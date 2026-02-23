# Sistema Gestione Ricorsi Si.Na.Fi.

Applicazione full-stack per la gestione di ricorsi legali collettivi per Si.Na.Fi. (Sindacato Nazionale Finanzieri).

## Funzionalità

- **Sistema Admin**: Autenticazione JWT con dashboard per gestione ricorsi
- **Gestione Ricorsi**: CRUD completo con campi dati e documenti dinamici
- **Form Pubblico**: Rendering dinamico basato su configurazione ricorso
- **Statistiche**: Visualizzazione submissions per regione con deadline
- **Sistema Inviti**: Generazione link per nuovi amministratori

## Stack Tecnologico

- **Frontend**: React, React Router, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI (Python), Pydantic
- **Database**: MongoDB

## Struttura Progetto

```
/app
├── backend/
│   ├── server.py          # API endpoints
│   ├── models.py          # Pydantic models
│   ├── auth.py            # JWT authentication
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/         # React pages
│   │   ├── services/      # API calls
│   │   ├── context/       # Auth context
│   │   └── components/ui/ # Shadcn components
│   └── package.json
```

## Installazione

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001
```

### Frontend
```bash
cd frontend
yarn install
yarn start
```

## Configurazione

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=ricorsi_db
SECRET_KEY=your-secret-key
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Credenziali Default

- **URL Admin**: `/admin/login`
- **Username**: `admin`
- **Password**: `admin123`

## API Endpoints

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | /api/admin/login | Login admin |
| GET | /api/ricorsi | Lista ricorsi |
| POST | /api/ricorsi | Crea ricorso |
| GET | /api/ricorsi/{id} | Dettaglio ricorso |
| PUT | /api/ricorsi/{id} | Modifica ricorso |
| DELETE | /api/ricorsi/{id} | Elimina ricorso |
| POST | /api/submissions | Nuova submission |
| GET | /api/submissions/stats/{id} | Statistiche regionali |

## Note

- Il sistema inviti admin genera un link da copiare manualmente (non invia email)
- All'avvio vengono creati automaticamente admin e ricorso di default
