import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse as HttpError } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { 
  ApiResponse, 
  ValidationResult, 
  PreviewData, 
  ImportResult 
} from '../models/api-response.interface';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8000/api/v1';

  constructor(private http: HttpClient) {}

/**
 * Valida un archivo Excel y retorna las hojas válidas e inválidas
 * @param file Archivo Excel a validar
 * @returns Observable con el resultado de la validación
 */
validateExcel(file: File): Observable<ApiResponse<ValidationResult>> {
  const formData = new FormData();
  formData.append('file', file);

  return this.http.post<ApiResponse<ValidationResult>>(
    `${this.apiUrl}/validate`,  // ✅ Esto ahora apunta a /api/v1/validate
    formData
  ).pipe(
    catchError(this.handleError)
  );
}

/**
 * Obtiene una previsualización de los datos de las hojas seleccionadas
 * @param file Archivo Excel
 * @param sheets Array con los nombres de las hojas a previsualizar
 * @returns Observable con los datos de previsualización
 */
previewExcel(file: File, sheets: string[]): Observable<ApiResponse<PreviewData[]>> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('sheets', JSON.stringify(sheets));

  return this.http.post<ApiResponse<PreviewData[]>>(
    `${this.apiUrl}/excel/preview`,  // ✅ Cambiado de /preview a /excel/preview
    formData
  ).pipe(
    catchError(this.handleError)
  );
}

/**
 * Importa los datos de las hojas seleccionadas a la base de datos
 * @param file Archivo Excel
 * @param sheets Array con los nombres de las hojas a importar
 * @returns Observable con el resultado de la importación
 */
importExcel(file: File, sheets: string[]): Observable<ApiResponse<ImportResult>> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('sheets', JSON.stringify(sheets));

  return this.http.post<ApiResponse<ImportResult>>(
    `${this.apiUrl}/excel/import`,  // ✅ Cambiado de /import a /excel/import
    formData
  ).pipe(
    catchError(this.handleError)
  );
}

  /**
   * Obtiene la lista de todos los empleados
   * @returns Observable con el array de empleados
   */
  getEmployees(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.apiUrl}/employees`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene estadísticas generales de los empleados
   * @returns Observable con las estadísticas
   */
  getStatistics(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/statistics`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina un empleado por su ID
   * @param id ID del empleado a eliminar
   * @returns Observable con el resultado de la eliminación
   */
  deleteEmployee(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/employees/${id}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crea un nuevo empleado
   * @param employee Datos del empleado
   * @returns Observable con el empleado creado
   */
  createEmployee(employee: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/employees`,
      employee,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza un empleado existente
   * @param id ID del empleado
   * @param employee Datos actualizados del empleado
   * @returns Observable con el empleado actualizado
   */
  updateEmployee(id: number, employee: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/employees/${id}`,
      employee,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene un empleado por su ID
   * @param id ID del empleado
   * @returns Observable con los datos del empleado
   */
  getEmployeeById(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/employees/${id}`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Health check del servidor
   * @returns Observable con el estado del servidor
   */
  healthCheck(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/health`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene todos los endpoints disponibles
   * @returns Observable con la lista de endpoints
   */
  getEndpoints(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/endpoints`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Reinicia el contenedor Docker
   * @returns Observable con el resultado del reinicio
   */
  restartContainer(): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/restart`,
      {}
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene los errores de importación
   * @returns Observable con los errores registrados
   */
  getImportErrors(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.apiUrl}/errors`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene el historial de importaciones
   * @returns Observable con el historial
   */
  getImportHistory(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.apiUrl}/import-history`
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Manejo centralizado de errores HTTP
   * @param error Error HTTP
   * @returns Observable que emite el error
   */
  private handleError(error: HttpError): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = `Código de error: ${error.status}, mensaje: ${error.statusText}`;
      }
    }

    console.error('Error en ApiService:', errorMessage, error);
    return throwError(() => error);
  }

  /**
   * Obtiene la URL base de la API
   * @returns URL base
   */
  getApiUrl(): string {
    return this.apiUrl;
  }

  /**
   * Cambia la URL base de la API (útil para cambiar entre desarrollo y producción)
   * @param url Nueva URL base
   */
  setApiUrl(url: string): void {
    this.apiUrl = url;
  }
}