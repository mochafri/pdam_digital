import 'dotenv/config';
import { PrismaClient, Role, BillStatus } from '@prisma/client';
import { getMariaDbAdapter } from '../src/prisma/prisma-adapter';

const prisma = new PrismaClient({
  adapter: getMariaDbAdapter(),
});

async function main() {
  console.log('Clearing database...');
  await prisma.payment.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding users...');
  
  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@pdam.go.id',
      password: 'password', // in production use a secure hash like bcrypt
      name: 'Administrator',
      role: Role.ADMIN,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256&h=256',
      status: 'Aktif',
    },
  });

  // 2. Create Customers
  const budi = await prisma.user.create({
    data: {
      email: 'budi@pdam.go.id',
      password: 'password',
      name: 'Budi Santoso',
      role: Role.CUSTOMER,
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256&h=256',
      phone: '0812-3456-7890',
      rt: '02',
      desa: 'Cinunuk',
      blok: 'A1/12',
      status: 'Aktif',
      meterNo: 'MTR-8923-001',
    },
  });

  const siti = await prisma.user.create({
    data: {
      email: 'siti@pdam.go.id',
      password: 'password',
      name: 'Siti Rahmawati',
      role: Role.CUSTOMER,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256&h=256',
      phone: '0856-7890-1234',
      rt: '05',
      desa: 'Cimekar',
      blok: 'B3/08',
      status: 'Tunggakan',
      meterNo: 'MTR-8923-042',
    },
  });

  const jaya = await prisma.user.create({
    data: {
      email: 'pdan@majujaya.co.id',
      password: 'password',
      name: 'PT. Maju Jaya Sentosa',
      role: Role.CUSTOMER,
      phone: '021-555-0198',
      rt: '01',
      desa: 'Cinunuk',
      blok: 'C2/45',
      status: 'Aktif',
      meterNo: 'MTR-8924-115',
    },
  });

  const ahmad = await prisma.user.create({
    data: {
      email: 'ahmad@pdam.go.id',
      password: 'password',
      name: 'Ahmad Wijaya',
      role: Role.CUSTOMER,
      phone: '0877-1122-3344',
      rt: '03',
      desa: 'Cimekar',
      blok: 'D4/19',
      status: 'Pengecekan',
      meterNo: 'MTR-8925-008',
    },
  });

  const diana = await prisma.user.create({
    data: {
      email: 'diana@pdam.go.id',
      password: 'password',
      name: 'Diana Kusuma',
      role: Role.CUSTOMER,
      phone: '0811-9988-7766',
      rt: '04',
      desa: 'Cinunuk',
      blok: 'E5/22',
      status: 'Aktif',
      meterNo: 'MTR-8925-055',
    },
  });

  console.log('Seeding bills and payments for Budi Santoso...');

  // 1. Bill Mei (Lunas)
  const billMei = await prisma.bill.create({
    data: {
      userId: budi.id,
      monthString: 'Mei',
      yearString: '2024',
      dueDate: '20 Mei 2024',
      meterStart: 1245.0,
      meterEnd: 1272.0,
      usage: 27.0,
      total: 185000,
      status: BillStatus.LUNAS,
    },
  });

  await prisma.payment.create({
    data: {
      billId: billMei.id,
      userId: budi.id,
      amount: 185000,
      paymentMethod: 'Virtual Account',
      status: 'SUCCESS',
      paidAt: new Date('2024-06-05T10:30:00Z'),
    },
  });

  // 2. Bill April (Belum Bayar)
  await prisma.bill.create({
    data: {
      userId: budi.id,
      monthString: 'April',
      yearString: '2024',
      dueDate: '20 April 2024',
      meterStart: 1210.0,
      meterEnd: 1245.0,
      usage: 35.0,
      total: 265000,
      status: BillStatus.BELUM_BAYAR,
    },
  });

  // 3. Bill Maret (Menunggu Verifikasi)
  const billMaret = await prisma.bill.create({
    data: {
      userId: budi.id,
      monthString: 'Maret',
      yearString: '2024',
      dueDate: '20 Maret 2024',
      meterStart: 1185.0,
      meterEnd: 1210.0,
      usage: 25.0,
      total: 172500,
      status: BillStatus.MENUNGGU_VERIFIKASI,
    },
  });

  await prisma.payment.create({
    data: {
      billId: billMaret.id,
      userId: budi.id,
      amount: 172500,
      paymentMethod: 'Transfer Bank',
      proofOfImage: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=400',
      status: 'PENDING',
    },
  });

  // 4. Bill Februari (Lunas)
  const billFeb = await prisma.bill.create({
    data: {
      userId: budi.id,
      monthString: 'Februari',
      yearString: '2024',
      dueDate: '20 Februari 2024',
      meterStart: 1162.0,
      meterEnd: 1185.0,
      usage: 23.0,
      total: 158000,
      status: BillStatus.LUNAS,
    },
  });

  await prisma.payment.create({
    data: {
      billId: billFeb.id,
      userId: budi.id,
      amount: 158000,
      paymentMethod: 'E-Wallet',
      status: 'SUCCESS',
      paidAt: new Date('2024-03-12T14:20:00Z'),
    },
  });

  // 5. Bill Januari (Lunas)
  const billJan = await prisma.bill.create({
    data: {
      userId: budi.id,
      monthString: 'Januari',
      yearString: '2024',
      dueDate: '20 Januari 2024',
      meterStart: 1135.0,
      meterEnd: 1162.0,
      usage: 27.0,
      total: 185000,
      status: BillStatus.LUNAS,
    },
  });

  await prisma.payment.create({
    data: {
      billId: billJan.id,
      userId: budi.id,
      amount: 185000,
      paymentMethod: 'Virtual Account',
      status: 'SUCCESS',
      paidAt: new Date('2024-02-05T08:15:00Z'),
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
