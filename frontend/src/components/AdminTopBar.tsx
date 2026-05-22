import { FC } from 'react';
import { Icons } from './Icons';
import { Screen, User } from '../types';

interface AdminTopBarProps {
  user: User;
  onMenuClick: () => void;
}

export const AdminTopBar: FC<AdminTopBarProps> = ({ user, onMenuClick }) => {
  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[280px] h-16 z-40 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant shadow-sm flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors lg:hidden"
        >
          <Icons.Menu size={24} />
        </button>
        <div className="flex items-center gap-4 bg-surface-container-low rounded-full px-4 py-2 w-full max-w-[200px] sm:max-w-md border border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
          <Icons.Search size={18} className="text-on-surface-variant shrink-0" />
          <input 
            className="bg-transparent border-none outline-none text-sm w-full placeholder-on-surface-variant text-on-surface shrink min-w-0" 
            placeholder="Cari pelanggan..." 
            type="text" 
          />
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <button className="hidden sm:flex hover:bg-surface-container-high rounded-full p-2 transition-all text-on-surface-variant active:scale-95">
          <Icons.Bell size={20} />
        </button>
        <button className="hidden sm:flex hover:bg-surface-container-high rounded-full p-2 transition-all text-on-surface-variant active:scale-95">
          <Icons.HelpCircle size={20} />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary-container overflow-hidden border border-outline-variant ml-1 md:ml-2 shrink-0">
          <img 
            alt="Administrator Avatar" 
            className="w-full h-full object-cover" 
            src={user.avatar} 
          />
        </div>
      </div>
    </header>
  );
};
