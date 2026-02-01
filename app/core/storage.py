import os
import requests
from pathlib import Path
from app.settings import settings

def ensure_output_dir() -> Path:
    p = Path(settings.output_dir)
    p.mkdir(parents=True, exist_ok=True)
    return p

def save_from_url(audio_url: str, filename: str) -> tuple[str, int]:
    out_dir = ensure_output_dir()
    path = out_dir / filename

    with requests.get(audio_url, stream=True, timeout=120) as r:
        r.raise_for_status()
        size = 0
        with open(path, "wb") as f:
            for chunk in r.iter_content(chunk_size=1024 * 256):
                if chunk:
                    f.write(chunk)
                    size += len(chunk)
    return str(path), size

def public_url_for_file(path: str) -> str:
    # 通过 FastAPI 静态文件挂载 /files
    rel = os.path.relpath(path, settings.output_dir)
    return f"{settings.public_base_url}/files/{rel}"