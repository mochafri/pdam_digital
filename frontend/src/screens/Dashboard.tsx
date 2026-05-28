import { FC, useEffect, useState } from 'react';
import { Icons } from '../components/Icons';
import { Screen, User, Bill } from '../types';

interface DashboardProps {
  user: User;
  navigate: (screen: Screen) => void;
  setSelectedBill: (bill: Bill | null) => void;
}

export const Dashboard: FC<DashboardProps> = ({ user, navigate, setSelectedBill }) => {
  const [mounted, setMounted] = useState(false);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    setMounted(true);
    const fetchBills = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:5000/api/bills?userId=${user.id}`);
        if (!response.ok) {
          throw new Error('Gagal mengambil data tagihan.');
        }
        const data = await response.json();
        setBills(data);
      } catch (err: any) {
        setError(err.message || 'Koneksi ke server gagal.');
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, [user.id]);

  const unpaidBill = bills.find(b => b.status === 'BELUM_BAYAR');
  const pendingBill = bills.find(b => b.status === 'MENUNGGU_VERIFIKASI');
  const activeBill = unpaidBill || pendingBill || bills[0];

  const currentUsage = activeBill ? activeBill.usage : 0;
  
  const trendPercent = bills.length > 1 && bills[1].usage > 0
    ? Math.round(((bills[0].usage - bills[1].usage) / bills[1].usage) * 100)
    : 0;

  const maxUsageVal = Math.max(...bills.map(x => x.usage || 10), 10);
  const getChartBars = () => {
    if (bills.length === 0) {
      return [
        { label: 'DES', height: '15%', usage: 0, active: false },
        { label: 'JAN', height: '15%', usage: 0, active: false },
        { label: 'FEB', height: '15%', usage: 0, active: false },
        { label: 'MAR', height: '15%', usage: 0, active: false },
        { label: 'APR', height: '15%', usage: 0, active: false },
        { label: 'MEI', height: '15%', usage: 0, active: true },
      ];
    }
    const latest6 = [...bills].slice(0, 6).reverse();
    const chartBars = latest6.map(b => ({
      label: b.monthString.substring(0, 3).toUpperCase(),
      height: `${Math.min(100, Math.max(15, (b.usage / maxUsageVal) * 100))}%`,
      usage: b.usage,
      active: b.id === activeBill?.id
    }));
    const dummyLabels = ['DES', 'JAN', 'FEB', 'MAR', 'APR', 'MEI'];
    while (chartBars.length < 6) {
      const idx = 6 - chartBars.length - 1;
      chartBars.unshift({
        label: dummyLabels[idx] || 'PREV',
        height: '15%',
        usage: 0,
        active: false
      });
    }
    return chartBars;
  };
  const chartData = getChartBars();

  const getStatusLabel = (status: string) => {
    if (status === 'LUNAS') return 'LUNAS';
    if (status === 'BELUM_BAYAR') return 'BELUM BAYAR';
    if (status === 'MENUNGGU_VERIFIKASI') return 'VERIFIKASI';
    return status;
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'LUNAS') return 'bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded shadow-sm';
    if (status === 'BELUM_BAYAR') return 'bg-error-container text-on-error-container text-[10px] font-bold px-2 py-1 rounded shadow-sm animate-pulse';
    if (status === 'MENUNGGU_VERIFIKASI') return 'bg-tertiary-container text-on-tertiary-container text-[10px] font-bold px-2 py-1 rounded shadow-sm';
    return 'bg-surface-container text-on-surface-variant text-[10px] font-bold px-2 py-1 rounded shadow-sm';
  };

  const handlePayClick = () => {
    if (unpaidBill) {
      setSelectedBill(unpaidBill);
      navigate('payment-method');
    }
  };

  return (
    <div className="pt-6 md:pt-12 px-4 md:px-8 pb-12 w-full max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {/* Welcome Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface mb-1">Halo, {user.name}</h1>
          <p className="text-on-surface-variant text-sm md:text-base">Selamat datang di dashboard pengelolaan air Anda.</p>
        </div>
        <div className="bg-surface-container border border-slate-200 px-4 py-2 rounded-lg flex items-center gap-3 self-start sm:self-end w-full sm:w-auto mt-2 sm:mt-0">
          <Icons.Droplet className="text-primary fill-primary/20 shrink-0" size={24} />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">No. Meter</p>
            <p className="font-code text-sm font-medium">{user.meterNo || 'BELUM TERCATAT'}</p>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm">
          <Icons.Droplet className="animate-bounce inline-block text-primary mb-3" size={32} />
          <p className="text-on-surface-variant font-medium">Memuat data dashboard...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm text-error font-medium">
          <Icons.AlertTriangle className="inline-block text-error mb-3" size={32} />
          <p>{error}</p>
        </div>
      ) : (
        /* Bento Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 relative">
          
          {/* Main Bill Card */}
          <div className="col-span-1 md:col-span-12 xl:col-span-4 bg-surface shadow-sm rounded-xl border border-slate-200 overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <span className={`p-3 rounded-lg ${activeBill?.status === 'BELUM_BAYAR' ? 'bg-error-container/20 text-error' : activeBill?.status === 'MENUNGGU_VERIFIKASI' ? 'bg-tertiary-container/20 text-tertiary' : 'bg-green-100 text-green-600'}`}>
                  {activeBill?.status === 'BELUM_BAYAR' ? <Icons.Clock size={24} /> : activeBill?.status === 'MENUNGGU_VERIFIKASI' ? <Icons.Clock size={24} /> : <Icons.CheckCircle size={24} />}
                </span>
                <span className={getStatusBadgeClass(activeBill?.status || 'LUNAS')}>
                  {getStatusLabel(activeBill?.status || 'LUNAS')}
                </span>
              </div>
              
              <p className="text-on-surface-variant text-xs font-semibold mb-1">
                {activeBill?.status === 'BELUM_BAYAR' ? 'Tagihan Belum Dibayar' : activeBill?.status === 'MENUNGGU_VERIFIKASI' ? 'Tagihan Menunggu Verifikasi' : 'Tagihan Terakhir'}
              </p>
              <h2 className="text-2xl font-bold mb-1">
                {activeBill ? `${activeBill.monthString} ${activeBill.yearString}` : 'Tidak ada tagihan'}
              </h2>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-on-surface-variant text-sm font-medium">Rp</span>
                <span className="text-[32px] font-bold text-on-surface">
                  {activeBill ? activeBill.total.toLocaleString('id-ID') : '0'}
                </span>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Jatuh Tempo</span>
                  <span className="font-semibold">{activeBill ? activeBill.dueDate : '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Denda (Jika terlambat)</span>
                  <span className="font-semibold text-error">
                    {activeBill?.status === 'BELUM_BAYAR' ? 'Rp 5.000' : 'Rp 0'}
                  </span>
                </div>
              </div>
            </div>
            
            {activeBill?.status === 'BELUM_BAYAR' ? (
              <button 
                onClick={handlePayClick}
                className="mt-auto w-full py-4 bg-primary text-on-primary font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors flex items-center justify-center gap-2 group cursor-pointer"
              >
                Bayar Sekarang
                <Icons.ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : activeBill?.status === 'MENUNGGU_VERIFIKASI' ? (
              <button 
                disabled
                className="mt-auto w-full py-4 bg-tertiary-container text-on-tertiary-container font-bold transition-colors flex items-center justify-center gap-2 cursor-not-allowed"
              >
                Sedang Diverifikasi
                <Icons.Clock size={18} />
              </button>
            ) : (
              <button 
                onClick={() => navigate('bills')}
                className="mt-auto w-full py-4 bg-surface-container text-on-surface-variant font-bold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Lihat Riwayat Tagihan
                <Icons.ArrowRight size={18} />
              </button>
            )}
          </div>
          
          {/* Usage Chart Card */}
          <div className="col-span-1 md:col-span-12 xl:col-span-8 bg-surface-container-lowest shadow-sm rounded-xl border border-slate-200 p-6 flex flex-col transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-bold text-on-surface">Grafik Pemakaian Air</h3>
                <p className="text-sm text-on-surface-variant">6 Periode Terakhir (m³)</p>
              </div>
              <div className="flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Pemakaian</span>
              </div>
            </div>
            
            <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 px-2 mt-auto">
              {chartData.map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group">
                  <div className="relative w-full flex justify-center">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 bg-inverse-surface text-inverse-on-surface text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none drop-shadow-md z-10 whitespace-nowrap">
                      {bar.usage} m³
                    </div>
                  </div>
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-1000 ease-out hover:brightness-110 cursor-pointer
                      ${bar.active ? 'bg-primary' : 'bg-primary-container/40'}`}
                    style={{ height: mounted ? bar.height : '0%' }}
                  ></div>
                  <span className={`text-[10px] font-bold ${bar.active ? 'text-primary' : 'text-on-surface-variant'}`}>{bar.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Total Consumption Metric */}
          <div className="col-span-1 md:col-span-4 bg-surface-container shadow-sm rounded-xl border border-slate-200 p-6 transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Icons.Droplet size={24} className="fill-primary/20" />
              </div>
              <h4 className="text-sm font-semibold text-on-surface-variant">Pemakaian Bulan Ini</h4>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight">{currentUsage}</span>
              <span className="text-lg text-on-surface-variant">m³</span>
            </div>
            
            {trendPercent >= 0 ? (
              <div className="mt-4 flex items-center gap-2 text-error text-sm font-semibold">
                <Icons.TrendingUp size={16} />
                +{trendPercent}% dari bulan lalu
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-semibold">
                <Icons.TrendingDown size={16} />
                {trendPercent}% dari bulan lalu
              </div>
            )}
          </div>
          
          {/* Latest History */}
          <div className="col-span-1 md:col-span-8 bg-surface-container-lowest shadow-sm rounded-xl border border-slate-200 p-6 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Riwayat Terakhir</h3>
              <button 
                onClick={() => navigate('bills')}
                className="text-primary text-xs font-bold flex items-center gap-1 hover:underline group cursor-pointer"
              >
                Lihat Semua
                <Icons.ExternalLink size={14} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
            <div className="overflow-x-auto custom-scrollbar pb-2">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="text-[10px] font-bold text-on-surface-variant uppercase border-b border-slate-200">
                    <th className="pb-3 px-2 font-semibold">Bulan</th>
                    <th className="pb-3 px-2 font-semibold">Stand Meter</th>
                    <th className="pb-3 px-2 font-semibold">Pemakaian</th>
                    <th className="pb-3 px-2 font-semibold text-right">Jumlah</th>
                    <th className="pb-3 px-2 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {bills.slice(0, 3).map((b) => (
                    <tr 
                      key={b.id} 
                      className="border-b border-slate-200 hover:bg-surface-container-low transition-colors group cursor-pointer" 
                      onClick={() => {
                        if (b.status === 'BELUM_BAYAR') {
                          setSelectedBill(b);
                          navigate('payment-method');
                        } else {
                          navigate('bills');
                        }
                      }}
                    >
                      <td className="py-4 px-2 font-semibold text-on-surface group-hover:text-primary transition-colors">
                        {b.monthString} {b.yearString}
                      </td>
                      <td className="py-4 px-2 text-on-surface-variant font-code">
                        {b.meterStart} → {b.meterEnd}
                      </td>
                      <td className="py-4 px-2 text-on-surface-variant font-semibold">
                        {b.usage} m³
                      </td>
                      <td className="py-4 px-2 text-right font-semibold">
                        Rp {b.total.toLocaleString('id-ID')}
                      </td>
                      <td className="py-4 px-2 text-right">
                        <span className={getStatusBadgeClass(b.status)}>
                          {getStatusLabel(b.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {bills.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-on-surface-variant font-medium">
                        Belum ada riwayat tagihan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Banner */}
          <div className="col-span-1 md:col-span-12 rounded-xl bg-gradient-to-r from-[#00478d] to-[#004c73] p-8 text-on-primary flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden mt-2 shadow-sm">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-2xl font-bold mb-2">Hemat Air, Hemat Biaya!</h2>
              <p className="text-on-primary/80 text-base leading-relaxed">
                Gunakan kran sensor otomatis untuk menghemat pemakaian air hingga 30% setiap bulannya. Dapatkan promo alat di PDAM Store.
              </p>
            </div>
            <button className="relative z-10 bg-surface-container-lowest text-primary font-bold px-8 py-3 rounded-lg hover:bg-surface-container-low hover:scale-105 active:scale-95 transition-all shadow-md whitespace-nowrap cursor-pointer">
              Pelajari Selengkapnya
            </button>
            
            {/* Decorative shapes */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
            <div className="absolute left-1/4 bottom-0 w-32 h-32 bg-white/10 rounded-full -mb-16 blur-2xl pointer-events-none"></div>
          </div>
          
        </div>
      )}
    </div>
  );
};
