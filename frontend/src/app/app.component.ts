import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

// Importar todos los componentes hijos
import { UploadComponent } from './components/upload/upload.component';
import { PreviewComponent } from './components/preview/preview.component';
import { EmployeesListComponent } from './components/employees-list/employees-list.component';
import { StatisticsComponent } from './components/statistics/statistics.component';

import { ValidationResult } from './models/api-response.interface';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    UploadComponent,
    PreviewComponent,
    EmployeesListComponent,
    StatisticsComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Sistema de Gestión de Nómina';
  
  // Estados del flujo
  currentStep: 'upload' | 'preview' | 'view' = 'upload';
  
  // Datos compartidos entre componentes
  validationResult: ValidationResult | null = null;
  fileContent: File | null = null;
  selectedSheets: string[] = [];
  showEmployees: boolean = false;

  /**
   * Manejador del evento de validación del archivo
   * CORRECCIÓN: Tipar correctamente el parámetro
   */
  onFileValidated(event: { validation: ValidationResult; file: File }): void {
    console.log('Archivo validado:', event);
    this.validationResult = event.validation;
    this.fileContent = event.file;
    this.currentStep = 'preview';
  }

  /**
   * Manejador de selección de hojas
   */
  onSheetsSelected(sheets: string[]): void {
    console.log('Hojas seleccionadas:', sheets);
    this.selectedSheets = sheets;
  }

  /**
   * Manejador de importación completada
   */
  onImportComplete(): void {
    console.log('Importación completada');
    this.currentStep = 'view';
    this.showEmployees = true;
    
    // Forzar actualización
    setTimeout(() => {
      this.showEmployees = false;
      setTimeout(() => {
        this.showEmployees = true;
      }, 50);
    }, 100);
  }

  /**
   * Resetea el flujo para una nueva importación
   */
  resetUpload(): void {
    this.currentStep = 'upload';
    this.validationResult = null;
    this.fileContent = null;
    this.selectedSheets = [];
    this.showEmployees = false;
  }
}