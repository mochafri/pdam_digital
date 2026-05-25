import { FC, useEffect, useState } from 'react';
import { Icons } from '../components/Icons';
import { Screen, Bill, User } from '../types';

interface PaymentMethodProps {
  user: User;
  navigate: (screen: Screen) => void;
  selectedBill: Bill | null;
  selectedMethod: string;
  setSelectedMethod: (method: string) => void;
}

export const PaymentMethod: FC<PaymentMethodProps> = ({ 
  user,
  navigate, 
  selectedBill, 
  selectedMethod, 
  setSelectedMethod 
}) => {
  const [paying, setPaying] = useState(false);
  const [snapToken, setSnapToken] = useState<string | null>(null);
  const [showEmbedded, setShowEmbedded] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);

  useEffect(() => {
    if (showEmbedded && snapToken) {
      const snap = (window as any).snap;
      if (snap) {
        // Clear any previous iframe from snap-container just in case
        const container = document.getElementById('snap-container');
        if (container) {
          container.innerHTML = '';
        }
        
        snap.embed(snapToken, {
          embedId: 'snap-container',
          onSuccess: async function (result: any) {
            if (currentPaymentId) {
              try {
                await fetch(`http://localhost:5000/api/payments/${currentPaymentId}/verify`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ approve: true }),
                });
              } catch (err) {
                console.error('Instant verification error:', err);
              }
            }
            alert('Pembayaran Berhasil! Tagihan Anda telah dilunasi.');
            navigate('bills');
          },
          onPending: function (result: any) {
            console.log('Payment pending:', result);
          },
          onError: async function (result: any) {
            if (currentPaymentId) {
              try {
                await fetch(`http://localhost:5000/api/payments/${currentPaymentId}/verify`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ approve: false }),
                });
              } catch (err) {
                console.error('Instant fail verification error:', err);
              }
            }
            alert('Pembayaran Gagal. Silakan coba kembali.');
            setShowEmbedded(false);
            setSnapToken(null);
          },
          onClose: function () {
            setShowEmbedded(false);
            setSnapToken(null);
          }
        });
      }
    }
  }, [showEmbedded, snapToken, currentPaymentId, navigate]);

  useEffect(() => {
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-_apIHAKTdVMvcov_';
    const snapUrl = import.meta.env.VITE_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/snap.js';
    
    let script = document.getElementById('midtrans-snap-script') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.src = snapUrl;
      script.id = 'midtrans-snap-script';
      script.setAttribute('data-client-key', clientKey);
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

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
          <button onClick={() => navigate('bills')} className="hover:text-primary transition-colors cursor-pointer">Tagihan Saya</button>
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

        {/* Payment Methods or Embedded Snap UI */}
        <div className="md:col-span-2">
          {showEmbedded ? (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/40 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="p-6 border-b border-outline-variant/20 bg-surface-bright/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setShowEmbedded(false);
                      setSnapToken(null);
                    }} 
                    className="p-2 hover:bg-surface-container-low rounded-lg text-on-surface-variant hover:text-primary transition-all cursor-pointer flex items-center gap-1.5 text-sm font-bold group"
                  >
                    <Icons.ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span>Kembali</span>
                  </button>
                  <div className="w-px h-6 bg-outline-variant/60"></div>
                  <h4 className="text-lg font-bold text-on-surface">Selesaikan Pembayaran</h4>
                </div>
                <div className="flex items-center gap-2 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Proses Transaksi</span>
                </div>
              </div>
              
              <div className="p-4 md:p-6 bg-surface flex flex-col items-center justify-center min-h-[650px] relative">
                {!snapToken && (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <Icons.Clock className="animate-spin text-primary" size={32} />
                    <p className="text-sm font-semibold text-on-surface-variant">Memuat formulir pembayaran...</p>
                  </div>
                )}
                <div 
                  id="snap-container" 
                  className={`w-full min-h-[650px] transition-opacity duration-300 ${snapToken ? 'opacity-100' : 'opacity-0 h-0 pointer-events-none'}`}
                ></div>
              </div>
            </div>
          ) : (
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
                  disabled={paying}
                  onClick={async () => {
                    if (!selectedBill) return;
                    
                    const snap = (window as any).snap;
                    if (!snap) {
                      alert('SDK pembayaran Midtrans gagal dimuat. Silakan coba kembali.');
                      return;
                    }

                    setPaying(true);
                    try {
                      const response = await fetch('http://localhost:5000/api/payments/charge', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          billId: selectedBill.id,
                          userId: user.id,
                          paymentMethod: selectedMethod
                        }),
                      });

                      if (!response.ok) {
                        const errData = await response.json();
                        throw new Error(errData.message || 'Gagal memulai transaksi Midtrans.');
                      }

                      const data = await response.json();
                      setShowEmbedded(true);
                      setSnapToken(data.token);
                      setCurrentPaymentId(data.paymentId);
                    } catch (err: any) {
                      alert(err.message || 'Koneksi ke server gagal.');
                    } finally {
                      setPaying(false);
                    }
                  }}
                  className={`w-full bg-primary text-on-primary font-bold text-base py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer
                    ${paying ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-container hover:text-on-primary-container active:scale-[0.98]'}`}
                >
                  {paying ? (
                    <>
                      <Icons.Clock className="animate-spin" size={20} />
                      Memproses Pembayaran...
                    </>
                  ) : (
                    <>
                      Bayar Sekarang (Midtrans Snap)
                      <Icons.ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};
