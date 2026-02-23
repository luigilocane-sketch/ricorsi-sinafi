import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSubmissionsStats } from '../services/api';
import { Shield, ArrowLeft, MapPin, Users, Calendar, AlertTriangle, TrendingUp } from 'lucide-react';
import { toast } from '../hooks/use-toast';

function RicorsoStats() {
  const { ricorsoId } = useParams();
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
      return;
    }
    loadStats();
  }, [admin, ricorsoId, navigate]);

  const loadStats = async () => {
    try {
      const data = await getSubmissionsStats(ricorsoId);
      setStats(data);
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile caricare le statistiche',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non impostata';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('it-IT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const getScadenzaForRegione = (regione) => {
    if (stats?.scadenze_regioni && stats.scadenze_regioni[regione]) {
      return stats.scadenze_regioni[regione];
    }
    return stats?.scadenza_generale || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <Shield className="animate-spin text-[#1a4a2e] mx-auto mb-4" size={48} />
          <p className="text-slate-600">Caricamento statistiche...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const regioniOrdered = Object.keys(stats.per_regione).sort();

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-gradient-to-br from-[#2d5a3f] to-[#1a4a2e] py-6 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-white text-sm hover:text-green-200 transition-colors flex items-center gap-2 mb-4"
          >
            <ArrowLeft size={16} />
            Torna alla Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1">
              <img src="/sinafi-logo.png" alt="Si.Na.Fi Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl tracking-tight">Statistiche per Regione</h1>
              <p className="text-green-200 text-xs">{stats.ricorso_titolo}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-200 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,0.1)] p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-[#1a4a2e]" size={32} />
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <h3 className="text-3xl font-black text-[#1a4a2e]">{stats.totale_submissions}</h3>
            <p className="text-slate-600 text-sm">Totale Partecipazioni</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,0.1)] p-6">
            <div className="flex items-center justify-between mb-2">
              <MapPin className="text-[#1a4a2e]" size={32} />
            </div>
            <h3 className="text-3xl font-black text-[#1a4a2e]">{regioniOrdered.length}</h3>
            <p className="text-slate-600 text-sm">Regioni Partecipanti</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,0.1)] p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="text-orange-600" size={32} />
            </div>
            <h3 className="text-3xl font-black text-orange-600">{stats.scadenze_imminenti.length}</h3>
            <p className="text-slate-600 text-sm">Scadenze Imminenti (30gg)</p>
          </div>
        </div>

        {/* Scadenze Imminenti */}
        {stats.scadenze_imminenti.length > 0 && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-sm p-6 mb-8">
            <h2 className="text-xl font-black text-orange-800 mb-4 flex items-center gap-2">
              <AlertTriangle size={24} />
              Attenzione: Scadenze Imminenti
            </h2>
            <div className="space-y-3">
              {stats.scadenze_imminenti.map((item) => (
                <div key={item.regione} className="bg-white border border-orange-300 rounded-sm p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#1a4a2e]">{item.regione}</p>
                    <p className="text-sm text-slate-600">
                      Scadenza: {formatDate(item.scadenza)} ({item.giorni_rimanenti} giorni rimanenti)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-[#1a4a2e]">{item.submissions_ricevute}</p>
                    <p className="text-xs text-slate-500">partecipazioni</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistiche per Regione */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,0.1)] overflow-hidden">
          <div className="bg-[#1a4a2e] px-6 py-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <MapPin size={20} />
              Dettaglio per Regione
            </h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-4 font-bold text-[#1a4a2e]">Regione</th>
                    <th className="text-center py-3 px-4 font-bold text-[#1a4a2e]">Partecipazioni</th>
                    <th className="text-center py-3 px-4 font-bold text-[#1a4a2e]">Scadenza</th>
                    <th className="text-right py-3 px-4 font-bold text-[#1a4a2e]">%</th>
                  </tr>
                </thead>
                <tbody>
                  {regioniOrdered.map((regione) => {
                    const regionData = stats.per_regione[regione];
                    const percentage = ((regionData.count / stats.totale_submissions) * 100).toFixed(1);
                    const scadenza = getScadenzaForRegione(regione);
                    
                    return (
                      <tr key={regione} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-slate-400" />
                            <span className="font-semibold text-[#1a4a2e]">{regione}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-800 font-bold rounded-full">
                            {regionData.count}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-slate-600">
                            <Calendar size={14} />
                            {formatDate(scadenza)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-[#1a4a2e] h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-700 w-12 text-right">{percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Scadenza Generale Info */}
        {stats.scadenza_generale && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-sm p-4">
            <p className="text-sm text-blue-800">
              <strong>Scadenza Generale:</strong> {formatDate(stats.scadenza_generale)} (applicata alle regioni senza scadenza specifica)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RicorsoStats;
