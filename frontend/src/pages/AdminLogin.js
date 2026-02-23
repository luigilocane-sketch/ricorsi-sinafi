import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User } from 'lucide-react';
import { toast } from '../hooks/use-toast';

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(username, password);
      toast({
        title: 'Login effettuato',
        description: 'Benvenuto nell\'area amministrativa',
      });
      navigate('/admin/dashboard');
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Credenziali non valide',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a4a2e] to-[#2d5a3f] flex items-center justify-center p-4">
      <div className="bg-white rounded-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-2 mb-4">
            <img src="/sinafi-logo.png" alt="Si.Na.Fi Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-[#1a4a2e]">Area Admin</h1>
          <p className="text-slate-600 text-sm">Ricorsi Si.Na.Fi</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-[#1a4a2e] mb-2 block uppercase tracking-wide">
              Username
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full h-12 rounded-sm border border-slate-300 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e] focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-[#1a4a2e] mb-2 block uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 rounded-sm border border-slate-300 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e] focus:border-transparent"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FFD700] text-[#1a4a2e] hover:bg-[#e6c200] font-bold uppercase tracking-wide px-8 py-3 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
          >
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-6">
          Credenziali di default: admin / admin123
        </p>
      </div>
    </div>
  );
}

export default AdminLogin;
