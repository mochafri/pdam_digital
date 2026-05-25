import React, { FC, useState, useEffect, useRef } from 'react';
import { Icons } from '../../components/Icons';
import { Screen, User, Bill } from '../../types';
import { useLocation } from 'react-router-dom';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const getMonthIndex = (month: string) => MONTHS.indexOf(month);

const getMonthValue = (month: string, year: string) => {
  const m = getMonthIndex(month);
  const y = parseInt(year, 10);
  return y * 12 + (m !== -1 ? m : 0);
};

const fromMonthValue = (val: number) => {
  const year = Math.floor(val / 12);
  const monthIdx = val % 12;
  return {
    monthString: MONTHS[monthIdx],
    yearString: String(year)
  };
};

interface InputMeterProps {
  navigate: (screen: Screen) => void;
}

export const InputMeter: FC<InputMeterProps> = ({ navigate }) => {
  const location = useLocation();
  const preselectedId = location.state?.selectedCustomerId;
  const preselectedMonth = location.state?.monthString;
  const preselectedYear = location.state?.yearString;

  const [customers, setCustomers] = useState<User[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerBills, setCustomerBills] = useState<Bill[]>([]);
  
  // Filters State
  const [selectedDesa, setSelectedDesa] = useState<string>('Semua');
  const [selectedRT, setSelectedRT] = useState<string>('Semua');
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [isOpenCustomerDropdown, setIsOpenCustomerDropdown] = useState<boolean>(false);

  const [selectedMonth, setSelectedMonth] = useState<string>('Mei');
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [standAwal, setStandAwal] = useState<number>(0);
  const [standAkhir, setStandAkhir] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Dropdown reference
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close customer dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpenCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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
          // If a preselectedId is provided and exists in the list, choose it
          if (preselectedId) {
            const preCust = data.find((c: any) => c.id === preselectedId);
            if (preCust) {
              setSelectedDesa(preCust.desa || 'Semua');
              setSelectedRT(preCust.rt || 'Semua');
              setSelectedCustomerId(preselectedId);
              return;
            }
          }
          setSelectedCustomerId(''); // Default to placeholder
        }
      } catch (err: any) {
        setError(err.message || 'Koneksi ke server gagal.');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [preselectedId]);

  // If filters change, check if selected customer still matches. If not, reset selection
  useEffect(() => {
    if (!selectedCustomerId) return;
    const currentCustomer = customers.find(c => c.id === selectedCustomerId);
    if (currentCustomer) {
      const matchDesa = selectedDesa === 'Semua' || currentCustomer.desa === selectedDesa;
      const matchRT = selectedRT === 'Semua' || currentCustomer.rt === selectedRT;
      if (!matchDesa || !matchRT) {
        setSelectedCustomerId('');
      }
    }
  }, [selectedDesa, selectedRT, selectedCustomerId, customers]);

  // Fetch customer's bills and auto-select next logical month when customer is selected
  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerBills([]);
      return;
    }
    
    const fetchCustomerBills = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/bills?userId=${selectedCustomerId}`);
        if (!response.ok) {
          throw new Error('Gagal mengambil riwayat tagihan.');
        }
        const bills: Bill[] = await response.json();
        setCustomerBills(bills);
        
        if (bills.length > 0) {
          if (preselectedMonth && preselectedYear) {
            setSelectedMonth(preselectedMonth);
            setSelectedYear(preselectedYear);
          } else {
            // find latest bill chronologically
            const sortedBills = [...bills].sort((a, b) => {
              return getMonthValue(a.monthString, a.yearString) - getMonthValue(b.monthString, b.yearString);
            });
            const latestBill = sortedBills[sortedBills.length - 1];
            const nextMonthVal = getMonthValue(latestBill.monthString, latestBill.yearString) + 1;
            const nextPeriod = fromMonthValue(nextMonthVal);
            setSelectedMonth(nextPeriod.monthString);
            setSelectedYear(nextPeriod.yearString);
          }
        } else {
          // default to current month and year
          const now = new Date();
          setSelectedMonth(MONTHS[now.getMonth()]);
          setSelectedYear(String(now.getFullYear()));
        }
      } catch (err) {
        console.error('Error fetching customer bills:', err);
        setCustomerBills([]);
      }
    };

    fetchCustomerBills();
  }, [selectedCustomerId, preselectedMonth, preselectedYear]);

  // Synchronize standAwal and standAkhir when period selection or bills change
  useEffect(() => {
    if (!selectedCustomerId) {
      setStandAwal(0);
      setStandAkhir('');
      return;
    }

    const existingBill = customerBills.find(
      (b) => b.monthString === selectedMonth && b.yearString === selectedYear
    );

    if (existingBill) {
      setStandAwal(existingBill.meterStart);
      setStandAkhir(String(existingBill.meterEnd));
    } else {
      if (customerBills.length > 0) {
        const sortedBills = [...customerBills].sort(
          (a, b) => getMonthValue(a.monthString, a.yearString) - getMonthValue(b.monthString, b.yearString)
        );
        const latestBill = sortedBills[sortedBills.length - 1];
        setStandAwal(latestBill.meterEnd);
      } else {
        setStandAwal(0);
      }
      setStandAkhir('');
    }
  }, [selectedCustomerId, selectedMonth, selectedYear, customerBills]);

  const isMonthEnabled = (m: string, y: string) => {
    if (!selectedCustomerId || customerBills.length === 0) return true;
    
    const sortedBills = [...customerBills].sort((a, b) => {
      return getMonthValue(a.monthString, a.yearString) - getMonthValue(b.monthString, b.yearString);
    });
    const latestBill = sortedBills[sortedBills.length - 1];
    const latestVal = getMonthValue(latestBill.monthString, latestBill.yearString);
    const nextLogicalVal = latestVal + 1;
    const selectedVal = getMonthValue(m, y);

    if (selectedVal === nextLogicalVal) return true;
    
    const billExists = customerBills.some(b => b.monthString === m && b.yearString === y);
    return billExists;
  };

  const isYearEnabled = (y: string) => {
    if (!selectedCustomerId || customerBills.length === 0) return true;
    
    const sortedBills = [...customerBills].sort((a, b) => {
      return getMonthValue(a.monthString, a.yearString) - getMonthValue(b.monthString, b.yearString);
    });
    const latestBill = sortedBills[sortedBills.length - 1];
    const latestVal = getMonthValue(latestBill.monthString, latestBill.yearString);
    const nextLogicalVal = latestVal + 1;

    const nextPeriod = fromMonthValue(nextLogicalVal);
    if (y === nextPeriod.yearString) return true;
    
    const hasBillInYear = customerBills.some(b => b.yearString === y);
    return hasBillInYear;
  };

  const handleYearChange = (yearVal: string) => {
    setSelectedYear(yearVal);
    const enabledMonth = MONTHS.find(m => isMonthEnabled(m, yearVal));
    if (enabledMonth) {
      setSelectedMonth(enabledMonth);
    }
  };

  // Calculate filtered list for searchable dropdown
  const filteredCustomers = customers.filter(c => {
    const matchDesa = selectedDesa === 'Semua' || c.desa === selectedDesa;
    const matchRT = selectedRT === 'Semua' || c.rt === selectedRT;
    const matchSearch = customerSearchQuery.trim() === '' ||
      c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
      (c.meterNo && c.meterNo.toLowerCase().includes(customerSearchQuery.toLowerCase()));
    return matchDesa && matchRT && matchSearch;
  });

  const existingBill = selectedCustomerId
    ? customerBills.find(b => b.monthString === selectedMonth && b.yearString === selectedYear)
    : null;

  const mode = existingBill ? 'UPDATE' : 'CREATE';

  let isValidPeriod = true;
  let validationMessage = '';

  if (selectedCustomerId && mode === 'CREATE' && customerBills.length > 0) {
    const sortedBills = [...customerBills].sort((a, b) => {
      return getMonthValue(a.monthString, a.yearString) - getMonthValue(b.monthString, b.yearString);
    });
    const latestBill = sortedBills[sortedBills.length - 1];
    const latestVal = getMonthValue(latestBill.monthString, latestBill.yearString);
    const selectedVal = getMonthValue(selectedMonth, selectedYear);
    const nextLogicalVal = latestVal + 1;

    if (selectedVal < nextLogicalVal) {
      isValidPeriod = false;
      validationMessage = `Tidak bisa melakukan backdate. Bulan ini mendahului tagihan terakhir (${latestBill.monthString} ${latestBill.yearString}) dan tidak memiliki data tagihan.`;
    } else if (selectedVal > nextLogicalVal) {
      isValidPeriod = false;
      const nextPeriod = fromMonthValue(nextLogicalVal);
      validationMessage = `Silakan masukkan tagihan untuk bulan ${nextPeriod.monthString} ${nextPeriod.yearString} terlebih dahulu.`;
    }
  }

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
    if (!isValidPeriod) {
      alert(validationMessage);
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
      let response;
      if (mode === 'UPDATE') {
        if (!existingBill) return;
        response = await fetch(`http://localhost:5000/api/bills/${existingBill.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meterEnd: endVal,
          }),
        });
      } else {
        response = await fetch('http://localhost:5000/api/bills', {
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
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Gagal menyimpan data meteran.');
      }

      if (mode === 'UPDATE') {
        alert('Data meteran bulanan berhasil diperbarui!');
      } else {
        alert('Data meteran bulanan berhasil disimpan dan tagihan diterbitkan!');
      }
      setStandAkhir('');
      navigate('admin-bills');
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
              <form className="space-y-6" onSubmit={handleSaveMeter}>
                
                {saveError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg">
                    {saveError}
                  </div>
                )}

                {!isValidPeriod && (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium rounded-xl flex items-start gap-3">
                    <Icons.AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-bold text-amber-900">Periode Tidak Valid</p>
                      <p className="text-xs text-amber-700 mt-1">{validationMessage}</p>
                    </div>
                  </div>
                )}

                {selectedCustomerId && mode === 'UPDATE' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 text-blue-800 text-sm font-medium rounded-xl flex items-start gap-3">
                    <Icons.Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-bold text-blue-900">Mode Pembaruan (Update)</p>
                      <p className="text-xs text-blue-700 mt-1">Tagihan untuk bulan ini sudah ada. Anda sedang mengubah stand akhir meteran. Perubahan ini akan memperbarui tagihan saat ini dan memperbarui stand awal bulan berikutnya secara otomatis di database.</p>
                    </div>
                  </div>
                )}

                {/* Filters: Desa & RT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Filter Desa</label>
                    <div className="relative">
                      <Icons.MapPin size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                      <select 
                        value={selectedDesa}
                        onChange={(e) => setSelectedDesa(e.target.value)}
                        className="w-full pl-10 pr-10 py-3.5 bg-surface-bright border border-outline-variant/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-semibold appearance-none cursor-pointer"
                      >
                        <option value="Semua">Semua Desa</option>
                        <option value="Cinunuk">Cinunuk</option>
                        <option value="Cimekar">Cimekar</option>
                      </select>
                      <Icons.ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Filter RT</label>
                    <div className="relative">
                      <Icons.Hash size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                      <select 
                        value={selectedRT}
                        onChange={(e) => setSelectedRT(e.target.value)}
                        className="w-full pl-10 pr-10 py-3.5 bg-surface-bright border border-outline-variant/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-semibold appearance-none cursor-pointer"
                      >
                        <option value="Semua">Semua RT</option>
                        <option value="01">RT 01</option>
                        <option value="02">RT 02</option>
                        <option value="03">RT 03</option>
                        <option value="04">RT 04</option>
                        <option value="05">RT 05</option>
                      </select>
                      <Icons.ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Customer Select (Searchable Select Component) */}
                <div ref={dropdownRef} className="relative">
                  <label className="block text-sm font-bold text-on-surface mb-2">Pilih Pelanggan</label>
                  <div 
                    onClick={() => setIsOpenCustomerDropdown(!isOpenCustomerDropdown)}
                    className="w-full pl-10 pr-10 py-3.5 bg-surface-bright border border-outline-variant/80 rounded-xl focus:outline-none ring-offset-background text-sm font-semibold flex items-center justify-between cursor-pointer shadow-sm relative min-h-[48px]"
                  >
                    <Icons.UserSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                    
                    <span className={selectedCustomerId ? 'text-on-surface font-semibold' : 'text-outline-variant font-medium'}>
                      {selectedCustomerId 
                        ? (() => {
                            const c = customers.find(x => x.id === selectedCustomerId);
                            if (!c) return '--- Pilih Pelanggan ---';
                            const showDesa = selectedDesa === 'Semua';
                            const showRT = selectedRT === 'Semua';
                            if (showDesa && showRT) {
                              return `${c.meterNo} - ${c.name} (${c.desa}, RT ${c.rt})`;
                            } else if (showDesa) {
                              return `${c.meterNo} - ${c.name} (${c.desa})`;
                            } else if (showRT) {
                              return `${c.meterNo} - ${c.name} (RT ${c.rt})`;
                            } else {
                              return `${c.meterNo} - ${c.name}`;
                            }
                          })()
                        : '--- Pilih Pelanggan ---'}
                    </span>

                    <Icons.ChevronDown size={20} className={`text-outline transition-transform duration-200 ${isOpenCustomerDropdown ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Dropdown Panel */}
                  {isOpenCustomerDropdown && (
                    <div className="absolute top-[80px] left-0 w-full bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 p-2 max-h-80 flex flex-col">
                      <div className="relative mb-2 shrink-0">
                        <Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                        <input
                          type="text"
                          placeholder="Cari nama atau no. meter..."
                          value={customerSearchQuery}
                          onChange={(e) => setCustomerSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 border border-outline-variant rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium bg-surface-bright"
                        />
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto divide-y divide-outline-variant/10 custom-scrollbar">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setSelectedCustomerId(c.id);
                                setIsOpenCustomerDropdown(false);
                                setCustomerSearchQuery('');
                              }}
                              className={`p-3 text-xs hover:bg-surface-container-low transition-colors cursor-pointer flex justify-between items-center rounded-lg font-medium group ${c.id === selectedCustomerId ? 'bg-primary/5 text-primary' : 'text-on-surface'}`}
                            >
                              {(() => {
                                const showDesa = selectedDesa === 'Semua';
                                const showRT = selectedRT === 'Semua';
                                if (!showDesa && !showRT) {
                                  return (
                                    <div className="min-w-0">
                                      <p className="font-bold truncate group-hover:text-primary transition-colors">{c.meterNo} - {c.name}</p>
                                    </div>
                                  );
                                }
                                let locationText = '';
                                if (showDesa && showRT) {
                                  locationText = `${c.desa}, RT ${c.rt}`;
                                } else if (showDesa) {
                                  locationText = c.desa;
                                } else {
                                  locationText = `RT ${c.rt}`;
                                }
                                return (
                                  <>
                                    <div className="min-w-0">
                                      <p className="font-bold truncate group-hover:text-primary transition-colors">{c.meterNo} - {c.name}</p>
                                      <p className="text-[10px] text-on-surface-variant mt-0.5">{locationText} • {c.email}</p>
                                    </div>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${c.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {c.status}
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-outline font-medium">
                            Tidak ada pelanggan cocok dengan kriteria filter.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
                        {MONTHS.map(m => (
                          <option 
                            key={m} 
                            value={m} 
                            disabled={!isMonthEnabled(m, selectedYear)}
                          >
                            {m}
                          </option>
                        ))}
                      </select>
                      <Icons.ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-2">Tahun</label>
                    <div className="relative">
                      <select 
                        value={selectedYear}
                        onChange={(e) => handleYearChange(e.target.value)}
                        className="w-full px-4 py-3.5 bg-surface-bright border border-outline-variant/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm font-semibold appearance-none cursor-pointer"
                      >
                        {Array.from({ length: 5 }, (_, i) => {
                          const yearVal = String(new Date().getFullYear() - 3 + i);
                          return (
                            <option 
                              key={yearVal} 
                              value={yearVal}
                              disabled={!isYearEnabled(yearVal)}
                            >
                              {yearVal}
                            </option>
                          );
                        })}
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
                      type="text" 
                      value={selectedCustomerId ? standAwal : ''}
                      readOnly
                      placeholder="---"
                      className="w-full px-4 py-3.5 bg-surface-container border border-outline-variant/50 border-dashed rounded-xl text-on-surface-variant font-code text-lg cursor-not-allowed placeholder:text-outline" 
                    />
                    <p className="mt-2 text-xs font-semibold text-outline">Stand akhir bulan sebelumnya terdaftar di database.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface mb-3">Stand Akhir (m³)</label>
                    <input 
                      type="number"
                      value={standAkhir}
                      onChange={(e) => setStandAkhir(e.target.value)}
                      placeholder={
                        !selectedCustomerId 
                          ? "Pilih pelanggan terlebih dahulu" 
                          : !isValidPeriod 
                            ? "Periode tidak valid" 
                            : "Masukkan meteran saat ini"
                      }
                      required
                      disabled={!selectedCustomerId || !isValidPeriod}
                      className={`w-full px-4 py-3.5 border border-outline-variant/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-lg font-code transition-shadow placeholder:text-sm placeholder:font-sans
                        ${selectedCustomerId && isValidPeriod ? 'bg-surface-bright' : 'bg-surface-container-high cursor-not-allowed opacity-60'}`}
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
                    <span className="font-bold text-on-surface whitespace-nowrap">Rp&nbsp;{biayaPemakaian > 0 ? biayaPemakaian.toLocaleString('id-ID') : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-outline pl-4 border-l-2 border-outline-variant/50">
                    <span>Tarif per m³</span>
                    <span className="whitespace-nowrap">Rp&nbsp;6.000</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2">
                    <span className="font-bold text-on-surface">Biaya Administrasi</span>
                    <span className="font-bold text-on-surface whitespace-nowrap">Rp&nbsp;{adminFee.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-5 border-t border-outline-variant/50">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-sm font-bold text-on-surface uppercase tracking-wider">Total</span>
                    <span className="text-3xl font-bold tracking-tight text-primary whitespace-nowrap">
                      Rp&nbsp;{standAkhir && pemakaian > 0 ? total.toLocaleString('id-ID') : '--'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-8 space-y-3">
                  <button 
                    disabled={saving || !standAkhir || pemakaian <= 0 || !isValidPeriod}
                    onClick={handleSaveMeter}
                    className={`w-full py-4 px-4 font-bold text-base rounded-xl transition-all flex justify-center items-center gap-2 shadow-sm cursor-pointer
                      ${standAkhir && pemakaian > 0 && !saving && isValidPeriod ? 'bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container active:scale-[0.98]' : 'bg-surface-container text-outline cursor-not-allowed'}`}
                  >
                    <Icons.Save size={20} />
                    {saving ? 'Menyimpan...' : mode === 'UPDATE' ? 'Update & Rilis Tagihan' : 'Simpan & Rilis Tagihan'}
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
