import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-callback',
  standalone: true,
  template: `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial;">
      <div style="text-align: center;">
        <h2>Procesando tu inicio de sesión...</h2>
        <p>Por favor espera un momento</p>
      </div>
    </div>
  `
})
export class CallbackComponent implements OnInit {

  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    console.log('🔄 CallbackComponent iniciado');

    this.auth.handleRedirectCallback().subscribe({
      next: (result) => {
        console.log('✅ Auth0 callback exitoso', result);

        // Redirige según lo que Auth0 nos diga o a la página por defecto
        const target = result.appState?.target || '/';
        this.router.navigateByUrl(target);
      },
      error: (err) => {
        console.error('❌ Error procesando callback:', err);
        this.router.navigate(['/']);
      }
    });
  }
}