import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  listAdmins, 
  deleteAdmin, 
  createAdminManual, 
  createInvite,
  listInvites 
} from '../services/api';
import { 
  Shield, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Users, 
  Mail, 
  UserPlus,
  Copy,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { toast } from '../hooks/use-toast';

function AdminManagement() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState(null);

  const [manualForm, setManualForm] = useState({
    username: '',
    password: '',
    nome: '',
    cognome: '',
    email: ''
  });

  const [inviteForm, setInviteForm] = useState({
    nome: '',
    cognome: '',
    email: ''
  });

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
      return;
    }
    loadData();
  }, [admin, navigate]);

  const loadData = async () => {
    try {
      const [adminsData, invitesData] = await Promise.all([
        listAdmins(),
        listInvites()
      ]);
      setAdmins(adminsData);
      setInvites(invitesData);
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i dati',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManual = async (e) => {
    e.preventDefault();
    try {
      await createAdminManual(manualForm);
      toast({
        title: 'Successo',
        description: 'Amministratore creato con successo',
      });
      setManualForm({ username: '', password: '', nome: '', cognome: '', email: '' });
      setShowManualForm(false);
      loadData();
    } catch (error) {
      toast({
        title: 'Errore',
        description: error.response?.data?.detail || 'Impossibile creare l\'amministratore',
        variant: 'destructive',
      });
    }
  };

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    try {
      const response = await createInvite(inviteForm);
      setGeneratedInvite(response);
      toast({
        title: 'Invito Generato',
        description: 'Copia il link e invialo manualmente via email',
      });
      setInviteForm({ nome: '', cognome: '', email: '' });
      loadData();
    } catch (error) {
      toast({
        title: 'Errore',
        description: error.response?.data?.detail || 'Impossibile generare l\'invito',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo amministratore?')) {
      return;
    }

    try {
      await deleteAdmin(adminId);
      toast({
        title: 'Successo',
        description: 'Amministratore eliminato',
      });
      loadData();
    } catch (error) {
      toast({
        title: 'Errore',
        description: error.response?.data?.detail || 'Impossibile eliminare l\'amministratore',
        variant: 'destructive',
      });
    }
  };

  const copyInviteLink = () => {
    const fullUrl = `${window.location.origin}${generatedInvite.invite_url}`;
    navigator.clipboard.writeText(fullUrl);
    toast({
      title: 'Link Copiato',
      description: 'Il link di invito è stato copiato negli appunti',
    });
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
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
              <h1 className="text-white font-black text-xl tracking-tight">Gestione Amministratori</h1>
              <p className="text-green-200 text-xs">Aggiungi e gestisci gli amministratori del sistema</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => {
              setShowManualForm(!showManualForm);
              setShowInviteForm(false);
              setGeneratedInvite(null);
            }}
            className="bg-[#1a4a2e] text-white hover:bg-[#0f2d1c] font-bold px-6 py-3 rounded-sm transition-all flex items-center gap-2"
          >
            <UserPlus size={20} />
            Aggiungi Admin Manualmente
          </button>
          <button
            onClick={() => {
              setShowInviteForm(!showInviteForm);
              setShowManualForm(false);
              setGeneratedInvite(null);
            }}
            className="bg-blue-600 text-white hover:bg-blue-700 font-bold px-6 py-3 rounded-sm transition-all flex items-center gap-2"
          >
            <Mail size={20} />
            Genera Link Invito
          </button>
        </div>

        {/* Manual Form */}
        {showManualForm && (
          <div className="bg-white border border-slate-200 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,0.1)] p-6 mb-8">
            <h3 className="text-lg font-bold text-[#1a4a2e] mb-4">Crea Amministratore Manualmente</h3>
            <form onSubmit={handleCreateManual} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Nome *</label>
                  <input
                    type="text"
                    value={manualForm.nome}
                    onChange={(e) => setManualForm({...manualForm, nome: e.target.value})}
                    required
                    className="w-full h-10 rounded-sm border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e]"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Cognome *</label>
                  <input
                    type="text"
                    value={manualForm.cognome}
                    onChange={(e) => setManualForm({...manualForm, cognome: e.target.value})}
                    required
                    className="w-full h-10 rounded-sm border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e]"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Email *</label>
                  <input
                    type="email"
                    value={manualForm.email}
                    onChange={(e) => setManualForm({...manualForm, email: e.target.value})}
                    required
                    className="w-full h-10 rounded-sm border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e]"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Username *</label>
                  <input
                    type="text"
                    value={manualForm.username}
                    onChange={(e) => setManualForm({...manualForm, username: e.target.value})}
                    required
                    className="w-full h-10 rounded-sm border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Password *</label>
                  <input
                    type="password"
                    value={manualForm.password}
                    onChange={(e) => setManualForm({...manualForm, password: e.target.value})}
                    required
                    minLength={6}
                    className="w-full h-10 rounded-sm border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e]"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-[#FFD700] text-[#1a4a2e] hover:bg-[#e6c200] font-bold px-6 py-2 rounded-sm transition-all"
                >
                  Crea Admin
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="bg-slate-300 text-slate-700 hover:bg-slate-400 font-bold px-6 py-2 rounded-sm transition-all"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Invite Form */}
        {showInviteForm && (
          <div className="bg-white border border-slate-200 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,0.1)] p-6 mb-8">
            <h3 className="text-lg font-bold text-[#1a4a2e] mb-4">Genera Link di Invito</h3>
            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Nome *</label>
                  <input
                    type="text"
                    value={inviteForm.nome}
                    onChange={(e) => setInviteForm({...inviteForm, nome: e.target.value})}
                    required
                    className="w-full h-10 rounded-sm border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e]"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Cognome *</label>
                  <input
                    type="text"
                    value={inviteForm.cognome}
                    onChange={(e) => setInviteForm({...inviteForm, cognome: e.target.value})}
                    required
                    className="w-full h-10 rounded-sm border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e]"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Email *</label>
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                    required
                    className="w-full h-10 rounded-sm border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e]"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-[#FFD700] text-[#1a4a2e] hover:bg-[#e6c200] font-bold px-6 py-2 rounded-sm transition-all"
                >
                  Genera Invito
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="bg-slate-300 text-slate-700 hover:bg-slate-400 font-bold px-6 py-2 rounded-sm transition-all"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Generated Invite */}
        {generatedInvite && (
          <div className="bg-green-50 border-2 border-green-500 rounded-sm p-6 mb-8">
            <div className="flex items-start gap-4">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={32} />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-800 mb-2">Invito Generato con Successo!</h3>
                <p className="text-sm text-green-700 mb-4">
                  Copia il link sottostante e invialo manualmente a <strong>{generatedInvite.email}</strong> via email.
                  Il link scadrà il {formatDate(generatedInvite.expires_at)}.
                </p>
                <div className="bg-white border border-green-300 rounded-sm p-4 flex items-center gap-3">
                  <code className="flex-1 text-sm text-slate-800 break-all">
                    {window.location.origin}{generatedInvite.invite_url}
                  </code>
                  <button
                    onClick={copyInviteLink}
                    className="bg-green-600 text-white hover:bg-green-700 font-semibold px-4 py-2 rounded-sm transition-all flex items-center gap-2"
                  >
                    <Copy size={16} />
                    Copia
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admins List */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,0.1)] overflow-hidden mb-8">
          <div className="bg-[#1a4a2e] px-6 py-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Users size={20} />
              Amministratori ({admins.length})
            </h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-4 font-bold text-[#1a4a2e]">Nome</th>
                    <th className="text-left py-3 px-4 font-bold text-[#1a4a2e]">Email</th>
                    <th className="text-left py-3 px-4 font-bold text-[#1a4a2e]">Username</th>
                    <th className="text-left py-3 px-4 font-bold text-[#1a4a2e]">Creato da</th>
                    <th className="text-center py-3 px-4 font-bold text-[#1a4a2e]">Data</th>
                    <th className="text-center py-3 px-4 font-bold text-[#1a4a2e]">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((adm) => (
                    <tr key={adm.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#1a4a2e]">
                          {adm.nome || '-'} {adm.cognome || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-sm">{adm.email || '-'}</td>
                      <td className="py-3 px-4 text-slate-600 text-sm">{adm.username}</td>
                      <td className="py-3 px-4 text-slate-600 text-sm">{adm.created_by || 'Sistema'}</td>
                      <td className="py-3 px-4 text-center text-slate-600 text-sm">
                        {formatDate(adm.created_at)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(adm.id)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                          title="Elimina"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pending Invites */}
        <div className="bg-white border border-slate-200 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,0.1)] overflow-hidden">
          <div className="bg-[#1a4a2e] px-6 py-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Mail size={20} />
              Inviti Generati
            </h2>
          </div>
          <div className="p-6">
            {invites.length === 0 ? (
              <p className="text-slate-500 text-center py-4">Nessun invito generato</p>
            ) : (
              <div className="space-y-3">
                {invites.map((invite) => {
                  const isExpired = new Date(invite.expires_at) < new Date();
                  const isUsed = invite.used;
                  
                  return (
                    <div key={invite.token} className={`border rounded-sm p-4 ${
                      isUsed ? 'bg-green-50 border-green-200' : 
                      isExpired ? 'bg-slate-50 border-slate-200' : 
                      'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">
                            {invite.nome} {invite.cognome} - {invite.email}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            Creato da: {invite.created_by} | Scade: {formatDate(invite.expires_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isUsed && (
                            <span className="flex items-center gap-1 text-green-700 text-sm font-semibold">
                              <CheckCircle size={16} />
                              Utilizzato
                            </span>
                          )}
                          {!isUsed && isExpired && (
                            <span className="flex items-center gap-1 text-slate-500 text-sm font-semibold">
                              <XCircle size={16} />
                              Scaduto
                            </span>
                          )}
                          {!isUsed && !isExpired && (
                            <span className="flex items-center gap-1 text-blue-700 text-sm font-semibold">
                              <Clock size={16} />
                              In attesa
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminManagement;
