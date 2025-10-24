from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Enum
from sqlalchemy.sql import func
from app.database import Base
import enum

class SexoEnum(str, enum.Enum):
    MASCULINO = "Masculino"
    FEMENINO = "Femenino"
    OTRO = "Otro"

class Employee(Base):
    """
    Modelo de Empleado
    """
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False, index=True)
    edad = Column(Integer, nullable=False)
    sexo = Column(Enum(SexoEnum), nullable=False)
    cargo = Column(String(100), nullable=False)
    sueldo = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<Employee(id={self.id}, nombre='{self.nombre}', cargo='{self.cargo}')>"

class DataImported(Base):
    """
    Registro de datos importados desde Excel
    """
    __tablename__ = "data_imported"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sheet_name = Column(String(100), nullable=False)
    rows_imported = Column(Integer, nullable=False)
    file_name = Column(String(255), nullable=False)
    import_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    status = Column(String(50), nullable=False, default="success")
    
    def __repr__(self):
        return f"<DataImported(id={self.id}, sheet='{self.sheet_name}', rows={self.rows_imported})>"

class DataError(Base):
    """
    Registro de errores durante importación
    """
    __tablename__ = "data_errors"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sheet_name = Column(String(100), nullable=False)
    error_type = Column(String(100), nullable=False)
    error_message = Column(Text, nullable=False)
    row_number = Column(Integer, nullable=True)
    file_name = Column(String(255), nullable=False)
    error_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<DataError(id={self.id}, sheet='{self.sheet_name}', type='{self.error_type}')>"