import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRicorso, createRicorso, updateRicorso, uploadEsempioFile, deleteEsempioFile } from '../services/api';
import {
  Shield, ArrowLeft, Plus, Trash2, Save, Eye, EyeOff,
  FileText, Type, Mail, Phone, Calendar, Hash, List, Upload, X
} from 'lucide-react';
import { toast } from '../hooks/use-toast';

const FIELD_TYPES = [
  { value: 'text', label: 'Testo', icon: Type },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'tel', label: 'Telefono', icon: Phone },
  { value: 'date', label: 'Data', icon: Calendar },
  { value: 'number', label: 'Numero', icon: Hash },
  { value: 'select', label: 'Selezione', icon: List },
  { value: 'textarea', label: 'Area Testo', icon: FileText },
];

const FILE_TYPES = [
  { value: 'pdf', label: 'Solo PDF' },
  { value: 'image', label: 'Solo Immagini (JPG, PNG)' },
  { value: 'both', label: 'PDF e Immagini' },
];

function RicorsoForm() {
  const { id } = useParams();
  const isEdit = id && id !== 'nuovo';
  const { admin } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    titolo: '',
    descrizione: '',
    badge_text: 'RICORSO COLLETTIVO',
    attivo: true,
    campi_dati: [],
    documenti_richiesti: [],
    scadenza_generale: '',
    scadenze_regioni: {},
  });

  useEffect(() => {
    if (!admin) {
      navigate('/admin/login');
      return;
    }
    if (isEdit) {
      loadRicorso();
    }
  }, [admin, isEdit, navigate]);

  const loadRicorso = async () => {
    try {
      const data = await getRicorso(id);
      setFormData(data);
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile caricare il ricorso',
        variant: 'destructive',
      });
      navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.campi_dati.length === 0) {
      toast({
        title: 'Errore',
        description: 'Aggiungi almeno un campo dati',
        variant: 'destructive',
      });
      return;
    }

    if (formData.documenti_richiesti.length === 0) {
      toast({
        title: 'Errore',
        description: 'Aggiungi almeno un documento',
        variant: 'destructive',
      });
      return;
    }

    if (formData.documenti_richiesti.length > 10) {
      toast({
        title: 'Errore',
        description: 'Massimo 10 documenti consentiti',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateRicorso(id, formData);
        toast({
          title: 'Successo',
          description: 'Ricorso aggiornato con successo',
        });
      } else {
        await createRicorso(formData);
        toast({
          title: 'Successo',
          description: 'Ricorso creato con successo',
        });
      }
      navigate('/admin/dashboard');
    } catch (error) {
      toast({
        title: 'Errore',
        description: error.response?.data?.detail || 'Impossibile salvare il ricorso',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addCampoDati = () => {
    const newId = `campo_${Date.now()}`;
    setFormData({
      ...formData,
      campi_dati: [
        ...formData.campi_dati,
        {
          id: newId,
          label: '',
          type: 'text',
          required: true,
          placeholder: '',
          options: [],
        },
      ],
    });
  };

  const updateCampoDati = (index, field, value) => {
    const newCampi = [...formData.campi_dati];
    newCampi[index] = { ...newCampi[index], [field]: value };
    setFormData({ ...formData, campi_dati: newCampi });
  };

  const removeCampoDati = (index) => {
    const newCampi = formData.campi_dati.filter((_, i) => i !== index);
    setFormData({ ...formData, campi_dati: newCampi });
  };

  const addDocumento = () => {
    if (formData.documenti_richiesti.length >= 10) {
      toast({
        title: 'Limite raggiunto',
        description: 'Massimo 10 documenti consentiti',
        variant: 'destructive',
      });
      return;
    }

    const newId = `doc_${Date.now()}`;
    setFormData({
      ...formData,
      documenti_richiesti: [
        ...formData.documenti_richiesti,
        {
          id: newId,
          label: '',
          required: true,
          fileType: 'pdf',
        },
      ],
    });
  };

  const updateDocumento = (index, field, value) => {
    const newDocs = [...formData.documenti_richiesti];
    newDocs[index] = { ...newDocs[index], [field]: value };
    setFormData({ ...formData, documenti_richiesti: newDocs });
  };

  const handleEsempioUpload = async (index, file) => {
    if (!isEdit) {
      toast({
        title: 'Salva prima il ricorso',
        description: 'Devi prima salvare il ricorso prima di caricare file di esempio',
        variant: 'destructive',
      });
      return;
    }

    try {
      const doc = formData.documenti_richiesti[index];
      await uploadEsempioFile(id, doc.id, file);
      
      // Update local state
      const newDocs = [...formData.documenti_richiesti];
      newDocs[index].esempio_file_url = `/api/esempio/${id}/${doc.id}`;
      setFormData({ ...formData, documenti_richiesti: newDocs });
      
      toast({
        title: 'Successo',
        description: 'File di esempio caricato',
      });
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile caricare il file di esempio',
        variant: 'destructive',
      });
    }
  };

  const handleEsempioDelete = async (index) => {
    try {
      const doc = formData.documenti_richiesti[index];
      await deleteEsempioFile(id, doc.id);
      
      // Update local state
      const newDocs = [...formData.documenti_richiesti];
      newDocs[index].esempio_file_url = null;
      setFormData({ ...formData, documenti_richiesti: newDocs });
      
      toast({
        title: 'Successo',
        description: 'File di esempio eliminato',
      });
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare il file di esempio',
        variant: 'destructive',
      });
    }
  };

  const removeDocumento = (index) => {
    const newDocs = formData.documenti_richiesti.filter((_, i) => i !== index);
    setFormData({ ...formData, documenti_richiesti: newDocs });
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
              <h1 className="text-white font-black text-xl tracking-tight">
                {isEdit ? 'Modifica Ricorso' : 'Nuovo Ricorso'}
              </h1>
              <p className="text-green-200 text-xs">Configura campi dati e documenti richiesti</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,0.1)] overflow-hidden">
            <div className="bg-[#1a4a2e] px-6 py-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <FileText size={20} />
                Informazioni Generali
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-bold text-[#1a4a2e] mb-2 block uppercase tracking-wide">
                  Titolo Ricorso *
                </label>
                <input
                  type="text"
                  value={formData.titolo}
                  onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                  placeholder="es: Ricorso Indennità Compensativa"
                  className="w-full h-12 rounded-sm border border-slate-300 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#1a4a2e] mb-2 block uppercase tracking-wide">
                  Descrizione *
                </label>
                <textarea
                  value={formData.descrizione}
                  onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                  placeholder="Descrizione del ricorso..."
                  rows={3}
                  className="w-full rounded-sm border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#1a4a2e] mb-2 block uppercase tracking-wide">
                  Testo Badge
                </label>
                <input
                  type="text"
                  value={formData.badge_text}
                  onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                  placeholder="RICORSO COLLETTIVO"
                  className="w-full h-12 rounded-sm border border-slate-300 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e] focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="attivo"
                  checked={formData.attivo}
                  onChange={(e) => setFormData({ ...formData, attivo: e.target.checked })}
                  className="w-5 h-5 text-[#1a4a2e] border-slate-300 rounded focus:ring-[#1a4a2e]"
                />
                <label htmlFor="attivo" className="text-sm font-bold text-[#1a4a2e] flex items-center gap-2">
                  {formData.attivo ? <Eye size={16} /> : <EyeOff size={16} />}
                  Ricorso Attivo
                </label>
              </div>
            </div>
          </div>

          {/* Campi Dati */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,0.1)] overflow-hidden">
            <div className="bg-[#1a4a2e] px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Type size={20} />
                Campi Dati ({formData.campi_dati.length})
              </h3>
              <button
                type="button"
                onClick={addCampoDati}
                className="bg-[#FFD700] text-[#1a4a2e] hover:bg-[#e6c200] font-semibold px-4 py-2 rounded-sm transition-all flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                Aggiungi Campo
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formData.campi_dati.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  Nessun campo dati. Clicca "Aggiungi Campo" per iniziare.
                </p>
              ) : (
                formData.campi_dati.map((campo, index) => (
                  <div key={campo.id} className="border border-slate-200 rounded-sm p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">Campo #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeCampoDati(index)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Label *</label>
                        <input
                          type="text"
                          value={campo.label}
                          onChange={(e) => updateCampoDati(index, 'label', e.target.value)}
                          placeholder="es: Nome, Email, Data di Nascita"
                          className="w-full h-10 rounded-sm border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e]"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Tipo *</label>
                        <select
                          value={campo.type}
                          onChange={(e) => updateCampoDati(index, 'type', e.target.value)}
                          className="w-full h-10 rounded-sm border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e]"
                        >
                          {FIELD_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Placeholder</label>
                        <input
                          type="text"
                          value={campo.placeholder || ''}
                          onChange={(e) => updateCampoDati(index, 'placeholder', e.target.value)}
                          placeholder="es: Mario, mario@email.com"
                          className="w-full h-10 rounded-sm border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e]"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id={`required-${campo.id}`}
                          checked={campo.required}
                          onChange={(e) => updateCampoDati(index, 'required', e.target.checked)}
                          className="w-4 h-4 text-[#1a4a2e] border-slate-300 rounded"
                        />
                        <label htmlFor={`required-${campo.id}`} className="text-xs font-semibold text-slate-600">
                          Campo Obbligatorio
                        </label>
                      </div>
                    </div>

                    {campo.type === 'select' && (
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">
                          Opzioni (una per riga)
                        </label>
                        <textarea
                          value={campo.options?.join('\n') || ''}
                          onChange={(e) => updateCampoDati(index, 'options', e.target.value.split('\n').filter(o => o.trim()))}
                          placeholder="Opzione 1\nOpzione 2\nOpzione 3"
                          rows={3}
                          className="w-full rounded-sm border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e]"
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Documenti Richiesti */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,0.1)] overflow-hidden">
            <div className="bg-[#1a4a2e] px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <FileText size={20} />
                Documenti Richiesti ({formData.documenti_richiesti.length}/10)
              </h3>
              <button
                type="button"
                onClick={addDocumento}
                disabled={formData.documenti_richiesti.length >= 10}
                className="bg-[#FFD700] text-[#1a4a2e] hover:bg-[#e6c200] font-semibold px-4 py-2 rounded-sm transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                Aggiungi Documento
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formData.documenti_richiesti.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  Nessun documento richiesto. Clicca "Aggiungi Documento" per iniziare.
                </p>
              ) : (
                formData.documenti_richiesti.map((doc, index) => (
                  <div key={doc.id} className="border border-slate-200 rounded-sm p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">Documento #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeDocumento(index)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Nome Documento *</label>
                        <input
                          type="text"
                          value={doc.label}
                          onChange={(e) => updateDocumento(index, 'label', e.target.value)}
                          placeholder="es: Carta d'Identità, Procura alle Liti"
                          className="w-full h-10 rounded-sm border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e]"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">Tipo File *</label>
                        <select
                          value={doc.fileType}
                          onChange={(e) => updateDocumento(index, 'fileType', e.target.value)}
                          className="w-full h-10 rounded-sm border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e]"
                        >
                          {FILE_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`doc-required-${doc.id}`}
                        checked={doc.required}
                        onChange={(e) => updateDocumento(index, 'required', e.target.checked)}
                        className="w-4 h-4 text-[#1a4a2e] border-slate-300 rounded"
                      />
                      <label htmlFor={`doc-required-${doc.id}`} className="text-xs font-semibold text-slate-600">
                        Documento Obbligatorio
                      </label>
                    </div>

                    {/* File di Esempio */}
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <label className="text-xs font-semibold text-slate-600 mb-2 block">
                        File di Esempio (opzionale)
                      </label>
                      {doc.esempio_file_url ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={`${process.env.REACT_APP_BACKEND_URL}${doc.esempio_file_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-green-600 hover:text-green-700 underline flex items-center gap-1"
                          >
                            <FileText size={14} />
                            Visualizza esempio
                          </a>
                          <button
                            type="button"
                            onClick={() => handleEsempioDelete(index)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) handleEsempioUpload(index, file);
                            }}
                            className="hidden"
                            disabled={!isEdit}
                          />
                          <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-semibold transition-colors ${
                            isEdit 
                              ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer' 
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}>
                            <Upload size={14} />
                            {isEdit ? 'Carica Esempio' : 'Salva prima il ricorso'}
                          </span>
                        </label>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        Gli utenti vedranno questo file come esempio
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="bg-slate-500 text-white hover:bg-slate-600 font-bold uppercase tracking-wide px-8 py-3 rounded-sm transition-all"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#FFD700] text-[#1a4a2e] hover:bg-[#e6c200] font-bold uppercase tracking-wide px-12 py-3 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 flex items-center gap-3"
            >
              <Save size={20} />
              {saving ? 'Salvataggio...' : isEdit ? 'Aggiorna Ricorso' : 'Crea Ricorso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RicorsoForm;
