import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { filter, catchError, of } from 'rxjs';
import { timer } from 'rxjs';
import { environment } from './environments/environment';
import { UsuarioService } from './services/usuario.service';
import { NavbarComponent } from './navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {

  protected auth = inject(AuthService);
  private router = inject(Router);
    private http     = inject(HttpClient);
  private usuarioService = inject(UsuarioService);

  usuario: any;
  title = 'ecosensor-frontend';

    backendCargando = true;
  mensajeWarmup   = 'Iniciando servidor...';
  
    private readonly rutasSinNavbar = ['/', '/completar-perfil', '/suscripcion','/suscripcion/confirmado'];
    mostrarNavbar = false;


   ngOnInit(): void {
     this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
       this.mostrarNavbar = !this.rutasSinNavbar.some(r =>
        e.urlAfterRedirects === r || e.urlAfterRedirects.startsWith(r + '?')
      );
    });
 
  this.mostrarNavbar = !this.rutasSinNavbar.includes(window.location.pathname);
      this.calentarBackend(0);

    this.auth.isAuthenticated$.subscribe(isAuthenticated => {
    if (isAuthenticated) {
      // Si el usuario acaba de entrar (está en la raíz), lo mandamos a su perfil
      if (isAuthenticated && window.location.pathname === '/') {
        this.redirigirSegunPerfil();
      }
    }
  });


  }

  private calentarBackend(intento: number) {
    // Mensajes progresivos para que el usuario entienda qué pasa
    const mensajes: Record<number, string> = {
      0:  'Iniciando servidor...',
      1:  'Despertando el servidor...',
      2:  'El servidor estaba en reposo, un momento...',
      4:  'Cargando servicios de EcoSensor...',
      6:  'Esto puede tardar hasta 60 segundos la primera vez...',
      10: 'Casi listo, el servidor está iniciando...',
      14: 'Gracias por tu paciencia, ya casi...',
    };
 
    if (mensajes[intento]) {
      this.mensajeWarmup = mensajes[intento];
    }
 
    // Después de 25 intentos (~100s) dejamos pasar de todos modos
    if (intento > 25) {
      this.backendCargando = false;
      return;
    }
 
    this.http
      .get(`${environment.apiUrl}/api/public/health`, { responseType: 'text' })
      .pipe(catchError(() => of(null)))
      .subscribe(resp => {
        if (resp === 'OK') {
          // Backend despierto → mostrar la app
          this.backendCargando = false;
        } else {
          // Aún durmiendo → reintentar en 4s
          timer(4000).subscribe(() => this.calentarBackend(intento + 1));
        }
      });
  }


   private redirigirSegunPerfil() {
    this.usuarioService.getPerfil().subscribe({
      next: (user: any) => {
        const esAdminSistema = user.rol === 'ADMIN' && !user.tipoUsuario;

        if (esAdminSistema) {
          this.router.navigate(['/admin']);
        } else if (user.tipoUsuario === 'EMPRESA') {
          this.router.navigate(['/company']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: () => this.router.navigate(['/completar-perfil'])
    });
  }
 

  // LOGIN CON REDIRECCIÓN 
  login() {
    this.auth.loginWithRedirect();
  }

   logout() {
    this.usuarioService.logout();
    this.auth.logout({ logoutParams: { returnTo: window.location.origin } });
  }

}