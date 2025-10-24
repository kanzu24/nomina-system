from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import init_db
from app.api import endpoints, health
from app.utils.logger_config import get_logger

logger = get_logger(__name__)
settings = get_settings()

# Crear aplicación
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API para gestión de nómina con importación desde Excel"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(health.router, tags=["Health"])
app.include_router(endpoints.router, prefix=settings.API_PREFIX, tags=["API"])

@app.on_event("startup")
async def startup_event():
    """
    Inicialización al arrancar la aplicación
    """
    logger.info("🚀 Iniciando Nomina System API...")
    logger.info(f"📌 Versión: {settings.VERSION}")
    
    try:
        init_db()
        logger.info("✅ Aplicación iniciada correctamente")
    except Exception as e:
        logger.error(f"❌ Error en startup: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """
    Limpieza al cerrar la aplicación
    """
    logger.info("👋 Cerrando Nomina System API...")

@app.get("/")
async def root():
    """
    Endpoint raíz
    """
    return {
        "message": "Nomina System API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health"
    }