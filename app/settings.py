from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env",extra="ignore")

    database_url:str
    redis_url:str
    minimax_api_key:str
    minimax_music_model:str | None
    output_dir:str
    public_base_url:str

settings = Settings()

if __name__ == "__main__":
    print(f"Database: {settings.database_url}")
    print(f"Redis: {settings.redis_url}")
    print(f"API Key exists: {settings.minimax_api_key is not None}")
