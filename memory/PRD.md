# PRD - Sistema Gestione Ricorsi Si.Na.Fi.

## Problema Originale
Creare un'applicazione full-stack per la gestione di ricorsi legali collettivi per Si.Na.Fi. (Sindacato Nazionale Finanzieri).

## Requisiti di Prodotto

### Funzionalità Core (COMPLETATE)
1. **Sistema Admin**
   - Autenticazione JWT con login/logout
   - Credenziali default: admin/admin123
   - Dashboard per gestione ricorsi

2. **Gestione Ricorsi**
   - CRUD completo (Create, Read, Update, Delete)
   - Campi dati dinamici configurabili
   - Documenti richiesti con tipo file (PDF, JPG, PNG)
   - File esempio per ogni documento
   - Deadline per regione

3. **Form Pubblico**
   - Rendering dinamico basato su configurazione ricorso
   - Upload documenti
   - Statistiche submissions per regione

4. **Sistema Inviti Admin (MOCKED)**
   - Genera link di registrazione
   - NON invia email - link da copiare manualmente

### UI/Branding
- Logo Si.Na.Fi.
- Testo "riservato ai soci Si.Na.Fi."
- Rimosso badge "Made with Emergent"

## Stack Tecnologico
- **Frontend**: React, React Router, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI (Python), Pydantic
- **Database**: MongoDB con motor (async)
- **Auth**: JWT in localStorage

## Architettura
```
/app
├── backend/
│   ├── server.py          # API endpoints
│   ├── models.py          # Pydantic models
│   ├── auth.py            # JWT auth logic
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/         # React pages
│   │   ├── services/api.js# API calls
│   │   ├── context/       # Auth context
│   │   └── components/ui/ # Shadcn components
│   └── package.json
```

## Endpoint API Principali
- `POST /api/admin/login` - Login admin
- `GET/POST /api/ricorsi` - Lista/crea ricorsi
- `GET/PUT/DELETE /api/ricorsi/{id}` - Singolo ricorso
- `POST /api/submissions` - Nuova submission
- `GET /api/submissions/stats/{id}` - Statistiche regionali
- `POST /api/admin/invite` - Crea invito (mocked)

## Stato Implementazione

### Completato (23 Feb 2026)
- [x] Sistema admin con JWT
- [x] Dashboard admin CRUD ricorsi
- [x] Eliminazione ricorsi (bug P0 risolto)
- [x] Form pubblico dinamico
- [x] Statistiche per regione
- [x] Sistema inviti admin (mocked)
- [x] UI Si.Na.Fi. branding
- [x] Bug fix: MongoDB ObjectId serialization
- [x] Bug fix: FileText import mancante

### Backlog (P2-P3)
- [ ] **P2**: Implementare invio email reale per inviti admin
- [ ] **P3**: Funzionalità cambio password admin
- [ ] **P3**: Data-testid su tutti gli elementi interattivi

## Credenziali Test
- **Admin URL**: `/admin/login`
- **Username**: `admin`
- **Password**: `admin123`

## Note Tecniche
- All'avvio del server viene creato admin default e ricorso di esempio
- I token JWT scadono dopo un certo periodo (configurabile)
- I file upload sono salvati in `/app/backend/uploads/`
