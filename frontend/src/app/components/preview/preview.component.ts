import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { 
  ApiResponse, 
  ValidationResult, 
  PreviewData, 
  ImportResult,
  HttpErrorResponse 
} from '../../models/api-response.interface';

interface SheetValidation {
  name: string;
  rows: number;
  columns: string[];
}

interface InvalidSheet {
  name: string;
  rows: number;
  errors: string[];
}

interface PreviewSheetData {
  sheet_name: string;
  headers: string[];
  rows: any[];
  data: any[];
  total_rows: number;
}

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.css']
})
export class PreviewComponent implements OnChanges {
  @Input() data: any; // 👈 necesario
  @Input() validationResult!: ValidationResult;
  @Input() file: File | null = null;
  @Output() sheetsSelected = new EventEmitter<string[]>();
  @Output() importComplete = new EventEmitter<void>();
  @Output() backToUpload = new EventEmitter<void>();

  private apiService = inject(ApiService);

  selectedSheets: Set<string> = new Set();
  previewData: PreviewSheetData[] = [];
  isLoadingPreview: boolean = false;
  isImporting: boolean = false;
  showPreview: boolean = false;
  activeTab: string = '';
  importMessage: string = '';
  importError: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['validationResult'] && this.validationResult) {
      this.initializeValidation();
    }
  }

  initializeValidation(): void {
    if (this.validationResult && this.validationResult.valid_sheets && this.validationResult.valid_sheets.length > 0) {
      this.selectedSheets.clear();
      
      this.validationResult.valid_sheets.forEach((sheet: any) => {
        this.selectedSheets.add(sheet.name);
      });
      
      this.activeTab = this.validationResult.valid_sheets[0].name;
      this.sheetsSelected.emit(Array.from(this.selectedSheets));
    }
  }

  toggleSheet(sheetName: string): void {
    if (this.selectedSheets.has(sheetName)) {
      this.selectedSheets.delete(sheetName);
    } else {
      this.selectedSheets.add(sheetName);
    }
    this.sheetsSelected.emit(Array.from(this.selectedSheets));
  }

  isSheetSelected(sheetName: string): boolean {
    return this.selectedSheets.has(sheetName);
  }

  get hasSelectedSheets(): boolean {
    return this.selectedSheets.size > 0;
  }

  get selectedSheetsCount(): number {
    return this.selectedSheets.size;
  }

  loadPreview(): void {
    if (!this.file || this.selectedSheets.size === 0) {
      this.importError = 'Debe seleccionar al menos una hoja para previsualizar';
      return;
    }

    this.isLoadingPreview = true;
    this.importError = '';
    this.errorMessage = '';

    this.apiService.previewExcel(this.file, Array.from(this.selectedSheets)).subscribe({
      next: (response: ApiResponse<PreviewData[]>) => {
        this.isLoadingPreview = false;
        if (response.status === 200 && response.data) {
          // Mapear los datos al formato esperado
          this.previewData = response.data.map(sheet => ({
            sheet_name: sheet.sheet_name,
            headers: sheet.headers,
            rows: sheet.rows || [],
            data: sheet.rows || [],
            total_rows: sheet.total_rows
          }));
          this.showPreview = true;
          if (this.previewData.length > 0) {
            this.activeTab = this.previewData[0].sheet_name;
          }
        } else {
          this.importError = response.message || 'Error al cargar preview';
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingPreview = false;
        this.importError = error.error?.message || 'Error al cargar preview';
        this.errorMessage = this.importError;
        console.error('Error cargando preview:', error);
      }
    });
  }

  importData(): void {
    if (!this.file || this.selectedSheets.size === 0) {
      this.importError = 'Debe seleccionar al menos una hoja para importar';
      return;
    }

    this.isImporting = true;
    this.importError = '';
    this.importMessage = '';
    this.errorMessage = '';
    this.successMessage = '';

    this.apiService.importExcel(this.file, Array.from(this.selectedSheets)).subscribe({
      next: (response: ApiResponse<ImportResult>) => {
        this.isImporting = false;
        if (response.status === 201 || response.status === 200) {
          this.importMessage = 'Los datos fueron cargados correctamente a la base de datos';
          this.successMessage = this.importMessage;
          setTimeout(() => {
            this.importComplete.emit();
          }, 2000);
        } else {
          this.importError = response.message || 'Error al importar datos';
          this.errorMessage = this.importError;
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isImporting = false;
        this.importError = error.error?.message || 'Error al importar datos';
        this.errorMessage = this.importError;
        console.error('Error importando datos:', error);
      }
    });
  }

  setActiveTab(sheetName: string): void {
    this.activeTab = sheetName;
  }

  getPreviewForSheet(sheetName: string): PreviewSheetData | undefined {
    return this.previewData.find(p => p.sheet_name === sheetName);
  }

  getSheetData(sheetName: string): PreviewSheetData | undefined {
    return this.getPreviewForSheet(sheetName);
  }

  get validSheets(): SheetValidation[] {
    if (!this.validationResult?.valid_sheets) return [];
    
    return this.validationResult.valid_sheets.map((sheet: any) => ({
      name: sheet.name,
      rows: sheet.rows || 0,
      columns: sheet.columns || []
    }));
  }

  get invalidSheets(): InvalidSheet[] {
    if (!this.validationResult?.invalid_sheets) return [];
    
    return this.validationResult.invalid_sheets.map((sheet: any) => ({
      name: sheet.name,
      rows: sheet.rows || 0,
      errors: sheet.errors || []
    }));
  }

  get hasInvalidSheets(): boolean {
    return this.invalidSheets.length > 0;
  }

  goBack(): void {
    this.backToUpload.emit();
  }

  cancelPreview(): void {
    this.showPreview = false;
    this.previewData = [];
    this.activeTab = '';
  }

  reset(): void {
    this.selectedSheets.clear();
    this.previewData = [];
    this.showPreview = false;
    this.activeTab = '';
    this.importMessage = '';
    this.importError = '';
    this.errorMessage = '';
    this.successMessage = '';
  }
}