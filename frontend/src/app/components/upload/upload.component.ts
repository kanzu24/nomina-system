import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { ApiResponse, ValidationResult, HttpErrorResponse } from '../../models/api-response.interface';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent {
  @Output() fileValidated = new EventEmitter<{
    validation: ValidationResult;
    file: File;
  }>();

  // Inyección moderna
  private apiService = inject(ApiService);

  selectedFile: File | null = null;
  isDragging: boolean = false;
  isValidating: boolean = false;
  errorMessage: string = '';
  fileName: string = '';

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  handleFile(file: File): void {
    this.errorMessage = '';
    
    // Validar tipo de archivo
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      this.errorMessage = 'Solo se permiten archivos Excel (.xlsx, .xls)';
      return;
    }

    // Validar tamaño (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.errorMessage = 'El archivo no debe superar los 10MB';
      return;
    }

    this.selectedFile = file;
    this.fileName = file.name;
    this.validateFile();
  }

  validateFile(): void {
    if (!this.selectedFile) return;

    this.isValidating = true;
    this.errorMessage = '';

    this.apiService.validateExcel(this.selectedFile).subscribe({
      next: (response: ApiResponse<ValidationResult>) => {
        this.isValidating = false;
        
        if (response.status === 200 && response.data) {
          this.fileValidated.emit({
            validation: response.data,
            file: this.selectedFile!
          });
        } else {
          this.errorMessage = response.message || 'Error al validar el archivo';
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isValidating = false;
        this.errorMessage = error.error?.message || 'Error al procesar el archivo';
        console.error('Error validando archivo:', error);
      }
    });
  }

  removeFile(): void {
    this.selectedFile = null;
    this.fileName = '';
    this.errorMessage = '';
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }
}