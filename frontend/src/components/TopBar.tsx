import { FC, useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { User, Bill } from '../types';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  user: User;
  onMenuClick: () => void;
  onLogout?: () => void;
  onSwitchRole?: () => void;
}

export const TopBar: FC<TopBarProps> = ({ user, onMenuClick, onLogout, onSwitchRole }) => {
  const navigate = useNavigate();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Bill[]>([]);
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

  // Mock Notifications for Customer
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Tagihan Belum Dibayar',
      desc: 'Tagihan April 2024 Anda sebesar Rp 265.000 belum dilunasi.',
      time: '1 jam yang lalu',
      unread: true,
      type: 'warning',
      action: () => navigate('/bills')
    },
    {
      id: '2',
      title: 'Pembayaran Diverifikasi',
      desc: 'Bukti transfer tagihan Maret 2024 Anda sedang ditinjau admin.',
      time: '1 hari yang lalu',
      unread: true,
      type: 'info',
      action: () => navigate('/bills')
    },
    {
      id: '3',
      title: 'Tagihan Lunas',
      desc: 'Terima kasih! Pembayaran tagihan Januari 2024 Anda telah lunas.',
      time: '1 minggu yang lalu',
      unread: false,
      type: 'success',
      action: () => navigate('/bills')
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`http://localhost:5000/api/bills?userId=${user.id}`);
        if (response.ok) {
          const data: Bill[] = await response.json();
          const filtered = data.filter(b => 
            b.monthString.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.yearString.includes(searchQuery)
          );
          setSearchResults(filtered);
        }
      } catch (err) {
        console.error('Error searching bills:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, user.id]);

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

  const getStatusColor = (status: string) => {
    if (status === 'LUNAS') return 'bg-green-100 text-green-700';
    if (status === 'BELUM_BAYAR') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[280px] w-full lg:w-[calc(100%-280px)] h-16 bg-surface border-b border-outline-variant/50 flex justify-between items-center px-4 md:px-8 z-40 bg-opacity-95 backdrop-blur-md transition-all duration-300">
      
      {/* Title / Mobile Menu */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors lg:hidden active:scale-95"
        >
          <Icons.Menu size={24} />
        </button>
        <h3 className="text-base md:text-lg font-bold text-primary tracking-tight truncate max-w-[150px] sm:max-w-none">
          PDAM Portal Pelanggan
        </h3>
      </div>
      
      {/* Controls Container */}
      <div className="flex items-center gap-2 md:gap-5 min-w-0">
        
        {/* Dynamic Search Popover */}
        <div ref={searchRef} className="relative hidden md:block">
          <div className={`relative transition-all duration-200 ${isSearchFocused ? 'scale-102' : ''}`}>
            <Icons.Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant shrink-0" />
            <input 
              type="text" 
              placeholder="Cari tagihan (e.g. Mei, Lunas)..." 
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
              className="pl-10 pr-8 py-2 bg-surface-container-low border border-outline-variant/60 rounded-full text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all w-48 lg:w-64 text-on-surface shrink min-w-0 font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors"
              >
                <Icons.X size={14} />
              </button>
            )}
          </div>

          {/* Search Dropdown Panel */}
          {showSearchDropdown && searchQuery.trim() && (
            <div className="absolute top-12 left-0 w-80 bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-sm bg-opacity-98">
              <div className="p-3.5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright/40">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Hasil Pencarian</span>
                {isSearching && <Icons.Droplet size={14} className="animate-bounce text-primary" />}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-outline-variant/10">
                {searchResults.length > 0 ? (
                  searchResults.map(bill => (
                    <div 
                      key={bill.id}
                      onClick={() => {
                        navigate('/bills');
                        setShowSearchDropdown(false);
                      }}
                      className="p-3 hover:bg-surface-container-low transition-colors cursor-pointer flex justify-between items-center group"
                    >
                      <div>
                        <p className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">
                          Tagihan {bill.monthString} {bill.yearString}
                        </p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          Pemakaian: {bill.usage} m³ • Rp {bill.total.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${getStatusColor(bill.status)}`}>
                        {bill.status === 'BELUM_BAYAR' ? 'BELUM BAYAR' : bill.status === 'MENUNGGU_VERIFIKASI' ? 'VERIFIKASI' : 'LUNAS'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-on-surface-variant font-medium">
                    Tidak ada tagihan yang cocok.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Actions Button Group */}
        <div className="flex items-center gap-1.5 md:gap-3.5 shrink-0">
          
          {/* sleeks Notification Bell */}
          <div ref={notifRef} className="relative">
            <button 
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                setShowHelpDropdown(false);
                setShowProfileDropdown(false);
              }}
              className={`p-2.5 rounded-full text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-all focus:ring-1 focus:ring-primary active:scale-95 cursor-pointer relative ${showNotifDropdown ? 'text-primary bg-primary/5' : ''}`}
            >
              <Icons.Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-error text-on-error text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse scale-90">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifDropdown && (
              <div className="absolute top-12 right-0 w-80 bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-sm bg-opacity-98">
                <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright/40">
                  <span className="text-[11px] font-bold text-on-surface uppercase tracking-wider">Notifikasi</span>
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
                        // Mark single notif as read
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

          {/* Help Center Popover */}
          <div ref={helpRef} className="relative">
            <button 
              onClick={() => {
                setShowHelpDropdown(!showHelpDropdown);
                setShowNotifDropdown(false);
                setShowProfileDropdown(false);
              }}
              className={`p-2.5 rounded-full text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-all focus:ring-1 focus:ring-primary active:scale-95 cursor-pointer ${showHelpDropdown ? 'text-primary bg-primary/5' : ''}`}
            >
              <Icons.HelpCircle size={19} />
            </button>

            {/* Help Dropdown Panel */}
            {showHelpDropdown && (
              <div className="absolute top-12 right-0 w-72 bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-sm bg-opacity-98 p-4 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Pusat Bantuan</h4>
                  <p className="text-[10.5px] text-on-surface-variant font-medium leading-relaxed">
                    Ada kendala atau pertanyaan terkait layanan? Tim customer service kami siap membantu Anda 24/7.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-outline-variant/30">
                  <a 
                    href="https://wa.me/6281234567890" 
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-2 bg-green-50 hover:bg-green-100 border border-green-200/50 rounded-lg text-green-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Icons.MessageCircle size={16} className="fill-green-600/10" />
                    <span>WhatsApp Live Chat</span>
                  </a>
                  <a 
                    href="tel:02112345678" 
                    className="flex items-center gap-3 p-2 bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-lg text-primary text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Icons.Phone size={16} />
                    <span>Call Center (021-1234)</span>
                  </a>
                </div>
              </div>
            )}
          </div>
          
          <div className="h-6 w-[1px] bg-outline-variant/50 mx-0.5 hidden sm:block"></div>
          
          {/* User Profile Popover */}
          <div ref={profileRef} className="relative">
            <div 
              onClick={() => {
                setShowProfileDropdown(!showProfileDropdown);
                setShowNotifDropdown(false);
                setShowHelpDropdown(false);
              }}
              className="flex items-center gap-2.5 cursor-pointer p-1 rounded-full hover:bg-surface-container-low transition-colors shrink-0"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-on-surface leading-none">{user.name}</p>
                <p className="text-[10px] text-on-surface-variant font-semibold mt-1">ID: {user.id}</p>
              </div>
              <img 
                src={user.avatar} 
                alt="Customer Avatar" 
                className="w-8.5 h-8.5 rounded-full border-2 border-primary-fixed object-cover bg-surface-container shrink-0 transition-transform active:scale-95" 
              />
            </div>

            {/* Profile Dropdown Panel */}
            {showProfileDropdown && (
              <div className="absolute top-13 right-0 w-64 bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-sm bg-opacity-98 p-1">
                <div className="p-3 border-b border-outline-variant/20 bg-surface-bright/20 flex flex-col items-center text-center">
                  <img 
                    src={user.avatar} 
                    alt="User" 
                    className="w-12 h-12 rounded-full object-cover border border-outline-variant mb-2 bg-surface-container"
                  />
                  <p className="text-xs font-bold text-on-surface leading-none">{user.name}</p>
                  <p className="text-[10px] text-on-surface-variant mt-1.5 font-semibold">Pelanggan • ID {user.id}</p>
                </div>
                <div className="p-1 space-y-0.5">
                  <button 
                    onClick={() => {
                      navigate('/dashboard');
                      setShowProfileDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Icons.LayoutDashboard size={16} />
                    <span>Dashboard Saya</span>
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/bills');
                      setShowProfileDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Icons.Receipt size={16} />
                    <span>Riwayat Tagihan</span>
                  </button>
                  <div className="h-[1px] bg-outline-variant/20 my-1"></div>
                  {onSwitchRole && (
                    <button 
                      onClick={() => {
                        onSwitchRole();
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Icons.RefreshCw size={16} />
                      <span>Ganti ke Admin</span>
                    </button>
                  )}
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
      </div>
    </header>
  );
};
