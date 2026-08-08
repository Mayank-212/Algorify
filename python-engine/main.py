import io
import json
import logging
import os
import re
import html
from pathlib import Path
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse, parse_qs

import requests
import pypdf
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi

# Configure production-style logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("algorify_engine")

# Load environment configuration
ENV_PATH = Path(__file__).parent.parent / "frontend" / ".env.local"
load_dotenv(ENV_PATH)

app = FastAPI(
    title="Algorify Engine API",
    description="Core backend services for the Algorify platform, including RAG and Video Processing.",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration & State ---
class Config:
    MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
    MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"
    BOOKS_DB_PATH = Path("library_cache.json")
    MAX_CONTEXT_LENGTH = 100000

class DocumentRepository:
    """Manages persistence and retrieval of uploaded educational documents."""
    
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._cache: Dict[str, str] = self._load_from_disk()

    def _load_from_disk(self) -> Dict[str, str]:
        if not self.db_path.exists():
            return {}
        try:
            with open(self.db_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError:
            logger.warning("Corrupted library cache found. Initializing empty repository.")
            return {}

    def save_to_disk(self) -> None:
        with open(self.db_path, "w", encoding="utf-8") as f:
            json.dump(self._cache, f, ensure_ascii=False, indent=2)

    def add_document(self, doc_id: str, content: str) -> None:
        self._cache[doc_id] = content
        self.save_to_disk()

    def get_document(self, doc_id: str) -> Optional[str]:
        return self._cache.get(doc_id)

    def list_documents(self) -> List[str]:
        return list(self._cache.keys())

# Initialize our state repositories
document_repo = DocumentRepository(Config.BOOKS_DB_PATH)
session_history: List[Dict[str, Any]] = []


# --- Models ---
class QueryRequest(BaseModel):
    document_id: str = Field(..., description="ID of the uploaded document to query against.")
    query: str = Field(..., description="The user's specific question.")

class MemoryRequest(BaseModel):
    user_query: str
    ai_response: str
    topic: str

class YouTubeRequest(BaseModel):
    url: str = Field(..., description="A standard YouTube video URL.")


# --- Internal Services ---
def _query_llm(system_prompt: str, user_prompt: str) -> str:
    """Centralized LLM client to prevent duplicate requests logic."""
    if not Config.MISTRAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="LLM provider configuration is missing."
        )

    headers = {
        "Authorization": f"Bearer {Config.MISTRAL_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "mistral-large-latest",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.7
    }

    try:
        response = requests.post(Config.MISTRAL_API_URL, headers=headers, json=payload, timeout=120)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except requests.exceptions.Timeout:
        logger.error("LLM API request timed out.")
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="The AI provider took too long to respond. Please try a shorter video.")
    except Exception as e:
        logger.error(f"LLM API request failed: {str(e)}")
        error_detail = f"Failed to communicate with LLM provider. Details: {str(e)}"
        if hasattr(e, 'response') and e.response is not None:
            error_detail += f" Status: {e.response.status_code}. Response: {e.response.text}"
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=error_detail)


def _extract_video_id(url: str) -> Optional[str]:
    """Parses a YouTube URL and returns the video ID if valid."""
    parsed = urlparse(url)
    if "youtube.com" in parsed.netloc:
        return parse_qs(parsed.query).get("v", [None])[0]
    elif "youtu.be" in parsed.netloc:
        return parsed.path.lstrip('/')
    return None


def _get_youtube_context(video_id: str) -> str:
    """Attempts to extract transcripts via primary API, falling back to manual scraping and oEmbed."""
    
    # Strategy 1: Official Transcript API
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        transcript = transcript_list.find_transcript(['en', 'en-US', 'en-GB'])
        full_text = " ".join([entry['text'] for entry in transcript.fetch()])
        return f"Transcript:\n\n{full_text[:Config.MAX_CONTEXT_LENGTH]}"
    except Exception as e:
        logger.info(f"Primary transcript extraction failed for {video_id}: {str(e)}")

    # Strategy 2: Manual Caption Extraction (HTML parsing)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
    }
    try:
        page_response = requests.get(f"https://www.youtube.com/watch?v={video_id}", headers=headers, timeout=10)
        page_text = page_response.text
        
        if "Our systems have detected unusual traffic" in page_text:
            raise ValueError("Rate limited by YouTube.")

        match = re.search(r'"captionTracks":\s*(\[.*?\])', page_text)
        if match:
            tracks = json.loads(match.group(1))
            if tracks:
                caption_url = tracks[0]['baseUrl']
                if 'tlang=' not in caption_url:
                    caption_url += '&tlang=en'
                    
                xml_data = requests.get(caption_url, headers=headers, timeout=10).text
                if "<html" not in xml_data.lower():
                    raw_text = re.sub(r'<[^>]+>', ' ', xml_data)
                    clean_text = html.unescape(raw_text).strip()
                    return f"Transcript:\n\n{clean_text[:Config.MAX_CONTEXT_LENGTH]}"
    except Exception as e:
        logger.info(f"Secondary transcript extraction failed for {video_id}: {str(e)}")

    # Strategy 3: Graceful degradation to Video Metadata
    try:
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        oembed = requests.get(oembed_url, timeout=5).json()
        
        title = oembed.get('title', 'Unknown Video')
        author = oembed.get('author_name', 'Unknown Author')
        
        return (
            f"Video Title: {title}\n"
            f"Channel: {author}\n\n"
            "(Note: Detailed subtitles could not be extracted due to network blocks. "
            "Use this metadata and your general knowledge to create detailed, structured notes about this topic.)"
        )
    except Exception as e:
        logger.error(f"All extraction strategies failed for {video_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Could not extract video data. Please ensure the video is public and valid."
        )


# --- Endpoints ---
@app.post("/api/books/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(file: UploadFile = File(...)):
    """Extracts text from an uploaded PDF and indexes it into the library cache."""
    try:
        contents = await file.read()
        pdf_reader = pypdf.PdfReader(io.BytesIO(contents))
        
        extracted_text = []
        for page in pdf_reader.pages:
            extracted_text.append(page.extract_text() or "")
            
        full_text = "\n".join(extracted_text)
        document_repo.add_document(file.filename, full_text)
        
        logger.info(f"Successfully processed and indexed document: {file.filename}")
        return {"document_id": file.filename, "message": "Document uploaded successfully into Learning Space."}
    except Exception as e:
        logger.error(f"Document processing error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to parse the provided PDF file.")

@app.get("/api/books")
async def list_documents():
    """Returns a list of all indexed documents."""
    return {"books": document_repo.list_documents()}

@app.post("/api/books/query")
async def query_document(req: QueryRequest):
    """Answers a user's question by grounding the LLM entirely in the requested document context."""
    text_context = document_repo.get_document(req.document_id)
    if not text_context:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found in Learning Space.")
    
    # Cap context to prevent token overflows
    safe_context = text_context[:Config.MAX_CONTEXT_LENGTH]
    
    system_prompt = (
        "You are the 'Algorify Co-Writer'. "
        "Your task is to accurately answer the user's question using ONLY the provided book context below. "
        "CRITICAL: Write in a highly humanized, conversational tone. Format your response exactly like beautifully handwritten notebook notes using markdown. "
        "Use expressive formatting (bolding key terms, using natural bullet points, breaking concepts into digestible sections) that looks natural, not rigidly AI-generated. "
        "If the answer is not in the text, inform the user you cannot find it in the provided document."
    )
    user_prompt = f"Book Content:\n{safe_context}\n\nStudent Question:\n{req.query}"
    
    answer = _query_llm(system_prompt, user_prompt)
    return {"answer": answer}

@app.post("/api/memory/store")
async def index_session_memory(req: MemoryRequest):
    """Records interactions to form the user's long-term learning graph."""
    session_history.append(req.dict())
    return {"status": "Memory indexed successfully"}

@app.get("/api/memory/logs")
async def get_session_history():
    """Retrieves all tracked memory logs."""
    return {"logs": session_history}

@app.post("/api/youtube/notes")
async def generate_video_notes(req: YouTubeRequest):
    """Processes a YouTube video and uses an LLM to generate structured study notes."""
    video_id = _extract_video_id(req.url)
    if not video_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid YouTube URL provided. Ensure it is a standard watch URL."
        )
        
    context = _get_youtube_context(video_id)
    
    system_prompt = (
        "You are Algorify's elite note-taker. Create beautifully styled, highly structured, "
        "and comprehensive markdown notes in English based ONLY on the provided video context. "
        "CRITICAL: Your output MUST look like human-written notebook notes. Do NOT use generic AI structures. "
        "Use expressive markdown, creative formatting (like emojis, bold highlights for emphasis), "
        "and write with a natural, humanized, and conversational flow. Make it feel personal and engaging, like a student's premium notebook. "
        "Include a concise 'Summary' section at the top."
    )
    
    notes = _query_llm(system_prompt, f"Context:\n{context}")
    return {"notes": notes}

if __name__ == "__main__":
    import uvicorn
    # Use standard entry point for local development
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
