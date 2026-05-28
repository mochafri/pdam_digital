import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Role, BillStatus, PaymentStatus } from '@prisma/client';
import * as midtransClient from 'midtrans-client';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];


@Injectable()
export class AppService {
  private snap: any;

  constructor(private readonly prisma: PrismaService) {
    this.snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
      serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-BWDW7fFOlGzXwcAeMYYLSAtO',
      clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-_apIHAKTdVMvcov_'
    });
  }

  getHello(): string {
    return 'PDAM Digital API Server';
  }

  // --- AUTH ---
  async login(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      throw new NotFoundException(`Akun dengan email ${email} tidak ditemukan.`);
    }
    return user;
  }

  // --- CUSTOMERS ---
  async getCustomers() {
    return this.prisma.user.findMany({
      where: { role: Role.CUSTOMER },
      orderBy: { name: 'asc' },
    });
  }

  async createCustomer(data: {
    email: string;
    name: string;
    phone?: string;
    rt?: string;
    desa?: string;
    blok?: string;
    status?: string;
    meterNo?: string;
  }) {
    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) {
      throw new BadRequestException('Alamat email sudah terdaftar.');
    }

    // Generate meter no if not supplied
    let meterNo = data.meterNo;
    if (!meterNo) {
      const count = await this.prisma.user.count({
        where: { role: Role.CUSTOMER },
      });
      const randDigits = Math.floor(100 + Math.random() * 900);
      meterNo = `MTR-8925-${String(count + 1).padStart(3, '0')}`;
    }

    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: 'password', // Default password
        name: data.name,
        role: Role.CUSTOMER,
        phone: data.phone,
        rt: data.rt,
        desa: data.desa,
        blok: data.blok,
        status: data.status || 'Aktif',
        meterNo,
      },
    });
  }

  async deleteCustomer(id: string) {
    const customer = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!customer) {
      throw new NotFoundException('Pelanggan tidak ditemukan.');
    }
    return this.prisma.user.delete({ where: { id } });
  }

  // --- BILLS ---
  async getBills(userId?: string, yearString?: string) {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }
    if (yearString) {
      where.yearString = yearString;
    }
    return this.prisma.bill.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBill(data: {
    userId: string;
    monthString: string;
    yearString: string;
    meterStart: number;
    meterEnd: number;
  }) {
    const usage = data.meterEnd - data.meterStart;
    if (usage < 0) {
      throw new BadRequestException('Stand akhir tidak boleh lebih kecil dari stand awal.');
    }
    
    // Check if bill for this month/year already exists for this customer
    const existing = await this.prisma.bill.findFirst({
      where: {
        userId: data.userId,
        monthString: data.monthString,
        yearString: data.yearString,
      },
    });
    if (existing) {
      throw new BadRequestException(`Tagihan untuk bulan ${data.monthString} ${data.yearString} sudah pernah dicatat.`);
    }

    // Hitung total: pemakaian * 6000 + 20000 (biaya pemeliharaan/admin)
    const total = usage * 6000 + 20000;

    // Jatuh tempo: tanggal 20 bulan tersebut
    const dueDate = `20 ${data.monthString} ${data.yearString}`;

    const bill = await this.prisma.bill.create({
      data: {
        userId: data.userId,
        monthString: data.monthString,
        yearString: data.yearString,
        dueDate,
        meterStart: data.meterStart,
        meterEnd: data.meterEnd,
        usage,
        total,
        status: BillStatus.BELUM_BAYAR,
      },
    });

    // Update customer status to Tunggakan if they have bills
    await this.prisma.user.update({
      where: { id: data.userId },
      data: { status: 'Tunggakan' },
    });

    return bill;
  }

  async updateBill(id: string, newMeterEnd: number) {
    const bill = await this.prisma.bill.findUnique({
      where: { id },
    });
    if (!bill) {
      throw new NotFoundException('Tagihan tidak ditemukan.');
    }

    if (newMeterEnd < bill.meterStart) {
      throw new BadRequestException('Stand akhir tidak boleh lebih kecil dari stand awal.');
    }

    // Get all bills for this user to find the next chronological bill
    const allBills = await this.prisma.bill.findMany({
      where: { userId: bill.userId },
    });

    const getMonthValue = (b: { monthString: string; yearString: string }) => {
      const idx = MONTHS.indexOf(b.monthString);
      return parseInt(b.yearString, 10) * 12 + (idx !== -1 ? idx : 0);
    };

    // Sort bills ascending
    const sortedBills = [...allBills].sort((a, b) => getMonthValue(a) - getMonthValue(b));
    const currentIndex = sortedBills.findIndex((b) => b.id === bill.id);
    const nextBill = currentIndex !== -1 && currentIndex < sortedBills.length - 1 ? sortedBills[currentIndex + 1] : null;

    if (nextBill) {
      if (newMeterEnd > nextBill.meterEnd) {
        throw new BadRequestException(
          `Stand akhir tidak boleh melebihi stand akhir bulan berikutnya (${nextBill.monthString} ${nextBill.yearString}: ${nextBill.meterEnd}).`
        );
      }
    }

    // Update current bill
    const usage = newMeterEnd - bill.meterStart;
    const total = usage * 6000 + 20000;

    const updatedBill = await this.prisma.bill.update({
      where: { id },
      data: {
        meterEnd: newMeterEnd,
        usage,
        total,
      },
    });

    // Update next bill if exists
    if (nextBill) {
      const nextUsage = nextBill.meterEnd - newMeterEnd;
      const nextTotal = nextUsage * 6000 + 20000;

      await this.prisma.bill.update({
        where: { id: nextBill.id },
        data: {
          meterStart: newMeterEnd,
          usage: nextUsage,
          total: nextTotal,
        },
      });
    }

    return updatedBill;
  }

  // --- PAYMENTS ---
  async getPayments(userId?: string) {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }
    return this.prisma.payment.findMany({
      where,
      include: {
        bill: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPayment(data: {
    billId: string;
    userId: string;
    amount: number;
    paymentMethod: string;
    proofOfImage?: string;
  }) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: data.billId },
    });
    if (!bill) {
      throw new NotFoundException('Tagihan tidak ditemukan.');
    }

    const payment = await this.prisma.payment.create({
      data: {
        billId: data.billId,
        userId: data.userId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        proofOfImage: data.proofOfImage || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=400',
        status: PaymentStatus.PENDING,
      },
    });

    // Update bill status to Menunggu Verifikasi
    await this.prisma.bill.update({
      where: { id: data.billId },
      data: { status: BillStatus.MENUNGGU_VERIFIKASI },
    });

    return payment;
  }

  async chargeBill(billId: string, userId: string, paymentMethodId: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id: billId },
      include: { user: true },
    });
    if (!bill) {
      throw new NotFoundException('Tagihan tidak ditemukan.');
    }

    const orderId = `BILL-${bill.id.substring(0, 8)}-${Date.now()}`;

    // Check if there is already an active pending Midtrans payment for this bill within last 20 hours
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        billId: billId,
        userId: userId,
        status: PaymentStatus.PENDING,
        paymentMethod: { contains: 'Midtrans' },
        createdAt: {
          gt: new Date(Date.now() - 20 * 60 * 60 * 1000),
        },
      },
    });

    if (existingPayment && existingPayment.proofOfImage) {
      return {
        token: existingPayment.proofOfImage,
        redirectUrl: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${existingPayment.proofOfImage}`,
        paymentId: existingPayment.id,
      };
    }

    // Map method ID to Midtrans enabled_payments code
    let enabledPayments: string[] = [];
    let friendlyMethodName = 'Midtrans Snap';

    if (paymentMethodId === 'bca-va') {
      enabledPayments = ['bca_va'];
      friendlyMethodName = 'BCA Virtual Account (Midtrans)';
    } else if (paymentMethodId === 'mandiri-va') {
      enabledPayments = ['echannel', 'mandiri_va'];
      friendlyMethodName = 'Mandiri Virtual Account (Midtrans)';
    } else if (paymentMethodId === 'bni-va') {
      enabledPayments = ['bni_va'];
      friendlyMethodName = 'BNI Virtual Account (Midtrans)';
    } else if (paymentMethodId === 'bri-va') {
      enabledPayments = ['bri_va'];
      friendlyMethodName = 'BRI Virtual Account (Midtrans)';
    } else if (paymentMethodId === 'permata-va') {
      enabledPayments = ['permata_va'];
      friendlyMethodName = 'Permata Virtual Account (Midtrans)';
    } else if (paymentMethodId === 'qris') {
      enabledPayments = ['qris'];
      friendlyMethodName = 'QRIS (Midtrans)';
    } else if (paymentMethodId === 'gopay') {
      enabledPayments = ['gopay'];
      friendlyMethodName = 'GoPay (Midtrans)';
    } else if (paymentMethodId === 'shopeepay') {
      enabledPayments = ['shopeepay'];
      friendlyMethodName = 'ShopeePay (Midtrans)';
    } else if (paymentMethodId === 'alfamart') {
      enabledPayments = ['alfamart'];
      friendlyMethodName = 'Alfamart (Midtrans)';
    } else if (paymentMethodId === 'indomaret') {
      enabledPayments = ['indomaret'];
      friendlyMethodName = 'Indomaret (Midtrans)';
    } else if (paymentMethodId === 'credit-card') {
      enabledPayments = ['credit_card'];
      friendlyMethodName = 'Credit/Debit Card (Midtrans)';
    } else {
      enabledPayments = [
        'bca_va', 'echannel', 'bni_va', 'bri_va', 'permata_va', 
        'qris', 'gopay', 'shopeepay', 'alfamart', 'indomaret', 'credit_card'
      ];
    }

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: bill.total,
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        first_name: bill.user.name,
        email: bill.user.email,
        phone: bill.user.phone || '',
      },
      item_details: [
        {
          id: bill.id,
          price: bill.total,
          quantity: 1,
          name: `Tagihan Air PDAM - ${bill.monthString} ${bill.yearString}`,
        },
      ],
      enabled_payments: enabledPayments,
    };

    try {
      const transaction = await this.snap.createTransaction(parameter);

      // Create a pending payment record in our DB and store the token for reuse
      await this.prisma.payment.create({
        data: {
          id: orderId,
          billId: bill.id,
          userId: userId,
          amount: bill.total,
          paymentMethod: friendlyMethodName,
          status: PaymentStatus.PENDING,
          proofOfImage: transaction.token,
        },
      });

      await this.prisma.bill.update({
        where: { id: bill.id },
        data: { status: BillStatus.MENUNGGU_VERIFIKASI },
      });

      return {
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
        paymentId: orderId,
      };
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Gagal membuat transaksi Midtrans.');
    }
  }

  async handleMidtransCallback(notification: any) {
    try {
      const statusResponse = await this.snap.transaction.notification(notification);
      const orderId = statusResponse.order_id;
      const transactionStatus = statusResponse.transaction_status;
      const fraudStatus = statusResponse.fraud_status;

      const payment = await this.prisma.payment.findUnique({
        where: { id: orderId },
      });

      if (!payment) {
        return { status: 'ignored' };
      }

      if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
        if (fraudStatus === 'challenge') {
          await this.prisma.payment.update({
            where: { id: orderId },
            data: { status: PaymentStatus.PENDING },
          });
        } else {
          // PAYMENT SUCCESS!
          await this.prisma.$transaction([
            this.prisma.payment.update({
              where: { id: orderId },
              data: {
                status: PaymentStatus.SUCCESS,
                paidAt: new Date(),
              },
            }),
            this.prisma.bill.update({
              where: { id: payment.billId },
              data: { status: BillStatus.LUNAS },
            }),
          ]);

          // Update user status to Aktif if all bills are paid
          const remainingUnpaid = await this.prisma.bill.count({
            where: {
              userId: payment.userId,
              status: {
                not: BillStatus.LUNAS,
              },
            },
          });
          if (remainingUnpaid === 0) {
            await this.prisma.user.update({
              where: { id: payment.userId },
              data: { status: 'Aktif' },
            });
          }
        }
      } else if (
        transactionStatus === 'cancel' ||
        transactionStatus === 'deny' ||
        transactionStatus === 'expire'
      ) {
        // PAYMENT FAILED or EXPIRED
        await this.prisma.$transaction([
          this.prisma.payment.update({
            where: { id: orderId },
            data: { status: PaymentStatus.FAILED },
          }),
          this.prisma.bill.update({
            where: { id: payment.billId },
            data: { status: BillStatus.BELUM_BAYAR },
          }),
        ]);
      } else if (transactionStatus === 'pending') {
        await this.prisma.payment.update({
          where: { id: orderId },
          data: { status: PaymentStatus.PENDING },
        });
      }

      return { status: 'ok' };
    } catch (err: any) {
      console.error('Midtrans Callback Error:', err);
      throw new BadRequestException('Gagal memproses callback Midtrans.');
    }
  }

  async verifyPayment(id: string, approve: boolean) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });
    if (!payment) {
      throw new NotFoundException('Data pembayaran tidak ditemukan.');
    }

    const status = approve ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
    const billStatus = approve ? BillStatus.LUNAS : BillStatus.BELUM_BAYAR;

    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: {
        status,
        paidAt: approve ? new Date() : null,
      },
    });

    await this.prisma.bill.update({
      where: { id: payment.billId },
      data: { status: billStatus },
    });

    // If approved, verify if user has any other pending bills
    if (approve) {
      const remainingUnpaid = await this.prisma.bill.count({
        where: {
          userId: payment.userId,
          status: {
            not: BillStatus.LUNAS,
          },
        },
      });
      
      if (remainingUnpaid === 0) {
        await this.prisma.user.update({
          where: { id: payment.userId },
          data: { status: 'Aktif' },
        });
      }
    }

    return updatedPayment;
  }

  // --- STATS ---
  async getStats() {
    const totalCustomers = await this.prisma.user.count({
      where: { role: Role.CUSTOMER },
    });

    const activeCustomers = await this.prisma.user.count({
      where: { role: Role.CUSTOMER, status: 'Aktif' },
    });

    const tunggakanCustomers = await this.prisma.user.count({
      where: { role: Role.CUSTOMER, status: 'Tunggakan' },
    });

    const pendingPaymentsCount = await this.prisma.payment.count({
      where: { status: PaymentStatus.PENDING },
    });

    const totalBillsUnpaid = await this.prisma.bill.count({
      where: { status: BillStatus.BELUM_BAYAR },
    });

    // Calculate dynamic stats
    const totalBills = await this.prisma.bill.count();
    const lunasBills = await this.prisma.bill.count({
      where: { status: BillStatus.LUNAS },
    });
    const paymentRate = totalBills > 0 ? Math.round((lunasBills / totalBills) * 100) : 100;

    const totalPayments = await this.prisma.payment.count();
    const successPayments = await this.prisma.payment.count({
      where: { status: PaymentStatus.SUCCESS },
    });
    const complaintResolution = totalPayments > 0 ? Math.round((successPayments / totalPayments) * 100) : 100;

    // Get usage trends grouped by month and year in JS
    const allBills = await this.prisma.bill.findMany({
      select: {
        monthString: true,
        yearString: true,
        usage: true,
      },
    });

    const MONTHS_ORDER = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const getMonthValue = (m: string, y: string) => {
      const idx = MONTHS_ORDER.indexOf(m);
      const yr = parseInt(y, 10) || 2026;
      return yr * 12 + (idx !== -1 ? idx : 0);
    };

    const groupedUsage: Record<string, number> = {};
    allBills.forEach((b) => {
      const key = `${b.monthString} ${b.yearString}`;
      groupedUsage[key] = (groupedUsage[key] || 0) + b.usage;
    });

    const trends = Object.entries(groupedUsage).map(([key, usage]) => {
      const [m, y] = key.split(' ');
      return {
        label: `${m.substring(0, 3)} '${y.substring(2)}`,
        usage,
        monthVal: getMonthValue(m, y),
      };
    });

    // Sort chronologically
    trends.sort((a, b) => a.monthVal - b.monthVal);

    // Filter to last 6 trends
    const finalTrends = trends.slice(-6).map((t) => ({
      label: t.label,
      usage: t.usage,
    }));

    return {
      totalCustomers,
      activeCustomers,
      tunggakanCustomers,
      pendingPaymentsCount,
      totalBillsUnpaid,
      paymentRate,
      complaintResolution,
      trends: finalTrends.length > 0 ? finalTrends : [
        { label: "Mei '24", usage: 120 },
        { label: "Jun '24", usage: 150 },
        { label: "Jul '24", usage: 180 },
        { label: "Agu '24", usage: 220 },
        { label: "Sep '24", usage: 250 },
      ],
    };
  }
}
