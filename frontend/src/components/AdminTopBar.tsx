import { FC, useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  meterNo?: string;
  status: string;
}

interface AdminTopBarProps {
  user: User;
  onMenuClick: () => void;
  onLogout?: () => void;
}

export const AdminTopBar: FC<AdminTopBarProps> = ({ user, onMenuClick, onLogout }) => {
  const navigate = useNavigate();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Dropdown visibility states
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showHelpDropdown, setShowHelpDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // References for outside click detection
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Mock Notifications for Admin
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Pemberitahuan Pembayaran',
      desc: 'Budi Santoso telah sukses melakukan pembayaran untuk tagihan Maret 2024 via Midtrans.',
      time: '15 menit yang lalu',
      unread: true,
      type: 'success',
      action: () => navigate('/admin/payments')
    },
    {
      id: '2',
      title: 'Pelanggan Baru Terdaftar',
      desc: 'Siti Aminah (MTR-8925-055) telah sukses didaftarkan ke sistem.',
      time: '2 jam yang lalu',
      unread: true,
      type: 'success',
      action: () => navigate('/admin/customers')
    },
    {
      id: '3',
      title: 'Daftar Tunggakan Air',
      desc: 'Sistem mendeteksi 3 pelanggan aktif melebihi batas waktu jatuh tempo.',
      time: '1 hari yang lalu',
      unread: false,
      type: 'info',
      action: () => navigate('/admin/bills')
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Search logic for Admin: searches registered customers
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch('http://localhost:5000/api/customers');
        if (response.ok) {
          const data: CustomerData[] = await response.json();
          const filtered = data.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.meterNo && c.meterNo.toLowerCase().includes(searchQuery.toLowerCase()))
          );
          setSearchResults(filtered);
        }
      } catch (err) {
        console.error('Error searching customers:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Click outside to close active dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setShowHelpDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[280px] h-16 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant shadow-sm flex items-center justify-between px-4 md:px-8">
      
      {/* Search Input / Mobile Menu toggle */}
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors lg:hidden active:scale-95 shrink-0"
        >
          <Icons.Menu size={24} />
        </button>

        {/* Admin Dynamic Live Search */}
        <div ref={searchRef} className="relative w-full max-w-[200px] sm:max-w-md">
          <div className={`flex items-center gap-3 bg-surface-container-low rounded-full px-4 py-1.5 border border-outline-variant transition-all ${isSearchFocused ? 'border-primary ring-1 ring-primary scale-101' : ''}`}>
            <Icons.Search size={18} className="text-on-surface-variant shrink-0" />
            <input 
              className="bg-transparent border-none outline-none text-xs w-full placeholder-on-surface-variant text-on-surface shrink min-w-0 font-medium" 
              placeholder="Cari pelanggan berdasarkan nama/no meter..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => {
                setIsSearchFocused(true);
                setShowSearchDropdown(true);
              }}
              onBlur={() => setIsSearchFocused(false)}
              type="text" 
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-outline-variant hover:text-on-surface transition-colors"
              >
                <Icons.X size={14} />
              </button>
            )}
          </div>

          {/* Search Dropdown Panel */}
          {showSearchDropdown && searchQuery.trim() && (
            <div className="absolute top-11 left-0 w-full bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-sm bg-opacity-98">
              <div className="p-3 border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright/40">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Hasil Pelanggan</span>
                {isSearching && <Icons.Droplet size={14} className="animate-bounce text-primary" />}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-outline-variant/10">
                {searchResults.length > 0 ? (
                  searchResults.map(customer => (
                    <div 
                      key={customer.id}
                      onClick={() => {
                        navigate('/admin/customers');
                        setShowSearchDropdown(false);
                      }}
                      className="p-3 hover:bg-surface-container-low transition-colors cursor-pointer flex justify-between items-center group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                          {customer.name}
                        </p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5 font-medium truncate">
                          No. Meter: {customer.meterNo || 'Belum Ada'} • {customer.email}
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${customer.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {customer.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-on-surface-variant font-medium">
                    Tidak ada nama pelanggan yang cocok.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        
        {/* Admin Bell notifications */}
        <div ref={notifRef} className="relative">
          <button 
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowHelpDropdown(false);
              setShowProfileDropdown(false);
            }}
            className={`hover:bg-surface-container-high rounded-full p-2.5 transition-all text-on-surface-variant active:scale-95 cursor-pointer relative ${showNotifDropdown ? 'bg-surface-container-high text-primary' : ''}`}
          >
            <Icons.Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-error text-on-error text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse scale-90">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Admin Notifications popover */}
          {showNotifDropdown && (
            <div className="absolute top-11 right-0 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-sm bg-opacity-98">
              <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright/40">
                <span className="text-[11px] font-bold text-on-surface uppercase tracking-wider">Antrean Notifikasi</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/10">
                {notifications.map(notif => (
                  <div 
                    key={notif.id}
                    onClick={() => {
                      notif.action();
                      setShowNotifDropdown(false);
                      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, unread: false } : n));
                    }}
                    className={`p-3.5 hover:bg-surface-container-low transition-colors cursor-pointer flex gap-3 items-start relative group ${notif.unread ? 'bg-primary-container/10' : ''}`}
                  >
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 transition-transform group-hover:scale-125 ${notif.unread ? 'bg-primary' : 'bg-transparent'}`} />
                    <div className="space-y-1">
                      <h5 className={`text-xs font-bold leading-none ${notif.unread ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        {notif.title}
                      </h5>
                      <p className="text-[10.5px] leading-relaxed text-on-surface-variant font-medium">
                        {notif.desc}
                      </p>
                      <span className="text-[9px] text-outline font-semibold block pt-0.5">
                        {notif.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Admin Support Info */}
        <div ref={helpRef} className="relative">
          <button 
            onClick={() => {
              setShowHelpDropdown(!showHelpDropdown);
              setShowNotifDropdown(false);
              setShowProfileDropdown(false);
            }}
            className={`hover:bg-surface-container-high rounded-full p-2.5 transition-all text-on-surface-variant active:scale-95 cursor-pointer ${showHelpDropdown ? 'bg-surface-container-high text-primary' : ''}`}
          >
            <Icons.HelpCircle size={19} />
          </button>

          {/* Help Dropdown Panel */}
          {showHelpDropdown && (
            <div className="absolute top-11 right-0 w-72 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-sm bg-opacity-98 p-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Panduan Admin</h4>
                <p className="text-[10.5px] text-on-surface-variant font-medium leading-relaxed">
                  Gunakan menu **Input Meteran** untuk mencatat meteran bulanan baru, dan **Riwayat Pembayaran** untuk memantau setoran pelanggan secara real-time.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-outline-variant/30">
                <a 
                  href="#"
                  className="flex items-center gap-3 p-2 bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-lg text-primary text-xs font-bold transition-colors cursor-pointer"
                >
                  <Icons.FileText size={16} />
                  <span>Unduh Panduan Admin (PDF)</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Admin User Profile */}
        <div ref={profileRef} className="relative">
          <div 
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifDropdown(false);
              setShowHelpDropdown(false);
            }}
            className="w-9 h-9 rounded-full bg-primary-container overflow-hidden border border-outline-variant ml-1 cursor-pointer transition-transform hover:scale-105 active:scale-95 shrink-0"
          >
            <img 
              alt="Administrator Avatar" 
              className="w-full h-full object-cover" 
              src={user.avatar} 
            />
          </div>

          {/* Profile Dropdown Panel */}
          {showProfileDropdown && (
            <div className="absolute top-12 right-0 w-64 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-sm bg-opacity-98 p-1">
              <div className="p-3 border-b border-outline-variant/20 bg-surface-bright/20 flex flex-col items-center text-center">
                <img 
                  src={user.avatar} 
                  alt="Admin" 
                  className="w-12 h-12 rounded-full object-cover border border-outline-variant mb-2 bg-surface-container"
                />
                <p className="text-xs font-bold text-on-surface leading-none">{user.name}</p>
                <p className="text-[10px] text-on-surface-variant mt-1.5 font-semibold">Administrator • Level 1</p>
              </div>
              <div className="p-1 space-y-0.5">
                <button 
                  onClick={() => {
                    navigate('/admin/dashboard');
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Icons.LayoutDashboard size={16} />
                  <span>Dashboard Ringkasan</span>
                </button>
                <button 
                  onClick={() => {
                    navigate('/admin/customers');
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Icons.Users size={16} />
                  <span>Manajemen Pelanggan</span>
                </button>
                <div className="h-[1px] bg-outline-variant/20 my-1"></div>
                <button 
                  onClick={() => {
                    if (onLogout) onLogout();
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-error hover:bg-error/5 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Icons.LogOut size={16} />
                  <span>Keluar Sistem</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
