import { FC } from 'react';
import { Icons } from './Icons';
import { Screen } from '../types';

interface SidebarProps {
  currentScreen: Screen;
  navigate: (screen: Screen) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: FC<SidebarProps> = ({ currentScreen, navigate, isOpen, onClose }) => {
  return (
    <aside className={`w-[280px] h-screen fixed left-0 top-0 bg-surface shadow-sm flex flex-col py-6 z-50 overflow-y-auto custom-scrollbar border-r border-outline-variant/30 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="px-6 mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">PDAM Portal</h2>
          <p className="text-sm font-medium text-on-surface-variant opacity-70">Manajemen Layanan</p>
        </div>
        <button onClick={onClose} className="p-2 -mr-2 text-on-surface-variant hover:bg-surface-container-low rounded-full lg:hidden">
          <Icons.X size={20} />
        </button>
      </div>
      
      <nav className="flex-1 flex flex-col gap-1">
        <button 
          onClick={() => navigate('dashboard')}
          className={`flex items-center gap-3 px-6 py-3 w-full text-left transition-colors font-medium
            ${currentScreen === 'dashboard' ? 'text-primary border-l-4 border-primary bg-secondary-container/30' : 'text-on-surface-variant hover:bg-secondary-container/20 border-l-4 border-transparent'}`}
        >
          <Icons.LayoutDashboard size={20} className={currentScreen === 'dashboard' ? 'fill-primary/20' : ''} />
          <span>Dashboard</span>
        </button>

        <button 
          onClick={() => navigate('bills')}
          className={`flex items-center gap-3 px-6 py-3 w-full text-left transition-colors font-medium
            ${['bills', 'payment-method', 'payment-form'].includes(currentScreen) ? 'text-primary border-l-4 border-primary bg-secondary-container/30' : 'text-on-surface-variant hover:bg-secondary-container/20 border-l-4 border-transparent'}`}
        >
          <Icons.Receipt size={20} className={['bills', 'payment-method', 'payment-form'].includes(currentScreen) ? 'fill-primary/20' : ''} />
          <span>Tagihan Saya</span>
        </button>

        <button 
          className="flex items-center gap-3 px-6 py-3 w-full text-left text-on-surface-variant hover:bg-secondary-container/20 border-l-4 border-transparent transition-colors font-medium"
        >
          <Icons.HelpCircle size={20} />
          <span>Pusat Bantuan</span>
        </button>
      </nav>

      <div className="px-6 mb-6">
        <button 
          onClick={() => navigate('payment-method')}
          className="w-full py-3 bg-primary text-on-primary rounded-lg font-medium shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Icons.CreditCard size={18} />
          Bayar Tagihan Sekarang
        </button>
      </div>

      <div className="mt-auto px-6 pt-6 border-t border-outline-variant/30 flex flex-col gap-1">
        <button className="flex items-center gap-3 py-2 text-on-surface-variant hover:text-primary transition-colors font-medium w-full text-left">
          <Icons.Settings size={20} />
          <span>Pengaturan</span>
        </button>
        <button 
          onClick={() => navigate('login')}
          className="flex items-center gap-3 py-2 text-on-surface-variant hover:text-primary transition-colors font-medium w-full text-left"
        >
          <Icons.LogOut size={20} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
};
