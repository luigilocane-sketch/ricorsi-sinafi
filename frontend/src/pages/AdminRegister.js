import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { validateInvite, registerWithInvite } from '../services/api';
import { Shield, Lock, User, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from '../hooks/use-toast';

function AdminRegister() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [validating, setValidating] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [error, setError] = useState(null);
  const [registering, setRegistering] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const data = await validateInvite(token);
      setInviteData(data);
    } catch (error) {
      setError(error.response?.data?.detail || 'Invito non valido o scaduto');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Errore',
        description: 'Le password non coincidono',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Errore',
        description: 'La password deve essere di almeno 6 caratteri',
        variant: 'destructive',
      });
      return;
    }

    setRegistering(true);
    try {
      await registerWithInvite(token, formData.username, formData.password);
      toast({
        title: 'Registrazione Completata',
        description: 'Ora puoi accedere con le tue credenziali',
      });
      setTimeout(() => {
        navigate('/admin/login');
      }, 2000);
    } catch (error) {
      toast({
        title: 'Errore',
        description: error.response?.data?.detail || 'Impossibile completare la registrazione',
        variant: 'destructive',
      });
    } finally {
      setRegistering(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a4a2e] to-[#2d5a3f] flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="animate-spin text-white mx-auto mb-4" size={48} />
          <p className="text-white">Validazione invito...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a4a2e] to-[#2d5a3f] flex items-center justify-center p-4">
        <div className="bg-white rounded-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] w-full max-w-md p-8 text-center">
          <AlertTriangle className="text-red-600 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-black text-[#1a4a2e] mb-4">Invito Non Valido</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#1a4a2e] text-white hover:bg-[#0f2d1c] font-bold px-8 py-3 rounded-sm transition-all"
          >
            Torna alla Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a4a2e] to-[#2d5a3f] flex items-center justify-center p-4">
      <div className="bg-white rounded-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-2 mb-4 border-4 border-[#1a4a2e]">
            <img src="/sinafi-logo.png" alt="Si.Na.Fi Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-[#1a4a2e]">Registrazione Admin</h1>
          <p className="text-slate-600 text-sm text-center mt-2">
            Benvenuto <strong>{inviteData.nome} {inviteData.cognome}</strong>!<br />
            Completa la registrazione per diventare amministratore.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-sm p-4 mb-6">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle size={20} />
            <span className="text-sm font-semibold">Email confermata: {inviteData.email}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-[#1a4a2e] mb-2 block uppercase tracking-wide">
              Username *
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="Scegli un username"
                required
                minLength={3}
                className="w-full h-12 rounded-sm border border-slate-300 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-[#1a4a2e] mb-2 block uppercase tracking-wide">
              Password *
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full h-12 rounded-sm border border-slate-300 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-[#1a4a2e] mb-2 block uppercase tracking-wide">
              Conferma Password *
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full h-12 rounded-sm border border-slate-300 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e] focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={registering}
            className="w-full bg-[#FFD700] text-[#1a4a2e] hover:bg-[#e6c200] font-bold uppercase tracking-wide px-8 py-3 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
          >
            {registering ? 'Registrazione...' : 'Completa Registrazione'}
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-6">
          Dopo la registrazione, potrai accedere all'area amministrativa
        </p>
      </div>
    </div>
  );
}

export default AdminRegister;
