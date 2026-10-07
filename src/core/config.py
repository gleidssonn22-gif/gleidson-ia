from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Gleidson Assistant"
    GEMINI_API_KEY: str
    DEFAULT_MODEL: str = "gemini-3.8-flash"  # Atualizado para o modelo atual e ativo
    ADVANCED_MODEL: str = "gemini-2.5-pro"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()