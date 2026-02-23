from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class FieldType(str, Enum):
    TEXT = "text"
    EMAIL = "email"
    TEL = "tel"
    NUMBER = "number"
    DATE = "date"
    SELECT = "select"
    TEXTAREA = "textarea"


class FileType(str, Enum):
    PDF = "pdf"
    IMAGE = "image"
    BOTH = "both"


class CampoData(BaseModel):
    id: str
    label: str
    type: FieldType
    required: bool = True
    placeholder: Optional[str] = None
    options: Optional[List[str]] = None  # Per select


class DocumentoRichiesto(BaseModel):
    id: str
    label: str
    required: bool = True
    fileType: FileType = FileType.PDF
    esempio_file_url: Optional[str] = None  # URL del file di esempio


class Ricorso(BaseModel):
    id: str = Field(default_factory=lambda: str(datetime.now().timestamp()).replace('.', ''))
    titolo: str
    descrizione: str
    badge_text: str = "RICORSO COLLETTIVO"
    campi_dati: List[CampoData]
    documenti_richiesti: List[DocumentoRichiesto]
    attivo: bool = True
    scadenze_regioni: Optional[Dict[str, str]] = None  # {"Lazio": "2026-12-31", "Lombardia": "2026-11-30"}
    scadenza_generale: Optional[str] = None  # Scadenza di default se non specificata per regione
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RicorsoCreate(BaseModel):
    titolo: str
    descrizione: str
    badge_text: str = "RICORSO COLLETTIVO"
    campi_dati: List[CampoData]
    documenti_richiesti: List[DocumentoRichiesto]
    attivo: bool = True
    scadenze_regioni: Optional[Dict[str, str]] = None
    scadenza_generale: Optional[str] = None


class RicorsoUpdate(BaseModel):
    titolo: Optional[str] = None
    descrizione: Optional[str] = None
    badge_text: Optional[str] = None
    campi_dati: Optional[List[CampoData]] = None
    documenti_richiesti: Optional[List[DocumentoRichiesto]] = None
    attivo: Optional[bool] = None
    scadenze_regioni: Optional[Dict[str, str]] = None
    scadenza_generale: Optional[str] = None


class Admin(BaseModel):
    username: str
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AdminLogin(BaseModel):
    username: str
    password: str


class AdminCreate(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class Submission(BaseModel):
    id: str = Field(default_factory=lambda: str(datetime.now().timestamp()).replace('.', ''))
    ricorso_id: str
    ricorso_titolo: str
    dati_utente: Dict[str, Any]
    files_info: Dict[str, str]  # documento_id -> filename
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    reference_id: str = Field(default_factory=lambda: f"REF-{int(datetime.now().timestamp())}")
