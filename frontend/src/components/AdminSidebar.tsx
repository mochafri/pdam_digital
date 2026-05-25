import { FC } from 'react';
import { Icons } from './Icons';
import { Screen } from '../types';

interface AdminSidebarProps {
  currentScreen: Screen;
  navigate: (screen: Screen) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSidebar: FC<AdminSidebarProps> = ({ currentScreen, navigate, isOpen, onClose }) => {
  const getNavLinkClass = (screen: Screen) => {
    const isActive = currentScreen === screen;
    if (isActive) {
      return "flex items-center gap-3 px-4 py-3 text-primary bg-primary-container/10 border-l-4 border-primary font-semibold rounded-r-lg transition-colors w-full text-left";
    }
    return "flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low transition-colors duration-150 rounded-lg w-full text-left border-l-4 border-transparent";
  };

  return (
    <nav className={`fixed left-0 top-0 h-full w-[280px] z-50 bg-surface-container-lowest border-r border-outline-variant shadow-sm flex flex-col py-6 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="px-6 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-h3 shrink-0">
            <Icons.Droplet size={24} className="fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary tracking-tight">PDAM Digital</h1>
            <p className="text-xs font-medium text-on-surface-variant">Portal Admin</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 -mr-2 rounded-full text-on-surface-variant hover:bg-surface-container-low lg:hidden">
          <Icons.X size={20} />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col gap-1 px-4">
        <button onClick={() => navigate('admin-dashboard')} className={getNavLinkClass('admin-dashboard')}>
          <Icons.LayoutDashboard size={20} />
          <span className="text-sm">Dashboard</span>
        </button>
        <button onClick={() => navigate('admin-customers')} className={getNavLinkClass('admin-customers')}>
          <Icons.Users size={20} />
          <span className="text-sm">Pelanggan</span>
        </button>
        <button onClick={() => navigate('admin-meter')} className={getNavLinkClass('admin-meter')}>
          <Icons.Gauge size={20} />
          <span className="text-sm">Catat Meteran</span>
        </button>
        <button onClick={() => navigate('admin-bills')} className={getNavLinkClass('admin-bills')}>
          <Icons.Receipt size={20} />
          <span className="text-sm">Tagihan</span>
        </button>
        <button onClick={() => navigate('admin-payments')} className={getNavLinkClass('admin-payments')}>
          <Icons.CreditCard size={20} />
          <span className="text-sm">Riwayat Pembayaran</span>
        </button>
      </div>

      <div className="mt-auto px-4 flex flex-col gap-1 border-t border-outline-variant pt-4">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-left text-on-surface-variant hover:bg-surface-container-low transition-colors duration-150 rounded-lg">
          <Icons.Settings size={20} />
          <span className="text-sm">Pengaturan</span>
        </button>
        <button onClick={() => navigate('login')} className="flex items-center gap-3 px-4 py-3 w-full text-left text-error hover:bg-error-container hover:text-on-error-container transition-colors duration-150 rounded-lg">
          <Icons.LogOut size={20} />
          <span className="text-sm">Keluar</span>
        </button>
      </div>
    </nav>
  );
};
