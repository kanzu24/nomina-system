from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.utils.response import APIResponse
from app.utils.logger_config import get_logger
from datetime import datetime

logger = get_logger(__name__)
router = APIRouter()

@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    **Health Check Endpoint**
    
    Verifica el estado de salud de la API y la conexión a la base de datos.
    
    **Retorna:**
    - HTTP 200: Servicio operativo
    - HTTP 503: Servicio no disponible
    
    **Ejemplo de respuesta exitosa:**
```json
    {
        "status": 200,
        "type": "success",
        "title": "Servicio Operativo",
        "message": "API y base de datos funcionando correctamente",
        "data": {
            "timestamp": "2025-10-23T10:30:00",
            "database": "connected",
            "version": "1.0.0"
        }
    }
```
    """
    try:
        # Verificar conexión a BD
        db.execute("SELECT 1")
        
        return APIResponse.success(
            title="Servicio Operativo",
            message="API y base de datos funcionando correctamente",
            data={
                "timestamp": datetime.now().isoformat(),
                "database": "connected",
                "version": "1.0.0"
            }
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return APIResponse.error(
            title="Servicio No Disponible",
            message="Error en la conexión con la base de datos",
            error=str(e),
            status_code=503
        )

@router.get("/ping")
async def ping():
    """
    **Ping Endpoint**
    
    Endpoint simple para verificar que la API está respondiendo.
    
    **Retorna:**
    - HTTP 200: API activa
    """
    return APIResponse.success(
        title="Pong",
        message="API está activa",
        data={"timestamp": datetime.now().isoformat()}
    )