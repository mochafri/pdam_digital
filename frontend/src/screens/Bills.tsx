import { FC, useState, useEffect } from 'react';
import { Icons } from '../components/Icons';
import { Screen, Bill, User } from '../types';

interface BillsProps {
  user: User;
  navigate: (screen: Screen) => void;
  setSelectedBill: (bill: Bill | null) => void;
}

export const Bills: FC<BillsProps> = ({ user, navigate, setSelectedBill }) => {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:5000/api/bills?userId=${user.id}`);
        if (!response.ok) {
          throw new Error('Gagal mengambil data riwayat tagihan.');
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

  // Filter bills by selected year
  const filteredBills = bills.filter(b => b.yearString === selectedYear);

  // Metrics calculation
  const averageUsage = filteredBills.length > 0
    ? (filteredBills.reduce((sum, b) => sum + b.usage, 0) / filteredBills.length).toFixed(1)
    : '0';

  const unpaidBills = filteredBills.filter(b => b.status === 'BELUM_BAYAR');
  const unpaidTotal = unpaidBills.reduce((sum, b) => sum + b.total, 0);
  const unpaidCount = unpaidBills.length;
  const totalCount = filteredBills.length;

  const getStatusLabel = (status: string) => {
    if (status === 'LUNAS') return 'LUNAS';
    if (status === 'BELUM_BAYAR') return 'BELUM BAYAR';
    if (status === 'MENUNGGU_VERIFIKASI') return 'MEMVERIFIKASI';
    return status;
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'LUNAS') return 'bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm';
    if (status === 'BELUM_BAYAR') return 'bg-error-container text-on-error-container text-xs font-bold px-3 py-1 rounded-full shadow-sm animate-pulse';
    if (status === 'MENUNGGU_VERIFIKASI') return 'bg-tertiary-container text-on-tertiary-container text-xs font-bold px-3 py-1 rounded-full shadow-sm';
    return 'bg-surface-container text-on-surface-variant text-xs font-bold px-3 py-1 rounded-full shadow-sm';
  };

  const handlePayClick = (bill: Bill) => {
    setSelectedBill(bill);
    navigate('payment-method');
  };

  return (
    <div className="pt-6 md:pt-12 px-2 md:px-8 pb-12 w-full max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Daftar Tagihan Saya</h1>
          <p className="text-on-surface-variant mt-1 text-base">Kelola dan pantau riwayat penggunaan air bulanan Anda.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Pilih Tahun</label>
            <div className="relative">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-4 py-2 pr-10 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none cursor-pointer hover:border-outline transition-colors text-on-surface"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
              <Icons.ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
            </div>
          </div>
          <button className="bg-surface-container-low text-primary border border-primary/20 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-primary/5 transition-colors mt-auto group cursor-pointer">
            <Icons.Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
            Unduh Laporan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm">
          <Icons.Droplet className="animate-bounce inline-block text-primary mb-3" size={32} />
          <p className="text-on-surface-variant font-medium">Memuat data tagihan...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm text-error font-medium">
          <Icons.AlertTriangle className="inline-block text-error mb-3" size={32} />
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30 relative overflow-hidden group hover:border-primary/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-primary">
                <Icons.Droplet size={80} strokeWidth={1} className="fill-current" />
              </div>
              <p className="text-on-surface-variant text-sm font-semibold">Rata-rata Pemakaian</p>
              <h3 className="text-4xl font-bold text-primary mt-2">{averageUsage} <span className="text-sm font-normal text-on-surface-variant">m³ / bln</span></h3>
              <div className="mt-4 flex items-center gap-2 text-[12px] text-green-600 font-medium">
                <Icons.TrendingDown size={14} />
                Stabil di tingkat hemat
              </div>
            </div>
            
            <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:border-error/30 transition-colors">
              <div>
                <p className="text-on-surface-variant text-sm font-semibold">Tagihan Belum Dibayar</p>
                <h3 className="text-4xl font-bold text-error mt-2 tracking-tight">Rp {unpaidTotal.toLocaleString('id-ID')}</h3>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-error h-full rounded-full transition-all duration-500" 
                    style={{ width: `${totalCount > 0 ? (unpaidCount / totalCount) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-xs text-on-surface-variant whitespace-nowrap font-medium">{unpaidCount} dari {totalCount} Tagihan</span>
              </div>
            </div>
            
            <div className="bg-primary p-6 rounded-xl shadow-sm text-on-primary flex flex-col justify-between overflow-hidden relative group">
              {/* Abstract background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none transition-transform duration-700 group-hover:scale-110">
                <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 100 C 100 50 300 150 400 100 L 400 200 L 0 200 Z" fill="white"></path>
                  <path d="M0 120 C 120 70 280 170 400 120 L 400 200 L 0 200 Z" fill="white" opacity="0.5"></path>
                </svg>
              </div>
              <div className="z-10">
                <p className="text-sm font-semibold opacity-90">Saldo Kredit Saat Ini</p>
                <h3 className="text-4xl font-bold mt-2">Rp 0</h3>
              </div>
              <button className="z-10 mt-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 py-2.5 rounded-lg text-sm font-semibold transition-colors backdrop-blur-sm shadow-sm active:scale-[0.98] cursor-pointer">
                Top Up Saldo
              </button>
            </div>
          </div>

          {/* Billing Table Section */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-bright/30">
              <h3 className="text-xl font-bold text-on-surface">Riwayat Tagihan {selectedYear}</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-xs text-on-surface-variant font-medium">Informasi sinkron dengan database</span>
              </div>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-surface-container-low select-none">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Bulan/Tahun</th>
                    <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Stand Meter (m³)</th>
                    <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-center">Pemakaian</th>
                    <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total Tagihan</th>
                    <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredBills.map((bill) => (
                    <tr 
                      key={bill.id} 
                      className={`transition-colors group hover:bg-surface-container-low/50 relative
                        ${bill.status === 'BELUM_BAYAR' ? 'bg-error-container/5' : ''}`}
                    >
                      <td className={`px-6 py-5 ${bill.status === 'BELUM_BAYAR' ? 'border-l-4 border-error' : 'border-l-4 border-transparent'}`}>
                        <p className="font-semibold text-on-surface">{bill.monthString} {bill.yearString}</p>
                        <p className={`text-[11px] mt-0.5 ${bill.status === 'BELUM_BAYAR' ? 'text-error font-medium' : 'text-on-surface-variant'}`}>
                          Tenggat: {bill.dueDate}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Awal</span>
                            <span className="font-code text-base">{bill.meterStart.toLocaleString()}</span>
                          </div>
                          <Icons.ArrowRight size={16} className="text-outline-variant" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Akhir</span>
                            <span className="font-code text-base">{bill.meterEnd.toLocaleString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center font-bold text-primary text-lg">
                        {bill.usage.toFixed(1)}
                      </td>
                      <td className={`px-6 py-5 font-bold tracking-tight text-lg ${bill.status === 'BELUM_BAYAR' ? 'text-error' : 'text-on-surface'}`}>
                        Rp {bill.total.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-5">
                        <span className={getStatusBadgeClass(bill.status)}>
                          {getStatusLabel(bill.status)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {bill.status === 'BELUM_BAYAR' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handlePayClick(bill)}
                              className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-primary-container hover:text-on-primary-container transition-colors whitespace-nowrap active:scale-95 cursor-pointer"
                            >
                              Bayar Sekarang
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors cursor-pointer" title="Lihat Detail">
                              <Icons.Eye size={20} />
                            </button>
                            <button className="p-2 text-on-surface-variant hover:bg-surface-container-highest rounded-full transition-colors cursor-pointer" title="Unduh Struk">
                              <Icons.Download size={20} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredBills.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant font-medium text-base">
                        Tidak ada riwayat tagihan untuk tahun {selectedYear}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-surface-container-low/50 border-t border-outline-variant/30 flex items-center justify-between mt-auto">
              <p className="text-sm text-on-surface-variant font-medium">Menampilkan {filteredBills.length} tagihan</p>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg text-outline hover:text-primary hover:bg-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent" disabled>
                  <Icons.ChevronLeft size={20} />
                </button>
                <button className="w-8 h-8 rounded-lg bg-primary text-on-primary text-sm font-bold shadow-sm">1</button>
                <button className="p-2 rounded-lg text-outline hover:text-primary hover:bg-white transition-colors disabled:opacity-30" disabled>
                  <Icons.ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Utility Advisory */}
          <div className="mt-8 flex flex-col lg:flex-row gap-6">
            <div className="flex-1 bg-surface-container rounded-xl p-6 border border-primary/10 flex items-start gap-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 bg-primary/10 rounded-full text-primary shrink-0">
                <Icons.Lightbulb size={28} className="fill-primary/20" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-on-surface">Tips Hemat Air Bulan Ini</h4>
                <p className="text-on-surface-variant mt-2 leading-relaxed text-sm">
                  Menjaga meteran air tetap bersih dan memantau pemakaian mingguan secara manual dapat mendeteksi kebocoran pipa tersembunyi lebih cepat untuk menghindari pembengkakan tagihan.
                </p>
                <a href="#" className="inline-flex items-center gap-1 mt-4 text-primary text-sm font-bold hover:underline group">
                  Pelajari pedoman kami
                  <Icons.ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>
            
            <div className="w-full lg:w-[340px] bg-tertiary-container text-on-tertiary-container p-6 rounded-xl border border-tertiary/10 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Icons.HelpCircle size={100} />
              </div>
              <h4 className="text-lg font-bold relative z-10">Butuh Bantuan?</h4>
              <p className="text-sm mt-2 opacity-90 relative z-10 font-medium">Hubungi layanan pelanggan kami jika Anda memiliki kendala terkait tagihan atau meteran.</p>
              <div className="mt-6 flex flex-col gap-4 relative z-10">
                <a href="tel:02112345678" className="flex items-center gap-3 hover:bg-white/10 p-2 -ml-2 rounded-lg transition-colors w-fit">
                  <Icons.Phone size={20} className="opacity-80" />
                  <span className="text-sm font-bold tracking-wide">021-1234-5678</span>
                </a>
                <a href="#" className="flex items-center gap-3 hover:bg-white/10 p-2 -ml-2 rounded-lg transition-colors w-fit">
                  <Icons.MessageCircle size={20} className="fill-current opacity-80" />
                  <span className="text-sm font-bold">Live Chat via WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
