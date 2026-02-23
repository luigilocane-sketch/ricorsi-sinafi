import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronRight, FileText, Calendar } from 'lucide-react';
import { getRicorsi } from '../services/api';
import { toast } from '../hooks/use-toast';

function Home() {
  const [ricorsi, setRicorsi] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadRicorsi();
  }, []);

  const loadRicorsi = async () => {
    try {
      const data = await getRicorsi(true); // Only active ricorsi
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
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
      <header className="bg-gradient-to-br from-[#2d5a3f] to-[#1a4a2e] py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Shield className="text-[#1a4a2e]" size={24} />
            </div>
            <div>
              <h1 className="text-white font-black text-xl tracking-tight">Ricorsi Si.Na.Fi</h1>
              <p className="text-green-200 text-xs">Sindacato Nazionale Finanzieri</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/login')}
            className="text-white text-sm hover:text-green-200 transition-colors flex items-center gap-2"
          >
            <ChevronRight size={16} className="rotate-180" />
            Area Admin
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-b from-[#1a4a2e] to-[#2d5a3f] py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-[#FFD700] text-[#1a4a2e] px-4 py-2 rounded-sm font-bold text-sm mb-6">
            <Shield size={18} />
            PORTALE RICORSI
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Ricorsi Collettivi
          </h2>
          <p className="text-green-100 text-xl max-w-2xl mx-auto">
            Seleziona il ricorso a cui desideri partecipare e compila il modulo di adesione
          </p>
        </div>
      </div>

      {/* Ricorsi List */}
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        {ricorsi.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="text-slate-300 mx-auto mb-4" size={64} />
            <h3 className="text-2xl font-bold text-slate-600 mb-2">Nessun ricorso disponibile</h3>
            <p className="text-slate-500">Al momento non ci sono ricorsi attivi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {ricorsi.map((ricorso) => (
              <div
                key={ricorso.id}
                className="bg-white border border-slate-200 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,0.1)] overflow-hidden hover:shadow-[8px_8px_0px_0px_rgba(26,74,46,0.2)] transition-all cursor-pointer group"
                onClick={() => navigate(`/ricorso/${ricorso.id}`)}
              >
                <div className="bg-[#1a4a2e] px-6 py-4">
                  <span className="text-[#FFD700] text-xs font-bold uppercase tracking-wide">
                    {ricorso.badge_text}
                  </span>
                  <h3 className="text-white font-black text-2xl mt-2 mb-1">
                    {ricorso.titolo}
                  </h3>
                </div>
                
                <div className="p-6">
                  <p className="text-slate-700 mb-6 leading-relaxed">
                    {ricorso.descrizione}
                  </p>
                  
                  <div className="flex items-center gap-6 text-sm text-slate-500 mb-6">
                    <div className="flex items-center gap-2">
                      <FileText size={16} />
                      <span>{ricorso.campi_dati.length} campi dati</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText size={16} />
                      <span>{ricorso.documenti_richiesti.length} documenti</span>
                    </div>
                  </div>

                  {ricorso.created_at && (
                    <p className="text-xs text-slate-400 mb-4 flex items-center gap-2">
                      <Calendar size={14} />
                      Creato il {formatDate(ricorso.created_at)}
                    </p>
                  )}
                  
                  <button className="w-full bg-[#FFD700] text-[#1a4a2e] hover:bg-[#e6c200] font-bold uppercase tracking-wide px-6 py-3 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,1)] group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none transition-all flex items-center justify-center gap-2">
                    <Shield size={18} />
                    Partecipa al Ricorso
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-[#1a4a2e] to-[#2d5a3f] py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-white text-sm mb-2">
            © 2026 Si.Na.Fi - Sindacato Nazionale Finanzieri
          </p>
          <p className="text-green-200 text-xs">
            Cum Grano Salis
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
