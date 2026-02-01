import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db, SessionTable, JobTable
from app.core.ids import new_id
from app.workers.rq_queue import queue
from app.workers.tasks import generate_music_task

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.post("", response_model=dict)
def create_session(db: Session = Depends(get_db)):
    sid = new_id("sess_")
    s = SessionTable(id=sid, state="STORY_RECEIVED", created_at=datetime.utcnow(), updated_at=datetime.utcnow())
    db.add(s); db.commit()
    return {"session_id": sid, "state": s.state}

@router.post("/{session_id}/story", response_model=dict)
def submit_story(session_id: str, body: dict, db: Session = Depends(get_db)):
    s = db.get(SessionTable, session_id)
    if not s:
        raise HTTPException(404, "session not found")
    # MVP：先只存 story，后续你把 story_intake LLM 接进来并写 story_brief_json
    s.story_json = json.dumps(body, ensure_ascii=False)
    s.state = "STORY_RECEIVED"
    s.updated_at = datetime.utcnow()
    db.add(s); db.commit()
    return {"session_id": session_id, "state": s.state}

@router.post("/{session_id}/lyrics/lock", response_model=dict)
def lock_lyrics(session_id: str, body: dict, db: Session = Depends(get_db)):
    """
    body: {"lyrics": "...", "language": "zh", "hook_line": "..."}
    你 Phase1 的 A/B 歌词草稿、Hook锁定会生成同样结构的 body
    """
    s = db.get(SessionTable, session_id)
    if not s:
        raise HTTPException(404, "session not found")
    if not body.get("lyrics") or not body.get("hook_line"):
        raise HTTPException(400, "lyrics and hook_line required")
    s.locked_lyrics_json = json.dumps(body, ensure_ascii=False)
    s.state = "LYRICS_LOCKED"
    s.updated_at = datetime.utcnow()
    db.add(s); db.commit()
    return {"session_id": session_id, "state": s.state}

@router.post("/{session_id}/styles", response_model=dict)
def generate_style_cards(session_id: str, db: Session = Depends(get_db)):
    """
    MVP：先返回固定三张卡，后续接你的 style_translator prompt 生成。
    """
    s = db.get(SessionTable, session_id)
    if not s:
        raise HTTPException(404, "session not found")

    cards = [
        {
            "id": "card1",
            "visual": {"title":"深海隧道", "scene":"一个人走在深海隧道里，周围只有心跳的回声", "light":"dark blue", "motion":"slow", "space":"large", "color_tone":"cold"},
            "audio": {"genre":["ambient","rnb"], "bpm":70, "reverb":"high", "timbre":["sub_bass","airy_pad","soft_drums"], "vocal_fx":["breathy","wide_reverb"], "mix_tags":["wide space","soft transients"]}
        },
        {
            "id": "card2",
            "visual": {"title":"火焰吞噬信件", "scene":"将所有信件丢进火盆，看火焰疯狂吞噬一切", "light":"red/orange", "motion":"fast", "space":"medium", "color_tone":"warm"},
            "audio": {"genre":["trap","alt-rock"], "bpm":140, "reverb":"medium", "timbre":["distorted_guitar","808","punchy_drums","risers"], "vocal_fx":["aggressive","light_autotune"], "mix_tags":["tight low-end","bright highs"]}
        },
        {
            "id": "card3",
            "visual": {"title":"旧公园长椅", "scene":"坐在旧公园长椅上，看气球慢慢飘向天空", "light":"golden hour", "motion":"medium", "space":"open", "color_tone":"soft"},
            "audio": {"genre":["indie-folk","pop"], "bpm":100, "reverb":"low", "timbre":["acoustic_guitar","light_perc","whistle"], "vocal_fx":["natural","soft_harmonies"], "mix_tags":["clean","warm"]}
        }
    ]

    s.style_cards_json = json.dumps(cards, ensure_ascii=False)
    s.state = "STYLE_OPTIONS_READY"
    s.updated_at = datetime.utcnow()
    db.add(s); db.commit()
    return {"session_id": session_id, "state": s.state, "style_cards": cards}

@router.post("/{session_id}/styles/lock", response_model=dict)
def lock_style(session_id: str, body: dict, db: Session = Depends(get_db)):
    """
    body: {"selected_style_card_id":"card2", "micro_tunes":[...可选]}
    MVP：先只存 selected_style_card_id；微调后续接 micro_tune prompt。
    """
    s = db.get(SessionTable, session_id)
    if not s:
        raise HTTPException(404, "session not found")

    selected = body.get("selected_style_card_id")
    if not selected:
        raise HTTPException(400, "selected_style_card_id required")

    s.locked_style_json = json.dumps({"selected_style_card_id": selected, "micro_tunes": body.get("micro_tunes", [])}, ensure_ascii=False)
    s.state = "STYLE_LOCKED"
    s.updated_at = datetime.utcnow()
    db.add(s); db.commit()
    return {"session_id": session_id, "state": s.state}

@router.post("/{session_id}/music", response_model=dict)
def create_music_job(session_id: str, db: Session = Depends(get_db)):
    s = db.get(SessionTable, session_id)
    if not s:
        raise HTTPException(404, "session not found")
    if not s.locked_lyrics_json or not s.locked_style_json or not s.style_cards_json:
        raise HTTPException(400, "need locked_lyrics + style_cards + locked_style before music")

    jid = new_id("job_")
    job = JobTable(id=jid, session_id=session_id, status="PENDING", created_at=datetime.utcnow(), updated_at=datetime.utcnow())
    db.add(job); db.commit()

    # 投递到 RQ
    queue.enqueue(generate_music_task, jid)

    s.state = "MUSIC_JOB_CREATED"
    s.updated_at = datetime.utcnow()
    db.add(s); db.commit()

    return {"session_id": session_id, "job_id": jid, "status": "PENDING"}