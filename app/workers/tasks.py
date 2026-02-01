import json
from datetime import datetime

from sqlalchemy.orm import Session

from app.core.db import SessionLocal, JobTable, AssetTable, SessionTable, PromptLogTable
from app.core.ids import new_id
from app.core.prompt_registry import get_prompt
from app.core.minimax_client import minimax_generate_music
from app.core.storage import save_from_url,public_url_for_file

def _update_job(db: Session, job: JobTable, **kwargs):
    for k, v in kwargs.items():
        setattr(job,k,v)
        job.updated_at = datetime.utcnow()
        db.add(job)
        db.commit()

def generate_music_task(job_id:str):
    db = SessionLocal()
    try:
        job = db.get(JobTable,job_id)
        if not job:
            return
        
        session = db.get(SessionTable,job.session_id)
        if not session:
            _update_job(db, job,status="FAILED",error_message="session not found")
            return
        
        _update_job(db,job,status="RUNNING",stage="arraging",message="正在编曲中...")

        # 1) 取 locked lyrics + locked stytle 
        locked_lyrics = json.loads(session.locked_lyrics_json or "{}")
        locked_style = json.loads(session.locked_style_json or "{}")
        style_cards = json.loads(session.style_cards_json or "{}")

        hook_line = locked_lyrics.get("hook_line") or "Hook"
        lyrics_text = locked_lyrics.get("lyrics") or "[Chorus]\nHook\n"
        lang = locked_lyrics.get("language") or "zh"

        selected_id = locked_style.get("selected_style_card_id")
        selected = next((c for c in style_cards if c.get("id") == selected_id), None) or {}

        audio = (selected.get("audio") or {})
        visual = (selected.get("visual") or {})

        bpm = audio.get("bpm") or 90
        genre = " / ".join(audio.get("genre", [])[:2]) or "Pop"
        reverb = audio.get("reverb") or "medium"
        timbre = ", ".join(audio.get("timbre", [])[:4]) or "modern synth"
        vocal_fx = ", ".join(audio.get("vocal_fx", [])[:4]) or "clean"
        mix_tags = ", ".join(audio.get("mix_tags", [])[:4]) or "balanced"
        scene = visual.get("scene") or ""
        title = visual.get("title") or "Scene"

         # 2) 用 PromptRegistry 渲染最终 prompt（这里是最小模板；后续你随时改 registry.json）
        version, tpl = get_prompt("music_prompt_builder")
        prompt_text = tpl.format(
            mood="充满张力与画面感",
            genre=genre,
            vocal="清晰且有情绪的主唱",
            delivery="节奏性强的表达",
            vocal_fx=vocal_fx,
            hook_line=hook_line,
            reverb=reverb,
            space_desc=scene or title,
            bpm=bpm,
            drums="强劲鼓组",
            bass="低频驱动贝斯",
            rhythm="切分与推进",
            pad=timbre,
            transitions="过渡音效",
            use_cases="夜晚独行/健身/驾车",
            final_emotion="释放与前行"
        )

         # 3) 记录 PromptLog（回放/对比的关键）
        plog_id = new_id("plog_")
        db.add(PromptLogTable(
            id=plog_id,
            session_id=session.id,
            step="music_prompt_builder",
            version=version,
            input_json=json.dumps({
                "locked_lyrics": locked_lyrics,
                "selected_style": selected,
                "locked_style": locked_style
            }, ensure_ascii=False),
            output_json=json.dumps({
                "prompt": prompt_text,
                "lyrics": lyrics_text
            }, ensure_ascii=False),
        ))
        db.commit()

        _update_job(db, job, stage="synth", message="正在合成与演唱处理中…")

        payload = {
            "model": "music-2.5",
            "prompt": prompt_text,
            "lyrics": lyrics_text,
            "audio_setting": {"sample_rate": 44100, "bitrate": 256000, "format": "mp3"},
            "output_format": "url"
        }

        result = minimax_generate_music(payload)
        trace_id = result.get("trace_id")

        data = (result or {}).get("data") or {}
        audio_url = data.get("audio")
        if not audio_url:
            _update_job(db, job, status="FAILED", error_message=f"missing audio url trace_id={trace_id}", provider_trace_id=trace_id)
            return

        _update_job(db, job, stage="export", message="正在导出与保存作品…", provider_trace_id=trace_id)

        # 4) 下载保存到本地（避免临时链接过期）
        asset_id = new_id("asset_")
        filename = f"{asset_id}.mp3"
        path, size_bytes = save_from_url(audio_url, filename)
        url = public_url_for_file(path)

        asset = AssetTable(
            id=asset_id,
            kind="audio",
            mime_type="audio/mpeg",
            path=path,
            url=url,
            size_bytes=size_bytes
        )
        db.add(asset)
        db.commit()

        # 5) 更新 job / session
        _update_job(db, job, status="SUCCEEDED", asset_id=asset_id, stage=None, message="生成完成")
        session.state = "MUSIC_READY"
        session.updated_at = datetime.utcnow()
        db.add(session)
        db.commit()

    except Exception as e:
        job = db.get(JobTable, job_id)
        if job:
            _update_job(db, job, status="FAILED", error_message=str(e))
    finally:
        db.close()
