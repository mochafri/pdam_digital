import { User, Bill, Payment } from './types';

const mockUser: User = {
  id: 'u1',
  email: 'budi@example.com',
  name: 'Budi Santoso',
  role: 'CUSTOMER',
  phone: '081234567890',
  rt: '01',
  desa: 'Sukamaju',
  blok: 'A1',
  status: 'Aktif',
  meterNo: 'MTR-12345'
};

const mockAdmin: User = {
  id: 'a1',
  email: 'admin@pdam.com',
  name: 'Admin PDAM',
  role: 'ADMIN',
  status: 'Aktif'
};

const mockBills: Bill[] = [
  {
    id: 'b1',
    userId: 'u1',
    monthString: 'Mei',
    yearString: '2026',
    dueDate: '20 Mei 2026',
    meterStart: 1200,
    meterEnd: 1215,
    usage: 15,
    total: 75000,
    status: 'BELUM_BAYAR',
    createdAt: new Date().toISOString()
  },
  {
    id: 'b2',
    userId: 'u1',
    monthString: 'April',
    yearString: '2026',
    dueDate: '20 April 2026',
    meterStart: 1182,
    meterEnd: 1200,
    usage: 18,
    total: 90000,
    status: 'LUNAS',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'b3',
    userId: 'u1',
    monthString: 'Maret',
    yearString: '2026',
    dueDate: '20 Maret 2026',
    meterStart: 1162,
    meterEnd: 1182,
    usage: 20,
    total: 100000,
    status: 'LUNAS',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const mockCustomers: User[] = [mockUser];

const mockPayments: Payment[] = [];

const mockStats = {
  totalCustomers: 1500,
  activeCustomers: 1450,
  totalRevenue: 75000000,
  unpaidBills: 125,
  pendingVerifications: 10
};

export function setupMockApi() {
  const originalFetch = window.fetch;
  
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const urlString = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.toString());
    
    // Intercept API requests
    if (urlString.includes('/api/')) {
      // Simulate network delay for realistic UI
      await new Promise(resolve => setTimeout(resolve, 800));

      console.log(`[Mock API] ${init?.method || 'GET'} ${urlString}`);

      // 1. Auth Login
      if (urlString.includes('/api/auth/login') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        const user = body.email.includes('admin') ? mockAdmin : mockUser;
        return new Response(JSON.stringify(user), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 2. Bills
      if (urlString.includes('/api/bills')) {
        return new Response(JSON.stringify(mockBills), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 3. Customers
      if (urlString.includes('/api/customers')) {
        return new Response(JSON.stringify(mockCustomers), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 4. Payments
      if (urlString.includes('/api/payments')) {
        return new Response(JSON.stringify(mockPayments), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // 5. Stats
      if (urlString.includes('/api/stats')) {
        return new Response(JSON.stringify(mockStats), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // Default empty array for unknown GET
      if (init?.method === 'GET' || !init?.method) {
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      
      // Default success for unknown POST/PUT
      return new Response(JSON.stringify({ success: true, message: 'Mock Success' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // For non-API requests (e.g., assets), use original fetch
    let finalInput = input;
    if (typeof finalInput === 'string' && finalInput.startsWith('http://localhost:5000')) {
      finalInput = finalInput.replace('http://localhost:5000', `http://${window.location.hostname}:5000`);
    }
    return originalFetch(finalInput, init);
  };
}
