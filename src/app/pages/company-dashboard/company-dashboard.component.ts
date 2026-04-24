// company-dashboard.component.ts
import { Component, OnInit, AfterViewInit, OnDestroy,ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import Chart from 'chart.js/auto';
import { AlertaService } from '../../services/alertas.service';
import { DashboardService } from '../../services/dashboard.service';
import { UsuarioService } from '../../services/usuario.service';
import { Subject, Subscription, forkJoin, takeUntil } from 'rxjs';
import { LucideAngularModule, Wind, Droplets, Zap, ArrowRight } from 'lucide-angular';

@Component({
  selector: 'app-company-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe, LucideAngularModule],
  templateUrl: './company-dashboard.component.html',
  styleUrl: './company-dashboard.component.css'
})
export class CompanyDashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  readonly iconAire    = Wind;
  readonly iconAgua    = Droplets;
  readonly iconEnergia = Zap;
  readonly iconArrow   = ArrowRight;

  private destroy$  = new Subject<void>();
  
  private clockTimer?: any;
  private alertaSub?: Subscription;
  

  

  // Métricas reales
  airQuality   = 0;
  waterQuality = 7;
  energyUsage  = 0;
  co2          = 0;

  isDarkMode = false;

    //Flags dinámicos por zona
  tieneAire    = false;
  tieneAgua    = false;
  tieneEnergia = false;
 
  //Flags globales de empresa (para KPI strip)
  empresaTieneAire    = false;
  empresaTieneAgua    = false;
  empresaTieneEnergia = false;


    // Zonas
  zonas:           string[] = [];
  zonaSeleccionada = '';
  sensoresPorZona  = new Map<string, any[]>();
  todosSensores:   any[] = [];


  // plan
planActual= 'Básico'
  empresaId = 0;
  fechaActual = new Date();

// UI
  cargando = true;
  alertas: any[] = [];

  // Charts
  private chartAir:    any;
  private chartWater:  any;
  private chartEnergy: any;

  private airHistory:    number[] = [0, 0, 0, 0, 0, 0];
  private waterHistory:  number[] = [7, 7, 7, 7, 7, 7];
  private energyHistory: number[] = [0, 0, 0, 0, 0, 0];


  // KPIs globales (toda la empresa)
  totalSensores      = 0;
  sensoresActivos    = 0;
  alertasAltas       = 0;
  alertasNoAtendidas = 0;
  ecoScore           = 100;
  estadoGeneral      = 'BUENO';


  constructor(
    private alertaService: AlertaService,
    private dashboardService: DashboardService,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarTodo();
    this.clockTimer = setInterval(() => this.fechaActual = new Date(), 60000);
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearInterval(this.clockTimer);
    this.alertaSub?.unsubscribe();
    this.chartAir?.destroy();
    this.chartWater?.destroy();
    this.chartEnergy?.destroy();
  }


cargarTodo() {
    this.cargando = true;
    this.usuarioService.getPerfil().pipe(takeUntil(this.destroy$)).subscribe({
      next: (user: any) => {
        // CORRECCIÓN: Buscamos el ID en cualquier nivel del objeto
        this.empresaId = user.empresaId || user.empresa?.id || 0;
        this.planActual = user.planNombre || 'Básico';

        if (!this.empresaId) {
          console.error("No se encontró empresaId en el perfil");
          this.cargando = false;
          return;
        }

        // Ejecutamos las dos cargas principales en paralelo
        forkJoin({
          dashboard: this.dashboardService.getDashboardEmpresa(this.empresaId),
          sensores: this.dashboardService.getSensores(this.empresaId)
        }).pipe(takeUntil(this.destroy$)).subscribe({
          next: (res: any) => {
            // Datos del dashboard
            this.totalSensores = res.dashboard.totalSensores || 0;
            this.sensoresActivos = res.dashboard.sensoresActivos || 0;
            this.estadoGeneral = res.dashboard.estadoGeneral || 'BUENO';

            // Sensores y Flags globales
            this.todosSensores = res.sensores;
            this.empresaTieneAire = res.sensores.some((s: any) => s.tipo === 'AIRE');
            this.empresaTieneAgua = res.sensores.some((s: any) => s.tipo === 'AGUA');
            this.empresaTieneEnergia = res.sensores.some((s: any) => s.tipo === 'ENERGIA');

            this.agruparPorZona(res.sensores);
            this.cargando = false;
            
            // 👈 Forzamos a Angular a ver los nuevos *ngIf antes de crear los gráficos
            this.cdr.detectChanges(); 
          },
          error: () => this.cargando = false
        });

        this.cargarAlertas();
      }
    });
  }
  
  private agruparPorZona(sensores: any[]) {
    console.log("Sensores recibidos del backend:", sensores);
    this.sensoresPorZona = new Map();
    if (!sensores || sensores.length === 0) {
    this.zonas = [];
    this.cargando = false;
    return;
  }
  
    sensores.forEach(s => {
      const zona = s.ubicacion?.trim() || 'General';
      if (!this.sensoresPorZona.has(zona)) this.sensoresPorZona.set(zona, []);
      this.sensoresPorZona.get(zona)!.push(s);
    });
    this.zonas = Array.from(this.sensoresPorZona.keys());
    if (this.zonas.length > 0) {
      this.zonaSeleccionada = this.zonas[0];
      this.cargarMetricasZona(this.zonaSeleccionada);
    }
  }

  
  // ── MÉTRICAS POR ZONA ──────────────────────────────────────────
 
  cargarMetricasZona(zona: string) {
    const sensoresDeZona = this.sensoresPorZona.get(zona) ?? [];
 
    // Qué tipos hay en esta zona específica
    this.tieneAire    = sensoresDeZona.some(s => s.tipo === 'AIRE');
    this.tieneAgua    = sensoresDeZona.some(s => s.tipo === 'AGUA');
    this.tieneEnergia = sensoresDeZona.some(s => s.tipo === 'ENERGIA');
 
    this.airQuality = 0; this.waterQuality = 7; this.energyUsage = 0;
    this.chartAir?.destroy(); this.chartWater?.destroy(); this.chartEnergy?.destroy();
 
    if (sensoresDeZona.length === 0) return;

    this.cdr.detectChanges(); 
 
    forkJoin(sensoresDeZona.map(s => this.dashboardService.getDashboardPorSensor(s.id))).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results: any[]) => {
        results.forEach(data => {
          if (data.promedioPM25   > 0) this.airQuality   = data.promedioPM25;
          if (data.promedioPH     > 0) this.waterQuality = data.promedioPH;
          if (data.consumoEnergia > 0) this.energyUsage  = data.consumoEnergia;
        });
        this.airHistory.fill(this.airQuality);
        this.waterHistory.fill(this.waterQuality);
        this.energyHistory.fill(this.energyUsage);

        setTimeout(() => this.crearGraficos(), 150);
      },
      error: () => setTimeout(() => this.crearGraficos(), 200)
    });
  }

  
  cambiarZona(event: any) {
    this.zonaSeleccionada = event.target.value;
    this.cargarMetricasZona(this.zonaSeleccionada);
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
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#334155', font: { size: 10 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#334155', font: { size: 10 } } }
      }
    };


      if (this.tieneAire) {
      const el = document.getElementById('airChart') as HTMLCanvasElement;
      if (el) this.chartAir = new Chart(el, {
        type: 'line',
        data: { labels, datasets: [{ data: [...this.airHistory], borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)', fill: true, tension: 0.4, pointRadius: 2 }] },
        options: { ...base, scales: { ...base.scales, y: { ...base.scales.y, beginAtZero: true } } }
      });
    }

    if (this.tieneAgua) {
      const el = document.getElementById('waterChart') as HTMLCanvasElement;
      if (el) this.chartWater = new Chart(el, {
        type: 'line',
        data: { labels, datasets: [{ data: [...this.waterHistory], borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.08)', fill: true, tension: 0.4, pointRadius: 2 }] },
        options: { ...base, scales: { ...base.scales, y: { ...base.scales.y, min: 0, max: 14 } } }
      });
    }

      if (this.tieneEnergia) {
      const el = document.getElementById('energyChart') as HTMLCanvasElement;
      if (el) this.chartEnergy = new Chart(el, {
        type: 'bar',
        data: { labels, datasets: [{ data: [...this.energyHistory], backgroundColor: 'rgba(59,130,246,0.6)', borderRadius: 4 }] },
        options: { ...base, scales: { ...base.scales, y: { ...base.scales.y, beginAtZero: true } } }
      });
    }
  }

 exportarReporte() {
  if (!this.empresaId) return;

  this.dashboardService.descargarReporte(this.empresaId).subscribe({
    next: (blob: Blob) => {
      // Creamos un link temporal en el navegador para iniciar la descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Reporte_EcoSensor_${new Date().toLocaleDateString('es-PE')}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url); // Limpiamos memoria
    },
    error: (err) => {
      console.error('Error al descargar el PDF:', err);
    }
  });
}

  getAirStatus()  { return this.airQuality < 50 ? 'Buena' : this.airQuality < 100 ? 'Moderada' : 'Peligrosa'; }
  getAirClass()   { return this.airQuality < 50 ? 'good'  : this.airQuality < 100 ? 'medium'   : 'bad'; }
  getWaterStatus(){ return (this.waterQuality >= 6.5 && this.waterQuality <= 8) ? 'Potable' : 'No potable'; }
  getWaterClass() { return (this.waterQuality >= 6.5 && this.waterQuality <= 8) ? 'good' : 'bad'; }
  getEstadoClass(){ return this.estadoGeneral === 'CRITICO' ? 'bad' : this.estadoGeneral === 'MEDIO' ? 'medium' : 'good'; }

    get sensoresZonaActual(): number {
    return this.sensoresPorZona.get(this.zonaSeleccionada)?.length ?? 0;
  }

}