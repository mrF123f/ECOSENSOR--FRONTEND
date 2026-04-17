// suscripcion.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { UsuarioService } from '../services/usuario.service';
import { switchMap } from 'rxjs/operators';
import { environment } from '../environments/environment';


@Component({
  selector: 'app-suscripcion',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './suscripcion.component.html',
  styleUrls: ['./suscripcion.component.css']
})
export class SuscripcionComponent implements OnInit {

  planes = [
    {
      id: 1,
      nombre: 'Básico',
      precio: 45,        
      precioUSD: 12,
      periodo: '/mes',
      descripcion: 'Para hogares y uso personal',
      color: 'basic',
      features: [
        { text: 'Hasta 3 sensores',          ok: true,  ai: false },
        { text: 'Dashboard en tiempo real',   ok: true,  ai: false },
        { text: 'Alertas por email',          ok: true,  ai: false },
        { text: 'Historial 30 días',          ok: true,  ai: false },
        { text: 'Predicciones con IA',        ok: false, ai: false },
      ]
    },
    {
      id: 2,
      nombre: 'Pro',
      precio: 169,       
      precioUSD: 45,
      periodo: '/mes',
      descripcion: 'Para pequeñas empresas',
      popular: true,
      color: 'pro',
      features: [
        { text: 'Hasta 20 sensores',          ok: true,  ai: false },
        { text: 'Todo lo del Básico',         ok: true,  ai: false },
        { text: 'Reportes PDF',               ok: true,  ai: false },
        { text: 'Historial 1 año',            ok: true,  ai: false },
        { text: 'Predicciones IA básicas',    ok: true,  ai: true  },
      ]
    },
    {
      id: 3,
      nombre: 'Enterprise',
      precio: 675,        
      precioUSD: 180,
      periodo: '/mes',
      descripcion: 'Para empresas medianas/grandes',
      color: 'enterprise',
      features: [
        { text: 'Sensores ilimitados',        ok: true,  ai: false },
        { text: 'Multi-sede',                 ok: true,  ai: false },
        { text: 'Todo lo del Pro',            ok: true,  ai: false },
        { text: 'IA avanzada + anomalías',    ok: true,  ai: true  },
        { text: 'Soporte prioritario 24/7',        ok: true,  ai: false },
      ]
    }
  ];

  procesando: number | null = null; // id del plan que se está procesando
  empresaId: number = 0;
  error = '';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.usuarioService.getPerfil().subscribe({
      next: (user: any) => {
        this.empresaId = user.empresaId || user.empresa?.id || 0;
      },
      error: () => {}
    });
  }

  suscribirse(plan: any) {
    
    this.procesando = plan.id;
    this.error = '';

    this.auth.getAccessTokenSilently().pipe(
      switchMap(token =>
        this.http.post<any>(
          `${environment.apiUrl}/api/pagos/iniciar`,
          {
          planId: plan.id,
          empresaId: this.empresaId || null
        },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      )
    ).subscribe({
      next: (res) => {
        this.procesando = null;
        // 🔥 redirigir al checkout de Pay-me
        if (res.checkoutUrl) {
          window.location.href = res.checkoutUrl;
        }
      },
      error: (err) => {
        this.procesando = null;
        this.error = err.error?.message || 'Error al iniciar el pago. Intenta de nuevo.';
      }
    });
  }
}