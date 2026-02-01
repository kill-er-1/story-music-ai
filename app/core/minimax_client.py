import os
import requests
from app.settings import settings

MINIMAX_URL = "https://api.minimaxi.com/v1/music_generation"

def minimax_generate_music(payload: dict) -> dict:
    api_key = settings.minimax_api_key or os.getenv("MINIMAX_API_KEY")
    if not api_key:
        raise RuntimeError("MINIMAX_API_KEY not set")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    r = requests.post(MINIMAX_URL, headers=headers, json=payload, timeout=300)
    r.raise_for_status()
    data = r.json()

    base = (data or {}).get("base_resp") or {}
    if base.get("status_code") not in (0, None):
        # 有些接口也可能没有 base_resp，你可按实际返回调整
        raise RuntimeError(f"MiniMax error: {base.get('status_msg')} trace_id={data.get('trace_id')}")
    return data