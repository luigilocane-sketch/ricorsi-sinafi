import { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Shield, User, Hash, Phone, Building, Mail, MapPin, FileText, Upload, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { toast } from './hooks/use-toast';
import { AuthProvider } from './context/AuthContext';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import RicorsoForm from './pages/RicorsoForm';

const REGIONI_ITALIANE = [
  'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
  'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
  'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
  'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto'
];

const DOCUMENTI_RICHIESTI = [
  { id: 'istanza', label: 'Istanza', required: true },
  { id: 'carta_identita', label: "Carta d'Identità", required: true },
  { id: 'codice_fiscale', label: 'Codice Fiscale', required: true },
  { id: 'preavviso_diniego', label: 'Preavviso di Diniego', required: true },
  { id: 'diniego', label: 'Diniego', required: true }
];

function App() {
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    matricola: '',
    telefono: '',
    reparto: '',
    email: '',
    regione: ''
  });

  const [uploadedFiles, setUploadedFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileUpload = (docId, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Errore',
          description: 'Solo file PDF sono accettati',
          variant: 'destructive'
        });
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        toast({
          title: 'Errore',
          description: 'Il file deve essere inferiore a 15MB',
          variant: 'destructive'
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

    // Validate personal data
    if (!formData.nome.trim()) newErrors.nome = 'Nome è obbligatorio';
    if (!formData.cognome.trim()) newErrors.cognome = 'Cognome è obbligatorio';
    if (!formData.matricola.trim()) newErrors.matricola = 'Matricola è obbligatoria';
    if (!formData.telefono.trim()) newErrors.telefono = 'Telefono è obbligatorio';
    if (!formData.reparto.trim()) newErrors.reparto = 'Reparto di Servizio è obbligatorio';
    if (!formData.email.trim()) {
      newErrors.email = 'Email è obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email non valida';
    }
    if (!formData.regione) newErrors.regione = 'Regione è obbligatoria';

    // Validate documents
    DOCUMENTI_RICHIESTI.forEach(doc => {
      if (doc.required && !uploadedFiles[doc.id]) {
        newErrors[doc.id] = `${doc.label} è obbligatorio`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // Mock submission
      console.log('Form submitted:', formData);
      console.log('Files:', uploadedFiles);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast({
        title: 'Errore di validazione',
        description: 'Si prega di compilare tutti i campi obbligatori',
        variant: 'destructive'
      });
    }
  };

  if (isSubmitted) {
    return (
      <div className="App">
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
              <button className="text-white text-sm hover:text-green-200 transition-colors flex items-center gap-2">
                <ChevronRight size={16} className="rotate-180" />
                Area Admin
              </button>
            </div>
          </header>

          {/* Success Message */}
          <div className="max-w-2xl mx-auto px-4 py-16">
            <div className="bg-white border border-green-200 rounded-sm shadow-[8px_8px_0px_0px_rgba(26,74,46,0.1)] p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-[#1a4a2e]" size={48} />
              </div>
              <h2 className="text-3xl font-black text-[#1a4a2e] mb-4">Richiesta Inviata con Successo!</h2>
              <p className="text-slate-600 text-lg mb-8">
                Grazie {formData.nome} {formData.cognome}, la tua richiesta è stata ricevuta.
                <br />Riceverai una conferma via email a: <span className="font-semibold">{formData.email}</span>
              </p>
              <div className="bg-green-50 border border-green-200 rounded-sm p-6 mb-8">
                <p className="text-sm text-slate-700">
                  <strong>ID Riferimento:</strong> {Date.now()}-{formData.matricola}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({
                    nome: '',
                    cognome: '',
                    matricola: '',
                    telefono: '',
                    reparto: '',
                    email: '',
                    regione: ''
                  });
                  setUploadedFiles({});
                  setErrors({});
                }}
                className="bg-[#1a4a2e] text-white hover:bg-[#0f2d1c] font-bold uppercase tracking-wide px-8 py-3 rounded-sm transition-all"
              >
                Invia Nuova Richiesta
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Toaster />
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
            <button className="text-white text-sm hover:text-green-200 transition-colors flex items-center gap-2">
              <ChevronRight size={16} className="rotate-180" />
              Area Admin
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <div className="bg-gradient-to-b from-[#1a4a2e] to-[#2d5a3f] py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-[#FFD700] text-[#1a4a2e] px-4 py-2 rounded-sm font-bold text-sm mb-6">
              <Shield size={18} />
              RICORSO COLLETTIVO
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Ricorso Indennità Compensativa
            </h2>
            <p className="text-green-100 text-lg max-w-2xl mx-auto">
              Ricorso collettivo per l'indennità compensativa dei membri della Guardia di Finanza
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Data Section */}
            <div className="bg-white border border-slate-200 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,0.1)] overflow-hidden animate-fadeIn">
              <div className="bg-[#1a4a2e] px-6 py-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <User size={20} />
                  Dati Personali
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div>
                  <label className="text-sm font-bold text-[#1a4a2e] mb-2 block uppercase tracking-wide">
                    Nome *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    placeholder="Mario"
                    className="w-full h-12 rounded-sm border border-slate-300 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e] focus:border-transparent"
                    data-testid="input-nome"
                  />
                  {errors.nome && <p className="text-red-600 text-xs mt-1">{errors.nome}</p>}
                </div>

                {/* Cognome */}
                <div>
                  <label className="text-sm font-bold text-[#1a4a2e] mb-2 block uppercase tracking-wide">
                    Cognome *
                  </label>
                  <input
                    type="text"
                    name="cognome"
                    value={formData.cognome}
                    onChange={handleInputChange}
                    placeholder="Rossi"
                    className="w-full h-12 rounded-sm border border-slate-300 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e] focus:border-transparent"
                    data-testid="input-cognome"
                  />
                  {errors.cognome && <p className="text-red-600 text-xs mt-1">{errors.cognome}</p>}
                </div>

                {/* Matricola */}
                <div>
                  <label className="text-sm font-bold text-[#1a4a2e] mb-2 block uppercase tracking-wide">
                    Matricola *
                  </label>
                  <div className="relative">
                    <Hash size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="matricola"
                      value={formData.matricola}
                      onChange={handleInputChange}
                      placeholder="123456"
                      className="w-full h-12 rounded-sm border border-slate-300 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e] focus:border-transparent"
                      data-testid="input-matricola"
                    />
                  </div>
                  {errors.matricola && <p className="text-red-600 text-xs mt-1">{errors.matricola}</p>}
                </div>

                {/* Telefono */}
                <div>
                  <label className="text-sm font-bold text-[#1a4a2e] mb-2 block uppercase tracking-wide">
                    Telefono *
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      placeholder="+39 333 1234567"
                      className="w-full h-12 rounded-sm border border-slate-300 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e] focus:border-transparent"
                      data-testid="input-telefono"
                    />
                  </div>
                  {errors.telefono && <p className="text-red-600 text-xs mt-1">{errors.telefono}</p>}
                </div>

                {/* Reparto di Servizio */}
                <div>
                  <label className="text-sm font-bold text-[#1a4a2e] mb-2 block uppercase tracking-wide">
                    Reparto di Servizio *
                  </label>
                  <div className="relative">
                    <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="reparto"
                      value={formData.reparto}
                      onChange={handleInputChange}
                      placeholder="Nucleo PEF Milano"
                      className="w-full h-12 rounded-sm border border-slate-300 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e] focus:border-transparent"
                      data-testid="input-reparto"
                    />
                  </div>
                  {errors.reparto && <p className="text-red-600 text-xs mt-1">{errors.reparto}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-bold text-[#1a4a2e] mb-2 block uppercase tracking-wide">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="mario.rossi@email.com"
                      className="w-full h-12 rounded-sm border border-slate-300 bg-white pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e] focus:border-transparent"
                      data-testid="input-email"
                    />
                  </div>
                  {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Regione */}
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-[#1a4a2e] mb-2 block uppercase tracking-wide">
                    Regione *
                  </label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                    <select
                      name="regione"
                      value={formData.regione}
                      onChange={handleInputChange}
                      className="w-full h-12 rounded-sm border border-slate-300 bg-white pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a2e] focus:border-transparent appearance-none cursor-pointer"
                      data-testid="select-regione"
                    >
                      <option value="">Seleziona la tua regione</option>
                      {REGIONI_ITALIANE.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <ChevronRight size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
                  </div>
                  {errors.regione && <p className="text-red-600 text-xs mt-1">{errors.regione}</p>}
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-white border border-slate-200 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,0.1)] overflow-hidden animate-fadeIn stagger-2">
              <div className="bg-[#1a4a2e] px-6 py-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <FileText size={20} />
                  Documenti Richiesti
                </h3>
                <p className="text-green-200 text-sm mt-1">
                  Tutti i documenti devono essere in formato PDF (max 15MB)
                </p>
              </div>
              <div className="p-6 space-y-4">
                {DOCUMENTI_RICHIESTI.map((doc, idx) => (
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
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handleFileUpload(doc.id, e)}
                            className="hidden"
                            data-testid={`upload-${doc.id}`}
                          />
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-semibold transition-colors bg-[#1a4a2e] text-white hover:bg-[#0f2d1c]">
                            <Upload size={16} />
                            Carica PDF
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                className="bg-[#FFD700] text-[#1a4a2e] hover:bg-[#e6c200] font-bold uppercase tracking-wide px-12 py-4 rounded-sm shadow-[4px_4px_0px_0px_rgba(26,74,46,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 text-lg"
                data-testid="submit-btn"
              >
                <Shield size={24} />
                Invia Richiesta
              </button>
            </div>
          </form>
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
    </div>
  );
}

export default App;
