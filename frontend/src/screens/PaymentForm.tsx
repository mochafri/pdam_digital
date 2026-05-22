import React, { FC, useState, useRef, useEffect } from 'react';
import { Icons } from '../components/Icons';
import { Screen, Bill, User } from '../types';

interface PaymentFormProps {
  user: User;
  navigate: (screen: Screen) => void;
  selectedBill: Bill | null;
  selectedMethod: string;
}

export const PaymentForm: FC<PaymentFormProps> = ({ 
  user, 
  navigate, 
  selectedBill, 
  selectedMethod 
}) => {
  const [senderName, setSenderName] = useState(user.name);
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedBill) {
      navigate('dashboard');
    }
  }, [selectedBill, navigate]);

  if (!selectedBill) return null;

  const getMethodName = (id: string) => {
    if (id === 'bca-va') return 'BCA Virtual Account';
    if (id === 'mandiri-va') return 'Mandiri Virtual Account';
    if (id === 'bni-va') return 'BNI Virtual Account';
    if (id === 'qris') return 'QRIS (GoPay, ShopeePay, Dana)';
    if (id === 'gopay') return 'GoPay Direct';
    return 'Virtual Account';
  };

  const getAccountNumber = (id: string) => {
    if (id === 'bca-va') return '8925 0812 3456 7890';
    if (id === 'mandiri-va') return '8892 5081 2345 6789';
    if (id === 'bni-va') return '8825 0812 3456 7890';
    return '8925 0812 3456 7890';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert("Ukuran file melebihi batas 5MB.");
      return;
    }
    setFile(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Silakan unggah bukti pembayaran terlebih dahulu.");
      return;
    }
    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billId: selectedBill.id,
          userId: user.id,
          amount: selectedBill.total,
          paymentMethod: getMethodName(selectedMethod),
          // In a production app, the file is uploaded to S3/Cloudinary and the URL is returned.
          // For local testing, we send a realistic, rich receipt image URL to ensure beautiful dashboard visualization.
          proofOfImage: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=600',
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Gagal memproses pengiriman bukti pembayaran.');
      }
      
      alert('Terima kasih! Bukti pembayaran Anda telah kami terima dan akan diverifikasi oleh Admin dalam 1x24 jam.');
      navigate('bills');
    } catch (err: any) {
      alert(err.message || 'Koneksi ke server gagal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-6 md:pt-12 px-2 md:px-8 pb-12 w-full max-w-5xl mx-auto animate-in fade-in slide-in-from-right-8 duration-300">
      
      {/* Breadcrumb & Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-on-surface-variant text-xs font-semibold mb-3">
          <button onClick={() => navigate('dashboard')} className="hover:text-primary transition-colors cursor-pointer">Dashboard</button>
          <Icons.ChevronRight size={14} className="opacity-50" />
          <button onClick={() => navigate('bills')} className="hover:text-primary transition-colors cursor-pointer">My Bills</button>
          <Icons.ChevronRight size={14} className="opacity-50" />
          <button onClick={() => navigate('payment-method')} className="hover:text-primary transition-colors cursor-pointer">Metode</button>
          <Icons.ChevronRight size={14} className="opacity-50" />
          <span className="text-primary">Konfirmasi</span>
        </nav>
        <h1 className="text-3xl font-bold text-on-surface">Konfirmasi Pembayaran</h1>
        <p className="text-on-surface-variant mt-2 text-base font-medium">Selesaikan transfer dan unggah bukti untuk memproses tagihan Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Detail and Transfer Instructions Card */}
        <div className="md:col-span-12 xl:col-span-5 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/40 p-6 relative overflow-hidden">
            <h4 className="text-sm font-bold text-primary tracking-wide flex items-center gap-2 mb-6">
              <Icons.FileText size={20} />
              DETAIL TAGIHAN
            </h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant font-medium">Periode</span>
                <span className="font-bold text-on-surface text-base">{selectedBill.monthString} {selectedBill.yearString}</span>
              </div>
              <div className="pt-4 border-t border-dashed border-outline-variant/60">
                <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-widest mb-1">Total Dibayar</p>
                <p className="text-3xl font-bold text-primary tracking-tight">Rp {selectedBill.total.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-primary text-on-primary rounded-xl shadow-md p-6 relative overflow-hidden">
            {/* Abstract decorative graphic */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            
            <h4 className="text-sm font-bold text-primary-fixed mb-6 flex items-center gap-2 tracking-wide">
              <Icons.Building size={20} />
              INSTRUKSI TRANSFER
            </h4>
            
            <div className="space-y-5 relative z-10">
              <div>
                <p className="text-xs text-primary-fixed-dim font-medium uppercase tracking-wider mb-1">Bank Tujuan</p>
                <p className="text-xl font-bold text-white">{getMethodName(selectedMethod)}</p>
              </div>
              
              {!selectedMethod.includes('qris') && !selectedMethod.includes('gopay') ? (
                <div>
                  <p className="text-xs text-primary-fixed-dim font-medium uppercase tracking-wider mb-2">Nomor Virtual Account</p>
                  <div className="flex items-center justify-between bg-black/20 backdrop-blur-sm p-3 rounded-lg border border-white/10 shadow-inner group">
                    <span className="font-code text-base sm:text-lg font-bold tracking-[0.15em] text-white">
                      {getAccountNumber(selectedMethod)}
                    </span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(getAccountNumber(selectedMethod).replace(/\s/g, ''));
                        alert("Nomor Virtual Account disalin!");
                      }}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors active:scale-95 cursor-pointer" 
                      title="Salin ke clipboard"
                    >
                      <Icons.Copy size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-primary-fixed-dim font-medium uppercase tracking-wider mb-2">QR Code Pembayaran</p>
                  <div className="bg-white p-3 rounded-lg w-40 h-40 mx-auto flex items-center justify-center border border-white/20 shadow-inner">
                    <img 
                      src="https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=150" 
                      alt="QR Code" 
                      className="w-36 h-36 object-contain"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-xs text-primary-fixed-dim font-medium uppercase tracking-wider mb-1">Atas Nama</p>
                <p className="font-bold text-lg text-white">PDAM DIGITAL / {user.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Form */}
        <div className="md:col-span-12 xl:col-span-7">
          <form 
            onSubmit={handleSubmit}
            className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/40 flex flex-col h-full overflow-hidden"
          >
            <div className="p-8 pb-4 border-b border-outline-variant/20 bg-surface-bright/30">
              <h4 className="text-xl font-bold text-on-surface">Unggah Bukti Pembayaran</h4>
              <p className="text-sm text-on-surface-variant font-medium mt-1">Pastikan nama pengirim dan tanggal transfer sesuai.</p>
            </div>
            
            <div className="p-8 space-y-6 flex-1 bg-surface-container-lowest">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Nama Pengirim</label>
                  <input 
                    type="text" 
                    required 
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant/60 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-bright transition-all text-sm font-medium"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Tanggal Transfer</label>
                  <input 
                    type="date" 
                    required 
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-outline-variant/60 focus:ring-2 focus:ring-primary focus:border-primary bg-surface-bright transition-all text-sm font-medium"
                  />
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                <label className="text-sm font-semibold text-on-surface">Bukti Pembayaran (Gambar/PDF)</label>
                
                {!file ? (
                  <div 
                    className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group
                      ${isDragging ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-outline-variant/80 bg-surface-container-low hover:border-primary/50 hover:bg-primary/5'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      id="file-upload" 
                      accept="image/jpeg,image/png,image/jpg,application/pdf" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:scale-110 group-hover:bg-primary/15 transition-all text-primary">
                      <Icons.UploadCloud size={36} className="fill-primary/20" />
                    </div>
                    <p className="text-base font-bold text-on-surface mb-1">Tarik & lepaskan file di sini</p>
                    <p className="text-sm text-on-surface-variant font-medium">Atau klik untuk menelusuri galeri Anda</p>
                    <p className="text-[10px] text-outline font-bold mt-6 uppercase tracking-wider bg-outline-variant/20 px-3 py-1.5 rounded-full">Maksimal File 5MB (JPG, PNG, PDF)</p>
                  </div>
                ) : (
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-lg border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                          {file.type.includes('pdf') ? <Icons.FileText size={24} /> : <Icons.FileCheck size={24} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-on-surface max-w-[200px] sm:max-w-xs truncate">{file.name}</p>
                          <p className="text-xs text-on-surface-variant font-semibold mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={removeFile}
                        className="p-2 text-error hover:bg-error-container hover:text-on-error-container rounded-lg transition-colors group cursor-pointer"
                        title="Hapus file"
                      >
                        <Icons.X size={20} className="group-hover:rotate-90 transition-transform" />
                      </button>
                    </div>
                    {/* Simulated progress bar */}
                    <div className="w-full h-1.5 bg-primary/20 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-full shadow-[0_0_10px_rgb(0,71,141)] rounded-full animate-[pulse_1.5s_infinite]"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-8 pt-6 border-t border-outline-variant/20 bg-surface-bright/30 mt-auto">
              <button 
                type="submit"
                disabled={!file || isSubmitting}
                className={`w-full py-4 rounded-xl shadow-md font-bold text-base transition-all flex items-center justify-center gap-2 cursor-pointer
                  ${(!file || isSubmitting) ? 'bg-surface-container border border-outline-variant/50 text-outline cursor-not-allowed' : 'bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container active:scale-[0.98]'}`}
              >
                {isSubmitting ? (
                  <>
                    <Icons.Clock size={20} className="animate-spin" />
                    Mengirim Data...
                  </>
                ) : (
                  <>
                    <Icons.Send size={20} />
                    Kirim Bukti Pembayaran
                  </>
                )}
              </button>
              <p className="text-center text-xs font-medium text-on-surface-variant mt-4 px-4">
                Dengan menekan tombol, Anda menyatakan bahwa data yang diberikan adalah benar dan valid.
              </p>
            </div>
          </form>
        </div>
      </div>
      
    </div>
  );
};
