from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

class SexoEnum(str, Enum):
    MASCULINO = "Masculino"
    FEMENINO = "Femenino"
    OTRO = "Otro"

# Employee Schemas
class EmployeeBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    edad: int = Field(..., gt=0, lt=120)
    sexo: SexoEnum
    cargo: str = Field(..., min_length=1, max_length=100)
    sueldo: float = Field(..., gt=0)

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(EmployeeBase):
    pass

class EmployeeResponse(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Excel Schemas
class SheetInfo(BaseModel):
    name: str
    rows: int
    valid: bool
    errors: List[str] = []

class ExcelValidationResponse(BaseModel):
    valid_sheets: List[SheetInfo]
    invalid_sheets: List[SheetInfo]
    total_sheets: int

class ExcelPreviewData(BaseModel):
    sheet_name: str
    data: List[Dict[str, Any]]
    total_rows: int

class ExcelUploadRequest(BaseModel):
    selected_sheets: List[str]

# Statistics Schemas
class StatisticsBySexo(BaseModel):
    sexo: str
    total_employees: int
    average_salary: float
    total_salary: float

class StatisticsByCargo(BaseModel):
    cargo: str
    total_employees: int
    average_salary: float

class StatisticsResponse(BaseModel):
    total_employees: int
    average_age: float
    average_salary: float
    by_sexo: List[StatisticsBySexo]
    by_cargo: List[StatisticsByCargo]
    salary_range: Dict[str, float]