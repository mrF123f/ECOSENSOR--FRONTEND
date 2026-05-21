// navbar.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { UsuarioService } from '../services/usuario.service';
import { DashboardService } from '../services/dashboard.service';
import { Subscription, filter } from 'rxjs';

declare var anime: any;

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy, AfterViewInit {

  usuario:    any    = null;
  tipoUsuario = 'HOGAR';
  planActual  = 'Básico';
  iniciales   = '';
  menuLinks:  any[]  = [];

  // Eco-score — hace que la app se sienta viva
  ecoScore = 0;
  private empresaId = 0;

  collapsed  = false;
  rutaActual = '';
  private subs: Subscription[] = [];


  private get linksAdmin() {
    return [
      { path: '/admin',        icon: 'admin',  label: 'Control Total' },
      { path: '/company',      icon: 'grid',   label: 'Vista Empresa' },
      { path: '/sensores',     icon: 'sensor', label: 'Sensores' },
    ];
  }

  private get linksEmpresa() {
    return [
      { path: '/company',      icon: 'grid',   label: 'Dashboard' },
      { path: '/mis-sensores',     icon: 'sensor', label: 'Sensores' },
      { path: '/predicciones', icon: 'ia',     label: 'Predicciones IA', pro: true },
      { path: '/suscripcion',  icon: 'plan',   label: 'Mi plan' },
    ];
  }

  private get linksHogar() {
    return [
      { path: '/home',         icon: 'grid',   label: 'Dashboard' },
      { path: '/mis-sensores',     icon: 'sensor', label: 'Mis sensores' },
      { path: '/predicciones', icon: 'ia',     label: 'Predicciones IA', pro: true },
      { path: '/suscripcion',  icon: 'plan',   label: 'Mi plan' },
    ];
  }

  constructor(
    private router:           Router,
    public  auth:             AuthService,
    private usuarioService:   UsuarioService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.router.events.pipe(
        filter(e => e instanceof NavigationEnd)
      ).subscribe((e: any) => {
        this.rutaActual = e.urlAfterRedirects;
      })
    );

    this.rutaActual = this.router.url;

    this.subs.push(
      this.auth.isAuthenticated$.subscribe(isAuth => {
        if (isAuth) {
          this.usuarioService.getPerfil().subscribe();
        }
      })
    );


    this.subs.push(
      this.usuarioService.usuarioActual$.subscribe(u => {
        if (u) {
          this.usuario     = u;
          this.tipoUsuario = u.tipoUsuario ?? 'HOGAR';
          this.planActual  = (u as any).planNombre ?? 'Básico';
          this.iniciales   = this.getIniciales(u.nombre);
          this.empresaId   = (u as any).empresaId ?? 0;
          this.definirLinks();

          // Cargar eco-score una vez que sabemos el empresaId
          if (this.empresaId) {
            this.cargarEcoScore();
          }
        }
      })
    );

  }

  private definirLinks() {
 // 1. Si el rol es ADMIN, mandamos los links de Admin de frente
  if (this.usuario?.rol === 'ADMIN') {
    this.menuLinks = this.linksAdmin;
    return; // Salimos de la función
  }

  // 2. Si no es admin, evaluamos si es Empresa u Hogar
  if (this.tipoUsuario === 'EMPRESA') {
    this.menuLinks = this.linksEmpresa;
  } else {
    this.menuLinks = this.linksHogar;
  }
}

  private cargarEcoScore() {
    this.dashboardService.getDashboardEmpresa(this.empresaId).subscribe({
      next: (data: any) => {
        this.ecoScore = data.ecoScore ?? 0;
      },
      error: () => { /* silencioso — el eco-score es decorativo */ }
    });
  }

  // Clase CSS según el valor del eco-score
  get ecoStripClass(): string {
    if (this.ecoScore >= 75) return 'eco-bueno';
    if (this.ecoScore >= 50) return 'eco-medio';
    return 'eco-malo';
  }

  // Emoji según estado
  get ecoIcon(): string {
    if (this.ecoScore >= 75) return '🌿';
    if (this.ecoScore >= 50) return '⚠️';
    return '🔴';
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.animarEntrada(), 100);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private animarEntrada() {
    if (typeof anime === 'undefined') return;
    anime({
      targets: '.nav-sidebar',
      translateX: [-240, 0], opacity: [0, 1],
      duration: 600, easing: 'easeOutExpo'
    });
    anime({
      targets: '.nav-link-item',
      translateX: [-16, 0], opacity: [0, 1],
      duration: 450, delay: anime.stagger(55, { start: 150 }),
      easing: 'easeOutExpo'
    });
    anime({
      targets: '.eco-strip',
      translateY: [10, 0], opacity: [0, 1],
      duration: 400, delay: 500, easing: 'easeOutExpo'
    });
  }

  irAlPerfil() { this.router.navigate(['/perfil']); }

  stopProp(event: Event) { event.stopPropagation(); }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    if (typeof anime !== 'undefined') {
      anime({
        targets: '.nav-sidebar',
        width: this.collapsed ? [240, 68] : [68, 240],
        duration: 300, easing: 'easeOutCubic'
      });
      if (!this.collapsed) {
        anime({
          targets: '.nav-label, .nav-logo-text, .user-info, .plan-badge, .eco-info',
          opacity: [0, 1], duration: 200, delay: 150, easing: 'easeOutCubic'
        });
      }
    }
  }

  esActivo(path: string): boolean {
    if (path === '/perfil') return this.rutaActual === '/perfil';
    return this.rutaActual.startsWith(path);
  }

  getIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const p = nombre.trim().split(' ');
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : p[0][0].toUpperCase();
  }

  esPlanBloqueado(link: any): boolean {
    return link.pro && this.planActual === 'Básico';
  }

  navegar(link: any) {
    if (this.esPlanBloqueado(link)) {
      this.router.navigate(['/suscripcion']);
      return;
    }
    this.router.navigate([link.path]);
  }

  logout() {
    this.usuarioService.logout();
    this.auth.logout({ logoutParams: { returnTo: window.location.origin } });
  }
}