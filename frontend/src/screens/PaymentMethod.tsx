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
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const handleImgError = (id: string) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  };

  const getFallbackBadge = (id: string, name: string) => {
    let label = name
      .replace(' Virtual Account', '')
      .replace(' Direct', '')
      .replace(' (GoPay, ShopeePay, Dana)', '');
    if (label === 'Kartu Kredit / Debit') label = 'Card';
    
    let bgClass = 'bg-primary/10 text-primary border-primary/20';
    
    if (id.includes('bca')) {
      bgClass = 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    } else if (id.includes('mandiri')) {
      bgClass = 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    } else if (id.includes('bni')) {
      bgClass = 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    } else if (id.includes('bri')) {
      bgClass = 'bg-sky-500/10 text-sky-600 border-sky-500/20';
    } else if (id.includes('permata')) {
      bgClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    } else if (id === 'qris') {
      bgClass = 'bg-pink-500/10 text-pink-600 border-pink-500/20';
    } else if (id === 'gopay') {
      bgClass = 'bg-teal-500/10 text-teal-600 border-teal-500/20';
    } else if (id === 'shopeepay') {
      bgClass = 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    } else if (id === 'alfamart') {
      bgClass = 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    } else if (id === 'indomaret') {
      bgClass = 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    } else if (id === 'credit-card') {
      bgClass = 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
    }

    return (
      <div className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md uppercase tracking-wider border ${bgClass} shadow-sm shrink-0 whitespace-nowrap`}>
        {label}
      </div>
    );
  };

  const getInitialCategory = (method: string) => {
    if (['bca-va', 'mandiri-va', 'bni-va', 'bri-va', 'permata-va'].includes(method)) return 'va';
    if (['qris', 'gopay', 'shopeepay'].includes(method)) return 'wallet';
    if (['alfamart', 'indomaret'].includes(method)) return 'store';
    if (method === 'credit-card') return 'card';
    return 'va';
  };

  const [expandedCategory, setExpandedCategory] = useState<string | null>(getInitialCategory(selectedMethod));

  const toggleCategory = (cat: string) => {
    setExpandedCategory(expandedCategory === cat ? null : cat);
  };

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
    const clientKey = (import.meta as any).env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-_apIHAKTdVMvcov_';
    const snapUrl = (import.meta as any).env.VITE_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/snap.js';
    
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
              
              <div className="p-6 space-y-4 bg-surface-container-lowest flex-1 overflow-y-auto">
                
                {/* Virtual Account Group Accordion Card */}
                <div className="border border-outline-variant/40 rounded-xl overflow-hidden shadow-sm bg-surface-container-lowest transition-all hover:border-primary/20">
                  <button 
                    type="button"
                    onClick={() => toggleCategory('va')}
                    className={`w-full flex items-center justify-between p-4 bg-surface-container-low/40 hover:bg-surface-container-low transition-all font-bold text-sm text-on-surface select-none outline-none
                      ${expandedCategory === 'va' ? 'border-b border-outline-variant/40 bg-primary/5' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icons.Building size={16} className={`transition-colors ${expandedCategory === 'va' ? 'text-primary' : 'text-on-surface-variant'}`} />
                      <span className={`uppercase tracking-wider text-[11px] ${expandedCategory === 'va' ? 'text-primary' : 'text-on-surface'}`}>Transfer Virtual Account</span>
                    </div>
                    <Icons.ChevronDown 
                      size={18} 
                      className={`text-on-surface-variant transition-transform duration-300 ${expandedCategory === 'va' ? 'rotate-180 text-primary' : ''}`}
                    />
                  </button>
                  
                  {expandedCategory === 'va' && (
                    <div className="p-4 space-y-3 bg-surface-container-lowest animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'bca-va', name: 'BCA Virtual Account', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg' },
                          { id: 'mandiri-va', name: 'Mandiri Virtual Account', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg' },
                          { id: 'bni-va', name: 'BNI Virtual Account', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Bank_Negara_Indonesia_logo_%282004%29.svg' },
                          { id: 'bri-va', name: 'BRI Virtual Account', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/68/BANK_BRI_logo.svg' },
                          { id: 'permata-va', name: 'Permata Virtual Account', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Permata_Bank_%282024%29.svg' },
                        ].map((method) => (
                          <label 
                            key={method.id} 
                            className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all duration-200 group
                              ${selectedMethod === method.id 
                                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' 
                                : 'border-outline-variant/40 hover:bg-surface-container-low/50 hover:border-primary/40'}`}
                            onClick={() => setSelectedMethod(method.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                                ${selectedMethod === method.id ? 'border-primary' : 'border-outline group-hover:border-primary/50'}`}>
                                {selectedMethod === method.id && <div className="w-2 h-2 rounded-full bg-primary animate-in zoom-in duration-200"></div>}
                              </div>
                              <span className={`text-xs font-semibold transition-colors ${selectedMethod === method.id ? 'text-primary' : 'text-on-surface'}`}>
                                {method.name}
                              </span>
                            </div>
                            <div className="h-6 min-w-[64px] flex items-center justify-end">
                              {imgErrors[method.id] ? (
                                getFallbackBadge(method.id, method.name)
                              ) : (
                                <img 
                                  src={method.logo} 
                                  alt={method.name} 
                                  onError={() => handleImgError(method.id)}
                                  className="h-5 w-auto max-w-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
                                />
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* E-Wallet Group Accordion Card */}
                <div className="border border-outline-variant/40 rounded-xl overflow-hidden shadow-sm bg-surface-container-lowest transition-all hover:border-primary/20">
                  <button 
                    type="button"
                    onClick={() => toggleCategory('wallet')}
                    className={`w-full flex items-center justify-between p-4 bg-surface-container-low/40 hover:bg-surface-container-low transition-all font-bold text-sm text-on-surface select-none outline-none
                      ${expandedCategory === 'wallet' ? 'border-b border-outline-variant/40 bg-primary/5' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icons.CreditCard size={16} className={`transition-colors ${expandedCategory === 'wallet' ? 'text-primary' : 'text-on-surface-variant'}`} />
                      <span className={`uppercase tracking-wider text-[11px] ${expandedCategory === 'wallet' ? 'text-primary' : 'text-on-surface'}`}>E-Wallet & QRIS</span>
                    </div>
                    <Icons.ChevronDown 
                      size={18} 
                      className={`text-on-surface-variant transition-transform duration-300 ${expandedCategory === 'wallet' ? 'rotate-180 text-primary' : ''}`}
                    />
                  </button>
                  
                  {expandedCategory === 'wallet' && (
                    <div className="p-4 space-y-3 bg-surface-container-lowest animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'qris', name: 'QRIS (GoPay, ShopeePay, Dana)', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg' },
                          { id: 'gopay', name: 'GoPay Direct', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg' },
                          { id: 'shopeepay', name: 'ShopeePay', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg' },
                        ].map((method) => (
                          <label 
                            key={method.id} 
                            className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all duration-200 group
                              ${selectedMethod === method.id 
                                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' 
                                : 'border-outline-variant/40 hover:bg-surface-container-low/50 hover:border-primary/40'}`}
                            onClick={() => setSelectedMethod(method.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                                ${selectedMethod === method.id ? 'border-primary' : 'border-outline group-hover:border-primary/50'}`}>
                                {selectedMethod === method.id && <div className="w-2 h-2 rounded-full bg-primary animate-in zoom-in duration-200"></div>}
                              </div>
                              <span className={`text-xs font-semibold transition-colors ${selectedMethod === method.id ? 'text-primary' : 'text-on-surface'}`}>
                                {method.name}
                              </span>
                            </div>
                            <div className="h-6 min-w-[64px] flex items-center justify-end">
                              {imgErrors[method.id] ? (
                                getFallbackBadge(method.id, method.name)
                              ) : (
                                <img 
                                  src={method.logo} 
                                  alt={method.name} 
                                  onError={() => handleImgError(method.id)}
                                  className="h-5 w-auto max-w-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
                                />
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Convenience Store Group Accordion Card */}
                <div className="border border-outline-variant/40 rounded-xl overflow-hidden shadow-sm bg-surface-container-lowest transition-all hover:border-primary/20">
                  <button 
                    type="button"
                    onClick={() => toggleCategory('store')}
                    className={`w-full flex items-center justify-between p-4 bg-surface-container-low/40 hover:bg-surface-container-low transition-all font-bold text-sm text-on-surface select-none outline-none
                      ${expandedCategory === 'store' ? 'border-b border-outline-variant/40 bg-primary/5' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icons.Building size={16} className={`transition-colors ${expandedCategory === 'store' ? 'text-primary' : 'text-on-surface-variant'}`} />
                      <span className={`uppercase tracking-wider text-[11px] ${expandedCategory === 'store' ? 'text-primary' : 'text-on-surface'}`}>Gerai Ritel (Over the Counter)</span>
                    </div>
                    <Icons.ChevronDown 
                      size={18} 
                      className={`text-on-surface-variant transition-transform duration-300 ${expandedCategory === 'store' ? 'rotate-180 text-primary' : ''}`}
                    />
                  </button>
                  
                  {expandedCategory === 'store' && (
                    <div className="p-4 space-y-3 bg-surface-container-lowest animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'alfamart', name: 'Alfamart', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Alfamart_logo.svg' },
                          { id: 'indomaret', name: 'Indomaret', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Indomaret.svg' },
                        ].map((method) => (
                          <label 
                            key={method.id} 
                            className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all duration-200 group
                              ${selectedMethod === method.id 
                                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' 
                                : 'border-outline-variant/40 hover:bg-surface-container-low/50 hover:border-primary/40'}`}
                            onClick={() => setSelectedMethod(method.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                                ${selectedMethod === method.id ? 'border-primary' : 'border-outline group-hover:border-primary/50'}`}>
                                {selectedMethod === method.id && <div className="w-2 h-2 rounded-full bg-primary animate-in zoom-in duration-200"></div>}
                              </div>
                              <span className={`text-xs font-semibold transition-colors ${selectedMethod === method.id ? 'text-primary' : 'text-on-surface'}`}>
                                {method.name}
                              </span>
                            </div>
                            <div className="h-6 min-w-[64px] flex items-center justify-end">
                              {imgErrors[method.id] ? (
                                getFallbackBadge(method.id, method.name)
                              ) : (
                                <img 
                                  src={method.logo} 
                                  alt={method.name} 
                                  onError={() => handleImgError(method.id)}
                                  className="h-5 w-auto max-w-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
                                />
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Credit Card Group Accordion Card */}
                <div className="border border-outline-variant/40 rounded-xl overflow-hidden shadow-sm bg-surface-container-lowest transition-all hover:border-primary/20">
                  <button 
                    type="button"
                    onClick={() => toggleCategory('card')}
                    className={`w-full flex items-center justify-between p-4 bg-surface-container-low/40 hover:bg-surface-container-low transition-all font-bold text-sm text-on-surface select-none outline-none
                      ${expandedCategory === 'card' ? 'border-b border-outline-variant/40 bg-primary/5' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icons.CreditCard size={16} className={`transition-colors ${expandedCategory === 'card' ? 'text-primary' : 'text-on-surface-variant'}`} />
                      <span className={`uppercase tracking-wider text-[11px] ${expandedCategory === 'card' ? 'text-primary' : 'text-on-surface'}`}>Kartu Kredit & Debit</span>
                    </div>
                    <Icons.ChevronDown 
                      size={18} 
                      className={`text-on-surface-variant transition-transform duration-300 ${expandedCategory === 'card' ? 'rotate-180 text-primary' : ''}`}
                    />
                  </button>
                  
                  {expandedCategory === 'card' && (
                    <div className="p-4 space-y-3 bg-surface-container-lowest animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 'credit-card', name: 'Kartu Kredit / Debit', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Visa_Inc._logo_%282005%E2%80%932014%29.svg' },
                        ].map((method) => (
                          <label 
                            key={method.id} 
                            className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all duration-200 group
                              ${selectedMethod === method.id 
                                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' 
                                : 'border-outline-variant/40 hover:bg-surface-container-low/50 hover:border-primary/40'}`}
                            onClick={() => setSelectedMethod(method.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                                ${selectedMethod === method.id ? 'border-primary' : 'border-outline group-hover:border-primary/50'}`}>
                                {selectedMethod === method.id && <div className="w-2 h-2 rounded-full bg-primary animate-in zoom-in duration-200"></div>}
                              </div>
                              <span className={`text-xs font-semibold transition-colors ${selectedMethod === method.id ? 'text-primary' : 'text-on-surface'}`}>
                                {method.name}
                              </span>
                            </div>
                            <div className="h-6 min-w-[64px] flex items-center justify-end">
                              {imgErrors[method.id] ? (
                                getFallbackBadge(method.id, method.name)
                              ) : (
                                <img 
                                  src={method.logo} 
                                  alt={method.name} 
                                  onError={() => handleImgError(method.id)}
                                  className="h-5 w-auto max-w-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
                                />
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
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
