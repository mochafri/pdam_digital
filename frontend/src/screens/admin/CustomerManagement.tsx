import React, { FC, useState, useEffect } from 'react';
import { Icons } from '../../components/Icons';
import { Screen, User } from '../../types';

interface CustomerManagementProps {
  navigate: (screen: Screen) => void;
}

export const CustomerManagement: FC<CustomerManagementProps> = ({ navigate }) => {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDesa, setSelectedDesa] = useState<string>('Semua');
  const [selectedRT, setSelectedRT] = useState<string>('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    rt: '01',
    desa: 'Cinunuk',
    blok: '',
    meterNo: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch Customers
  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/customers');
      if (!response.ok) {
        throw new Error('Gagal mengambil data pelanggan dari database.');
      }
      const data = await response.json();
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'Koneksi ke server gagal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle Delete
  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid navigating
    if (!confirm(`Apakah Anda yakin ingin menghapus pelanggan "${name}"?`)) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/customers/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Gagal menghapus pelanggan.');
      }
      setCustomers(customers.filter((c) => c.id !== id));
      alert('Pelanggan berhasil dihapus.');
    } catch (err: any) {
      alert(err.message || 'Koneksi ke server gagal.');
    }
  };

  // Handle Save Customer
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError(null);
    try {
      const response = await fetch('http://localhost:5000/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCustomer),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Gagal menyimpan data.');
      }

      await fetchCustomers();
      setIsModalOpen(false);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        rt: '01',
        desa: 'Cinunuk',
        blok: '',
        meterNo: '',
      });
      alert('Pelanggan baru berhasil ditambahkan!');
    } catch (err: any) {
      setSaveError(err.message || 'Koneksi ke server gagal.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Filter Logic
  const filteredCustomers = customers.filter((c) => {
    const matchDesa = selectedDesa === 'Semua' || c.desa === selectedDesa;
    const matchRT = selectedRT === 'Semua' || c.rt === selectedRT;
    return matchDesa && matchRT;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Aktif':
        return 'bg-green-100 text-green-800';
      case 'Tunggakan':
        return 'bg-red-100 text-red-800 animate-pulse';
      case 'Pengecekan':
        return 'bg-[#fef7e0] text-[#b06000]';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-on-surface">Manajemen Pelanggan</h2>
          <p className="text-base font-medium text-on-surface-variant mt-1">Kelola data pelanggan, informasi meteran, dan detail kontak secara real-time dari database.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary hover:bg-primary-fixed-variant text-sm font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Icons.Plus size={20} />
          Tambah Pelanggan Baru
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 shadow-sm flex items-center gap-4 hover:border-primary/50 transition-colors">
          <div className="w-14 h-14 rounded-full bg-primary-container/30 flex items-center justify-center text-primary">
            <Icons.Users size={28} className="fill-current" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Pelanggan Aktif</p>
            <p className="text-3xl font-bold text-on-surface">
              {loading ? '...' : customers.filter(c => c.status === 'Aktif').length}
            </p>
          </div>
        </div>
        
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 shadow-sm flex items-center gap-4 hover:border-secondary/50 transition-colors">
          <div className="w-14 h-14 rounded-full bg-secondary-container/50 flex items-center justify-center text-on-secondary-container">
            <Icons.Gauge size={28} className="fill-current" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Terdaftar</p>
            <p className="text-3xl font-bold text-on-surface">{loading ? '...' : customers.length}</p>
          </div>
        </div>
        
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 shadow-sm flex items-center gap-4 hover:border-error/50 transition-colors">
          <div className="w-14 h-14 rounded-full bg-error-container/50 flex items-center justify-center text-error">
            <Icons.AlertTriangle size={28} className="fill-current" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Perlu Perhatian (Tunggakan)</p>
            <p className="text-3xl font-bold text-on-surface tracking-tight">
              {loading ? '...' : customers.filter(c => c.status === 'Tunggakan').length}
            </p>
          </div>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
        {/* Table Header Actions */}
        <div className="p-4 border-b border-outline-variant flex flex-wrap items-center justify-between gap-4 bg-surface-container-low/30">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex p-1 bg-surface border border-outline-variant rounded-lg">
              <button 
                onClick={() => setSelectedDesa('Semua')}
                className={`text-xs font-bold px-4 py-1.5 rounded-md transition-all focus:outline-none cursor-pointer ${
                  selectedDesa === 'Semua' ? 'text-on-primary bg-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                Semua Desa
              </button>
              <button 
                onClick={() => setSelectedDesa('Cinunuk')}
                className={`text-xs font-bold px-4 py-1.5 rounded-md transition-all focus:outline-none cursor-pointer ${
                  selectedDesa === 'Cinunuk' ? 'text-on-primary bg-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                Cinunuk
              </button>
              <button 
                onClick={() => setSelectedDesa('Cimekar')}
                className={`text-xs font-bold px-4 py-1.5 rounded-md transition-all focus:outline-none cursor-pointer ${
                  selectedDesa === 'Cimekar' ? 'text-on-primary bg-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                Cimekar
              </button>
            </div>
            <div className="relative">
              <select 
                value={selectedRT}
                onChange={(e) => setSelectedRT(e.target.value)}
                className="appearance-none bg-surface border border-outline-variant text-on-surface-variant text-sm font-semibold px-4 py-2 pr-10 rounded-lg hover:border-primary transition-all focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
              >
                <option value="Semua">Semua RT</option>
                <option value="01">RT 01</option>
                <option value="02">RT 02</option>
                <option value="03">RT 03</option>
                <option value="04">RT 04</option>
                <option value="05">RT 05</option>
              </select>
              <Icons.ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant" />
            </div>
          </div>
          <button 
            onClick={() => fetchCustomers()}
            className="text-sm font-bold text-on-surface-variant flex items-center gap-2 hover:text-primary transition-colors border border-outline-variant px-4 py-2 rounded-lg bg-white cursor-pointer"
          >
            <Icons.Download size={18} />
            Refresh Data
          </button>
        </div>

        {/* Loading and Error States */}
        {loading ? (
          <div className="p-12 text-center text-on-surface-variant font-medium">
            <Icons.Droplet className="animate-bounce inline-block text-primary mb-3" size={32} />
            <p>Memuat data pelanggan dari database MySQL...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-error font-medium">
            <Icons.AlertTriangle className="inline-block text-error mb-3" size={32} />
            <p>{error}</p>
            <button onClick={fetchCustomers} className="mt-4 bg-primary text-on-primary px-4 py-2 rounded-lg font-bold text-sm">Coba Lagi</button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant font-medium">
            <p>Tidak ada data pelanggan yang cocok dengan kriteria filter.</p>
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-surface-container-low/50">
                <tr>
                  <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">No. Meter</th>
                  <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nama Pelanggan</th>
                  <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">RT</th>
                  <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Desa</th>
                  <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Blok/No</th>
                  <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-on-surface divide-y divide-outline-variant/50">
                {filteredCustomers.map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-surface-container-low transition-colors group cursor-pointer" 
                    onClick={() => navigate('admin-meter')}
                  >
                    <td className="p-4 font-code text-on-surface-variant group-hover:text-primary transition-colors">{row.meterNo}</td>
                    <td className="p-4">
                      <div className="font-bold text-on-surface">{row.name}</div>
                      <div className="text-xs text-on-surface-variant mt-1 font-semibold">{row.phone || '-'}</div>
                    </td>
                    <td className="p-4 text-on-surface-variant">{row.rt}</td>
                    <td className="p-4 text-on-surface-variant">{row.desa}</td>
                    <td className="p-4 text-on-surface-variant">{row.blok || '-'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm ${getStatusBadgeClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`ID Pelanggan: ${row.id}\nEmail: ${row.email}\nNama: ${row.name}\nHubungi: ${row.phone}`);
                          }}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors" 
                          title="Lihat Detail"
                        >
                          <Icons.Eye size={18} />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(row.id, row.name, e)}
                          className="p-2 text-error hover:bg-error-container rounded-lg transition-colors" 
                          title="Hapus"
                        >
                          <Icons.Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Block */}
        <div className="p-4 border-t border-outline-variant/50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-lowest mt-auto">
          <span className="text-sm font-semibold text-on-surface-variant">
            Menampilkan {filteredCustomers.length} pelanggan dari total {customers.length} terdaftar
          </span>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-primary p-6 text-on-primary flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Icons.Users size={24} />
                Tambah Pelanggan Baru
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-on-primary/80 hover:text-on-primary hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Icons.X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg">
                  {saveError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required 
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Alamat Email</label>
                  <input 
                    type="email" 
                    required 
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    placeholder="budi@pdam.go.id"
                    className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">No. Telepon</label>
                    <input 
                      type="text" 
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">No. Meter (Opsional)</label>
                    <input 
                      type="text" 
                      value={newCustomer.meterNo}
                      onChange={(e) => setNewCustomer({...newCustomer, meterNo: e.target.value})}
                      placeholder="MTR-xxxx-xxx"
                      className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Desa</label>
                    <select 
                      value={newCustomer.desa}
                      onChange={(e) => setNewCustomer({...newCustomer, desa: e.target.value})}
                      className="w-full px-3 py-2.5 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold"
                    >
                      <option value="Cinunuk">Cinunuk</option>
                      <option value="Cimekar">Cimekar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">RT</label>
                    <select 
                      value={newCustomer.rt}
                      onChange={(e) => setNewCustomer({...newCustomer, rt: e.target.value})}
                      className="w-full px-3 py-2.5 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold"
                    >
                      <option value="01">01</option>
                      <option value="02">02</option>
                      <option value="03">03</option>
                      <option value="04">04</option>
                      <option value="05">05</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Blok/No</label>
                    <input 
                      type="text" 
                      required
                      value={newCustomer.blok}
                      onChange={(e) => setNewCustomer({...newCustomer, blok: e.target.value})}
                      placeholder="A1/12"
                      className="w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/30 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container active:scale-[0.98] cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2.5 bg-primary text-on-primary font-bold text-sm rounded-lg hover:bg-primary-fixed-variant active:scale-[0.98] shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {saveLoading ? 'Menyimpan...' : 'Simpan Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
