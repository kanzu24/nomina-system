import re
from typing import List, Set

def normalize_column_name(name: str) -> str:
    """
    Normalizar nombre de columna (eliminar espacios, convertir a minúsculas)
    """
    return name.strip().lower().replace(" ", "_")

def has_special_characters(text: str) -> bool:
    """
    Verificar si un texto contiene caracteres especiales no permitidos
    Permite: letras, números, espacios, guiones, puntos, comas
    """
    pattern = r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\.\-,]+$'
    return not bool(re.match(pattern, str(text)))

def validate_required_columns(df_columns: List[str], required_columns: Set[str]) -> tuple[bool, List[str]]:
    """
    Validar que el DataFrame tenga las columnas requeridas
    """
    normalized_cols = {normalize_column_name(col): col for col in df_columns}
    missing = []
    
    for req_col in required_columns:
        if req_col not in normalized_cols:
            missing.append(req_col)
    
    return len(missing) == 0, missing