// landing.component.ts — con anime.js completo
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { AsyncPipe, NgIf } from '@angular/common';
import { Subscription } from 'rxjs';

declare var anime: any;

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [AsyncPipe, NgIf],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit, OnDestroy, AfterViewInit {

  isAuthenticated = false;
  private authSub?: Subscription;

  constructor(public auth: AuthService, public router: Router) {}

  ngOnInit(): void {
    this.authSub = this.auth.isAuthenticated$.subscribe(v => this.isAuthenticated = v);
  }

  ngAfterViewInit(): void {
    this.animarEntrada();
    this.animarLoop();
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
  }

login() {

  this.auth.loginWithRedirect({
    appState: { 
      target: '/completar-perfil'
    }
  });
} 

logout() { this.auth.logout({ logoutParams: { returnTo: window.location.origin } }); }

  private animarEntrada() {
    if (typeof anime === 'undefined') return;

    // badge
    anime({ targets: '.hero-badge', translateY: [-20, 0], opacity: [0, 1], duration: 600, easing: 'easeOutExpo' });

    // título
    anime({ targets: '.hero-title', translateY: [50, 0], opacity: [0, 1], duration: 800, delay: 200, easing: 'easeOutExpo' });

    // subtítulo
    anime({ targets: '.hero-subtitle', translateY: [30, 0], opacity: [0, 1], duration: 700, delay: 400, easing: 'easeOutExpo' });

    // botones stagger
    anime({ targets: '.hero-actions > *', translateY: [20, 0], opacity: [0, 1], duration: 600, delay: anime.stagger(100, { start: 600 }), easing: 'easeOutExpo' });

    // stats
    anime({ targets: '.stat', scale: [0.8, 1], opacity: [0, 1], duration: 500, delay: anime.stagger(100, { start: 800 }), easing: 'easeOutBack' });

    // preview desde derecha
    anime({ targets: '.hero-preview', translateX: [80, 0], opacity: [0, 1], duration: 900, delay: 400, easing: 'easeOutExpo' });

    // nav
    anime({ targets: '.nav', translateY: [-20, 0], opacity: [0, 1], duration: 500, easing: 'easeOutExpo' });

    // feature cards
    anime({ targets: '.feature-card', translateY: [60, 0], opacity: [0, 1], duration: 700, delay: anime.stagger(100, { start: 600 }), easing: 'easeOutExpo' });

    // plan cards
    anime({ targets: '.plan-card', scale: [0.93, 1], opacity: [0, 1], duration: 700, delay: anime.stagger(120, { start: 400 }), easing: 'easeOutBack' });
  }

  private animarLoop() {
    if (typeof anime === 'undefined') return;

    // live dot pulso
    anime({ targets: '.live-dot', scale: [1, 1.5, 1], opacity: [1, 0.3, 1], duration: 2000, loop: true, easing: 'easeInOutSine' });

    // alerta flotante sube y baja
    anime({ targets: '.alert-float', translateY: [0, -8, 0], duration: 3500, loop: true, delay: 1000, easing: 'easeInOutSine' });

    // barras del preview animadas
    anime({
      targets: '.bar',
      height: (el: HTMLElement) => {
        const h = parseInt(el.style.height || '50');
        return `${Math.max(15, Math.min(90, h + (Math.random() - 0.5) * 25))}%`;
      },
      duration: 1500,
      loop: true,
      delay: anime.stagger(200),
      easing: 'easeInOutSine',
      direction: 'alternate'
    });

    // orbs de fondo en movimiento suave
    anime({ targets: '.orb-1', translateX: [-40, 40, -40], translateY: [-25, 25, -25], duration: 9000, loop: true, easing: 'easeInOutSine' });
    anime({ targets: '.orb-2', translateX: [30, -30, 30], translateY: [35, -35, 35], duration: 11000, loop: true, easing: 'easeInOutSine' });
    anime({ targets: '.orb-3', translateX: [-20, 30, -20], translateY: [-30, 20, -30], duration: 13000, loop: true, easing: 'easeInOutSine' });
  }
}