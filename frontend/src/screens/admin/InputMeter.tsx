import React, { FC, useState, useEffect } from 'react';
import { Icons } from '../../components/Icons';
import { Screen, User, Bill } from '../../types';

interface InputMeterProps {
  navigate: (screen: Screen) => void;
}

export const InputMeter: FC<InputMeterProps> = ({ navigate }) => {
  const [customers, setCustomers] = useState<User[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('Mei');
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [standAwal, setStandAwal] = useState<number>(0);
  const [standAkhir, setStandAkhir] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch all customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://localhost:5000/api/customers');
        if (!response.ok) {
          throw new Error('Gagal mengambil data pelanggan.');
        }
        const data = await response.json();
        setCustomers(data);
        if (data.length > 0) {
          setSelectedCustomerId(data[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Koneksi ke server gagal.');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // Fetch standAwal (latest bill's standAkhir) when customer is selected
  useEffect(() => {
    if (!selectedCustomerId) return;
    
    const fetchLatestBill = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/bills?userId=${selectedCustomerId}`);
        if (!response.ok) {
          throw new Error('Gagal mengambil riwayat tagihan.');
        }
        const bills: Bill[] = await response.json();
        if (bills.length > 0) {
          // Find the latest bill (based on meterEnd/createdAt)
          const latestBill = bills[0]; // Already ordered by desc in backend
          setStandAwal(latestBill.meterEnd);
        } else {
          // New customer, no previous bills
          setStandAwal(0);
        }
      } catch (err) {
        console.error('Error fetching latest bill:', err);
        setStandAwal(0); // Default to 0 on failure or new customer
      }
    };

    fetchLatestBill();
  }, [selectedCustomerId]);

  const pemakaian = standAkhir ? parseInt(standAkhir) - standAwal : 0;
  const biayaPemakaian = pemakaian > 0 ? pemakaian * 6000 : 0;
  const adminFee = 20000;
  const total = biayaPemakaian + adminFee;

  const handleSaveMeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      alert('Silakan pilih pelanggan terlebih dahulu.');
      return;
    }
    const endVal = parseInt(standAkhir);
    if (isNaN(endVal) || endVal <= standAwal) {
      alert('Stand akhir harus lebih besar dari stand awal.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch('http://localhost:5000/api/bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedCustomerId,
          monthString: selectedMonth,
          yearString: selectedYear,
          meterStart: standAwal,
          meterEnd: endVal,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Gagal menyimpan data meteran.');
      }

      alert('Data meteran bulanan berhasil disimpan dan tagihan diterbitkan!');
      setStandAkhir('');
      navigate('admin-customers');
    } catch (err: any) {
      setSaveError(err.message || 'Koneksi ke server gagal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-on-surface mb-2">Input Meteran Air Bulanan</h2>
        <p className="text-base font-medium text-on-surface-variant">Catat pemakaian air pelanggan untuk periode penagihan saat ini langsung ke database.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm">
          <Icons.Droplet className="animate-bounce inline-block text-primary mb-3" size={32} />
          <p className="text-on-surface-variant font-medium">Memuat data pelanggan dan informasi meteran...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm text-error font-medium">
          <Icons.AlertTriangle className="inline-block text-error mb-3" size={32} />
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Input Form Section */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/60 p-8">
              <form className="space-y-8" onSubmit={handleSaveMeter}>
                
                {saveError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg">
                    {saveError}
                  </div>
                )}

                {/* Customer Select */}
                <div>
                  <label className="block text-sm font-bold text-on-surface mb-2">Pilih Pelanggan</label>
                  <div className="relative">
                    <Icons.UserSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                    <select 
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      className="w-full pl-10 pr-10 py-3.5 bg-surface-bright border border-outline-variant/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-semibold appearance-none cursor-pointer"
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.meterNo} - {c.name} ({c.desa}, RT {c.rt})
                        </option>
                      ))}
                    </select>
                    <Icons.ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
                  </div>
                </div>

                {/* Date Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Bulan Tagihan</label>
                    <div className="relative">
                      <Icons.Calendar size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                      <select 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full pl-10 pr-10 py-3.5 bg-surface-bright border border-outline-variant/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-semibold appearance-none cursor-pointer"
                      >
                        <option value="Januari">Januari</option>
                        <option value="Februari">Februari</option>
                        <option value="Maret">Maret</option>
                        <option value="April">April</option>
                        <option value="Mei">Mei</option>
                        <option value="Juni">Juni</option>
                        <option value="Juli">Juli</option>
                        <option value="Agustus">Agustus</option>
                        <option value="September">September</option>
                        <option value="Oktober">Oktober</option>
                        <option value="November">November</option>
                        <option value="Desember">Desember</option>
                      </select>
                      <Icons.ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Tahun</label>
                    <div className="relative">
                      <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full px-4 py-3.5 bg-surface-bright border border-outline-variant/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-semibold appearance-none cursor-pointer"
                      >
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                      </select>
                      <Icons.ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Meter Readings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-outline-variant/30">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-on-surface mb-3">
                      Stand Awal (m³)
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-surface-container-high text-on-surface-variant">Database Pre-filled</span>
                    </label>
                    <input 
                      type="number" 
                      value={standAwal}
                      readOnly
                      className="w-full px-4 py-3.5 bg-surface-container border border-outline-variant/50 border-dashed rounded-xl text-on-surface-variant font-code text-lg cursor-not-allowed" 
                    />
                    <p className="mt-2 text-xs font-semibold text-outline">Stand akhir bulan sebelumnya terdaftar di database.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-3">Stand Akhir (m³)</label>
                    <input 
                      type="number"
                      value={standAkhir}
                      onChange={(e) => setStandAkhir(e.target.value)}
                      placeholder="Masukkan meteran saat ini"
                      required
                      className="w-full px-4 py-3.5 bg-surface-bright border border-outline-variant/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-lg font-code transition-shadow placeholder:text-sm placeholder:font-sans" 
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Preview & Calculation Section */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant/60 overflow-hidden lg:sticky lg:top-24">
              <div className="bg-primary px-6 py-5">
                <h3 className="text-lg font-bold text-on-primary flex items-center gap-2">
                  <Icons.Calculator size={22} />
                  Kalkulasi Tagihan
                </h3>
                <p className="text-xs font-medium text-on-primary/80 mt-1.5">Preview estimasi biaya sebelum simpan</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Volume Usage */}
                <div className="flex items-center justify-between border-b border-outline-variant/30 pb-5">
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-primary">Pemakaian Air</p>
                    <p className="text-xs font-medium text-outline mt-1">(Stand Akhir - Awal)</p>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-bold tracking-tight text-primary">
                      {pemakaian > 0 ? pemakaian : '--'}
                    </span>
                    <span className="text-base font-semibold text-on-surface-variant ml-1">m³</span>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-on-surface">Biaya Pemakaian</span>
                    <span className="font-bold text-on-surface">Rp {biayaPemakaian > 0 ? biayaPemakaian.toLocaleString('id-ID') : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-outline pl-4 border-l-2 border-outline-variant/50">
                    <span>Tarif per m³</span>
                    <span>Rp 6.000</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2">
                    <span className="font-bold text-on-surface">Biaya Administrasi</span>
                    <span className="font-bold text-on-surface">Rp {adminFee.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-5 border-t border-outline-variant/50">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-on-surface uppercase tracking-wider">Total Estimasi</span>
                    <span className="text-3xl font-bold tracking-tight text-on-surface">
                      Rp {standAkhir && pemakaian > 0 ? total.toLocaleString('id-ID') : '--'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-8 space-y-3">
                  <button 
                    disabled={saving || !standAkhir || pemakaian <= 0}
                    onClick={handleSaveMeter}
                    className={`w-full py-4 px-4 font-bold text-base rounded-xl transition-all flex justify-center items-center gap-2 shadow-sm cursor-pointer
                      ${standAkhir && pemakaian > 0 && !saving ? 'bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container active:scale-[0.98]' : 'bg-surface-container text-outline cursor-not-allowed'}`}
                  >
                    <Icons.Save size={20} />
                    {saving ? 'Menyimpan...' : 'Simpan & Rilis Tagihan'}
                  </button>
                  <button 
                    onClick={() => setStandAkhir('')}
                    className="w-full py-3.5 bg-surface-container-low hover:bg-surface-container-high text-on-surface font-bold text-sm rounded-xl transition-colors text-center active:scale-[0.98] cursor-pointer"
                  >
                    Reset Form
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
