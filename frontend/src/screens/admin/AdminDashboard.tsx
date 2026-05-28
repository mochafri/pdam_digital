import { FC, useEffect, useState } from 'react';
import { Icons } from '../../components/Icons';
import { Screen, Payment } from '../../types';

interface AdminDashboardProps {
  navigate: (screen: Screen) => void;
}

interface Stats {
  totalCustomers: number;
  activeCustomers: number;
  tunggakanCustomers: number;
  pendingPaymentsCount: number;
  totalBillsUnpaid: number;
  paymentRate: number;
  complaintResolution: number;
  trends: Array<{ label: string; usage: number }>;
}

export const AdminDashboard: FC<AdminDashboardProps> = ({ navigate }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, paymentsRes] = await Promise.all([
          fetch('http://localhost:5000/api/stats'),
          fetch('http://localhost:5000/api/payments')
        ]);

        if (!statsRes.ok || !paymentsRes.ok) {
          throw new Error('Gagal memuat data statistik dashboard.');
        }

        const statsData = await statsRes.json();
        const paymentsData = await paymentsRes.json();

        setStats(statsData);
        setPayments(paymentsData);
      } catch (err: any) {
        setError(err.message || 'Koneksi ke server gagal.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusLabel = (status: string) => {
    if (status === 'SUCCESS') return 'Berhasil';
    if (status === 'PENDING') return 'Pending';
    if (status === 'FAILED') return 'Gagal';
    return status;
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'SUCCESS') return 'bg-green-100 text-green-800';
    if (status === 'PENDING') return 'bg-tertiary-fixed text-on-tertiary-fixed animate-pulse';
    if (status === 'FAILED') return 'bg-error-container text-on-error-container';
    return 'bg-surface-container text-on-surface-variant';
  };

  return (
    <div className="px-4 md:px-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-background">Ringkasan Dasbor</h1>
          <p className="text-base text-on-surface-variant mt-2 font-medium">Ringkasan operasional dan finansial hari ini.</p>
        </div>
        <div className="flex items-center gap-4 text-sm w-full sm:w-auto">
          <button 
            onClick={() => navigate('admin-meter')}
            className="bg-primary text-on-primary font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-fixed-variant transition-colors shadow-sm active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Icons.Plus size={18} />
            Input Meteran
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm">
          <Icons.Droplet className="animate-bounce inline-block text-primary mb-3" size={32} />
          <p className="text-on-surface-variant font-medium">Memuat statistik sistem...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm text-error font-medium">
          <Icons.AlertTriangle className="inline-block text-error mb-3" size={32} />
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Bento Grid: Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Card 1: Total Pelanggan */}
            <div className="bg-surface flex flex-col justify-between rounded-xl p-6 shadow-sm border border-slate-200 transition-all hover:shadow-md hover:-translate-y-1 group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-surface-container rounded-lg text-primary group-hover:bg-primary/10 transition-colors">
                  <Icons.Users size={24} />
                </div>
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                  {stats?.activeCustomers} Aktif
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface-variant mb-1">Total Pelanggan</p>
                <p className="text-3xl font-bold text-on-surface tracking-tight">{stats?.totalCustomers}</p>
              </div>
            </div>

            {/* Card 2: Tunggakan Pelanggan */}
            <div className="bg-surface flex flex-col justify-between rounded-xl p-6 shadow-sm border border-slate-200 transition-all hover:shadow-md hover:-translate-y-1 group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-surface-container rounded-lg text-primary group-hover:bg-primary/10 transition-colors">
                  <Icons.AlertTriangle size={24} className="text-error" />
                </div>
                {stats && stats.tunggakanCustomers > 0 ? (
                  <span className="text-xs font-bold text-error bg-error-container px-2.5 py-1 rounded-full animate-pulse">
                    Tindakan
                  </span>
                ) : (
                  <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                    Aman
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface-variant mb-1">Pelanggan Menunggak</p>
                <p className="text-3xl font-bold text-on-surface tracking-tight">{stats?.tunggakanCustomers}</p>
              </div>
            </div>

            {/* Card 3: Pembayaran Pending */}
            <div className="bg-surface flex flex-col justify-between rounded-xl p-6 shadow-sm border border-slate-200 transition-all hover:shadow-md hover:-translate-y-1 group cursor-pointer" onClick={() => navigate('admin-payments')}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-tertiary-container/30 rounded-lg text-tertiary group-hover:bg-tertiary-container/50 transition-colors">
                  <Icons.Clock size={24} />
                </div>
                {stats && stats.pendingPaymentsCount > 0 && (
                  <span className="text-xs font-bold text-on-tertiary-container bg-tertiary-container px-2.5 py-1 rounded-full animate-bounce">
                    Pending
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface-variant mb-1">Pembayaran Pending</p>
                <p className="text-3xl font-bold text-on-surface tracking-tight">{stats?.pendingPaymentsCount}</p>
              </div>
            </div>

            {/* Card 4: Tagihan Belum Bayar */}
            <div className="bg-surface flex flex-col justify-between rounded-xl p-6 shadow-sm border border-slate-200 transition-all hover:shadow-md hover:-translate-y-1 group cursor-pointer" onClick={() => navigate('admin-bills')}>
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-error-container/30 rounded-lg text-error group-hover:bg-error-container transition-colors">
                  <Icons.Receipt size={24} />
                </div>
                <span className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-2.5 py-1 rounded-full">
                  Belum Bayar
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface-variant mb-1">Tagihan Belum Bayar</p>
                <p className="text-3xl font-bold text-on-surface tracking-tight">{stats?.totalBillsUnpaid}</p>
              </div>
            </div>
          </div>

          {/* Main Workspace Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
            {/* Chart Section */}
            <div className="lg:col-span-8 bg-surface rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-on-surface">Tren Distribusi Air</h2>
                <span className="text-xs text-on-surface-variant font-medium bg-surface-container px-2.5 py-1 rounded-full">Distribusi per Periode (m³)</span>
              </div>
              
              <div className="flex-1 flex items-end gap-2 mt-4 pt-4 border-t border-surface-container-high relative min-h-[240px]">
                {/* Y-axis labels */}
                {(() => {
                  const maxUsage = stats?.trends ? Math.max(...stats.trends.map(t => t.usage), 1) : 100;
                  return (
                    <>
                      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-on-surface-variant text-xs font-semibold py-2">
                        <span>{Math.round(maxUsage)} m³</span>
                        <span>{Math.round(maxUsage * 0.75)} m³</span>
                        <span>{Math.round(maxUsage * 0.5)} m³</span>
                        <span>{Math.round(maxUsage * 0.25)} m³</span>
                        <span>0</span>
                      </div>
                      <div className="flex-1 pl-12 flex items-end justify-between h-full gap-4">
                        {(stats?.trends || []).map((bar, i) => {
                          const heightPercent = `${Math.round((bar.usage / maxUsage) * 100)}%`;
                          return (
                            <div 
                              key={i} 
                              className="w-full rounded-t-md relative group cursor-pointer transition-all duration-500 ease-out bg-primary hover:bg-primary-fixed-variant" 
                              style={{ height: heightPercent || '10%' }}
                            >
                              <div className="absolute -bottom-7 w-full text-center text-xs font-bold text-on-surface-variant">
                                {bar.label}
                              </div>
                              {/* Tooltip on hover */}
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none drop-shadow-md z-10 whitespace-nowrap font-bold">
                                {bar.usage.toLocaleString('id-ID')} m³
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Secondary Widget */}
            <div className="lg:col-span-4 bg-surface rounded-xl shadow-sm border border-outline-variant p-6">
              <h2 className="text-xl font-bold text-on-surface mb-6">Status Operasional</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-on-surface">Tingkat Pelunasan Tagihan</span>
                    <span className="text-primary">{stats?.paymentRate || 100}%</span>
                  </div>
                  <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${stats?.paymentRate || 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-on-surface">Rasio Transaksi Sukses</span>
                    <span className="text-primary">{stats?.complaintResolution || 100}%</span>
                  </div>
                  <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${stats?.complaintResolution || 100}%` }}></div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-surface-container mt-8">
                  <div className="flex items-center gap-4 bg-surface-container-low p-4 rounded-xl border border-primary/10">
                    <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                      <Icons.Droplet size={24} className="fill-current" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">Kualitas Air Normal</p>
                      <p className="text-xs font-medium text-on-surface-variant mt-0.5">Diperbarui beberapa menit yang lalu</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-surface rounded-xl shadow-sm border border-outline-variant overflow-hidden">
            <div className="p-6 border-b border-surface-container flex items-center justify-between bg-surface-bright/30">
              <h2 className="text-xl font-bold text-on-surface">Aktivitas Transaksi Terbaru</h2>
              <button onClick={() => navigate('admin-payments')} className="text-sm font-bold text-primary hover:text-primary-fixed-variant transition-colors hover:underline cursor-pointer">Lihat Semua</button>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-container-low/50 border-b border-surface-container">
                    <th className="text-xs font-bold text-on-surface-variant uppercase tracking-wider py-4 px-6">ID Transaksi</th>
                    <th className="text-xs font-bold text-on-surface-variant uppercase tracking-wider py-4 px-6">Nama Pelanggan</th>
                    <th className="text-xs font-bold text-on-surface-variant uppercase tracking-wider py-4 px-6">Metode</th>
                    <th className="text-xs font-bold text-on-surface-variant uppercase tracking-wider py-4 px-6">Nominal</th>
                    <th className="text-xs font-bold text-on-surface-variant uppercase tracking-wider py-4 px-6">Status</th>
                    <th className="text-xs font-bold text-on-surface-variant uppercase tracking-wider py-4 px-6">Waktu Pencatatan</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium text-on-surface divide-y divide-surface-container">
                  {payments.slice(0, 5).map((p) => (
                    <tr 
                      key={p.id} 
                      className="hover:bg-surface-container-lowest transition-colors cursor-pointer group" 
                      onClick={() => navigate('admin-payments')}
                    >
                      <td className="py-4 px-6 font-code text-secondary group-hover:text-primary transition-colors">
                        TRX-{p.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="py-4 px-6 font-bold">{p.user?.name || 'Pelanggan'}</td>
                      <td className="py-4 px-6 text-on-surface-variant">{p.paymentMethod}</td>
                      <td className="py-4 px-6 font-bold">Rp {p.amount.toLocaleString('id-ID')}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(p.status)}`}>
                          {getStatusLabel(p.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-on-surface-variant font-semibold">
                        {new Date(p.createdAt).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-on-surface-variant font-medium">
                        Belum ada aktivitas pembayaran tercatat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
