from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.openai import OpenAISpeechToText
import tempfile
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize OpenAI Speech-to-Text
stt = OpenAISpeechToText(api_key=os.getenv("EMERGENT_LLM_KEY"))

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class Transcription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    language: str = "en"
    duration: Optional[float] = None
    filename: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TranscriptionCreate(BaseModel):
    language: str = "en"

class TranscriptionResponse(BaseModel):
    id: str
    text: str
    language: str
    duration: Optional[float]
    filename: str
    timestamp: str

# Routes
@api_router.get("/")
async def root():
    return {"message": "Audio Transcription API"}

@api_router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(file: UploadFile = File(...), language: str = "en"):
    """Transcribe an audio file using OpenAI Whisper"""
    try:
        # Validate file type
        allowed_extensions = ['.mp3', '.wav', '.m4a', '.webm', '.mp4', '.mpeg', '.mpga']
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file format. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Check file size (25MB limit)
        content = await file.read()
        if len(content) > 25 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 25MB limit")
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        try:
            # Transcribe using OpenAI Whisper
            with open(tmp_path, "rb") as audio_file:
                response = await stt.transcribe(
                    file=audio_file,
                    model="whisper-1",
                    response_format="verbose_json",
                    language=language if language != "auto" else None,
                    temperature=0.0
                )
            
            # Extract duration if available
            duration = getattr(response, 'duration', None)
            
            # Create transcription record
            transcription = Transcription(
                text=response.text,
                language=language,
                duration=duration,
                filename=file.filename
            )
            
            # Save to MongoDB
            doc = transcription.model_dump()
            doc['timestamp'] = doc['timestamp'].isoformat()
            await db.transcriptions.insert_one(doc)
            
            # Return response
            return TranscriptionResponse(
                id=transcription.id,
                text=transcription.text,
                language=transcription.language,
                duration=transcription.duration,
                filename=transcription.filename,
                timestamp=doc['timestamp']
            )
        
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@api_router.get("/transcriptions", response_model=List[TranscriptionResponse])
async def get_transcriptions():
    """Get all transcriptions"""
    transcriptions = await db.transcriptions.find({}, {"_id": 0}).sort("timestamp", -1).to_list(100)
    
    return [
        TranscriptionResponse(
            id=t['id'],
            text=t['text'],
            language=t['language'],
            duration=t.get('duration'),
            filename=t['filename'],
            timestamp=t['timestamp']
        )
        for t in transcriptions
    ]

@api_router.delete("/transcriptions/{transcription_id}")
async def delete_transcription(transcription_id: str):
    """Delete a transcription"""
    result = await db.transcriptions.delete_one({"id": transcription_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transcription not found")
    return {"message": "Transcription deleted successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()