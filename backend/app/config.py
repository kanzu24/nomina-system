from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from urllib.parse import quote_plus  # ✅ Agregar esto

def read_secret(secret_name: str, default: str = "") -> str:
    """
    Lee un secreto de Docker desde /run/secrets/
    """
    secret_path = f"/run/secrets/{secret_name}"
    try:
        if os.path.exists(secret_path):
            with open(secret_path, 'r') as secret_file:
                return secret_file.read().strip()
    except Exception as e:
        print(f"Error leyendo secreto {secret_name}: {e}")
    return default

class Settings(BaseSettings):
    """
    Configuración de la aplicación usando variables de entorno
    """
    # Database
    DB_HOST: str = os.getenv("DB_HOST", "db")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_USER: str = os.getenv("DB_USER", "nomina_user")
    DB_NAME: str = os.getenv("DB_NAME", "nomina_db")
    
    # Leer contraseña desde Docker secret o variable de entorno
    @property
    def DB_PASSWORD(self) -> str:
        password = read_secret("db_password")
        if not password:
            password = os.getenv("DB_PASSWORD", "")
        return password
    
    # API
    API_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Nomina System API"
    VERSION: str = "1.0.0"
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:4200", "http://localhost"]
    
    # Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {".xlsx", ".xls"}
    
    @property
    def DATABASE_URL(self) -> str:
        # ✅ Codificar la contraseña para caracteres especiales
        encoded_password = quote_plus(self.DB_PASSWORD)
        return f"mysql+pymysql://{self.DB_USER}:{encoded_password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    class Config:
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()