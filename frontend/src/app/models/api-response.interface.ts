export interface ApiResponse<T = any> {
  status: number;
  type_: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  data?: T;
  error?: string;
}

export interface ValidationResult {
  valid_sheets: Array<{
    name: string;
    rows: number;
    columns: string[];
  }>;
  invalid_sheets: Array<{
    name: string;
    errors: string[];
  }>;
  total_sheets: number;
  valid_count: number;
  invalid_count: number;
}

export interface PreviewData {
  sheet_name: string;
  headers: string[];
  rows: any[];
  total_rows: number;
}

export interface ImportResult {
  imported_count: number;
  error_count: number;
  sheets_processed: string[];
}

export interface HttpErrorResponse {
  error?: {
    status: number;
    message: string;
    error?: string;
  };
  status: number;
  message?: string;
}