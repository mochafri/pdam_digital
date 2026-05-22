import { FC, useEffect } from 'react';
import { Icons } from '../components/Icons';
import { Screen, Bill } from '../types';

interface PaymentMethodProps {
  navigate: (screen: Screen) => void;
  selectedBill: Bill | null;
  selectedMethod: string;
  setSelectedMethod: (method: string) => void;
}

export const PaymentMethod: FC<PaymentMethodProps> = ({ 
  navigate, 
  selectedBill, 
  selectedMethod, 
  setSelectedMethod 
}) => {

  useEffect(() => {
    if (!selectedBill) {
      navigate('dashboard');
    }
  }, [selectedBill, navigate]);

  if (!selectedBill) return null;

  return (
    <div className="pt-6 md:pt-12 px-2 md:px-8 pb-12 w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-right-8 duration-300">
      
      {/* Breadcrumb & Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-on-surface-variant text-xs font-semibold mb-3">
          <button onClick={() => navigate('dashboard')} className="hover:text-primary transition-colors cursor-pointer">Dashboard</button>
          <Icons.ChevronRight size={14} className="opacity-50" />
          <button onClick={() => navigate('bills')} className="hover:text-primary transition-colors cursor-pointer">My Bills</button>
          <Icons.ChevronRight size={14} className="opacity-50" />
          <span className="text-primary">Pembayaran</span>
        </nav>
        <h1 className="text-3xl font-bold text-on-surface">Selesaikan Pembayaran</h1>
        <p className="text-on-surface-variant mt-2 text-base font-medium">Pilih metode pembayaran yang Anda inginkan untuk melanjutkan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Bill Summary Sidebar */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/40 p-6 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
              <Icons.FileText className="text-primary fill-primary/10" size={24} />
              <h4 className="text-sm font-bold text-primary tracking-wide">RINGKASAN TAGIHAN</h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant font-medium">Periode</span>
                <span className="font-bold text-on-surface">{selectedBill.monthString} {selectedBill.yearString}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant font-medium">No. Pelanggan</span>
                <span className="font-code font-bold text-on-surface">{selectedBill.user?.meterNo || 'BELUM ADA'}</span>
              </div>
              <div className="pt-4 border-t border-dashed border-outline-variant/60">
                <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-widest mb-1">Total Pembayaran</p>
                <p className="text-3xl font-bold text-primary tracking-tight">Rp {selectedBill.total.toLocaleString('id-ID')}</p>
              </div>
            </div>
            {/* abstract accent */}
            <div className="absolute -bottom-10 -right-10 opacity-5">
              <Icons.Receipt size={120} />
            </div>
          </div>
          
          <div className="p-4 bg-surface-container-low rounded-xl border border-primary/10 flex items-start gap-3">
            <Icons.ShieldCheck className="text-primary shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-bold text-on-surface mb-1">Pembayaran Aman</p>
              <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed">
                Semua transaksi dienkripsi dan diproses secara aman. Tagihan akan langsung terupdate setelah verifikasi.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="md:col-span-2">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/40 overflow-hidden flex flex-col">
            <div className="p-8 pb-6 border-b border-outline-variant/20 bg-surface-bright/30">
              <h4 className="text-xl font-bold text-on-surface">Pilih Metode Pembayaran</h4>
            </div>
            
            <div className="p-8 space-y-8 bg-surface-container-lowest flex-1">
              
              {/* Virtual Account Group */}
              <div>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Icons.Building size={14} /> Transfer Virtual Account
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'bca-va', name: 'BCA Virtual Account', icon: 'BCA' },
                    { id: 'mandiri-va', name: 'Mandiri Virtual Account', icon: 'Mandiri' },
                    { id: 'bni-va', name: 'BNI Virtual Account', icon: 'BNI' },
                  ].map((method) => (
                    <label 
                      key={method.id} 
                      className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all duration-200 group
                        ${selectedMethod === method.id 
                          ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' 
                          : 'border-outline-variant/50 hover:bg-surface-container-low hover:border-primary/50'}`}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                          ${selectedMethod === method.id ? 'border-primary' : 'border-outline group-hover:border-primary/50'}`}>
                          {selectedMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-primary animate-in zoom-in duration-200"></div>}
                        </div>
                        <span className={`text-sm font-semibold transition-colors ${selectedMethod === method.id ? 'text-primary' : 'text-on-surface'}`}>
                          {method.name}
                        </span>
                      </div>
                      <div className="h-6 px-2 py-0.5 rounded bg-surface border border-outline-variant/30 text-[10px] font-bold flex items-center text-on-surface-variant shadow-sm uppercase tracking-wider">
                        {method.icon}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* E-Wallet Group */}
              <div>
                <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Icons.CreditCard size={14} /> E-Wallet & QRIS
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'qris', name: 'QRIS (GoPay, ShopeePay, Dana)', icon: 'QRIS' },
                    { id: 'gopay', name: 'GoPay Direct', icon: 'GOPAY' },
                  ].map((method) => (
                    <label 
                      key={method.id} 
                      className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all duration-200 group
                        ${selectedMethod === method.id 
                          ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' 
                          : 'border-outline-variant/50 hover:bg-surface-container-low hover:border-primary/50'}`}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                          ${selectedMethod === method.id ? 'border-primary' : 'border-outline group-hover:border-primary/50'}`}>
                          {selectedMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-primary animate-in zoom-in duration-200"></div>}
                        </div>
                        <span className={`text-sm font-semibold transition-colors ${selectedMethod === method.id ? 'text-primary' : 'text-on-surface'}`}>
                          {method.name}
                        </span>
                      </div>
                      <div className="h-6 px-2 py-0.5 rounded bg-surface border border-outline-variant/30 text-[10px] font-bold flex items-center text-on-surface-variant shadow-sm uppercase tracking-wider bg-gradient-to-br from-white to-surface-container-low">
                        {method.icon}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* Action Footer */}
            <div className="p-8 pt-6 border-t border-outline-variant/20 bg-surface-bright/30">
              <button 
                onClick={() => navigate('payment-form')}
                className="w-full bg-primary text-on-primary font-bold text-base py-4 rounded-xl shadow-md hover:bg-primary-container hover:text-on-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                Lanjutkan Pembayaran
                <Icons.ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};
