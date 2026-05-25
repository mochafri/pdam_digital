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
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'SUCCESS' | 'FAILED'>('ALL');

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/payments');
      if (!response.ok) {
        throw new Error('Gagal mengambil data riwayat pembayaran.');
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

  // Filter payments by selected tab status
  const filteredPayments = payments.filter((p) => {
    if (activeTab === 'ALL') return true;
    return p.status === activeTab;
  });

  const getStatusLabel = (status: string) => {
    if (status === 'SUCCESS') return 'Berhasil';
    if (status === 'PENDING') return 'Menunggu';
    if (status === 'FAILED') return 'Gagal';
    return status;
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'SUCCESS') return 'bg-green-100 text-green-800 border border-green-200';
    if (status === 'PENDING') return 'bg-amber-100 text-amber-800 border border-amber-200';
    if (status === 'FAILED') return 'bg-red-100 text-red-800 border border-red-200';
    return 'bg-surface-container text-on-surface-variant';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-background">Riwayat Pembayaran</h1>
          <p className="text-base text-on-surface-variant mt-2 font-medium">Pantau semua transaksi pembayaran tagihan air pelanggan secara real-time.</p>
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
          { id: 'ALL', name: 'Semua Transaksi', count: payments.length },
          { id: 'SUCCESS', name: 'Pembayaran Berhasil', count: payments.filter(p => p.status === 'SUCCESS').length },
          { id: 'PENDING', name: 'Menunggu Pembayaran', count: payments.filter(p => p.status === 'PENDING').length },
          { id: 'FAILED', name: 'Pembayaran Gagal', count: payments.filter(p => p.status === 'FAILED').length },
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
          <p className="text-on-surface-variant font-medium">Memuat data riwayat pembayaran...</p>
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
                  <th className="p-4">Periode</th>
                  <th className="p-4">Tanggal Pembuatan</th>
                  <th className="p-4">Tanggal Pembayaran</th>
                  <th className="p-4">Nominal</th>
                  <th className="p-4">Metode Bayar</th>
                  <th className="p-4 pr-6">Status</th>
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
                    <td className="p-4 text-on-surface-variant font-medium">
                      {new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-on-surface-variant font-medium">
                      {p.paidAt ? (
                        new Date(p.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      ) : (
                        <span className="text-outline font-semibold">-</span>
                      )}
                    </td>
                    <td className="p-4 font-bold tracking-tight">
                      Rp {p.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-on-surface-variant font-semibold">
                      {p.paymentMethod}
                    </td>
                     <td className="p-4 pr-6">
                       <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${getStatusBadgeClass(p.status)}`}>
                         {getStatusLabel(p.status)}
                       </span>
                     </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-on-surface-variant font-medium text-base">
                      Tidak ada data riwayat pembayaran untuk kategori ini.
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
    </div>
  );
};
