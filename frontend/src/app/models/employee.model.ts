export interface Employee {
  id: number;
  nombre: string;
  edad: number;
  sexo: 'Masculino' | 'Femenino' | 'Otro';
  cargo: string;
  sueldo: number;
  created_at: string;
  updated_at: string;
}

export interface SheetInfo {
  name: string;
  rows: number;
  valid: boolean;
  errors: string[];
}

export interface ValidationResult {
  valid_sheets: SheetInfo[];
  invalid_sheets: SheetInfo[];
  total_sheets: number;
}

export interface PreviewData {
  sheet_name: string;
  data: any[];
  total_rows: number;
}

export interface Statistics {
  total_employees: number;
  average_age: number;
  average_salary: number;
  by_sexo: StatisticsBySexo[];
  by_cargo: StatisticsByCargo[];
  salary_range: {
    min: number;
    max: number;
  };
}

export interface StatisticsBySexo {
  sexo: string;
  total_employees: number;
  average_salary: number;
  total_salary: number;
}

export interface StatisticsByCargo {
  cargo: string;
  total_employees: number;
  average_salary: number;
}