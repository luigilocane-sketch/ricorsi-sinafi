import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRicorsi, deleteRicorso } from '../services/api';
import { Shield, Plus, Edit, Trash2, LogOut, Eye, EyeOff, FileText, BarChart3, Users } from 'lucide-react';
import { toast } from '../hooks/use-toast';

function AdminDashboard() {
  const [ricorsi, setRicorsi] = useState([]);
  const [loading, setLoading] = useState(true);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
      return;
    }
    loadRicorsi();
  }, [admin, navigate]);

  const loadRicorsi = async () => {
    try {
      const data = await getRicorsi();
      setRicorsi(data);
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i ricorsi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo ricorso?')) {
      return;
    }

    try {
      await deleteRicorso(id);
      toast({
        title: 'Successo',
        description: 'Ricorso eliminato con successo',
      });
      loadRicorsi();
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare il ricorso',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <Shield className="animate-spin text-[#1a4a2e] mx-auto mb-4" size={48} />
          <p className="text-slate-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-gradient-to-br from-[#2d5a3f] to-[#1a4a2e] py-6 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1">
              <img src="/sinafi-logo.png" alt="Si.Na.Fi Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl tracking-tight">Dashboard Admin</h1>
              <p className="text-green-200 text-xs">Benvenuto, {admin?.username}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-white text-sm hover:text-green-200 transition-colors flex items-center gap-2"
          >
            <LogOut size={16} />
            Esci
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-[#1a4a2e] mb-2">Gestione Ricorsi</h2>
            <p className="text-slate-600">Crea e gestisci i ricorsi collettivi</p>
          </div>
          <button
            onClick={() => navigate('/admin/ricorso/nuovo')}
            className="bg-[#FFD700] text-[#1a4a2e] hover:bg-[#e6c200] font-bold uppercase tracking-wide px-6 py-3 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Nuovo Ricorso
          </button>
        </div>

        {/* Ricorsi List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ricorsi.map((ricorso) => (
            <div
              key={ricorso.id}
              className="bg-white border border-slate-200 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,0.1)] overflow-hidden hover:shadow-[6px_6px_0px_0px_rgba(26,74,46,0.2)] transition-all"
            >
              <div className={`px-6 py-4 ${ricorso.attivo ? 'bg-[#1a4a2e]' : 'bg-slate-600'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#FFD700] text-xs font-bold uppercase tracking-wide">
                    {ricorso.badge_text}
                  </span>
                  <div className="flex items-center gap-1">
                    {ricorso.attivo ? (
                      <Eye size={16} className="text-green-200" />
                    ) : (
                      <EyeOff size={16} className="text-slate-300" />
                    )}
                  </div>
                </div>
                <h3 className="text-white font-bold text-lg">{ricorso.titolo}</h3>
              </div>
              <div className="p-6">
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">{ricorso.descrizione}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                  <div className="flex items-center gap-1">
                    <FileText size={14} />
                    <span>{ricorso.campi_dati.length} campi</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText size={14} />
                    <span>{ricorso.documenti_richiesti.length} documenti</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/stats/${ricorso.id}`)}
                    className="flex-1 bg-blue-600 text-white hover:bg-blue-700 font-semibold px-4 py-2 rounded-sm transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <BarChart3 size={16} />
                    Statistiche
                  </button>
                  <button
                    onClick={() => navigate(`/admin/ricorso/${ricorso.id}`)}
                    className="flex-1 bg-[#1a4a2e] text-white hover:bg-[#0f2d1c] font-semibold px-4 py-2 rounded-sm transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Edit size={16} />
                    Modifica
                  </button>
                  <button
                    onClick={() => handleDelete(ricorso.id)}
                    className="bg-red-600 text-white hover:bg-red-700 font-semibold px-4 py-2 rounded-sm transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {ricorsi.length === 0 && (
          <div className="text-center py-16">
            <Shield className="text-slate-300 mx-auto mb-4" size={64} />
            <h3 className="text-xl font-bold text-slate-600 mb-2">Nessun ricorso trovato</h3>
            <p className="text-slate-500 mb-6">Crea il tuo primo ricorso per iniziare</p>
            <button
              onClick={() => navigate('/admin/ricorso/nuovo')}
              className="bg-[#1a4a2e] text-white hover:bg-[#0f2d1c] font-bold uppercase tracking-wide px-8 py-3 rounded-sm transition-all"
            >
              Crea Ricorso
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
