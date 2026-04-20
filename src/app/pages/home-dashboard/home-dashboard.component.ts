// home-dashboard.component.ts — corregido
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';
import { Subscription, Subject, takeUntil,forkJoin, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AlertaService } from '../../services/alertas.service';
import { DashboardService } from '../../services/dashboard.service';
import { SensorService } from '../../services/sensor.service';
import { UsuarioService } from '../../services/usuario.service';
import { WebSocketService } from '../../services/websocket.service';
import { LucideAngularModule, Wind, Droplets, Zap, ArrowRight } from 'lucide-angular';

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './home-dashboard.component.html',
  styleUrl: './home-dashboard.component.css'
})
export class HomeDashboardComponent implements OnInit, OnDestroy {

  readonly iconAire    = Wind;
  readonly iconAgua    = Droplets;
  readonly iconEnergia = Zap;
  readonly iconArrow   = ArrowRight;

  private destroy$ = new Subject<void>();
  private alertaTimer?: any;

  private wsSubscriptions: Subscription[] = [];

  sensores:        any[] = [];
  zonas:           string[] = [];
  zonaSeleccionada = '';
  sensoresPorZona  = new Map<string, any[]>();
  alertas:         any[] = [];

  // Plan del usuario
  planActual  = 'Básico';
  tipoUsuario = 'HOGAR';
  empresaId   = 0;

  // Métricas
  airQuality   = 0;
  waterQuality = 7;
  energyUsage  = 0;

   tieneAire    = false;
  tieneAgua    = false;
  tieneEnergia = false;

  // Gráficos
  chartAir:    any;
  chartWater:  any;
  chartEnergy: any;

  private airHistory:    number[] = [0, 0, 0, 0, 0];
  private waterHistory:  number[] = [7, 7, 7, 7, 7];
  private energyHistory: number[] = [0, 0, 0, 0, 0];

  cargando = true;

  constructor(
    private alertaService:    AlertaService,
    private dashboardService: DashboardService,
    private sensorService:    SensorService,
    private wsService:        WebSocketService,
    private usuarioService:   UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
    this.cargarAlertas();

    this.alertaTimer = setInterval(() => this.cargarAlertas(), 60000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // 2. Limpiar WebSockets físicamente
    this.wsService.desuscribirTodo();

    // 3. Limpiar Timers
    if (this.alertaTimer) clearInterval(this.alertaTimer);

    // 4. Destruir instancias de Chart.js para liberar RAM
    this.chartAir?.destroy();
    this.chartWater?.destroy();
    this.chartEnergy?.destroy();
  }

  // ── PASO 1: perfil → decide flujo ─────────────────────────────

  cargarPerfil() {
    this.cargando = true;
    this.usuarioService.getPerfil()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (user: any) => {
        this.tipoUsuario = user.tipoUsuario ?? 'HOGAR';
        this.empresaId   = user.empresaId   ?? 0;
        this.planActual = (user.planNombre || user.empresa?.plan?.nombre) ?? 'Básico';

        if (this.tipoUsuario === 'EMPRESA' && this.empresaId > 0) {
          this.cargarSensoresEmpresa(this.empresaId);
        } else {
          //HOGAR: carga sus propios sensores directamente
          this.cargarSensoresHogar();
        }
      },
      error: () => {
        this.cargando = false;
      }
    });
  }


 

  // ── HOGAR: /api/sensores/mis-sensores ─────────────────────────

  cargarSensoresHogar() {
    this.sensorService.getMisSensores()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.sensores = data;
          this.agruparPorZona(data);
          this.cargando = false;
        },
        error: () => this.cargando = false
      });
  }

  // ── EMPRESA: /api/dashboard/empresa/{id}/sensores ─────────────

  cargarSensoresEmpresa(empresaId: number) {
    this.dashboardService.getSensores(empresaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.sensores = data;
          this.agruparPorZona(data);
          this.cargando = false;
        },
        error: () => this.cargando = false
      });
  }

  // ── AGRUPACIÓN POR ZONA ───────────────────────────────────────

  private agruparPorZona(sensores: any[]) {
    this.sensoresPorZona = new Map();

    sensores.forEach(s => {
      const zona = s.ubicacion?.trim() || 'Sin ubicación';
      if (!this.sensoresPorZona.has(zona)) this.sensoresPorZona.set(zona, []);
      this.sensoresPorZona.get(zona)!.push(s);
    });

    this.zonas = Array.from(this.sensoresPorZona.keys());

    if (this.zonas.length > 0) {
      this.zonaSeleccionada = this.zonas[0];
      this.cargarDashboardZona(this.zonaSeleccionada);
    }
  }

  // ── CARGA POR ZONA ────────────────────────────────────────────

  cargarDashboardZona(zona: string) {
    const sensoresDeZona = this.sensoresPorZona.get(zona) ?? [];
  
     this.tieneAire    = sensoresDeZona.some(s => s.tipo === 'AIRE');
    this.tieneAgua    = sensoresDeZona.some(s => s.tipo === 'AGUA');
    this.tieneEnergia = sensoresDeZona.some(s => s.tipo === 'ENERGIA');


  // Limpieza inicial
  this.airQuality = 0; this.waterQuality = 7; this.energyUsage = 0;
  this.wsService.desuscribirTodo();
      this.chartAir?.destroy(); this.chartWater?.destroy(); this.chartEnergy?.destroy();


  if (sensoresDeZona.length === 0) {
    
    return;
  }

 

  // Ejecutamos todo y esperamos el final (Evita la lentitud)
    forkJoin(sensoresDeZona.map(s => this.dashboardService.getDashboardPorSensor(s.id))).subscribe({
    next: (results: any[]) => {
      results.forEach(data => {
        if (data.promedioPM25 > 0) this.airQuality = data.promedioPM25;
        if (data.promedioPH > 0) this.waterQuality = data.promedioPH;
        if (data.consumoEnergia > 0) this.energyUsage = data.consumoEnergia;
      });
      
      this.airHistory.fill(this.airQuality);
      this.waterHistory.fill(this.waterQuality);
      this.energyHistory.fill(this.energyUsage);
      
      // SOLO CREAMOS LOS GRÁFICOS UNA VEZ AL FINAL
      setTimeout(() => this.crearGraficos(), 50);

      // Conectamos WebSockets después de cargar la data histórica
      sensoresDeZona.forEach(s => this.conectarWebSocketSensor(s.deviceId));
    },
    error: () => setTimeout(() => this.crearGraficos(), 50) 
  });
  }

  // ── WEBSOCKET ─────────────────────────────────────────────────

  private conectarWebSocketSensor(deviceId: string) {
    this.wsService.conectar(deviceId);
    const sub = this.wsService.getLecturas().subscribe(lectura => {
      if (!lectura) return;
      switch (lectura.tipoMetrica) {
        case 'PM25':     this.airQuality   = lectura.valor ?? this.airQuality;   this.airHistory.push(this.airQuality);     this.airHistory.shift();    break;
        case 'PH':       this.waterQuality = lectura.valor ?? this.waterQuality; this.waterHistory.push(this.waterQuality); this.waterHistory.shift();  break;
        case 'ENERGIA':  this.energyUsage  = lectura.valor ?? this.energyUsage;  this.energyHistory.push(this.energyUsage); this.energyHistory.shift(); break;
      }
      this.actualizarGraficos();
      //clearTimeout(this.alertaTimer);
      //this.alertaTimer = setTimeout(() => this.cargarAlertas(), 30000);
    });
    this.wsSubscriptions.push(sub);
  }

  cambiarZona(event: any) {
    this.zonaSeleccionada = event.target.value;
    this.cargarDashboardZona(this.zonaSeleccionada);
  }

  cargarAlertas() {
    this.alertaService.getAlertas()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => this.alertas = data.slice(0, 8));
  }

  // ── GRÁFICOS ──────────────────────────────────────────────────

  crearGraficos() {
    this.chartAir?.destroy(); this.chartWater?.destroy(); this.chartEnergy?.destroy();
    const labels = ['', '', '', '', 'Ahora'];
    const base = {
      animation: false as any, responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } },
        x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } }
      }
    };

    if (this.tieneAire) {
      const el = document.getElementById('homeAirChart') as HTMLCanvasElement;
      if (el) this.chartAir = new Chart(el, { type: 'line', data: { labels, datasets: [{ data: [...this.airHistory], borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4, pointRadius: 0 }] }, options: { ...base, scales: { ...base.scales, y: { ...base.scales.y, beginAtZero: true } } } });
    }
    if (this.tieneAgua) {
      const el = document.getElementById('homeWaterChart') as HTMLCanvasElement;
      if (el) this.chartWater = new Chart(el, { type: 'line', data: { labels, datasets: [{ data: [...this.waterHistory], borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.1)', fill: true, tension: 0.4, pointRadius: 0 }] }, options: { ...base, scales: { ...base.scales, y: { ...base.scales.y, min: 0, max: 14 } } } });
    }
    if (this.tieneEnergia) {
      const el = document.getElementById('homeEnergyChart') as HTMLCanvasElement;
      if (el) this.chartEnergy = new Chart(el, { type: 'bar', data: { labels, datasets: [{ data: [...this.energyHistory], backgroundColor: 'rgba(59,130,246,0.6)', borderRadius: 4 }] }, options: { ...base, scales: { ...base.scales, y: { ...base.scales.y, beginAtZero: true } } } });
    }
  }

  actualizarGraficos() {
    if (this.chartAir)    { this.chartAir.data.datasets[0].data    = [...this.airHistory];    this.chartAir.update('none'); }
    if (this.chartWater)  { this.chartWater.data.datasets[0].data  = [...this.waterHistory];  this.chartWater.update('none'); }
    if (this.chartEnergy) { this.chartEnergy.data.datasets[0].data = [...this.energyHistory]; this.chartEnergy.update('none'); }
  }

  // ── HELPERS ───────────────────────────────────────────────────

  getAirStatusText()   { return this.airQuality < 50  ? 'Buena' : this.airQuality < 100  ? 'Moderada' : 'Peligrosa'; }
  getAirStatusClass()  { return this.airQuality < 50  ? 'good'  : this.airQuality < 100  ? 'medium'   : 'bad'; }
  getWaterStatusText() { return this.waterQuality >= 6.5 && this.waterQuality <= 8.5 ? 'Potable' : 'Riesgo'; }
  getWaterStatusClass(){ return this.waterQuality >= 6.5 && this.waterQuality <= 8.5 ? 'good' : 'bad'; }
}