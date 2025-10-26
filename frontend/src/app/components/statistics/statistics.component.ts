import { Component, Input, OnInit, OnChanges, SimpleChanges, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { ApiResponse, HttpErrorResponse } from '../../models/api-response.interface';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

interface BySexo {
  sexo: string;
  total_employees: number;
  average_salary: number;
  total_salary: number;
}

interface ByCargo {
  cargo: string;
  total_employees: number;
  average_salary: number;
}

interface Statistics {
  total_employees: number;
  total_payroll: number;
  average_salary: number;
  average_age: number;
  salary_range: {
    min: number;
    max: number;
  };
  salary_by_gender: {
    Masculino: number;
    Femenino: number;
  };
  employees_by_gender: {
    Masculino: number;
    Femenino: number;
  };
  salary_by_position: Array<{
    cargo: string;
    promedio_sueldo: number;
    cantidad: number;
  }>;
  age_distribution: {
    '18-25': number;
    '26-35': number;
    '36-45': number;
    '46-55': number;
    '56+': number;
  };
  by_sexo: BySexo[];
  by_cargo: ByCargo[];
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() refresh: boolean = false;

  private apiService = inject(ApiService);

  statistics: Statistics | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';

  private genderChart: any = null;
  private salaryChart: any = null;
  private ageChart: any = null;
  private positionChart: any = null;

  ngOnInit(): void {
    this.loadStatistics();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refresh'] && changes['refresh'].currentValue) {
      this.refreshStatistics();
    }
  }

  ngAfterViewInit(): void {
    // Los gráficos se crearán después de cargar los datos
  }

  loadStatistics(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.getStatistics().subscribe({
      next: (response: ApiResponse<any>) => {
        this.isLoading = false;
        if (response.status === 200 && response.data) {
          const rawData = response.data;
          
          this.statistics = {
            total_employees: rawData.total_employees || 0,
            total_payroll: rawData.total_payroll || 0,
            average_salary: rawData.average_salary || 0,
            average_age: rawData.average_age || 0,
            salary_range: rawData.salary_range || { min: 0, max: 0 },
            salary_by_gender: rawData.salary_by_gender || { Masculino: 0, Femenino: 0 },
            employees_by_gender: rawData.employees_by_gender || { Masculino: 0, Femenino: 0 },
            salary_by_position: rawData.salary_by_position || [],
            age_distribution: rawData.age_distribution || {},
            by_sexo: this.transformBySexo(rawData),
            by_cargo: this.transformByCargo(rawData)
          };

          setTimeout(() => this.createCharts(), 100);
        } else {
          this.errorMessage = response.message || 'Error al cargar estadísticas';
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error al cargar estadísticas';
        console.error('Error cargando estadísticas:', error);
      }
    });
  }

  transformBySexo(data: any): BySexo[] {
    const result: BySexo[] = [];
    
    if (data.employees_by_gender) {
      Object.keys(data.employees_by_gender).forEach(sexo => {
        result.push({
          sexo: sexo,
          total_employees: data.employees_by_gender[sexo] || 0,
          average_salary: data.salary_by_gender?.[sexo] ? 
            data.salary_by_gender[sexo] / (data.employees_by_gender[sexo] || 1) : 0,
          total_salary: data.salary_by_gender?.[sexo] || 0
        });
      });
    }
    
    return result;
  }

  transformByCargo(data: any): ByCargo[] {
    if (data.salary_by_position && Array.isArray(data.salary_by_position)) {
      return data.salary_by_position.map((item: any) => ({
        cargo: item.cargo,
        total_employees: item.cantidad || 0,
        average_salary: item.promedio_sueldo || 0
      }));
    }
    return [];
  }

  createCharts(): void {
    if (!this.statistics) return;

    this.createGenderChart();
    this.createSalaryChart();
    this.createAgeChart();
    this.createPositionChart();
  }

  createGenderChart(): void {
    if (!this.statistics) return;
    
    const ctx = document.getElementById('sexoChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.genderChart) {
      this.genderChart.destroy();
    }

    const config: ChartConfiguration<'pie'> = {
      type: 'pie',
      data: {
        labels: this.statistics.by_sexo.map(s => s.sexo),
        datasets: [{
          data: this.statistics.by_sexo.map(s => s.total_employees),
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(255, 206, 86, 0.8)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    };

    this.genderChart = new Chart(ctx, config);
  }

  createSalaryChart(): void {
    if (!this.statistics) return;
    
    const ctx = document.getElementById('salaryBySexoChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.salaryChart) {
      this.salaryChart.destroy();
    }

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: this.statistics.by_sexo.map(s => s.sexo),
        datasets: [{
          label: 'Salario Promedio',
          data: this.statistics.by_sexo.map(s => s.average_salary),
          backgroundColor: [
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }
    };

    this.salaryChart = new Chart(ctx, config);
  }

  createAgeChart(): void {
    if (!this.statistics) return;

    const ctx = document.getElementById('ageChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.ageChart) {
      this.ageChart.destroy();
    }

    const ageData = this.statistics.age_distribution;

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: Object.keys(ageData),
        datasets: [{
          label: 'Cantidad de Empleados',
          data: Object.values(ageData),
          backgroundColor: 'rgba(255, 159, 64, 0.8)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    };

    this.ageChart = new Chart(ctx, config);
  }

  createPositionChart(): void {
    if (!this.statistics || !this.statistics.by_cargo || this.statistics.by_cargo.length === 0) return;
    
    const ctx = document.getElementById('salaryByCargoChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.positionChart) {
      this.positionChart.destroy();
    }

    const topCargos = this.statistics.by_cargo.slice(0, 10);

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: topCargos.map(c => c.cargo),
        datasets: [{
          label: 'Salario Promedio',
          data: topCargos.map(c => c.average_salary),
          backgroundColor: 'rgba(153, 102, 255, 0.8)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false }
        }
      }
    };

    this.positionChart = new Chart(ctx, config);
  }

  refreshStatistics(): void {
    this.destroyCharts();
    this.loadStatistics();
  }

  destroyCharts(): void {
    if (this.genderChart) {
      this.genderChart.destroy();
      this.genderChart = null;
    }
    if (this.salaryChart) {
      this.salaryChart.destroy();
      this.salaryChart = null;
    }
    if (this.ageChart) {
      this.ageChart.destroy();
      this.ageChart = null;
    }
    if (this.positionChart) {
      this.positionChart.destroy();
      this.positionChart = null;
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }
}