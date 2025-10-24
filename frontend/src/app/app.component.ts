import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadComponent } from './components/upload/upload.component';
import { PreviewComponent } from './components/preview/preview.component';
import { EmployeesListComponent } from './components/employees-list/employees-list.component';
import { StatisticsComponent } from './components/statistics/statistics.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    UploadComponent,
    PreviewComponent,
    EmployeesListComponent,
    StatisticsComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Sistema de Nómina';
  currentStep: 'upload' | 'preview' | 'view' = 'upload';
  
  validationResult: any = null;
  fileContent: File | null = null;
  selectedSheets: string[] = [];
  showEmployees: boolean = false;

  onFileValidated(result: any) {
    this.validationResult = result.validation;
    this.fileContent = result.file;
    
    if (result.validation.valid_sheets.length > 0) {
      this.currentStep = 'preview';
    }
  }

  onSheetsSelected(sheets: string[]) {
    this.selectedSheets = sheets;
  }

  onImportComplete() {
    this.currentStep = 'view';
    this.showEmployees = true;
  }

  resetUpload() {
    this.currentStep = 'upload';
    this.validationResult = null;
    this.fileContent = null;
    this.selectedSheets = [];
    this.showEmployees = false;
  }
}