import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Role, BillStatus, PaymentStatus } from '@prisma/client';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];


@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

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
          status: BillStatus.BELUM_BAYAR,
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

    return {
      totalCustomers,
      activeCustomers,
      tunggakanCustomers,
      pendingPaymentsCount,
      totalBillsUnpaid,
    };
  }
}
