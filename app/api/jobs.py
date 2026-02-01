from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db, JobTable, AssetTable

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("/{job_id}", response_model=dict)
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.get(JobTable, job_id)
    if not job:
        raise HTTPException(404, "job not found")
    asset = db.get(AssetTable, job.asset_id) if job.asset_id else None
    return {
        "job": {
            "job_id": job.id,
            "session_id": job.session_id,
            "status": job.status,
            "stage": job.stage,
            "message": job.message,
            "error_message": job.error_message,
            "asset_id": job.asset_id,
            "provider_trace_id": job.provider_trace_id,
        },
        "asset": ({
            "asset_id": asset.id,
            "url": asset.url,
            "mime_type": asset.mime_type,
            "size_bytes": asset.size_bytes,
        } if asset else None)
    }