import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Employee } from '../../models/employee.model';

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employees-list.component.html',
  styleUrls: ['./employees-list.component.css']
})
export class EmployeesListComponent implements OnInit, OnChanges {
  @Input() refresh: boolean = false;

  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalEmployees: number = 0;
  totalPages: number = 0;
  
  // Filters
  searchTerm: string = '';
  filterSexo: string = '';
  filterCargo: string = '';
  sortColumn: string = 'id';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Unique values for filters
  uniqueSexos: string[] = [];
  uniqueCargos: string[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadEmployees();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['refresh'] && changes['refresh'].currentValue) {
      this.loadEmployees();
    }
  }

  loadEmployees() {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getEmployees(0, 1000).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.status === 200) {
          this.employees = response.data.employees;
          this.totalEmployees = response.data.total;
          this.extractUniqueValues();
          this.applyFilters();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error al cargar empleados';
        console.error('Error cargando empleados:', error);
      }
    });
  }

  extractUniqueValues() {
    this.uniqueSexos = [...new Set(this.employees.map(e => e.sexo))];
    this.uniqueCargos = [...new Set(this.employees.map(e => e.cargo))];
  }

  applyFilters() {
    let filtered = [...this.employees];

    // Search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(e => 
        e.nombre.toLowerCase().includes(term) ||
        e.cargo.toLowerCase().includes(term)
      );
    }

    // Filter by Sexo
    if (this.filterSexo) {
      filtered = filtered.filter(e => e.sexo === this.filterSexo);
    }

    // Filter by Cargo
    if (this.filterCargo) {
      filtered = filtered.filter(e => e.cargo === this.filterCargo);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[this.sortColumn as keyof Employee];
      let bValue: any = b[this.sortColumn as keyof Employee];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredEmployees = filtered;
    this.totalPages = Math.ceil(this.filteredEmployees.length / this.pageSize);
    this.currentPage = 1;
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  get paginatedEmployees(): Employee[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredEmployees.slice(start, end);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  clearFilters() {
    this.searchTerm = '';
    this.filterSexo = '';
    this.filterCargo = '';
    this.applyFilters();
  }

  deleteEmployee(id: number) {
    if (!confirm('¿Está seguro de eliminar este empleado?')) {
      return;
    }

    this.apiService.deleteEmployee(id).subscribe({
      next: (response) => {
        if (response.status === 200) {
          this.loadEmployees();
        }
      },
      error: (error) => {
        console.error('Error eliminando empleado:', error);
        alert('Error al eliminar empleado');
      }
    });
  }

  exportToCSV() {
    const headers = ['ID', 'Nombre', 'Edad', 'Sexo', 'Cargo', 'Sueldo'];
    const rows = this.filteredEmployees.map(e => [
      e.id,
      e.nombre,
      e.edad,
      e.sexo,
      e.cargo,
      e.sueldo
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'empleados.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}