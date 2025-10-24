import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.css']
})
export class PreviewComponent implements OnChanges {
  @Input() validationResult: any;
  @Input() file: File | null = null;
  @Output() sheetsSelected = new EventEmitter<string[]>();
  @Output() importComplete = new EventEmitter<void>();
  @Output() backToUpload = new EventEmitter<void>();

  selectedSheets: Set<string> = new Set();
  previewData: any[] = [];
  isLoadingPreview: boolean = false;
  isImporting: boolean = false;
  showPreview: boolean = false;
  activeTab: string = '';
  importMessage: string = '';
  importError: string = '';

  constructor(private apiService: ApiService) {}

  ngOnChanges() {
    if (this.validationResult && this.validationResult.valid_sheets.length > 0) {
      // Seleccionar todas las hojas válidas por defecto
      this.validationResult.valid_sheets.forEach((sheet: any) => {
        this.selectedSheets.add(sheet.name);
      });
      this.activeTab = this.validationResult.valid_sheets[0].name;
    }
  }

  toggleSheet(sheetName: string) {
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

  loadPreview() {
    if (!this.file || this.selectedSheets.size === 0) {
      return;
    }

    this.isLoadingPreview = true;
    this.importError = '';

    this.apiService.previewExcel(this.file, Array.from(this.selectedSheets)).subscribe({
      next: (response) => {
        this.isLoadingPreview = false;
        if (response.status === 200) {
          this.previewData = response.data;
          this.showPreview = true;
          if (this.previewData.length > 0) {
            this.activeTab = this.previewData[0].sheet_name;
          }
        }
      },
      error: (error) => {
        this.isLoadingPreview = false;
        this.importError = error.error?.message || 'Error al cargar preview';
        console.error('Error cargando preview:', error);
      }
    });
  }

  importData() {
    if (!this.file || this.selectedSheets.size === 0) {
      return;
    }

    this.isImporting = true;
    this.importError = '';
    this.importMessage = '';

    this.apiService.importExcel(this.file, Array.from(this.selectedSheets)).subscribe({
      next: (response) => {
        this.isImporting = false;
        if (response.status === 201 || response.status === 200) {
          this.importMessage = 'Los datos fueron cargados correctamente a la base de datos';
          setTimeout(() => {
            this.importComplete.emit();
          }, 2000);
        } else {
          this.importError = response.message || 'Error al importar datos';
        }
      },
      error: (error) => {
        this.isImporting = false;
        this.importError = error.error?.message || 'Error al importar datos';
        console.error('Error importando datos:', error);
      }
    });
  }

  setActiveTab(sheetName: string) {
    this.activeTab = sheetName;
  }

  getPreviewForSheet(sheetName: string) {
    return this.previewData.find(p => p.sheet_name === sheetName);
  }

  goBack() {
    this.backToUpload.emit();
  }
}