// admin.component.ts
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient,HttpHeaders  } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
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

  ngOnInit(): void { this.cargarTodo(); }

  ngAfterViewInit(): void {
    setTimeout(() => this.animarEntrada(), 300);
  }

  private animarEntrada() {
    if (typeof anime === 'undefined') return; 
    anime({ targets: '.admin-header', translateY: [-30, 0], opacity: [0, 1], duration: 600, easing: 'easeOutExpo' });
    anime({ targets: '.kpi-card', translateY: [40, 0], opacity: [0, 1], duration: 700, delay: anime.stagger(80), easing: 'easeOutExpo' });
    anime({ targets: '.mrr-strip',     translateY: [20, 0],  opacity: [0, 1], duration: 600, delay: 400, easing: 'easeOutExpo' });
  }

  cargarTodo() {
    this.cargando = true;
     this.auth.getAccessTokenSilently().pipe(
      switchMap(token => {
        const h = { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
        return forkJoin({
          kpis:          this.http.get<any>   (`${this.base}/kpis`,          h),
          usuarios:      this.http.get<any[]> (`${this.base}/usuarios`,      h),
          empresas:      this.http.get<any[]> (`${this.base}/empresas`,      h),
          suscripciones: this.http.get<any[]> (`${this.base}/suscripciones`, h),
          alertas:       this.http.get<any[]> (`${this.base}/alertas`,       h),
        });
      })
    ).subscribe({
      next: (res) => {
        this.kpis          = res.kpis;
        this.usuarios      = res.usuarios;
        this.empresas      = res.empresas;
        this.suscripciones = res.suscripciones;
        this.alertas       = res.alertas;
        this.cargando      = false;
        // Animar solo cuando todos los datos ya están
        setTimeout(() => this.animarEntrada(), 50);
      },
      error: () => { this.cargando = false; }
    });
  }

  //
    verUsuario(u: any) {
    this.cargandoVista = true;
    this.auth.getAccessTokenSilently().pipe(
      switchMap(token => this.http.get<any>(
        `${this.base}/usuarios/${u.id}/perfil-vista`,
        { headers: { Authorization: `Bearer ${token}` } }
      ))
    ).subscribe({
      next: (data) => {
        this.usuarioEnVista = data;
        this.mostrandoVista = true;
        this.cargandoVista  = false;
      },
      error: () => { this.cargandoVista = false; }
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

    this.auth.getAccessTokenSilently().pipe(
      switchMap(token => this.http.put(url, {}, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'text'
      }))
    ).subscribe({
      next: () => { u.activo = !u.activo; this.accionando = null; },
      error: () => { this.accionando = null; }
    });
  }

  // ── TOGGLE EMPRESA ────────────────────────────────────────────
  toggleEmpresa(e: any) {
    if (this.accionando) return;
    this.accionando = e.id;
    const url = e.activa
      ? `${this.base}/empresas/${e.id}/desactivar`
      : `${this.base}/empresas/${e.id}/activar`;

    this.auth.getAccessTokenSilently().pipe(
      switchMap(token => this.http.put(url, {}, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'text'
      }))
    ).subscribe({
      next: () => { e.activa = !e.activa; this.accionando = null; },
      error: () => { this.accionando = null; }
    });
  }

  // ── TOGGLE SUSCRIPCIÓN ────────────────────────────────────────
  toggleSuscripcion(s: any) {
    if (this.accionando) return;
    this.accionando = s.id;
    const url = s.estado === 'ACTIVA'
      ? `${this.base}/suscripciones/${s.id}/suspender`
      : `${this.base}/suscripciones/${s.id}/activar`;

    this.auth.getAccessTokenSilently().pipe(
      switchMap(token => this.http.put(url, {}, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'text'
      }))
    ).subscribe({
      next: () => {
        const eraActiva = s.estado === 'ACTIVA';
        s.estado     = eraActiva ? 'CANCELADA' : 'ACTIVA';
        s.estadoPago = eraActiva ? 'FALLIDO'   : 'PAGADO';
        this.accionando = null;
      },
      error: () => { this.accionando = null; }
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