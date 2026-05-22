import { FC, useEffect, useState } from 'react';
import { Icons } from '../../components/Icons';
import { Screen, Bill } from '../../types';

interface AdminBillsProps {
  navigate: (screen: Screen) => void;
}

export const AdminBills: FC<AdminBillsProps> = ({ navigate }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Semua');

  useEffect(() => {
    const fetchBills = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:5000/api/bills');
        if (!response.ok) {
          throw new Error('Gagal mengambil data tagihan sistem.');
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
  }, []);

  // Compute metrics dynamically from the active bills list
  const unpaidBills = bills.filter(b => b.status === 'BELUM_BAYAR');
  const unpaidTotal = unpaidBills.reduce((sum, b) => sum + b.total, 0);
  const unpaidCount = unpaidBills.length;

  const verifyingBills = bills.filter(b => b.status === 'MENUNGGU_VERIFIKASI');
  const verifyingTotal = verifyingBills.reduce((sum, b) => sum + b.total, 0);
  const verifyingCount = verifyingBills.length;

  const lunasBills = bills.filter(b => b.status === 'LUNAS');
  const lunasTotal = lunasBills.reduce((sum, b) => sum + b.total, 0);
  const lunasCount = lunasBills.length;

  // Extract unique monthString/yearString periods for filtering
  const periods = ['Semua', ...Array.from(new Set(bills.map(b => `${b.monthString} ${b.yearString}`)))];

  const filteredBills = selectedPeriod === 'Semua'
    ? bills
    : bills.filter(b => `${b.monthString} ${b.yearString}` === selectedPeriod);

  const getStatusLabel = (status: string) => {
    if (status === 'LUNAS') return 'Lunas';
    if (status === 'BELUM_BAYAR') return 'Belum Bayar';
    if (status === 'MENUNGGU_VERIFIKASI') return 'Menunggu Verifikasi';
    return status;
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'LUNAS') return 'bg-green-100 text-green-800';
    if (status === 'BELUM_BAYAR') return 'bg-error-container text-error animate-pulse';
    if (status === 'MENUNGGU_VERIFIKASI') return 'bg-tertiary-container text-on-tertiary-container';
    return 'bg-surface-container text-on-surface-variant';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-on-surface">Daftar Tagihan Pelanggan</h2>
          <p className="text-sm text-on-surface-variant mt-1 font-medium">Kelola dan verifikasi tagihan seluruh pelanggan.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('admin-meter')}
            className="bg-primary text-on-primary text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-fixed-variant transition-colors shadow-sm active:scale-95 cursor-pointer"
          >
            <Icons.Plus size={20} />
            Buat Tagihan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm">
          <Icons.Droplet className="animate-bounce inline-block text-primary mb-3" size={32} />
          <p className="text-on-surface-variant font-medium">Memuat riwayat tagihan sistem...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm text-error font-medium">
          <Icons.AlertTriangle className="inline-block text-error mb-3" size={32} />
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card: Unpaid */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/60 flex flex-col justify-between hover:border-error/30 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-error-container/50 flex items-center justify-center text-error">
                  <Icons.AlertTriangle size={20} />
                </div>
                <span className="text-[11px] font-bold text-error bg-error-container px-2 py-1 rounded-full uppercase tracking-wider">Belum Bayar</span>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-on-surface">Rp {unpaidTotal.toLocaleString('id-ID')}</h3>
                <p className="text-sm text-on-surface-variant font-medium mt-1">{unpaidCount} Tagihan Outstanding</p>
              </div>
            </div>

            {/* Card: Pending Verification */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/60 flex flex-col justify-between hover:border-tertiary/30 transition-colors cursor-pointer" onClick={() => navigate('admin-payments')}>
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-tertiary-container/30 flex items-center justify-center text-tertiary">
                  <Icons.Clock size={20} />
                </div>
                <span className="text-[11px] font-bold text-on-tertiary-container bg-tertiary-container px-2 py-1 rounded-full uppercase tracking-wider">Menunggu Verifikasi</span>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-on-surface">Rp {verifyingTotal.toLocaleString('id-ID')}</h3>
                <p className="text-sm text-on-surface-variant font-medium mt-1">{verifyingCount} Tagihan Antrean</p>
              </div>
            </div>

            {/* Card: Lunas */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/60 flex flex-col justify-between hover:border-green-300 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-700">
                  <Icons.CheckCircle size={20} />
                </div>
                <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full uppercase tracking-wider">Lunas</span>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-on-surface">Rp {lunasTotal.toLocaleString('id-ID')}</h3>
                <p className="text-sm text-on-surface-variant font-medium mt-1">{lunasCount} Tagihan Terbayar</p>
              </div>
            </div>
          </div>

          {/* Data Table Card */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/80 overflow-hidden">
            <div className="p-6 border-b border-outline-variant/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container-low/30">
              <h3 className="text-lg font-bold text-on-surface">Daftar Tagihan Aktif</h3>
              <div className="flex items-center gap-2 text-sm text-on-surface-variant font-medium">
                <span>Periode:</span>
                <div className="relative">
                  <select 
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="bg-transparent border-none text-primary font-bold cursor-pointer focus:ring-0 p-0 pr-5 appearance-none outline-none"
                  >
                    {periods.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <Icons.ChevronDown size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-surface-container-low/50 border-b border-outline-variant/50 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    <th className="p-4 pl-6">No. Meteran</th>
                    <th className="p-4">Nama Pelanggan</th>
                    <th className="p-4">Periode</th>
                    <th className="p-4">Stand Awal → Akhir</th>
                    <th className="p-4 text-right">Total Tagihan (Rp)</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center pr-6">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-on-surface divide-y divide-outline-variant/30">
                  {filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-surface-container-low/50 transition-colors group">
                      <td className="p-4 pl-6 font-code text-on-surface-variant font-medium group-hover:text-primary transition-colors">
                        {bill.user?.meterNo || 'BELUM SET'}
                      </td>
                      <td className="p-4 font-bold">{bill.user?.name || 'Pelanggan'}</td>
                      <td className="p-4 text-on-surface-variant font-medium">{bill.monthString} {bill.yearString}</td>
                      <td className="p-4 text-on-surface-variant font-code">
                        {bill.meterStart} → {bill.meterEnd} ({bill.usage} m³)
                      </td>
                      <td className="p-4 text-right font-bold tracking-tight">
                        {bill.total.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${getStatusBadgeClass(bill.status)}`}>
                          {getStatusLabel(bill.status)}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-center">
                        {bill.status === 'MENUNGGU_VERIFIKASI' ? (
                          <button 
                            onClick={() => navigate('admin-payments')}
                            className="bg-primary text-on-primary hover:bg-primary-fixed-variant px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                          >
                            Verifikasi
                          </button>
                        ) : (
                          <button className="text-on-surface-variant hover:text-primary hover:bg-surface-container p-2 rounded-lg transition-colors cursor-pointer">
                            <Icons.MoreVertical size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredBills.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-on-surface-variant font-medium text-base">
                        Belum ada tagihan terdaftar untuk periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-on-surface-variant font-medium bg-surface-container-lowest">
              <div>Menampilkan {filteredBills.length} dari {bills.length} total tagihan</div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-lg hover:bg-surface-container transition-colors disabled:opacity-30" disabled>
                  <Icons.ChevronLeft size={18} />
                </button>
                <span className="w-8 h-8 flex items-center justify-center font-bold text-primary bg-primary/10 rounded-lg">1</span>
                <button className="p-2 rounded-lg hover:bg-surface-container transition-colors disabled:opacity-30" disabled>
                  <Icons.ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
