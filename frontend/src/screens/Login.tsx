import React, { FC, useState } from 'react';
import { Icons } from '../components/Icons';
import { Screen, User } from '../types';

interface LoginProps {
  navigate: (screen: Screen) => void;
  onLoginSuccess: (user: User) => void;
}

export const Login: FC<LoginProps> = ({ navigate, onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@pdam.go.id');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login gagal.');
      }
      
      const user = await response.json();
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Koneksi ke server gagal.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-surface-container relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-primary-fixed-dim/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-tertiary-fixed-dim/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <main className="w-full max-w-[420px] p-6 relative z-10">
        <div className="bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/30 backdrop-blur-sm overflow-hidden flex flex-col pt-8">
          
          <div className="px-8 pb-6 flex flex-col items-center border-b border-outline-variant/20 bg-surface-bright/50">
            <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-4 shadow-sm border border-primary-fixed-dim/30">
              <Icons.Droplet size={32} className="fill-current text-white" />
            </div>
            <h1 className="text-3xl font-bold text-primary tracking-tight text-center">PDAM Digital</h1>
            <p className="text-sm text-on-surface-variant mt-1 text-center font-medium">Sistem Manajemen Utilitas Terpadu</p>
          </div>
          
          <div className="p-8 bg-surface-container-lowest">
            <form 
              onSubmit={handleSubmit} 
              className="flex flex-col gap-6"
            >
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg border border-red-200 flex items-center gap-2">
                  <Icons.AlertTriangle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-semibold text-on-surface">Alamat Email</label>
                <div className="relative flex items-center group">
                  <Icons.Mail size={20} className="absolute left-3 text-outline group-focus-within:text-primary transition-colors pointer-events-none" />
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    placeholder="nama@pdam.go.id" 
                    required 
                    value={email}
                    disabled={loading}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-outline-variant rounded-lg text-base text-on-surface bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-outline/50 transition-all font-sans disabled:opacity-60"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-semibold text-on-surface">Kata Sandi</label>
                  <a href="#" className="text-xs font-medium text-primary hover:text-primary-fixed-variant transition-colors">Lupa sandi?</a>
                </div>
                <div className="relative flex items-center group">
                  <Icons.Lock size={20} className="absolute left-3 text-outline group-focus-within:text-primary transition-colors pointer-events-none" />
                  <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    placeholder="••••••••" 
                    required 
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3 border border-outline-variant rounded-lg text-base text-on-surface bg-surface-container-lowest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-outline/50 transition-all font-sans disabled:opacity-60"
                    defaultValue="password"
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex justify-center items-center py-3 px-4 rounded-lg shadow-sm text-sm font-semibold text-on-primary bg-primary hover:bg-primary-fixed-variant hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Masuk...' : 'Masuk ke Sistem'}
              </button>
            </form>
            
            <div className="mt-8 p-4 bg-tertiary-container/30 border border-tertiary-fixed rounded-lg text-sm text-on-surface-variant font-medium text-center">
              <p className="mb-1">💡 <b>Tip Login:</b> Gunakan <span className="text-primary font-bold">admin@pdam.go.id</span> untuk dashboard Admin.</p>
              <p>Email lainnya akan masuk sebagai Pelanggan.</p>
            </div>

            <div className="mt-6 pt-6 border-t border-outline-variant/30 text-center">
              <p className="text-sm text-on-surface-variant font-medium">
                Belum memiliki akses? 
                <a href="#" className="text-sm font-semibold text-primary hover:text-primary-fixed-variant transition-colors ml-1">Daftar sekarang</a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
