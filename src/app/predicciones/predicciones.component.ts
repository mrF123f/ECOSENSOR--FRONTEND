// predicciones.component.ts
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { UsuarioService } from '../services/usuario.service';
import { switchMap } from 'rxjs/operators';
import { environment } from '../environments/environment';


declare var anime: any;

interface Anomalia {
  id: number;
  fecha: string;
  tipoMetrica: string;
  valor: number;
  valorEsperado: number;
  desviacion: number;
  nivel: string;
  sensor: string;
  mensaje: string;
  atendida: boolean;
}

@Component({
  selector: 'app-predicciones',
  standalone: true,
  imports: [CommonModule, RouterModule, DecimalPipe, DatePipe],
  templateUrl: './predicciones.component.html',
  styleUrls: ['./predicciones.component.css']
})
export class PrediccionesComponent implements OnInit, AfterViewInit {

  // datos
  anomalias:       Anomalia[] = [];
  alertasPredictivas: any[] = [];
  totalAnomalias   = 0;
  anomaliasCriticas = 0;
  sensoresEnRiesgo  = 0;
  ecoScore          = 0;

  // UI
  cargando = true;
  planBloqueado = false;
  planActual = 'Básico';
  filtroNivel = 'TODOS';
  empresaId = 0;

    private apiUrl = environment.apiUrl;


  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.usuarioService.getPerfil().subscribe({
      next: (user: any) => {
        this.planActual  = user.planNombre ?? 'Básico';
        this.empresaId   = user.empresaId  ?? 0;
         this.planBloqueado = this.planActual.toLowerCase() === 'Básico' ||
                             this.planActual.toLowerCase() === 'Basico';

        if (!this.planBloqueado) {
          this.cargarAnomalias();
        } else {
          this.cargando = false;
        }
      },
      error: () => { this.cargando = false; }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animarEntrada(), 200);
  }

  private animarEntrada() {
    if (typeof anime === 'undefined') return;

    anime({
      targets: '.page-header',
      translateY: [-20, 0],
      opacity:    [0, 1],
      duration:   600,
      easing:     'easeOutExpo'
    });

    anime({
      targets: '.kpi-card',
      translateY: [30, 0],
      opacity:    [0, 1],
      duration:   600,
      delay:      anime.stagger(80, { start: 200 }),
      easing:     'easeOutExpo'
    });
  }

  cargarAnomalias() {
    this.cargando = true;
    this.auth.getAccessTokenSilently().pipe(
      switchMap(token =>
        this.http.get<any[]>(
          `${this.apiUrl}/api/alertas/mis-alertas`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      )
    ).subscribe({
      next: (data) => {
        // filtrar solo las que son anomalías ML
        const todasAnomalias = data.filter(a =>
          a.mensaje?.toLowerCase().includes('anomal') ||
          a.nivel === 'CRITICO'
        );

        this.anomalias = todasAnomalias.map((a: any) => ({
          id:            a.id,
          fecha:         a.fecha,
          tipoMetrica:   a.tipoMetrica,
          valor:         a.valor ?? 0,
          valorEsperado: this.calcularEsperado(a.tipoMetrica),
          desviacion:    this.calcularDesviacion(a.valor, a.tipoMetrica),
          nivel:         a.nivel,
          sensor:        a.sensorDeviceId ?? 'Sensor',
          mensaje:       a.mensaje,
          atendida:      a.atendida
        }));

        // KPIs
        this.totalAnomalias    = this.anomalias.length;
        this.anomaliasCriticas = this.anomalias.filter(a => a.nivel === 'CRITICO').length;
        this.sensoresEnRiesgo  = new Set(this.anomalias.map(a => a.sensor)).size;
        this.ecoScore          = this.calcularEcoScore();

        // alertas predictivas simuladas basadas en las anomalías
        this.alertasPredictivas = this.generarAlertasPredictivas(todasAnomalias);

        this.cargando = false;

        setTimeout(() => {
          if (typeof anime !== 'undefined') {
            anime({
              targets: '.anomalia-row',
              translateX: [-20, 0],
              opacity:    [0, 1],
              duration:   400,
              delay:      anime.stagger(40),
              easing:     'easeOutCubic'
            });
          }
        }, 100);
      },
      error: () => { this.cargando = false; }
    });
  }

  private calcularEsperado(tipo: string): number {
    const defaults: Record<string, number> = {
      'PM25': 30, 'CO2': 600, 'TEMPERATURA': 22,
      'HUMEDAD': 50, 'PH': 7.2, 'TURBIDEZ': 2,
      'TDS': 300, 'ENERGIA': 3, 'VOLTAJE': 220
    };
    return defaults[tipo] ?? 50;
  }

  private calcularDesviacion(valor: number, tipo: string): number {
    const esperado = this.calcularEsperado(tipo);
    if (esperado === 0) return 0;
    return Math.abs(((valor - esperado) / esperado) * 100);
  }

  private calcularEcoScore(): number {
    if (this.totalAnomalias === 0) return 98;
    const penalidad = Math.min(this.totalAnomalias * 5 + this.anomaliasCriticas * 10, 70);
    return Math.max(100 - penalidad, 30);
  }

  private generarAlertasPredictivas(anomalias: any[]): any[] {
    if (anomalias.length === 0) return [];

    // agrupar por tipo de métrica
    const grupos: Record<string, number> = {};
    anomalias.forEach(a => {
      grupos[a.tipoMetrica] = (grupos[a.tipoMetrica] ?? 0) + 1;
    });

    return Object.entries(grupos)
      .filter(([, count]) => count >= 1)
      .map(([tipo, count]) => ({
        tipo,
        riesgo:      count >= 3 ? 'ALTO' : count >= 2 ? 'MEDIO' : 'BAJO',
        descripcion: this.getDescripcionPredictiva(tipo, count),
        accion:      this.getAccionRecomendada(tipo),
        probabilidad: Math.min(count * 25 + 20, 95)
      }))
      .sort((a, b) => b.probabilidad - a.probabilidad)
      .slice(0, 5);
  }

  private getDescripcionPredictiva(tipo: string, count: number): string {
    const desc: Record<string, string> = {
      'PM25':        `Se detectaron ${count} picos de PM2.5. Patrón sugiere deterioro del filtro.`,
      'CO2':         `${count} episodios de CO2 elevado. Ventilación insuficiente detectada.`,
      'TEMPERATURA': `${count} variaciones térmicas anómalas. Revisar sistema de climatización.`,
      'HUMEDAD':     `${count} lecturas de humedad irregulares. Posible fuga o condensación.`,
      'PH':          `${count} variaciones de pH. Calidad del agua en riesgo.`,
      'ENERGIA':     `${count} picos de consumo energético. Posible sobrecarga en circuito.`,
      'VOLTAJE':     `${count} fluctuaciones de voltaje detectadas. Riesgo eléctrico.`,
    };
    return desc[tipo] ?? `${count} anomalías detectadas en ${tipo}.`;
  }

  private getAccionRecomendada(tipo: string): string {
    const acciones: Record<string, string> = {
      'PM25':        'Limpiar o reemplazar filtros de aire',
      'CO2':         'Mejorar ventilación del espacio',
      'TEMPERATURA': 'Revisar sistema de climatización',
      'HUMEDAD':     'Inspeccionar tuberías y sellados',
      'PH':          'Revisar filtros y fuente de agua',
      'ENERGIA':     'Auditoría del tablero eléctrico',
      'VOLTAJE':     'Contactar técnico eléctrico',
    };
    return acciones[tipo] ?? 'Revisar sensor y configuración';
  }

  get anomaliasFiltradas(): Anomalia[] {
    if (this.filtroNivel === 'TODOS') return this.anomalias;
    return this.anomalias.filter(a => a.nivel === this.filtroNivel);
  }

  filtrar(nivel: string) {
    this.filtroNivel = nivel;
    if (typeof anime !== 'undefined') {
      anime({
        targets: '.anomalia-row',
        opacity:  [0.3, 1],
        duration: 300,
        easing:   'easeOutCubic'
      });
    }
  }

  getNivelColor(nivel: string): string {
    switch (nivel) {
      case 'CRITICO': return '#ef4444';
      case 'ALTO':    return '#f97316';
      case 'MEDIO':   return '#facc15';
      default:        return '#22c55e';
    }
  }

  getRiesgoColor(riesgo: string): string {
    switch (riesgo) {
      case 'ALTO':  return '#f97316';
      case 'MEDIO': return '#facc15';
      default:      return '#22c55e';
    }
  }

  getEcoScoreColor(): string {
    if (this.ecoScore >= 80) return '#22c55e';
    if (this.ecoScore >= 60) return '#facc15';
    return '#f87171';
  }
}