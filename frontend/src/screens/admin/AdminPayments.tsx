import { FC, useEffect, useState } from 'react';
import { Icons } from '../../components/Icons';
import { Screen, Payment } from '../../types';

interface AdminPaymentsProps {
  navigate: (screen: Screen) => void;
}

export const AdminPayments: FC<AdminPaymentsProps> = ({ navigate }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/payments');
      if (!response.ok) {
        throw new Error('Gagal mengambil data antrean pembayaran.');
      }
      const data = await response.json();
      setPayments(data);
    } catch (err: any) {
      setError(err.message || 'Koneksi ke server gagal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleVerify = async (paymentId: string, approve: boolean) => {
    setVerifyingId(paymentId);
    try {
      const response = await fetch(`http://localhost:5000/api/payments/${paymentId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approve }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Gagal memproses verifikasi.');
      }

      alert(`Pembayaran berhasil ${approve ? 'DISETUJUI' : 'DITOLAK'}! Tagihan pelanggan telah diperbarui.`);
      // Reload payments list
      await fetchPayments();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat memproses verifikasi.');
    } finally {
      setVerifyingId(null);
    }
  };

  // Filter payments by selected tab status
  const filteredPayments = payments.filter((p) => {
    if (activeTab === 'ALL') return true;
    return p.status === activeTab;
  });

  const getStatusLabel = (status: string) => {
    if (status === 'SUCCESS') return 'Diterima';
    if (status === 'PENDING') return 'Menunggu';
    if (status === 'FAILED') return 'Ditolak';
    return status;
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'SUCCESS') return 'bg-green-100 text-green-800 border border-green-200';
    if (status === 'PENDING') return 'bg-tertiary-container text-on-tertiary-container border border-tertiary/20';
    if (status === 'FAILED') return 'bg-error-container text-on-error-container border border-error/15';
    return 'bg-surface-container text-on-surface-variant';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-background">Verifikasi Pembayaran</h1>
          <p className="text-base text-on-surface-variant mt-2 font-medium">Tinjau bukti transfer pelanggan untuk menyetujui pelunasan tagihan.</p>
        </div>
        <button 
          onClick={() => navigate('admin-bills')}
          className="bg-surface-container-low hover:bg-surface-container-high text-on-surface text-sm font-semibold px-4 py-2 rounded-lg border border-outline-variant/30 transition-colors self-start sm:self-auto cursor-pointer"
        >
          Kembali ke Tagihan
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-outline-variant/40 gap-6 text-sm font-bold select-none overflow-x-auto pb-0.5">
        {[
          { id: 'PENDING', name: 'Menunggu Verifikasi', count: payments.filter(p => p.status === 'PENDING').length },
          { id: 'SUCCESS', name: 'Pembayaran Diterima', count: payments.filter(p => p.status === 'SUCCESS').length },
          { id: 'FAILED', name: 'Pembayaran Ditolak', count: payments.filter(p => p.status === 'FAILED').length },
          { id: 'ALL', name: 'Semua Riwayat', count: payments.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 px-1 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer
              ${activeTab === tab.id 
                ? 'border-primary text-primary font-bold' 
                : 'border-transparent text-on-surface-variant hover:text-on-surface font-semibold'}`}
          >
            {tab.name}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
              ${activeTab === tab.id ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm">
          <Icons.Droplet className="animate-bounce inline-block text-primary mb-3" size={32} />
          <p className="text-on-surface-variant font-medium">Memuat antrean verifikasi...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm text-error font-medium">
          <Icons.AlertTriangle className="inline-block text-error mb-3" size={32} />
          <p>{error}</p>
        </div>
      ) : (
        /* Data Table Card */
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/80 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant/50 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="p-4 pl-6">ID Transaksi</th>
                  <th className="p-4">Pelanggan</th>
                  <th className="p-4">Periode Tagihan</th>
                  <th className="p-4">Nominal</th>
                  <th className="p-4">Metode Bayar</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Bukti</th>
                  <th className="p-4 text-center pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm text-on-surface divide-y divide-outline-variant/30">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container-low/30 transition-colors group">
                    <td className="p-4 pl-6 font-code text-on-surface-variant font-medium">
                      TRX-{p.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-on-surface">{p.user?.name || 'Pelanggan'}</span>
                        <span className="text-[10px] font-semibold text-outline tracking-wider mt-0.5">{p.user?.meterNo || 'NO METER'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-on-surface-variant font-medium">
                      {p.bill?.monthString} {p.bill?.yearString}
                    </td>
                    <td className="p-4 font-bold tracking-tight">
                      Rp {p.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-on-surface-variant font-semibold">
                      {p.paymentMethod}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${getStatusBadgeClass(p.status)}`}>
                        {getStatusLabel(p.status)}
                      </span>
                    </td>
                    <td className="p-4">
                      {p.proofOfImage ? (
                        <button 
                          onClick={() => setPreviewImage(p.proofOfImage || null)}
                          className="text-primary hover:text-primary-fixed-variant font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <Icons.Eye size={16} />
                          Lihat Bukti
                        </button>
                      ) : (
                        <span className="text-outline text-xs">Tidak ada</span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-center">
                      {p.status === 'PENDING' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            disabled={verifyingId !== null}
                            onClick={() => handleVerify(p.id, true)}
                            className="bg-primary text-on-primary hover:bg-primary-container px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            {verifyingId === p.id ? 'Loading...' : 'Setujui'}
                          </button>
                          <button 
                            disabled={verifyingId !== null}
                            onClick={() => handleVerify(p.id, false)}
                            className="bg-error-container text-on-error-container hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            {verifyingId === p.id ? 'Loading...' : 'Tolak'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-on-surface-variant text-xs font-medium uppercase tracking-widest bg-surface-container px-2.5 py-1 rounded-md">
                          Selesai
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-on-surface-variant font-medium text-base">
                      Tidak ada data antrean pembayaran untuk kategori ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-outline-variant/30 text-sm text-on-surface-variant font-medium bg-surface-container-lowest">
            Menampilkan {filteredPayments.length} transaksi tercatat
          </div>
        </div>
      )}

      {/* Glassmorphic Lightbox Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-outline-variant/20 bg-surface-bright flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Bukti Transfer Pelanggan</h3>
              <button 
                onClick={() => setPreviewImage(null)}
                className="p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface rounded-full transition-colors cursor-pointer"
              >
                <Icons.X size={20} />
              </button>
            </div>
            <div className="p-6 flex items-center justify-center bg-black/5 min-h-[300px]">
              <img 
                src={previewImage} 
                alt="Bukti Transfer" 
                className="max-h-[400px] object-contain rounded-lg border border-outline-variant/40 shadow-sm"
              />
            </div>
            <div className="p-6 border-t border-outline-variant/20 bg-surface-bright flex justify-end">
              <button 
                onClick={() => setPreviewImage(null)}
                className="px-6 py-2.5 bg-primary text-on-primary hover:bg-primary-container font-bold text-sm rounded-lg transition-colors cursor-pointer shadow-sm active:scale-95"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
