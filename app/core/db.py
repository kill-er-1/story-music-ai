import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase,Mapped,mapped_column
from sqlalchemy import String, DateTime,Text,Integer
from datetime import datetime, timezone

from app.settings import settings

os.makedirs("./data",exist_ok=True)

engine = create_engine(settings.database_url,connect_args={"check_same_thread":False} if "sqlite" in settings.database_url else {})
# PostgreSQL/MySQL 模式：无需特殊参数 sqlite需要线程安全的检查
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

class SessionTable(Base):
    __tablename__ = "sessions"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    state: Mapped[str] = mapped_column(String(64), default="STORY_RECEIVED")

    story_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    story_brief_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    locked_lyrics_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    style_cards_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    locked_style_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class JobTable(Base):
    __tablename__ = "jobs"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(32), default="PENDING")
    stage: Mapped[str | None] = mapped_column(String(32), nullable=True)
    message: Mapped[str | None] = mapped_column(String(200), nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)

    provider_trace_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    asset_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

class AssetTable(Base):
    __tablename__ = "assets"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    kind: Mapped[str] = mapped_column(String(32), default="audio")
    mime_type: Mapped[str] = mapped_column(String(80), default="audio/mpeg")
    path: Mapped[str] = mapped_column(Text)          # 本地路径
    url: Mapped[str] = mapped_column(Text)           # 公开访问 URL
    duration_sec: Mapped[int | None] = mapped_column(Integer, nullable=True)
    size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class PromptLogTable(Base):
    """
    关键：把 prompt 当作一等公民。
    你随时改 prompt，都能回放/对比：输入 -> 版本 -> 输出 -> 结果音频
    """
    __tablename__ = "prompt_logs"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    step: Mapped[str] = mapped_column(String(64))              # story_intake / lyrics_draft / music_prompt_builder ...
    version: Mapped[str] = mapped_column(String(64))           # v1/v2/v3
    input_json: Mapped[str] = mapped_column(Text)
    output_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()