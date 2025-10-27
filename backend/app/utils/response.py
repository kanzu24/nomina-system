from typing import Any, Optional, Dict
from fastapi import status
from enum import Enum

class ResponseType(str, Enum):
    SUCCESS = "success"
    ERROR = "error"
    INFO = "info"
    WARNING = "warning"

class APIResponse:
    """
    Clase para estandarizar respuestas de la API
    
    Parámetros:
    - status: Código de estado HTTP
    - type_: Tipo de respuesta (success, error, info, warning)
    - title: Título descriptivo
    - message: Mensaje principal
    - data: Datos adicionales (opcional)
    - error: Mensaje de error detallado (opcional)
    """
    
    @staticmethod
    def format_response(
        status_code: int,
        type_: ResponseType,
        title: str,
        message: str,
        data: Optional[Any] = None,
        error: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Formatear respuesta estándar
        """
        response = {
            "status": status_code,
            "type": type_.value,
            "title": title,
            "message": message
        }
        
        if data is not None:
            response["data"] = data
            
        if error is not None:
            response["error"] = error
            
        return response
    
    @staticmethod
    def success(
        title: str,
        message: str,
        data: Optional[Any] = None,
        status_code: int = status.HTTP_200_OK
    ) -> Dict[str, Any]:
        """
        Respuesta exitosa
        
        HTTP 200: Operación exitosa
        HTTP 201: Recurso creado
        """
        return APIResponse.format_response(
            status_code=status_code,
            type_=ResponseType.SUCCESS,
            title=title,
            message=message,
            data=data
        )
    
    @staticmethod
    def error(
        title: str,
        message: str,
        error: Optional[str] = None,
        status_code: int = status.HTTP_400_BAD_REQUEST
    ) -> Dict[str, Any]:
        """
        Respuesta de error
        
        HTTP 400: Bad Request - Error en datos enviados
        HTTP 404: Not Found - Recurso no encontrado
        HTTP 422: Unprocessable Entity - Error de validación
        HTTP 500: Internal Server Error - Error del servidor
        """
        return APIResponse.format_response(
            status_code=status_code,
            type_=ResponseType.ERROR,
            title=title,
            message=message,
            error=error
        )
    
    @staticmethod
    def not_found(
        title: str = "Recurso No Encontrado",
        message: str = "El recurso solicitado no existe"
    ) -> Dict[str, Any]:
        """
        Respuesta de recurso no encontrado
        
        HTTP 404: Not Found
        """
        return APIResponse.format_response(
            status_code=status.HTTP_404_NOT_FOUND,
            type_=ResponseType.ERROR,
            title=title,
            message=message
        )
    
    @staticmethod
    def validation_error(
        title: str = "Error de Validación",
        message: str = "Los datos proporcionados no son válidos",
        error: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Respuesta de error de validación
        
        HTTP 422: Unprocessable Entity
        """
        return APIResponse.format_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            type_=ResponseType.ERROR,
            title=title,
            message=message,
            error=error
        )
    
    @staticmethod
    def server_error(
        title: str = "Error del Servidor",
        message: str = "Ha ocurrido un error interno",
        error: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Respuesta de error del servidor
        
        HTTP 500: Internal Server Error
        """
        return APIResponse.format_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            type_=ResponseType.ERROR,
            title=title,
            message=message,
            error=error
        )
    
    @staticmethod
    def info(
        title: str,
        message: str,
        data: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Respuesta informativa
        
        HTTP 200: OK
        """
        return APIResponse.format_response(
            status_code=status.HTTP_200_OK,
            type_=ResponseType.INFO,
            title=title,
            message=message,
            data=data
        )
    
    @staticmethod
    def warning(
        title: str,
        message: str,
        data: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Respuesta de advertencia
        
        HTTP 200: OK (con advertencia)
        """
        return APIResponse.format_response(
            status_code=status.HTTP_200_OK,
            type_=ResponseType.WARNING,
            title=title,
            message=message,
            data=data
        )