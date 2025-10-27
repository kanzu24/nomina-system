from fastapi import APIRouter, UploadFile, File
from app.utils.response import APIResponse
from app.utils.logger_config import get_logger
from app.services.excel_service import ExcelService
import os

logger = get_logger(__name__)
router = APIRouter()

@router.post("/validate")
async def validate_excel(file: UploadFile = File(...)):
    """
    **Validar Archivo Excel**
    
    Valida la estructura y formato de un archivo Excel de nómina.
    
    **Parámetros:**
    - file: Archivo Excel (.xlsx o .xls)
    
    **Retorna:**
    - HTTP 200: Validación exitosa
    - HTTP 400: Archivo inválido
    - HTTP 422: Error de formato
    - HTTP 500: Error del servidor
    
    **Ejemplo de respuesta exitosa:**
```json
    {
        "status": 200,
        "type": "success",
        "title": "Archivo Válido",
        "message": "El archivo Excel es válido",
        "data": {
            "filename": "empleados.xlsx",
            "size": 6050,
            "valid_sheets": [...],
            "invalid_sheets": [...],
            "total_sheets": 2
        }
    }
```
    """
    try:
        # Validar extensión
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in ['.xlsx', '.xls']:
            return APIResponse.validation_error(
                message="Solo se permiten archivos Excel (.xlsx, .xls)",
                error=f"Extensión detectada: {file_ext}"
            )
        
        # Validar tamaño del archivo (10MB máximo)
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        max_size = 10 * 1024 * 1024  # 10MB
        if file_size > max_size:
            return APIResponse.validation_error(
                message=f"El archivo excede el tamaño máximo permitido (10MB)",
                error=f"Tamaño del archivo: {file_size / 1024 / 1024:.2f}MB"
            )
        
        # Leer contenido del archivo
        contents = await file.read()
        
        # Procesar y validar con ExcelService
        result = ExcelService.process_excel_file(contents)
        
        # Agregar información del archivo al resultado
        result['filename'] = file.filename
        result['size'] = file_size
        result['content_type'] = file.content_type
        
        # Determinar tipo de respuesta según validación
        if len(result['invalid_sheets']) > 0:
            return APIResponse.warning(
                title="Validación Completada con Advertencias",
                message=f"{len(result['valid_sheets'])} hojas válidas, {len(result['invalid_sheets'])} hojas con errores",
                data=result
            )
        
        return APIResponse.success(
            title="Archivo Válido",
            message=f"Todas las hojas ({result['total_sheets']}) son válidas y listas para importar",
            data=result
        )
        
    except ValueError as ve:
        logger.error(f"Error de validación: {ve}")
        return APIResponse.validation_error(
            message="Error al validar el archivo",
            error=str(ve)
        )
    except Exception as e:
        logger.error(f"Error inesperado validando archivo: {e}")
        return APIResponse.error(
            title="Error de Validación",
            message="No se pudo validar el archivo Excel",
            error=str(e),
            status_code=500
        )