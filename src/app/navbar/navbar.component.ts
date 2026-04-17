// navbar.component.ts
import { Component, OnInit, OnDestroy, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { UsuarioService } from '../services/usuario.service';
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

  // Estado del usuario
  usuario: any = null;
  tipoUsuario = 'HOGAR'; // HOGAR | EMPRESA | ADMIN
  planActual  = 'Básico';
  iniciales   = '';

  menuLinks: any[] = [];

  // UI
  collapsed   = false;
  rutaActual  = '';
  private subs: Subscription[] = [];

  // Links según tipo de usuario
  get linksHogar() {
    return [
      { path: '/home',       icon: 'grid',    label: 'Dashboard' },
      { path: '/sensores',   icon: 'sensor',  label: 'Mis sensores' },
      { path: '/predicciones', icon: 'ia',    label: 'Predicciones IA', pro: true },
      { path: '/suscripcion', icon: 'plan',   label: 'Mi plan' },
    ];
  }

  get linksEmpresa() {
    return [
      { path: '/company',    icon: 'grid',    label: 'Dashboard' },
      { path: '/sensores',   icon: 'sensor',  label: 'Sensores' },
      { path: '/predicciones', icon: 'ia',   label: 'Predicciones IA', pro: true },
      { path: '/suscripcion', icon: 'plan',  label: 'Mi plan' },
    ];
  }

  get linksAdmin() {
    return [
      { path: '/admin',      icon: 'admin',   label: 'Panel Admin' },
      { path: '/company',    icon: 'grid',    label: 'Dashboard' },
      { path: '/sensores',   icon: 'sensor',  label: 'Sensores' },
      { path: '/predicciones', icon: 'ia',   label: 'Predicciones IA', pro: false },
      { path: '/suscripcion', icon: 'plan',  label: 'Suscripciones' },
    ];
  }

  get links() {
      if (this.usuario?.rol === 'ADMIN') return this.linksAdmin;
     if (this.tipoUsuario === 'EMPRESA') return this.linksEmpresa;
    return this.linksHogar;
  }

  constructor(
    private router: Router,
    public auth: AuthService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    // escuchar cambios de ruta
    this.subs.push(
      this.router.events.pipe(
        filter(e => e instanceof NavigationEnd)
      ).subscribe((e: any) => {
        this.rutaActual = e.urlAfterRedirects;
      })
    );

    this.rutaActual = this.router.url;

    // cargar perfil
    this.subs.push(
      this.usuarioService.usuarioActual$.subscribe(u => {
        if (u) {
          this.usuario    = u;
          this.tipoUsuario = u.tipoUsuario ?? 'HOGAR';
          this.planActual  = (u as any).planNombre ?? 'Básico';
          this.iniciales   = this.getIniciales(u.nombre);
         this.definirLinks();
        }
      })
    );
    this.usuarioService.getPerfil().subscribe();
  }

  private definirLinks() {
    if (this.usuario?.rol === 'ADMIN') this.menuLinks = this.linksAdmin;
  else if (this.tipoUsuario === 'EMPRESA') this.menuLinks = this.linksEmpresa;
  else this.menuLinks = this.linksHogar;
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
      translateX: [-240, 0],
      opacity:    [0, 1],
      duration:   600,
      easing:     'easeOutExpo'
    });

    anime({
      targets: '.nav-link-item',
      translateX: [-20, 0],
      opacity:    [0, 1],
      duration:   500,
      delay:      anime.stagger(60, { start: 200 }),
      easing:     'easeOutExpo'
    });
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;

    if (typeof anime !== 'undefined') {
      anime({
        targets: '.nav-sidebar',
        width:   this.collapsed ? [240, 68] : [68, 240],
        duration: 300,
        easing:   'easeOutCubic'
      });

      if (!this.collapsed) {
        anime({
          targets: '.nav-label, .nav-logo-text, .user-info, .plan-badge',
          opacity:  [0, 1],
          duration: 200,
          delay:    150,
          easing:   'easeOutCubic'
        });
      }
    }
  }

  esActivo(path: string): boolean {
    return this.rutaActual.startsWith(path);
  }

  getIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const partes = nombre.trim().split(' ');
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
    return partes[0][0].toUpperCase();
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
    this.auth.logout({ logoutParams: { returnTo: window.location.origin } });
  }
}