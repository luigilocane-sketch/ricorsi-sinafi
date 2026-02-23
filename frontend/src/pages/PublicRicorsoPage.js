import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, ChevronRight, CheckCircle2, Upload, MapPin, Hash, Phone, Building, Mail, Calendar, User, ExternalLink, FileText } from 'lucide-react';
import { getRicorso, createSubmission, uploadFile, getEsempioFileUrl } from '../services/api';
import { toast } from '../hooks/use-toast';

function PublicRicorsoPage() {
  const { ricorsoId } = useParams();
  const navigate = useNavigate();
  const [ricorso, setRicorso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);

  useEffect(() => {
    loadRicorso();
  }, [ricorsoId]);

  const loadRicorso = async () => {
    try {
      const data = await getRicorso(ricorsoId);
      if (!data.attivo) {
        toast({
          title: 'Ricorso non disponibile',
          description: 'Questo ricorso non è più attivo',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }
      setRicorso(data);
      // Initialize form data
      const initialData = {};
      data.campi_dati.forEach(campo => {
        initialData[campo.id] = '';
      });
      setFormData(initialData);
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Impossibile caricare il ricorso',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getAcceptedTypes = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return '.pdf';
      case 'image':
        return '.jpg,.jpeg,.png';
      case 'both':
        return '.pdf,.jpg,.jpeg,.png';
      default:
        return '.pdf';
    }
  };

  const validateFileType = (file, fileType) => {
    const ext = file.name.split('.').pop().toLowerCase();
    switch (fileType) {
      case 'pdf':
        return ext === 'pdf';
      case 'image':
        return ['jpg', 'jpeg', 'png'].includes(ext);
      case 'both':
        return ['pdf', 'jpg', 'jpeg', 'png'].includes(ext);
      default:
        return false;
    }
  };

  const handleFileUpload = (docId, fileType, e) => {
    const file = e.target.files[0];
    if (file) {
      if (!validateFileType(file, fileType)) {
        toast({
          title: 'Errore',
          description: 'Tipo di file non consentito',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast({
          title: 'Errore',
          description: 'Il file deve essere inferiore a 15MB',
          variant: 'destructive',
        });
        return;
      }
      setUploadedFiles(prev => ({ ...prev, [docId]: file }));
      if (errors[docId]) {
        setErrors(prev => ({ ...prev, [docId]: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate campi dati
    ricorso.campi_dati.forEach(campo => {
      if (campo.required && !formData[campo.id]?.trim()) {
        newErrors[campo.id] = `${campo.label} è obbligatorio`;
      } else if (campo.type === 'email' && formData[campo.id] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[campo.id])) {
        newErrors[campo.id] = 'Email non valida';
      }
    });

    // Validate documents
    ricorso.documenti_richiesti.forEach(doc => {
      if (doc.required && !uploadedFiles[doc.id]) {
        newErrors[doc.id] = `${doc.label} è obbligatorio`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Errore di validazione',
        description: 'Si prega di compilare tutti i campi obbligatori',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create submission
      const submission = await createSubmission(ricorsoId, formData);

      // Upload files
      for (const [docId, file] of Object.entries(uploadedFiles)) {
        await uploadFile(submission.id, docId, file);
      }

      setSubmissionData(submission);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toast({
        title: 'Errore',
        description: error.response?.data?.detail || 'Impossibile inviare la richiesta',
        variant: 'destructive',
      });
    }
  };

  const getFieldIcon = (type) => {
    switch (type) {
      case 'email': return Mail;
      case 'tel': return Phone;
      case 'date': return Calendar;
      case 'number': return Hash;
      default: return User;
    }
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

  if (!ricorso) {
    return null;
  }

  if (isSubmitted && submissionData) {
    const userEmail = ricorso.campi_dati.find(c => c.type === 'email');
    const userEmailValue = userEmail ? formData[userEmail.id] : '';
    const userName = ricorso.campi_dati.find(c => c.id === 'nome' || c.label.toLowerCase().includes('nome'));
    const userSurname = ricorso.campi_dati.find(c => c.id === 'cognome' || c.label.toLowerCase().includes('cognome'));
    const fullName = `${userName ? formData[userName.id] : ''} ${userSurname ? formData[userSurname.id] : ''}`.trim();

    return (
      <div className="min-h-screen bg-[#f8fafc]">
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
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white border border-green-200 rounded-sm shadow-[8px_8px_0px_0px_rgba(26,74,46,0.1)] p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="text-[#1a4a2e]" size={48} />
            </div>
            <h2 className="text-3xl font-black text-[#1a4a2e] mb-4">Richiesta Inviata con Successo!</h2>
            <p className="text-slate-600 text-lg mb-8">
              {fullName && `Grazie ${fullName}, la`} tua richiesta è stata ricevuta.
              {userEmailValue && (
                <>
                  <br />Riceverai una conferma via email a: <span className="font-semibold">{userEmailValue}</span>
                </>
              )}
            </p>
            <div className="bg-green-50 border border-green-200 rounded-sm p-6 mb-8">
              <p className="text-sm text-slate-700">
                <strong>ID Riferimento:</strong> {submissionData.reference_id}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#1a4a2e] text-white hover:bg-[#0f2d1c] font-bold uppercase tracking-wide px-8 py-3 rounded-sm transition-all"
            >
              Invia Nuova Richiesta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-gradient-to-br from-[#2d5a3f] to-[#1a4a2e] py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-1">
              <img src="/sinafi-logo.png" alt="Si.Na.Fi Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-white font-black text-xl tracking-tight">Ricorsi Si.Na.Fi</h1>
              <p className="text-green-200 text-xs">Sindacato Nazionale Finanzieri</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-white text-sm hover:text-green-200 transition-colors flex items-center gap-2"
          >
            <ChevronRight size={16} className="rotate-180" />
            Torna ai Ricorsi
          </button>
        </div>
      </header>

      <div className="bg-gradient-to-b from-[#1a4a2e] to-[#2d5a3f] py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-[#FFD700] text-[#1a4a2e] px-4 py-2 rounded-sm font-bold text-sm mb-6">
            <Shield size={18} />
            {ricorso.badge_text}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            {ricorso.titolo}
          </h2>
          <p className="text-green-100 text-lg max-w-2xl mx-auto">
            {ricorso.descrizione}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dati Personali */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,0.1)] overflow-hidden animate-fadeIn">
            <div className="bg-[#1a4a2e] px-6 py-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <User size={20} />
                Dati Personali
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {ricorso.campi_dati.map((campo) => {
                const IconComponent = getFieldIcon(campo.type);
                
                if (campo.type === 'select') {
                  return (
                    <div key={campo.id} className={campo.options?.length > 10 ? 'md:col-span-2' : ''}>
                      <label className="text-sm font-bold text-[#1a4a2e] mb-2 block uppercase tracking-wide">
                        {campo.label} {campo.required && '*'}
                      </label>
                      <div className="relative">
                        <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                        <select
                          name={campo.id}
                          value={formData[campo.id] || ''}
                          onChange={handleInputChange}
                          required={campo.required}
                          className="w-full h-12 rounded-sm border border-slate-300 bg-white pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e] focus:border-transparent appearance-none cursor-pointer"
                        >
                          <option value="">{campo.placeholder || `Seleziona ${campo.label}`}</option>
                          {campo.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        <ChevronRight size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                      </div>
                      {errors[campo.id] && <p className="text-red-600 text-xs mt-1">{errors[campo.id]}</p>}
                    </div>
                  );
                }

                if (campo.type === 'textarea') {
                  return (
                    <div key={campo.id} className="md:col-span-2">
                      <label className="text-sm font-bold text-[#1a4a2e] mb-2 block uppercase tracking-wide">
                        {campo.label} {campo.required && '*'}
                      </label>
                      <textarea
                        name={campo.id}
                        value={formData[campo.id] || ''}
                        onChange={handleInputChange}
                        placeholder={campo.placeholder}
                        required={campo.required}
                        rows={4}
                        className="w-full rounded-sm border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e] focus:border-transparent"
                      />
                      {errors[campo.id] && <p className="text-red-600 text-xs mt-1">{errors[campo.id]}</p>}
                    </div>
                  );
                }

                return (
                  <div key={campo.id}>
                    <label className="text-sm font-bold text-[#1a4a2e] mb-2 block uppercase tracking-wide">
                      {campo.label} {campo.required && '*'}
                    </label>
                    <div className="relative">
                      <IconComponent size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={campo.type}
                        name={campo.id}
                        value={formData[campo.id] || ''}
                        onChange={handleInputChange}
                        placeholder={campo.placeholder}
                        required={campo.required}
                        className="w-full h-12 rounded-sm border border-slate-300 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e] focus:border-transparent"
                      />
                    </div>
                    {errors[campo.id] && <p className="text-red-600 text-xs mt-1">{errors[campo.id]}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Documenti */}
          <div className="bg-white border border-slate-200 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,0.1)] overflow-hidden animate-fadeIn">
            <div className="bg-[#1a4a2e] px-6 py-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <FileText size={20} />
                Documenti Richiesti
              </h3>
              <p className="text-green-200 text-sm mt-1">
                Tutti i documenti devono essere in formato consentito (max 15MB)
              </p>
            </div>
            <div className="p-6 space-y-4">
              {ricorso.documenti_richiesti.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="border-2 border-dashed rounded-sm p-4 transition-all border-slate-300 hover:border-[#1a4a2e] hover:bg-[#f2fcf5]"
                  style={{ animationDelay: `${(idx + 1) * 0.1}s` }}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {uploadedFiles[doc.id] ? (
                          <CheckCircle2 size={20} className="text-green-600" />
                        ) : (
                          <Upload size={20} className="text-slate-400" />
                        )}
                        <span className="font-bold text-[#1a4a2e]">
                          {doc.label} {doc.required && '*'}
                        </span>
                      </div>
                      {uploadedFiles[doc.id] && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircle2 size={14} />
                          {uploadedFiles[doc.id].name}
                        </p>
                      )}
                      {errors[doc.id] && (
                        <p className="text-xs text-red-600 mt-1">{errors[doc.id]}</p>
                      )}
                      {doc.esempio_file_url && (
                        <a
                          href={getEsempioFileUrl(ricorsoId, doc.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 underline flex items-center gap-1 mt-2"
                        >
                          <ExternalLink size={14} />
                          Vedi esempio
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept={getAcceptedTypes(doc.fileType)}
                          onChange={(e) => handleFileUpload(doc.id, doc.fileType, e)}
                          className="hidden"
                        />
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-semibold transition-colors bg-[#1a4a2e] text-white hover:bg-[#0f2d1c]">
                          <Upload size={16} />
                          Carica File
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              className="bg-[#FFD700] text-[#1a4a2e] hover:bg-[#e6c200] font-bold uppercase tracking-wide px-12 py-4 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-3 text-lg"
            >
              <Shield size={24} />
              Invia Richiesta
            </button>
          </div>
        </form>
      </div>

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

export default PublicRicorsoPage;
