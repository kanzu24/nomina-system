import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent {
  @Output() fileValidated = new EventEmitter<any>();

  selectedFile: File | null = null;
  isDragging: boolean = false;
  isValidating: boolean = false;
  errorMessage: string = '';
  fileName: string = '';

  constructor(private apiService: ApiService) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.handleFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  handleFile(file: File) {
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

  validateFile() {
    if (!this.selectedFile) return;

    this.isValidating = true;
    this.errorMessage = '';

    this.apiService.validateExcel(this.selectedFile).subscribe({
      next: (response) => {
        this.isValidating = false;
        
        if (response.status === 200) {
          this.fileValidated.emit({
            validation: response.data,
            file: this.selectedFile
          });
        } else {
          this.errorMessage = response.message || 'Error al validar el archivo';
        }
      },
      error: (error) => {
        this.isValidating = false;
        this.errorMessage = error.error?.message || 'Error al procesar el archivo';
        console.error('Error validando archivo:', error);
      }
    });
  }

  removeFile() {
    this.selectedFile = null;
    this.fileName = '';
    this.errorMessage = '';
  }

  triggerFileInput() {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }
}