// admin.component.ts
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap } from 'rxjs/operators';
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
  }

  cargarTodo() {
    this.cargando = true;
    this.auth.getAccessTokenSilently().subscribe({
      next: (token) => {
        const h = { Authorization: `Bearer ${token}` };
        this.http.get<any>(`${this.base}/kpis`, { headers: h }).subscribe({
          next: d => { this.kpis = d; this.cargando = false; },
          error: () => { this.cargando = false; }
        });
        this.http.get<any[]>(`${this.base}/usuarios`, { headers: h }).subscribe({ next: d => this.usuarios = d });
        this.http.get<any[]>(`${this.base}/empresas`, { headers: h }).subscribe({ next: d => this.empresas = d });
        this.http.get<any[]>(`${this.base}/suscripciones`, { headers: h }).subscribe({ next: d => this.suscripciones = d });
        this.http.get<any[]>(`${this.base}/alertas`, { headers: h }).subscribe({ next: d => this.alertas = d });
      },
      error: () => { this.cargando = false; }
    });
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
    const m: Record<string, string> = { CRITICO: '#ef4444', ALTO: '#f97316', MEDIO: '#facc15' };
    return m[nivel] ?? '#22c55e';
  }

  getEstadoColor(estado: string): string {
    const m: Record<string, string> = {
      ACTIVA: '#22c55e', CANCELADA: '#f87171', VENCIDA: '#facc15',
      PENDIENTE: '#60a5fa', PAGADO: '#22c55e', FALLIDO: '#f87171'
    };
    return m[estado] ?? '#64748b';
  }
}