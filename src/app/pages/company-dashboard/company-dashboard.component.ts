// company-dashboard.component.ts
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import Chart from 'chart.js/auto';
import { AlertaService } from '../../services/alertas.service';
import { DashboardService } from '../../services/dashboard.service';
import { UsuarioService } from '../../services/usuario.service';
import { Subscription } from 'rxjs';
import { LucideAngularModule, Wind, Droplets, Zap, ArrowRight } from 'lucide-angular';

@Component({
  selector: 'app-company-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, LucideAngularModule],
  templateUrl: './company-dashboard.component.html',
  styleUrl: './company-dashboard.component.css'
})
export class CompanyDashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  planActual: string = 'Básico';

  ecoScore = 100;

  readonly iconAire    = Wind;
  readonly iconAgua    = Droplets;
  readonly iconEnergia = Zap;
  readonly iconArrow   = ArrowRight;

  // KPIs reales
  totalSensores      = 0;
  sensoresActivos    = 0;
  alertasAltas       = 0;
  alertasNoAtendidas = 0;

  // Métricas reales
  airQuality   = 0;
  waterQuality = 7;
  energyUsage  = 0;
  co2          = 0;
  estadoGeneral = 'BUENO';

  isDarkMode = false;

  // UI
  cargando  = true;
  empresaId = 0;
  fechaActual = new Date();

  // Alertas
  alertas: any[] = [];

  // Charts
  private chartAir:    any;
  private chartWater:  any;
  private chartEnergy: any;

  private airHistory:    number[] = [0, 0, 0, 0, 0, 0];
  private waterHistory:  number[] = [7, 7, 7, 7, 7, 7];
  private energyHistory: number[] = [0, 0, 0, 0, 0, 0];

  private clockTimer?: any;
  private alertaSub?: Subscription;


  toggleDarkMode() {
  this.isDarkMode = !this.isDarkMode;
  if (this.isDarkMode) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
}

  constructor(
    private alertaService: AlertaService,
    private dashboardService: DashboardService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.cargarTodo();
    this.clockTimer = setInterval(() => this.fechaActual = new Date(), 60000);
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    clearInterval(this.clockTimer);
    this.alertaSub?.unsubscribe();
    this.chartAir?.destroy();
    this.chartWater?.destroy();
    this.chartEnergy?.destroy();
  }

  cargarTodo() {
    this.cargando = true;

    this.usuarioService.getPerfil().subscribe({
      next: (user: any) => {
        this.empresaId = user.empresaId ?? 0;
        this.planActual = user.planNombre || 'Básico';

        if (!this.empresaId) {
          this.cargando = false;
          return;
        }

        // cargar dashboard empresa
        this.dashboardService.getDashboardEmpresa(this.empresaId).subscribe({
          next: (data: any) => {
            this.ecoScore = data.ecoScore ?? 100;
            this.totalSensores      = data.totalSensores      ?? 0;
            this.sensoresActivos    = data.sensoresActivos    ?? 0;
            this.alertasNoAtendidas = data.alertasNoAtendidas ?? 0;
            this.airQuality         = data.promedioPM25       ?? 0;
            this.waterQuality       = data.promedioPH         ?? 7;
            this.energyUsage        = data.consumoEnergia     ?? 0;
            this.co2                = data.promedioCO2        ?? 0;
            this.estadoGeneral      = data.estadoGeneral      ?? 'BUENO';

            this.airHistory.fill(this.airQuality);
            this.waterHistory.fill(this.waterQuality);
            this.energyHistory.fill(this.energyUsage);

            this.cargando = false;
            setTimeout(() => this.crearGraficos(), 50);
          },
          error: (err) => {
            console.error('Error dashboard empresa:', err);
            this.cargando = false;
            setTimeout(() => this.crearGraficos(), 50);
          }
        });

        this.cargarAlertas();
      },
      error: (err) => {
        console.error('Error perfil:', err);
        this.cargando = false;
      }
    });
  }

  cargarAlertas() {
    this.alertaSub = this.alertaService.getAlertas().subscribe({
      next: (data) => {
        this.alertas      = data.slice(0, 10);
        this.alertasAltas = data.filter((a: any) =>
          a.nivel === 'ALTO' || a.nivel === 'CRITICO'
        ).length;
      },
      error: (err) => console.error('Error alertas:', err)
    });
  }

  crearGraficos() {
    this.chartAir?.destroy();
    this.chartWater?.destroy();
    this.chartEnergy?.destroy();

    const labels = ['t-5', 't-4', 't-3', 't-2', 't-1', 'Ahora'];
    const base = {
      animation: false as const,
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#334155', font: { size: 10 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#334155', font: { size: 10 } } }
      }
    };

    const air    = document.getElementById('airChart')    as HTMLCanvasElement;
    const water  = document.getElementById('waterChart')  as HTMLCanvasElement;
    const energy = document.getElementById('energyChart') as HTMLCanvasElement;

    if (air) this.chartAir = new Chart(air, {
      type: 'line',
      data: { labels, datasets: [{ data: [...this.airHistory],
        borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)',
        fill: true, tension: 0.4, pointRadius: 2 }]},
      options: { ...base, scales: { ...base.scales, y: { ...base.scales.y, beginAtZero: true } } }
    });

    if (water) this.chartWater = new Chart(water, {
      type: 'line',
      data: { labels, datasets: [{ data: [...this.waterHistory],
        borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.08)',
        fill: true, tension: 0.4, pointRadius: 2 }]},
      options: { ...base, scales: { ...base.scales, y: { ...base.scales.y, min: 0, max: 14 } } }
    });

    if (energy) this.chartEnergy = new Chart(energy, {
      type: 'bar',
      data: { labels, datasets: [{ data: [...this.energyHistory],
        backgroundColor: 'rgba(59,130,246,0.6)', borderRadius: 4 }]},
      options: { ...base, scales: { ...base.scales, y: { ...base.scales.y, beginAtZero: true } } }
    });
  }

 exportarReporte() {
  if (!this.empresaId) return;

  this.dashboardService.descargarReporte(this.empresaId).subscribe({
    next: (blob: Blob) => {
      // Creamos un link temporal en el navegador para iniciar la descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Reporte_Ambiental_${new Date().toLocaleDateString()}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url); // Limpiamos memoria
    },
    error: (err) => {
      console.error('Error al descargar el PDF:', err);
      alert('Hubo un error al generar el reporte. Intente de nuevo.');
    }
  });
}

  getAirStatus()  { return this.airQuality < 50 ? 'Buena' : this.airQuality < 100 ? 'Moderada' : 'Peligrosa'; }
  getAirClass()   { return this.airQuality < 50 ? 'good'  : this.airQuality < 100 ? 'medium'   : 'bad'; }
  getWaterStatus(){ return (this.waterQuality >= 6.5 && this.waterQuality <= 8) ? 'Potable' : 'No potable'; }
  getWaterClass() { return (this.waterQuality >= 6.5 && this.waterQuality <= 8) ? 'good' : 'bad'; }
  getEstadoClass(){ return this.estadoGeneral === 'CRITICO' ? 'bad' : this.estadoGeneral === 'MEDIO' ? 'medium' : 'good'; }
}