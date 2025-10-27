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
            valid_sheets = []
            invalid_sheets = []
            
            for sheet_name in excel_file.sheet_names:
                try:
                    df = pd.read_excel(excel_file, sheet_name=sheet_name)
                    is_valid, errors = ExcelService.validate_sheet(df, sheet_name)
                    
                    sheet_info = {
                        "name": sheet_name,
                        "rows": len(df),
                        "valid": is_valid,
                        "errors": errors
                    }
                    
                    if is_valid:
                        valid_sheets.append(sheet_info)
                        logger.info(f"✅ Hoja válida: {sheet_name} ({len(df)} filas)")
                    else:
                        invalid_sheets.append(sheet_info)
                        logger.warning(f"⚠️ Hoja inválida: {sheet_name} - {len(errors)} errores")
                        
                except Exception as e:
                    logger.error(f"Error procesando hoja {sheet_name}: {e}")
                    invalid_sheets.append({
                        "name": sheet_name,
                        "rows": 0,
                        "valid": False,
                        "errors": [f"Error al procesar la hoja: {str(e)}"]
                    })
            
            return {
                "valid_sheets": valid_sheets,
                "invalid_sheets": invalid_sheets,
                "total_sheets": len(excel_file.sheet_names)
            }
            
        except Exception as e:
            logger.error(f"Error procesando archivo Excel: {e}")
            raise ValueError(f"Error al procesar archivo: {str(e)}")
    
    @staticmethod
    def get_preview_data(file_content: bytes, sheet_names: List[str]) -> List[Dict[str, Any]]:
        """
        Obtener preview de datos de hojas seleccionadas
        """
        previews = []
        
        try:
            excel_file = pd.ExcelFile(BytesIO(file_content))
            
            for sheet_name in sheet_names:
                if sheet_name in excel_file.sheet_names:
                    df = pd.read_excel(excel_file, sheet_name=sheet_name)
                    df.columns = [normalize_column_name(col) for col in df.columns]
                    
                    # Convertir a diccionario y normalizar
                    data = df.to_dict('records')
                    for record in data:
                        # Normalizar sexo
                        if 'sexo' in record:
                            sexo = str(record['sexo']).strip().lower()
                            if sexo == 'masculino':
                                record['sexo'] = 'Masculino'
                            elif sexo == 'femenino':
                                record['sexo'] = 'Femenino'
                            elif sexo == 'otro':
                                record['sexo'] = 'Otro'
                    
                    previews.append({
                        "sheet_name": sheet_name,
                        "data": data[:100],  # Limitar a 100 registros para preview
                        "total_rows": len(df)
                    })
                    
        except Exception as e:
            logger.error(f"Error obteniendo preview: {e}")
            raise
        
        return previews
    
    @staticmethod
    def prepare_data_for_import(file_content: bytes, sheet_names: List[str]) -> List[Dict[str, Any]]:
        """
        Preparar datos de hojas seleccionadas para importar a BD
        """
        all_data = []
        
        try:
            excel_file = pd.ExcelFile(BytesIO(file_content))
            
            for sheet_name in sheet_names:
                if sheet_name in excel_file.sheet_names:
                    df = pd.read_excel(excel_file, sheet_name=sheet_name)
                    df.columns = [normalize_column_name(col) for col in df.columns]
                    
                    for _, row in df.iterrows():
                        # Normalizar sexo
                        sexo = str(row['sexo']).strip().lower()
                        if sexo == 'masculino':
                            sexo_value = 'Masculino'
                        elif sexo == 'femenino':
                            sexo_value = 'Femenino'
                        else:
                            sexo_value = 'Otro'
                        
                        employee_data = {
                            "nombre": str(row['nombre']).strip(),
                            "edad": int(row['edad']),
                            "sexo": sexo_value,
                            "cargo": str(row['cargo']).strip(),
                            "sueldo": float(row['sueldo'])
                        }
                        all_data.append(employee_data)
                        
            logger.info(f"✅ Preparados {len(all_data)} registros para importar")
            return all_data
            
        except Exception as e:
            logger.error(f"Error preparando datos: {e}")
            raise