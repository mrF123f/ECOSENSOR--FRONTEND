import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { catchError, of } from 'rxjs';
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

    private readonly rutasSinNavbar = ['/', '/completar-perfil', '/suscripcion','/suscripcion/confirmado'];
    mostrarNavbar = false;

  ngOnInit(): void {


    this.pingBackend();

     this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.mostrarNavbar = !this.rutasSinNavbar.includes(e.urlAfterRedirects);
    });
 
  this.mostrarNavbar = !this.rutasSinNavbar.includes(window.location.pathname);

    this.auth.isAuthenticated$.subscribe(isAuthenticated => {
    if (isAuthenticated) {
      // Si el usuario acaba de entrar (está en la raíz), lo mandamos a su perfil
      if (window.location.pathname === '/') {
        this.redirigirSegunPerfil();
      }
    }
  });


  }

  private pingBackend() {
    this.http
      .get(`${environment.apiUrl}/api/public/health`, { responseType: 'text' })
      .pipe(catchError(() => of(null)))
      .subscribe();
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