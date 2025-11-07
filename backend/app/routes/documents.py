from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Document
from app.schemas.schemas import DocumentResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.get("", response_model=list[DocumentResponse])
async def get_documents(db: Session = Depends(get_db)):
    """Get all active documents"""
    
    documents = db.query(Document).filter(Document.is_active == True).all()
    
    return documents

@router.get("/{slug}", response_model=DocumentResponse)
async def get_document(slug: str, db: Session = Depends(get_db)):
    """Get document by slug"""
    
    document = db.query(Document).filter(
        (Document.slug == slug) & (Document.is_active == True)
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return document

@router.get("/terms-of-service", response_model=DocumentResponse)
async def get_terms(db: Session = Depends(get_db)):
    """Get Terms of Service"""
    return await get_document("terms-of-service", db)

@router.get("/privacy-policy", response_model=DocumentResponse)
async def get_privacy(db: Session = Depends(get_db)):
    """Get Privacy Policy"""
    return await get_document("privacy-policy", db)

@router.get("/content-guidelines", response_model=DocumentResponse)
async def get_guidelines(db: Session = Depends(get_db)):
    """Get Content Guidelines"""
    return await get_document("content-guidelines", db)
