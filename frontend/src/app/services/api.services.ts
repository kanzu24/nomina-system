import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee, ValidationResult, PreviewData, Statistics } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8000/api/v1';

  constructor(private http: HttpClient) {}

  // Health Check
  healthCheck(): Observable<any> {
    return this.http.get(`${this.baseUrl.replace('/api/v1', '')}/health`);
  }

  // Employees CRUD
  getEmployees(skip: number = 0, limit: number = 100): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees?skip=${skip}&limit=${limit}`);
  }

  getEmployee(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees/${id}`);
  }

  createEmployee(employee: Partial<Employee>): Observable<any> {
    return this.http.post(`${this.baseUrl}/employees`, employee);
  }

  updateEmployee(id: number, employee: Partial<Employee>): Observable<any> {
    return this.http.put(`${this.baseUrl}/employees/${id}`, employee);
  }

  deleteEmployee(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/employees/${id}`);
  }

  // Excel Operations
  validateExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/excel/validate`, formData);
  }

  previewExcel(file: File, selectedSheets: string[]): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('selected_sheets', JSON.stringify(selectedSheets));
    return this.http.post(`${this.baseUrl}/excel/preview`, formData);
  }

  importExcel(file: File, selectedSheets: string[]): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('selected_sheets', JSON.stringify(selectedSheets));
    return this.http.post(`${this.baseUrl}/excel/import`, formData);
  }

  // Statistics
  getStatistics(): Observable<any> {
    return this.http.get(`${this.baseUrl}/statistics`);
  }

  // System
  restartContainer(): Observable<any> {
    return this.http.post(`${this.baseUrl}/system/restart`, {});
  }

  getRoutes(): Observable<any> {
    return this.http.get(`${this.baseUrl}/system/routes`);
  }
}