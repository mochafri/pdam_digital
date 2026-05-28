export type Screen = 
  | 'login' 
  | 'dashboard' 
  | 'bills' 
  | 'payment-method' 
  | 'payment-form'
  | 'admin-dashboard'
  | 'admin-customers'
  | 'admin-meter'
  | 'admin-bills'
  | 'admin-payments';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'CUSTOMER' | 'ADMIN';
  phone?: string;
  rt?: string;
  desa?: string;
  blok?: string;
  status: string; // 'Aktif', 'Tunggakan', 'Pengecekan'
  meterNo?: string;
}

export interface Bill {
  id: string;
  userId: string;
  user?: User;
  monthString: string;
  yearString: string;
  dueDate: string;
  meterStart: number;
  meterEnd: number;
  usage: number;
  total: number;
  status: 'LUNAS' | 'BELUM_BAYAR' | 'MENUNGGU_VERIFIKASI';
  createdAt: string;
}

export interface Payment {
  id: string;
  billId: string;
  bill?: Bill;
  userId: string;
  user?: User;
  amount: number;
  paymentMethod: string;
  proofOfImage?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  paidAt?: string;
  createdAt: string;
}

export const API_BASE = `http://${window.location.hostname}:5000`;

