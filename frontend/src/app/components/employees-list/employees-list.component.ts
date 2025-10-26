import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ApiResponse, HttpErrorResponse } from '../../models/api-response.interface';

interface Employee {
  id: number;
  nombre: string;
  edad: number;
  sexo: string;
  cargo: string;
  sueldo: number;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employees-list.component.html',
  styleUrls: ['./employees-list.component.css']
})
export class EmployeesListComponent implements OnInit, OnChanges {
  @Input() refresh: boolean = false;

  private apiService = inject(ApiService);

  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // Paginación
  currentPage: number = 1;
  pageSize: number = 10;
  itemsPerPage: number = 10;
  totalEmployees: number = 0;
  totalPages: number = 0;
  
  // Filtros
  searchTerm: string = '';
  filterSexo: string = '';
  filterCargo: string = '';
  sortColumn: string = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Valores únicos para filtros
  uniqueSexos: string[] = [];
  uniqueCargos: string[] = [];

  ngOnInit(): void {
    this.loadEmployees();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refresh'] && changes['refresh'].currentValue) {
      this.loadEmployees();
    }
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getEmployees().subscribe({
      next: (response: ApiResponse<Employee[]>) => {
        this.isLoading = false;
        if (response.status === 200 && response.data) {
          this.employees = response.data;
          this.totalEmployees = this.employees.length;
          this.extractUniqueValues();
          this.applyFilters();
        } else {
          this.errorMessage = response.message || 'Error al cargar empleados';
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error al cargar los datos';
        console.error('Error cargando empleados:', error);
      }
    });
  }

  extractUniqueValues(): void {
    this.uniqueSexos = [...new Set(this.employees.map(e => e.sexo))].sort();
    this.uniqueCargos = [...new Set(this.employees.map(e => e.cargo))].sort();
  }

  applyFilters(): void {
    let filtered = [...this.employees];

    // Búsqueda por texto
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.nombre.toLowerCase().includes(term) ||
        e.cargo.toLowerCase().includes(term) ||
        e.sexo.toLowerCase().includes(term)
      );
    }

    // Filtro por sexo
    if (this.filterSexo) {
      filtered = filtered.filter(e => e.sexo === this.filterSexo);
    }

    // Filtro por cargo
    if (this.filterCargo) {
      filtered = filtered.filter(e => e.cargo === this.filterCargo);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      const valueA = a[this.sortColumn as keyof Employee];
      const valueB = b[this.sortColumn as keyof Employee];

      let comparison = 0;
      if (valueA > valueB) {
        comparison = 1;
      } else if (valueA < valueB) {
        comparison = -1;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.filteredEmployees = filtered;
    this.calculateTotalPages();
    this.currentPage = 1;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  sortBy(column: keyof Employee): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredEmployees.length / this.pageSize);
  }

  get paginatedEmployees(): Employee[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredEmployees.slice(start, end);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterSexo = '';
    this.filterCargo = '';
    this.applyFilters();
  }

  deleteEmployee(id: number): void {
    if (!confirm('¿Está seguro de eliminar este empleado?')) {
      return;
    }

    // Si tienes endpoint de eliminación, descomenta esto:
    /*
    this.apiService.deleteEmployee(id).subscribe({
      next: (response: ApiResponse<any>) => {
        if (response.status === 200) {
          this.loadEmployees();
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error eliminando empleado:', error);
        alert('Error al eliminar empleado');
      }
    });
    */
    
    // Temporal: eliminar del array local
    this.employees = this.employees.filter(e => e.id !== id);
    this.applyFilters();
  }

  refreshData(): void {
    this.loadEmployees();
  }

  exportToCSV(): void {
    const headers = ['ID', 'Nombre', 'Edad', 'Sexo', 'Cargo', 'Sueldo', 'Fecha Creación'];
    const csvData = this.filteredEmployees.map(emp => [
      emp.id,
      emp.nombre,
      emp.edad,
      emp.sexo,
      emp.cargo,
      emp.sueldo,
      this.formatDate(emp.created_at)
    ]);

    let csv = headers.join(',') + '\n';
    csvData.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `empleados_${new Date().getTime()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}