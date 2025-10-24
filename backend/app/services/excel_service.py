import pandas as pd
from typing import Dict, List, Any, Tuple
from io import BytesIO
from app.utils.helpers import normalize_column_name, has_special_characters, validate_required_columns
from app.utils.logger_config import get_logger

logger = get_logger(__name__)

REQUIRED_COLUMNS = {"nombre", "edad", "sexo", "cargo", "sueldo"}
VALID_SEXO_VALUES = {"masculino", "femenino", "otro"}

class ExcelService:
    """
    Servicio para procesar archivos Excel
    """
    
    @staticmethod
    def get_sheet_names(file_content: bytes) -> List[str]:
        """
        Obtener nombres de todas las hojas del Excel
        """
        try:
            excel_file = pd.ExcelFile(BytesIO(file_content))
            return excel_file.sheet_names
        except Exception as e:
            logger.error(f"Error leyendo nombres de hojas: {e}")
            raise ValueError(f"Error al leer archivo Excel: {str(e)}")
    
    @staticmethod
    def validate_sheet(df: pd.DataFrame, sheet_name: str) -> Tuple[bool, List[str]]:
        """
        Validar estructura de una hoja
        Retorna: (es_valida, lista_de_errores)
        """
        errors = []
        
        # Verificar que no esté vacía
        if df.empty:
            errors.append("La hoja está vacía")
            return False, errors
        
        # Normalizar nombres de columnas
        df.columns = [normalize_column_name(col) for col in df.columns]
        
        # Validar columnas requeridas
        is_valid, missing = validate_required_columns(df.columns.tolist(), REQUIRED_COLUMNS)
        if not is_valid:
            errors.append(f"Faltan columnas requeridas: {', '.join(missing)}")
            return False, errors
        
        # Validar datos
        for idx, row in df.iterrows():
            row_errors = []
            
            # Validar nombre
            if pd.isna(row['nombre']) or str(row['nombre']).strip() == '':
                row_errors.append(f"Fila {idx + 2}: Nombre vacío")
            elif has_special_characters(str(row['nombre'])):
                row_errors.append(f"Fila {idx + 2}: Nombre contiene caracteres especiales no permitidos")
            
            # Validar edad
            try:
                edad = int(row['edad'])
                if edad <= 0 or edad >= 120:
                    row_errors.append(f"Fila {idx + 2}: Edad fuera de rango (1-119)")
            except (ValueError, TypeError):
                row_errors.append(f"Fila {idx + 2}: Edad no es un número válido")
            
            # Validar sexo
            if pd.isna(row['sexo']):
                row_errors.append(f"Fila {idx + 2}: Sexo vacío")
            else:
                sexo_normalized = str(row['sexo']).strip().lower()
                if sexo_normalized not in VALID_SEXO_VALUES:
                    row_errors.append(f"Fila {idx + 2}: Sexo debe ser Masculino, Femenino u Otro")
            
            # Validar cargo
            if pd.isna(row['cargo']) or str(row['cargo']).strip() == '':
                row_errors.append(f"Fila {idx + 2}: Cargo vacío")
            elif has_special_characters(str(row['cargo'])):
                row_errors.append(f"Fila {idx + 2}: Cargo contiene caracteres especiales no permitidos")
            
            # Validar sueldo
            try:
                sueldo = float(row['sueldo'])
                if sueldo <= 0:
                    row_errors.append(f"Fila {idx + 2}: Sueldo debe ser mayor a 0")
            except (ValueError, TypeError):
                row_errors.append(f"Fila {idx + 2}: Sueldo no es un número válido")
            
            if row_errors:
                errors.extend(row_errors)
        
        return len(errors) == 0, errors
    
    @staticmethod
    def process_excel_file(file_content: bytes) -> Dict[str, Any]:
        """
        Procesar archivo Excel completo y validar todas las hojas
        """
        try:
            excel_file = pd.ExcelFile(BytesIO(file_content))
            sheet_names = excel_file.sheet_names
            results = {}

            for sheet_name in sheet_names:
                df = pd.read_excel(excel_file, sheet_name=sheet_name)
                is_valid, errors = ExcelService.validate_sheet(df, sheet_name)
                results[sheet_name] = {
                    "is_valid": is_valid,
                    "errors": errors
                }

            return results
        except Exception as e:
            logger.error(f"Error procesando archivo Excel: {e}")
            raise ValueError(f"Error al procesar archivo Excel: {str(e)}")