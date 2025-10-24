from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Employee, DataImported, DataError
from app.schemas import EmployeeCreate, EmployeeUpdate
from typing import List, Optional, Dict, Any
from app.utils.logger_config import get_logger

logger = get_logger(__name__)

# Employee CRUD
def get_employee(db: Session, employee_id: int) -> Optional[Employee]:
    """Obtener empleado por ID"""
    return db.query(Employee).filter(Employee.id == employee_id).first()

def get_employees(db: Session, skip: int = 0, limit: int = 100) -> List[Employee]:
    """Obtener lista de empleados con paginación"""
    return db.query(Employee).offset(skip).limit(limit).all()

def create_employee(db: Session, employee: EmployeeCreate) -> Employee:
    """Crear nuevo empleado"""
    db_employee = Employee(**employee.dict())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    logger.info(f"✅ Empleado creado: {db_employee.nombre} (ID: {db_employee.id})")
    return db_employee

def update_employee(db: Session, employee_id: int, employee: EmployeeUpdate) -> Optional[Employee]:
    """Actualizar empleado existente"""
    db_employee = get_employee(db, employee_id)
    if db_employee:
        for key, value in employee.dict().items():
            setattr(db_employee, key, value)
        db.commit()
        db.refresh(db_employee)
        logger.info(f"✅ Empleado actualizado: {db_employee.nombre} (ID: {db_employee.id})")
    return db_employee

def delete_employee(db: Session, employee_id: int) -> bool:
    """Eliminar empleado"""
    db_employee = get_employee(db, employee_id)
    if db_employee:
        db.delete(db_employee)
        db.commit()
        logger.info(f"✅ Empleado eliminado: ID {employee_id}")
        return True
    return False

def create_employees_bulk(db: Session, employees: List[Dict[str, Any]]) -> int:
    """Crear múltiples empleados"""
    count = 0
    for emp_data in employees:
        try:
            db_employee = Employee(**emp_data)
            db.add(db_employee)
            count += 1
        except Exception as e:
            logger.error(f"Error creando empleado: {e}")
            continue
    
    db.commit()
    logger.info(f"✅ {count} empleados creados en bulk")
    return count

# Statistics
def get_statistics(db: Session) -> Dict[str, Any]:
    """Obtener estadísticas de empleados"""
    try:
        total = db.query(Employee).count()
        avg_age = db.query(func.avg(Employee.edad)).scalar() or 0
        avg_salary = db.query(func.avg(Employee.sueldo)).scalar() or 0
        
        # Por sexo
        by_sexo = db.query(
            Employee.sexo,
            func.count(Employee.id).label('total'),
            func.avg(Employee.sueldo).label('avg_salary'),
            func.sum(Employee.sueldo).label('total_salary')
        ).group_by(Employee.sexo).all()
        
        # Por cargo
        by_cargo = db.query(
            Employee.cargo,
            func.count(Employee.id).label('total'),
            func.avg(Employee.sueldo).label('avg_salary')
        ).group_by(Employee.cargo).all()
        
        # Rango salarial
        min_salary = db.query(func.min(Employee.sueldo)).scalar() or 0
        max_salary = db.query(func.max(Employee.sueldo)).scalar() or 0
        
        return {
            "total_employees": total,
            "average_age": round(float(avg_age), 2),
            "average_salary": round(float(avg_salary), 2),
            "by_sexo": [
                {
                    "sexo": str(item[0].value),
                    "total_employees": item[1],
                    "average_salary": round(float(item[2]), 2),
                    "total_salary": round(float(item[3]), 2)
                } for item in by_sexo
            ],
            "by_cargo": [
                {
                    "cargo": item[0],
                    "total_employees": item[1],
                    "average_salary": round(float(item[2]), 2)
                } for item in by_cargo
            ],
            "salary_range": {
                "min": round(float(min_salary), 2),
                "max": round(float(max_salary), 2)
            }
        }
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas: {e}")
        raise

# Data Import Tracking
def create_import_record(db: Session, sheet_name: str, rows: int, filename: str, status: str = "success") -> DataImported:
    """Registrar importación exitosa"""
    record = DataImported(
        sheet_name=sheet_name,
        rows_imported=rows,
        file_name=filename,
        status=status
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def create_error_record(db: Session, sheet_name: str, error_type: str, error_msg: str, 
                       filename: str, row_number: Optional[int] = None) -> DataError:
    """Registrar error durante importación"""
    error = DataError(
        sheet_name=sheet_name,
        error_type=error_type,
        error_message=error_msg,
        row_number=row_number,
        file_name=filename
    )
    db.add(error)
    db.commit()
    db.refresh(error)
    return error