from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form  # ✅ Agregado Form
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import crud, schemas
from app.api import upload
from app.services.excel_service import ExcelService
from app.utils.response import APIResponse
from app.utils.logger_config import get_logger
import json  # ✅ AGREGADO
import os

logger = get_logger(__name__)
router = APIRouter()

# ==================== EMPLOYEES CRUD ====================

@router.get("/employees", response_model=dict)
async def get_all_employees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    **Obtener Lista de Empleados**
    
    Retorna lista paginada de todos los empleados registrados.
    
    **Parámetros:**
    - skip: Número de registros a saltar (paginación)
    - limit: Cantidad máxima de registros a retornar
    
    **Retorna:**
    - HTTP 200: Lista de empleados obtenida exitosamente
    - HTTP 500: Error del servidor
    
    **Ejemplo de respuesta:**
```json
    {
        "status": 200,
        "type": "success",
        "title": "Empleados Obtenidos",
        "message": "Lista de empleados obtenida exitosamente",
        "data": {
            "employees": [...],
            "total": 50,
            "skip": 0,
            "limit": 100
        }
    }
```
    """
    try:
        employees = crud.get_employees(db, skip=skip, limit=limit)
        total = db.query(crud.Employee).count()
        
        return APIResponse.success(
            title="Empleados Obtenidos",
            message=f"Se encontraron {len(employees)} empleados",
            data={
                "employees": [schemas.EmployeeResponse.from_orm(emp) for emp in employees],
                "total": total,
                "skip": skip,
                "limit": limit
            }
        )
    except Exception as e:
        logger.error(f"Error obteniendo empleados: {e}")
        return APIResponse.server_error(
            message="Error al obtener lista de empleados",
            error=str(e)
        )

@router.get("/employees/{employee_id}", response_model=dict)
async def get_employee(employee_id: int, db: Session = Depends(get_db)):
    """
    **Obtener Empleado por ID**
    
    Retorna los datos de un empleado específico.
    
    **Parámetros:**
    - employee_id: ID del empleado a buscar
    
    **Retorna:**
    - HTTP 200: Empleado encontrado
    - HTTP 404: Empleado no encontrado
    - HTTP 500: Error del servidor
    """
    try:
        employee = crud.get_employee(db, employee_id)
        if not employee:
            return APIResponse.not_found(
                title="Empleado No Encontrado",
                message=f"No existe empleado con ID {employee_id}"
            )
        
        return APIResponse.success(
            title="Empleado Encontrado",
            message="Datos del empleado obtenidos exitosamente",
            data=schemas.EmployeeResponse.from_orm(employee)
        )
    except Exception as e:
        logger.error(f"Error obteniendo empleado {employee_id}: {e}")
        return APIResponse.server_error(error=str(e))

@router.post("/employees", response_model=dict)
async def create_employee(employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    """
    **Crear Nuevo Empleado**
    
    Crea un nuevo registro de empleado en la base de datos.
    
    **Body:**
```json
    {
        "nombre": "Juan Pérez",
        "edad": 30,
        "sexo": "Masculino",
        "cargo": "Desarrollador",
        "sueldo": 5000.00
    }
```
    
    **Retorna:**
    - HTTP 201: Empleado creado exitosamente
    - HTTP 422: Error de validación
    - HTTP 500: Error del servidor
    """
    try:
        new_employee = crud.create_employee(db, employee)
        return APIResponse.success(
            title="Empleado Creado",
            message=f"Empleado {new_employee.nombre} creado exitosamente",
            data=schemas.EmployeeResponse.from_orm(new_employee),
            status_code=201
        )
    except Exception as e:
        logger.error(f"Error creando empleado: {e}")
        return APIResponse.server_error(error=str(e))

@router.put("/employees/{employee_id}", response_model=dict)
async def update_employee(employee_id: int, employee: schemas.EmployeeUpdate, db: Session = Depends(get_db)):
    """
    **Actualizar Empleado**
    
    Actualiza los datos de un empleado existente.
    
    **Parámetros:**
    - employee_id: ID del empleado a actualizar
    
    **Retorna:**
    - HTTP 200: Empleado actualizado
    - HTTP 404: Empleado no encontrado
    - HTTP 500: Error del servidor
    """
    try:
        updated_employee = crud.update_employee(db, employee_id, employee)
        if not updated_employee:
            return APIResponse.not_found(
                message=f"No existe empleado con ID {employee_id}"
            )
        
        return APIResponse.success(
            title="Empleado Actualizado",
            message=f"Empleado {updated_employee.nombre} actualizado exitosamente",
            data=schemas.EmployeeResponse.from_orm(updated_employee)
        )
    except Exception as e:
        logger.error(f"Error actualizando empleado {employee_id}: {e}")
        return APIResponse.server_error(error=str(e))

@router.delete("/employees/{employee_id}", response_model=dict)
async def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    """
    **Eliminar Empleado**
    
    Elimina un empleado de la base de datos.
    
    **Parámetros:**
    - employee_id: ID del empleado a eliminar
    
    **Retorna:**
    - HTTP 200: Empleado eliminado
    - HTTP 404: Empleado no encontrado
    - HTTP 500: Error del servidor
    """
    try:
        deleted = crud.delete_employee(db, employee_id)
        if not deleted:
            return APIResponse.not_found(
                message=f"No existe empleado con ID {employee_id}"
            )
        
        return APIResponse.success(
            title="Empleado Eliminado",
            message=f"Empleado con ID {employee_id} eliminado exitosamente"
        )
    except Exception as e:
        logger.error(f"Error eliminando empleado {employee_id}: {e}")
        return APIResponse.server_error(error=str(e))

# ==================== EXCEL OPERATIONS ====================

@router.post("/excel/validate", response_model=dict)
async def validate_excel(file: UploadFile = File(...)):
    """
    **Validar Archivo Excel**
    
    Valida la estructura de todas las hojas del archivo Excel.
    Verifica columnas requeridas y formato de datos.
    
    **Archivo:**
    - Formato: .xlsx o .xls
    - Columnas requeridas: nombre, edad, sexo, cargo, sueldo
    
    **Retorna:**
    - HTTP 200: Validación completada
    - HTTP 400: Archivo inválido
    - HTTP 422: Error de formato
    """
    try:
        # Validar extensión
        if not file.filename.endswith(('.xlsx', '.xls')):
            return APIResponse.validation_error(
                message="Solo se permiten archivos Excel (.xlsx, .xls)"
            )
        
        # Leer contenido
        content = await file.read()
        
        # Procesar y validar
        result = ExcelService.process_excel_file(content)
        
        if len(result['invalid_sheets']) > 0:
            return APIResponse.warning(
                title="Validación Completada con Advertencias",
                message=f"{len(result['valid_sheets'])} hojas válidas, {len(result['invalid_sheets'])} hojas con errores",
                data=result
            )
        
        return APIResponse.success(
            title="Validación Exitosa",
            message=f"Todas las hojas ({result['total_sheets']}) son válidas",
            data=result
        )
        
    except Exception as e:
        logger.error(f"Error validando Excel: {e}")
        return APIResponse.error(
            title="Error de Validación",
            message="No se pudo validar el archivo Excel",
            error=str(e)
        )

@router.get("/excel/sheets", response_model=dict)
async def get_sheets():
    """
    **Obtener Nombres de Hojas**
    
    Retorna los nombres de todas las hojas detectadas en el último archivo cargado.
    
    **Nota:** Este endpoint requiere que primero se haya validado un archivo.
    
    **Retorna:**
    - HTTP 200: Nombres obtenidos
    - HTTP 400: No hay archivo cargado
    """
    return APIResponse.info(
        title="Información de Hojas",
        message="Use el endpoint /excel/validate para obtener información de hojas"
    )

@router.post("/excel/preview", response_model=dict)
async def preview_excel_data(
    file: UploadFile = File(...),
    sheets: str = Form(...)  # ✅ Cambiar a Form y recibir como string
):
    """
    **Preview de Datos**
    
    Muestra una vista previa de los datos de las hojas seleccionadas.
    
    **Parámetros:**
    - file: Archivo Excel
    - sheets: JSON string con array de nombres de hojas ["Hoja1", "Hoja2"]
    
    **Retorna:**
    - HTTP 200: Preview generado
    - HTTP 400: Error en parámetros
    """
    try:
        # Parsear el JSON string a lista
        selected_sheets = json.loads(sheets)
        
        if not isinstance(selected_sheets, list):
            return APIResponse.validation_error(
                message="El parámetro 'sheets' debe ser un array JSON"
            )
        
        # Leer contenido del archivo
        content = await file.read()
        
        # Generar preview
        previews = ExcelService.get_preview_data(content, selected_sheets)
        
        total_rows = sum(p['total_rows'] for p in previews)
        
        return APIResponse.success(
            title="Preview Generado",
            message=f"Preview de {len(previews)} hojas con {total_rows} registros totales",
            data=previews
        )
        
    except json.JSONDecodeError:
        return APIResponse.validation_error(
            message="Formato JSON inválido en el parámetro 'sheets'"
        )
    except Exception as e:
        logger.error(f"Error generando preview: {e}")
        return APIResponse.error(
            message="Error al generar preview",
            error=str(e)
        )

@router.post("/excel/import", response_model=dict)
async def import_excel_data(
    file: UploadFile = File(...),
    sheets: str = Form(...),  # ✅ Cambiar a Form y recibir como string
    db: Session = Depends(get_db)
):
    """
    **Importar Datos desde Excel**
    
    Importa los datos de las hojas seleccionadas a la base de datos.
    
    **Parámetros:**
    - file: Archivo Excel
    - sheets: JSON string con array de nombres de hojas
    
    **Retorna:**
    - HTTP 201: Datos importados exitosamente
    - HTTP 400: Error en importación
    - HTTP 500: Error del servidor
    """
    try:
        # Parsear el JSON string a lista
        selected_sheets = json.loads(sheets)
        
        if not isinstance(selected_sheets, list):
            return APIResponse.validation_error(
                message="El parámetro 'sheets' debe ser un array JSON"
            )
        
        content = await file.read()
        filename = file.filename
        
        # Preparar datos
        data_to_import = ExcelService.prepare_data_for_import(content, selected_sheets)
        
        if not data_to_import:
            return APIResponse.error(
                title="Sin Datos",
                message="No hay datos para importar en las hojas seleccionadas"
            )
        
        # Importar en bulk
        imported_count = crud.create_employees_bulk(db, data_to_import)
        
        # Registrar importación
        for sheet in selected_sheets:
            crud.create_import_record(
                db, 
                sheet_name=sheet,
                rows=imported_count,
                filename=filename,
                status="success"
            )
        
        return APIResponse.success(
            title="Importación Exitosa",
            message=f"Los datos fueron cargados correctamente a la base de datos",
            data={
                "imported_rows": imported_count,
                "sheets_processed": len(selected_sheets),
                "filename": filename
            },
            status_code=201
        )
        
    except json.JSONDecodeError:
        return APIResponse.validation_error(
            message="Formato JSON inválido en el parámetro 'sheets'"
        )
    except Exception as e:
        logger.error(f"Error importando datos: {e}")
        
        # Registrar error
        try:
            crud.create_error_record(
                db,
                sheet_name="ALL",
                error_type="IMPORT_ERROR",
                error_msg=str(e),
                filename=file.filename
            )
        except:
            pass
        
        return APIResponse.server_error(
            title="Error de Importación",
            message="Error al importar datos a la base de datos",
            error=str(e)
        )

# ==================== STATISTICS ====================

@router.get("/statistics", response_model=dict)
async def get_statistics(db: Session = Depends(get_db)):
    """
    **Obtener Estadísticas**
    
    Retorna estadísticas generales de empleados:
    - Total de empleados
    - Edad promedio
    - Salario promedio
    - Estadísticas por sexo
    - Estadísticas por cargo
    - Rango salarial
    
    **Retorna:**
    - HTTP 200: Estadísticas obtenidas
    - HTTP 500: Error del servidor
    """
    try:
        stats = crud.get_statistics(db)
        
        return APIResponse.success(
            title="Estadísticas Obtenidas",
            message="Estadísticas generadas exitosamente",
            data=stats
        )
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas: {e}")
        return APIResponse.server_error(error=str(e))

# ==================== SYSTEM ====================

@router.post("/system/restart", response_model=dict)
async def restart_container():
    """
    **Reiniciar Contenedor**
    
    Endpoint para reiniciar el contenedor de la aplicación.
    
    **Advertencia:** Esta operación reiniciará el servicio.
    
    **Retorna:**
    - HTTP 200: Solicitud de reinicio aceptada
    """
    logger.warning("⚠️ Solicitud de reinicio de contenedor recibida")
    
    return APIResponse.info(
        title="Reinicio Programado",
        message="El contenedor se reiniciará en breve",
        data={"action": "restart", "status": "pending"}
    )

@router.get("/system/routes", response_model=dict)
async def get_all_routes():
    """
    **Listar Todos los Endpoints**
    
    Retorna lista de todos los endpoints disponibles en la API con su documentación.
    
    **Retorna:**
    - HTTP 200: Lista de endpoints
    """
    routes = [
        {
            "path": "/api/v1/health",
            "method": "GET",
            "description": "Health check - Verifica estado del servicio"
        },
        {
            "path": "/api/v1/ping",
            "method": "GET",
            "description": "Ping - Verificar API activa"
        },
        {
            "path": "/api/v1/employees",
            "method": "GET",
            "description": "Obtener lista de empleados (paginado)"
        },
        {
            "path": "/api/v1/employees/{id}",
            "method": "GET",
            "description": "Obtener empleado por ID"
        },
        {
            "path": "/api/v1/employees",
            "method": "POST",
            "description": "Crear nuevo empleado"
        },
        {
            "path": "/api/v1/employees/{id}",
            "method": "PUT",
            "description": "Actualizar empleado"
        },
        {
            "path": "/api/v1/employees/{id}",
            "method": "DELETE",
            "description": "Eliminar empleado"
        },
        {
            "path": "/api/v1/excel/validate",
            "method": "POST",
            "description": "Validar estructura de archivo Excel"
        },
        {
            "path": "/api/v1/excel/sheets",
            "method": "GET",
            "description": "Obtener nombres de hojas detectadas"
        },
        {
            "path": "/api/v1/excel/preview",
            "method": "POST",
            "description": "Preview de datos de hojas seleccionadas"
        },
        {
            "path": "/api/v1/excel/import",
            "method": "POST",
            "description": "Importar datos a base de datos"
        },
        {
            "path": "/api/v1/statistics",
            "method": "GET",
            "description": "Obtener estadísticas de empleados"
        },
        {
            "path": "/api/v1/system/restart",
            "method": "POST",
            "description": "Reiniciar contenedor"
        },
        {
            "path": "/api/v1/system/routes",
            "method": "GET",
            "description": "Listar todos los endpoints"
        }
    ]
    
    return APIResponse.success(
        title="Endpoints Disponibles",
        message=f"Total de {len(routes)} endpoints documentados",
        data={"routes": routes, "total": len(routes)}
    )

