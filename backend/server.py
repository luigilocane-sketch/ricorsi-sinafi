from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta
import shutil
import json

from models import (
    Ricorso, RicorsoCreate, RicorsoUpdate, Admin, AdminLogin, AdminCreate,
    Token, Submission, CampoData, DocumentoRichiesto, AdminCreateManual,
    AdminInvite, InviteToken, AdminRegisterWithToken
)
from auth import (
    verify_password, get_password_hash, create_access_token, verify_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

# Examples directory
EXAMPLES_DIR = ROOT_DIR / 'examples'
EXAMPLES_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============= ADMIN ROUTES =============

@api_router.post("/admin/register", response_model=dict)
async def register_admin(admin: AdminCreate):
    """Register a new admin (first time only)"""
    existing = await db.admins.find_one({"username": admin.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    admin_dict = {
        "username": admin.username,
        "password_hash": get_password_hash(admin.password)
    }
    await db.admins.insert_one(admin_dict)
    return {"message": "Admin created successfully"}


@api_router.post("/admin/login", response_model=Token)
async def login_admin(credentials: AdminLogin):
    """Admin login"""
    admin = await db.admins.find_one({"username": credentials.username}, {"_id": 0})
    if not admin or not verify_password(credentials.password, admin["password_hash"]):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )
    
    access_token = create_access_token(
        data={"sub": credentials.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}


@api_router.get("/admin/check")
async def check_admin(username: str = Depends(verify_token)):
    """Check if admin is authenticated"""
    return {"username": username, "authenticated": True}


# ============= RICORSI ROUTES =============

@api_router.post("/ricorsi", response_model=Ricorso)
async def create_ricorso(ricorso: RicorsoCreate, username: str = Depends(verify_token)):
    """Create a new ricorso (admin only)"""
    if len(ricorso.documenti_richiesti) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 documents allowed")
    
    ricorso_obj = Ricorso(**ricorso.dict())
    await db.ricorsi.insert_one(ricorso_obj.dict())
    return ricorso_obj


@api_router.get("/ricorsi", response_model=List[Ricorso])
async def get_ricorsi(attivo: Optional[bool] = None):
    """Get all ricorsi (public or filtered by active status)"""
    query = {}
    if attivo is not None:
        query["attivo"] = attivo
    
    ricorsi = await db.ricorsi.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [Ricorso(**r) for r in ricorsi]


@api_router.get("/ricorsi/{ricorso_id}", response_model=Ricorso)
async def get_ricorso(ricorso_id: str):
    """Get a specific ricorso by ID"""
    ricorso = await db.ricorsi.find_one({"id": ricorso_id}, {"_id": 0})
    if not ricorso:
        raise HTTPException(status_code=404, detail="Ricorso not found")
    return Ricorso(**ricorso)


@api_router.put("/ricorsi/{ricorso_id}", response_model=Ricorso)
async def update_ricorso(
    ricorso_id: str,
    ricorso_update: RicorsoUpdate,
    username: str = Depends(verify_token)
):
    """Update a ricorso (admin only)"""
    existing = await db.ricorsi.find_one({"id": ricorso_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Ricorso not found")
    
    update_data = {k: v for k, v in ricorso_update.dict(exclude_unset=True).items()}
    if update_data:
        from datetime import datetime
        update_data["updated_at"] = datetime.utcnow()
        await db.ricorsi.update_one({"id": ricorso_id}, {"$set": update_data})
    
    updated = await db.ricorsi.find_one({"id": ricorso_id}, {"_id": 0})
    return Ricorso(**updated)


@api_router.delete("/ricorsi/{ricorso_id}")
async def delete_ricorso(ricorso_id: str, username: str = Depends(verify_token)):
    """Delete a ricorso (admin only)"""
    result = await db.ricorsi.delete_one({"id": ricorso_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ricorso not found")
    return {"message": "Ricorso deleted successfully"}


# ============= SUBMISSION ROUTES =============

@api_router.post("/submissions")
async def create_submission(
    ricorso_id: str = Form(...),
    dati_utente: str = Form(...),  # JSON string
):
    """Create a new submission"""
    # Get ricorso
    ricorso = await db.ricorsi.find_one({"id": ricorso_id}, {"_id": 0})
    if not ricorso:
        raise HTTPException(status_code=404, detail="Ricorso not found")
    
    # Parse user data
    try:
        dati_dict = json.loads(dati_utente)
    except:
        raise HTTPException(status_code=400, detail="Invalid dati_utente format")
    
    # Create submission
    submission = Submission(
        ricorso_id=ricorso_id,
        ricorso_titolo=ricorso["titolo"],
        dati_utente=dati_dict,
        files_info={}  # Will be populated by file upload endpoint
    )
    
    await db.submissions.insert_one(submission.dict())
    return submission


@api_router.post("/upload/{submission_id}/{document_id}")
async def upload_file(
    submission_id: str,
    document_id: str,
    file: UploadFile = File(...)
):
    """Upload a file for a submission"""
    # Validate file type
    file_ext = file.filename.split('.')[-1].lower()
    allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png']
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {allowed_extensions}")
    
    # Create directory for submission
    submission_dir = UPLOADS_DIR / submission_id
    submission_dir.mkdir(exist_ok=True)
    
    # Save file
    file_path = submission_dir / f"{document_id}.{file_ext}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update submission with file info
    await db.submissions.update_one(
        {"id": submission_id},
        {"$set": {f"files_info.{document_id}": file.filename}}
    )
    
    return {"message": "File uploaded successfully", "filename": file.filename}


@api_router.post("/upload-esempio/{ricorso_id}/{document_id}")
async def upload_esempio_file(
    ricorso_id: str,
    document_id: str,
    file: UploadFile = File(...),
    username: str = Depends(verify_token)
):
    """Upload an example file for a document (admin only)"""
    # Validate file type
    file_ext = file.filename.split('.')[-1].lower()
    allowed_extensions = ['pdf', 'jpg', 'jpeg', 'png']
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {allowed_extensions}")
    
    # Check if ricorso exists
    ricorso = await db.ricorsi.find_one({"id": ricorso_id})
    if not ricorso:
        raise HTTPException(status_code=404, detail="Ricorso not found")
    
    # Create directory for examples
    esempio_dir = EXAMPLES_DIR / ricorso_id
    esempio_dir.mkdir(exist_ok=True)
    
    # Save file
    filename = f"{document_id}_esempio.{file_ext}"
    file_path = esempio_dir / filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update ricorso with esempio file URL
    esempio_url = f"/api/esempio/{ricorso_id}/{document_id}"
    
    # Find the document in the ricorso and update it
    ricorso_obj = Ricorso(**ricorso)
    for doc in ricorso_obj.documenti_richiesti:
        if doc.id == document_id:
            doc.esempio_file_url = esempio_url
            break
    
    await db.ricorsi.update_one(
        {"id": ricorso_id},
        {"$set": {"documenti_richiesti": [doc.dict() for doc in ricorso_obj.documenti_richiesti]}}
    )
    
    return {"message": "Example file uploaded successfully", "url": esempio_url}


@api_router.get("/esempio/{ricorso_id}/{document_id}")
async def get_esempio_file(ricorso_id: str, document_id: str):
    """Get an example file"""
    esempio_dir = EXAMPLES_DIR / ricorso_id
    
    # Try to find the file with any extension
    for ext in ['pdf', 'jpg', 'jpeg', 'png']:
        file_path = esempio_dir / f"{document_id}_esempio.{ext}"
        if file_path.exists():
            return FileResponse(file_path)
    
    raise HTTPException(status_code=404, detail="Example file not found")


@api_router.delete("/esempio/{ricorso_id}/{document_id}")
async def delete_esempio_file(
    ricorso_id: str,
    document_id: str,
    username: str = Depends(verify_token)
):
    """Delete an example file (admin only)"""
    esempio_dir = EXAMPLES_DIR / ricorso_id
    
    # Try to find and delete the file with any extension
    deleted = False
    for ext in ['pdf', 'jpg', 'jpeg', 'png']:
        file_path = esempio_dir / f"{document_id}_esempio.{ext}"
        if file_path.exists():
            file_path.unlink()
            deleted = True
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Example file not found")
    
    # Update ricorso to remove esempio_file_url
    ricorso = await db.ricorsi.find_one({"id": ricorso_id})
    if ricorso:
        ricorso_obj = Ricorso(**ricorso)
        for doc in ricorso_obj.documenti_richiesti:
            if doc.id == document_id:
                doc.esempio_file_url = None
                break
        
        await db.ricorsi.update_one(
            {"id": ricorso_id},
            {"$set": {"documenti_richiesti": [doc.dict() for doc in ricorso_obj.documenti_richiesti]}}
        )
    
    return {"message": "Example file deleted successfully"}


@api_router.get("/submissions")
async def get_submissions(ricorso_id: Optional[str] = None, username: str = Depends(verify_token)):
    """Get all submissions (admin only)"""
    query = {}
    if ricorso_id:
        query["ricorso_id"] = ricorso_id
    
    submissions = await db.submissions.find(query, {"_id": 0}).sort("submitted_at", -1).to_list(1000)
    return submissions


@api_router.get("/submissions/stats/{ricorso_id}")
async def get_submissions_stats(ricorso_id: str, username: str = Depends(verify_token)):
    """Get statistics by region for a ricorso (admin only)"""
    # Get ricorso
    ricorso = await db.ricorsi.find_one(
        {"id": ricorso_id},
        {"_id": 0, "id": 1, "titolo": 1, "campi_dati": 1, "scadenze_regioni": 1, "scadenza_generale": 1}
    )
    if not ricorso:
        raise HTTPException(status_code=404, detail="Ricorso not found")
    
    # Get all submissions for this ricorso
    submissions = await db.submissions.find(
        {"ricorso_id": ricorso_id},
        {"_id": 0, "id": 1, "reference_id": 1, "submitted_at": 1, "dati_utente": 1}
    ).to_list(10000)
    
    # Find the regione field
    regione_field_id = None
    for campo in ricorso.get("campi_dati", []):
        if campo.get("label", "").lower() == "regione" or campo.get("id") == "regione":
            regione_field_id = campo.get("id")
            break
    
    if not regione_field_id:
        return {
            "ricorso_id": ricorso_id,
            "ricorso_titolo": ricorso.get("titolo"),
            "totale_submissions": len(submissions),
            "per_regione": {},
            "scadenze_regioni": ricorso.get("scadenze_regioni", {}),
            "message": "Nessun campo regione trovato"
        }
    
    # Group by region
    stats_per_regione = {}
    for sub in submissions:
        regione = sub.get("dati_utente", {}).get(regione_field_id, "Non specificata")
        if regione not in stats_per_regione:
            stats_per_regione[regione] = {
                "count": 0,
                "submissions": []
            }
        stats_per_regione[regione]["count"] += 1
        stats_per_regione[regione]["submissions"].append({
            "id": sub.get("id"),
            "reference_id": sub.get("reference_id"),
            "submitted_at": sub.get("submitted_at")
        })
    
    # Calculate scadenze imminenti (entro 30 giorni)
    scadenze_imminenti = []
    scadenze_regioni = ricorso.get("scadenze_regioni", {})
    
    for regione, scadenza_str in scadenze_regioni.items():
        try:
            scadenza = datetime.fromisoformat(scadenza_str.replace('Z', '+00:00'))
            giorni_rimanenti = (scadenza - datetime.utcnow()).days
            
            if 0 <= giorni_rimanenti <= 30:
                scadenze_imminenti.append({
                    "regione": regione,
                    "scadenza": scadenza_str,
                    "giorni_rimanenti": giorni_rimanenti,
                    "submissions_ricevute": stats_per_regione.get(regione, {}).get("count", 0)
                })
        except:
            pass
    
    return {
        "ricorso_id": ricorso_id,
        "ricorso_titolo": ricorso.get("titolo"),
        "totale_submissions": len(submissions),
        "per_regione": stats_per_regione,
        "scadenze_regioni": scadenze_regioni,
        "scadenza_generale": ricorso.get("scadenza_generale"),
        "scadenze_imminenti": scadenze_imminenti
    }



# ============= UTILITY ROUTES =============

@api_router.get("/")
async def root():
    return {"message": "Ricorsi API v1.0"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize default data if needed"""
    # Check if any admin exists
    admin_count = await db.admins.count_documents({})
    if admin_count == 0:
        # Create default admin
        default_admin = {
            "username": "admin",
            "password_hash": get_password_hash("admin123")
        }
        await db.admins.insert_one(default_admin)
        logger.info("Default admin created: username=admin, password=admin123")
    
    # Check if default ricorso exists
    ricorso_count = await db.ricorsi.count_documents({})
    if ricorso_count == 0:
        # Create default ricorso
        default_ricorso = Ricorso(
            titolo="Ricorso Indennità Compensativa",
            descrizione="Ricorso collettivo per l'indennità compensativa riservato ai soci Si.Na.Fi.",
            badge_text="RICORSO COLLETTIVO",
            campi_dati=[
                CampoData(id="nome", label="Nome", type="text", required=True, placeholder="Mario"),
                CampoData(id="cognome", label="Cognome", type="text", required=True, placeholder="Rossi"),
                CampoData(id="matricola", label="Matricola", type="text", required=True, placeholder="123456"),
                CampoData(id="telefono", label="Telefono", type="tel", required=True, placeholder="+39 333 1234567"),
                CampoData(id="reparto", label="Reparto di Servizio", type="text", required=True, placeholder="Nucleo PEF Milano"),
                CampoData(id="email", label="Email", type="email", required=True, placeholder="mario.rossi@email.com"),
                CampoData(
                    id="regione",
                    label="Regione",
                    type="select",
                    required=True,
                    options=[
                        'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
                        'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
                        'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
                        'Trentino-Alto Adige', 'Umbria', "Valle d'Aosta", 'Veneto'
                    ]
                )
            ],
            documenti_richiesti=[
                DocumentoRichiesto(id="istanza", label="Istanza", required=True, fileType="pdf"),
                DocumentoRichiesto(id="carta_identita", label="Carta d'Identità", required=True, fileType="both"),
                DocumentoRichiesto(id="codice_fiscale", label="Codice Fiscale", required=True, fileType="both"),
                DocumentoRichiesto(id="preavviso_diniego", label="Preavviso di Diniego", required=True, fileType="pdf"),
                DocumentoRichiesto(id="diniego", label="Diniego", required=True, fileType="pdf"),
                DocumentoRichiesto(id="procura_liti", label="Procura alle Liti", required=True, fileType="pdf")
            ],
            attivo=True
        )
        await db.ricorsi.insert_one(default_ricorso.dict())
        logger.info("Default ricorso created")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
