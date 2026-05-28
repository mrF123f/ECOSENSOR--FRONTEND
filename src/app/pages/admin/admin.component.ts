// admin.component.ts
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient,HttpHeaders  } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap } from 'rxjs/operators';
import { forkJoin, of, timer } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';


declare var anime: any;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit, AfterViewInit {

  kpis: any = {};
  usuarios:      any[] = [];
  empresas:      any[] = [];
  suscripciones: any[] = [];
  alertas:       any[] = [];

  tabActiva: 'usuarios' | 'empresas' | 'suscripciones' | 'alertas' = 'usuarios';
  cargando   = true;
  accionando: number | null = null;


   usuarioEnVista:   any    = null;
  mostrandoVista    = false;
  cargandoVista     = false;
 


  private base = `${environment.apiUrl}/api/admin`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit(): void {
    // Timeout de seguridad — si en 15s no cargó, quitar spinner igual
    timer(15000).subscribe(() => {
      if (this.cargando) {
        console.warn('⏱️ Timeout de seguridad — quitando spinner');
        this.cargando = false;
      }
    });

  this.cargarTodo();

  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animarEntrada(), 300);
  }

  private animarEntrada() {
    if (typeof anime === 'undefined') return; 

    
    anime({ targets: '.admin-header', translateY: [-30, 0], opacity: [0, 1], duration: 600, easing: 'easeOutExpo' });
    anime({ targets: '.kpi-card', translateY: [40, 0], opacity: [0, 1], duration: 700, delay: anime.stagger(80), easing: 'easeOutExpo' });
    anime({ targets: '.mrr-strip',     translateY: [20, 0],  opacity: [0, 1], duration: 600, delay: 400, easing: 'easeOutExpo' });
  }

// En tu admin.component.ts reemplaza tu función actual por esta:
cargarTodo() {
  this.cargando = true;
  console.log('🚀 Iniciando carga completa de ADMIN directa y segura...');

  // El interceptor se encargará de inyectar el token automáticamente en cada GET
    forkJoin({
      kpis:          this.http.get(`${this.base}/kpis`).pipe(
                       timeout(10000),
                       catchError(err => { console.error('❌ /kpis:', err.status ?? err.name); return of({}); })
                     ),
      usuarios:      this.http.get(`${this.base}/usuarios`).pipe(
                       timeout(10000),
                       catchError(err => { console.error('❌ /usuarios:', err.status ?? err.name); return of([]); })
                     ),
      empresas:      this.http.get(`${this.base}/empresas`).pipe(
                       timeout(10000),
                       catchError(err => { console.error('❌ /empresas:', err.status ?? err.name); return of([]); })
                     ),
      suscripciones: this.http.get(`${this.base}/suscripciones`).pipe(
                       timeout(10000),
                       catchError(err => { console.error('❌ /suscripciones:', err.status ?? err.name); return of([]); })
                     ),
      alertas:       this.http.get(`${this.base}/alertas`).pipe(
                       timeout(10000),
                       catchError(err => { console.error('❌ /alertas:', err.status ?? err.name); return of([]); })
                     ),
  }).subscribe({
    next: (res: any) => {
      console.log('✅ Admin data cargada');

      this.kpis          = res.kpis          || {};
        this.usuarios      = Array.isArray(res.usuarios)      ? res.usuarios      : [];
        this.empresas      = Array.isArray(res.empresas)      ? res.empresas      : [];
        this.suscripciones = Array.isArray(res.suscripciones) ? res.suscripciones : [];
        this.alertas       = Array.isArray(res.alertas)       ? res.alertas       : [];
        this.cargando      = false;

      setTimeout(() => this.animarEntrada(), 50);
    },
    error: (err: any) => {
      console.error('💥 Error crítico general en la carga de datos de administración:', err);
      this.cargando = false;
    }
  });
}

  //
     verUsuario(u: any) {
    this.cargandoVista = true;
    this.http.get<any>(`${this.base}/usuarios/${u.id}/perfil-vista`)
      .pipe(catchError(err => { console.error('❌ perfil-vista:', err); return of(null); }))
      .subscribe(data => {
        this.cargandoVista  = false;
        if (data) {
          this.usuarioEnVista = data;
          this.mostrandoVista = true;
        }
      });
  }
 
 
  cerrarVista() {
    this.usuarioEnVista = null;
    this.mostrandoVista = false;
  }

  // ── TOGGLE USUARIO (activar/desactivar) ───────────────────────
  toggleUsuario(u: any) {
    if (this.accionando) return;
    this.accionando = u.id;
    const url = u.activo
      ? `${this.base}/usuarios/${u.id}/desactivar`
      : `${this.base}/usuarios/${u.id}/activar`;

     this.http.put(url, {}, { responseType: 'text' })
      .pipe(catchError(err => { console.error('❌ toggleUsuario:', err); return of(null); }))
      .subscribe(() => { u.activo = !u.activo; this.accionando = null; });
  }
 

  // ── TOGGLE EMPRESA ────────────────────────────────────────────
  toggleEmpresa(e: any) {
    if (this.accionando) return;
    this.accionando = e.id;
    const url = e.activa
      ? `${this.base}/empresas/${e.id}/desactivar`
      : `${this.base}/empresas/${e.id}/activar`;

     this.http.put(url, {}, { responseType: 'text' })
      .pipe(catchError(err => { console.error('❌ toggleEmpresa:', err); return of(null); }))
      .subscribe(() => { e.activa = !e.activa; this.accionando = null; });
  }



  // ── TOGGLE SUSCRIPCIÓN ────────────────────────────────────────
  toggleSuscripcion(s: any) {
    if (this.accionando) return;
    this.accionando = s.id;
    const url = s.estado === 'ACTIVA'
      ? `${this.base}/suscripciones/${s.id}/suspender`
      : `${this.base}/suscripciones/${s.id}/activar`;

     this.http.put(url, {}, { responseType: 'text' })
      .pipe(catchError(err => { console.error('❌ toggleSuscripcion:', err); return of(null); }))
      .subscribe(() => {
        const eraActiva = s.estado === 'ACTIVA';
        s.estado     = eraActiva ? 'CANCELADA' : 'ACTIVA';
        s.estadoPago = eraActiva ? 'FALLIDO'   : 'PAGADO';
        this.accionando = null;
      });
  }
  

  cambiarTab(tab: 'usuarios' | 'empresas' | 'suscripciones' | 'alertas') {
    this.tabActiva = tab;
    if (typeof anime !== 'undefined') {
      anime({ targets: '.tab-content', translateX: [-20, 0], opacity: [0, 1], duration: 400, easing: 'easeOutCubic' });
    }
  }

  getNivelColor(nivel: string): string {
      return ({ CRITICO: '#ef4444', ALTO: '#f97316', MEDIO: '#facc15' } as any)[nivel] ?? '#22c55e';

  }

  getEstadoColor(estado: string): string {
    return ({
      ACTIVA: '#22c55e', CANCELADA: '#f87171', VENCIDA: '#facc15',
      PENDIENTE: '#60a5fa', PAGADO: '#22c55e', FALLIDO: '#f87171'
    } as any)[estado] ?? '#64748b';
  }
}