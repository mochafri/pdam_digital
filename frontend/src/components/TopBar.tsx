import { FC, useState } from 'react';
import { Icons } from './Icons';
import { User } from '../types';

interface TopBarProps {
  user: User;
  onMenuClick: () => void;
}

export const TopBar: FC<TopBarProps> = ({ user, onMenuClick }) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-[280px] w-full lg:w-[calc(100%-280px)] h-16 bg-surface border-b border-outline-variant/50 flex justify-between items-center px-4 md:px-8 z-40 bg-opacity-90 backdrop-blur-sm transition-all duration-300">
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors lg:hidden"
        >
          <Icons.Menu size={24} />
        </button>
        <h3 className="text-lg md:text-xl font-semibold text-primary truncate max-w-[150px] sm:max-w-none">PDAM Customer Portal</h3>
      </div>
      
      <div className="flex items-center gap-2 md:gap-6 min-w-0">
        <div className={`relative hidden md:block transition-transform duration-200 ${isSearchFocused ? 'scale-105' : ''}`}>
          <Icons.Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant shrink-0" />
          <input 
            type="text" 
            placeholder="Cari tagihan..." 
            className="pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/50 rounded-full text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all w-48 lg:w-64 text-on-surface shrink min-w-0"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <button className="hidden sm:flex p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors rounded-full focus:ring-2 focus:ring-primary">
            <Icons.Bell size={20} />
          </button>
          <button className="hidden sm:flex p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors rounded-full focus:ring-2 focus:ring-primary relative">
            <Icons.HelpCircle size={20} />
          </button>
          
          <div className="h-8 w-[1px] bg-outline-variant/50 md:mx-1 hidden sm:block"></div>
          
          <div className="flex items-center gap-3 cursor-pointer p-1 rounded-full hover:bg-surface-container-low transition-colors shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-on-surface leading-none">{user.name}</p>
              <p className="text-xs text-on-surface-variant mt-1">ID: {user.id}</p>
            </div>
            <img 
              src={user.avatar} 
              alt="Customer Avatar" 
              className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-primary-fixed object-cover bg-surface-container shrink-0" 
            />
          </div>
        </div>
      </div>
    </header>
  );
};
