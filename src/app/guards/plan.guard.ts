import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UsuarioService } from '../services/usuario.service';
import { map } from 'rxjs';

export const planGuard: CanActivateFn = (route, state) => {
  const usuarioService = inject(UsuarioService);
  const router = inject(Router);
  const planesPermitidos = route.data['planes'] as string[];

  return usuarioService.getPerfil().pipe(
    map(usuario => {
      // Si el plan del usuario está en la lista permitida de la ruta
      if (usuario && planesPermitidos.includes(usuario.planNombre || '')) {
        return true;
      }

      // Si no tiene acceso, lo mandamos a suscribirse
      alert(`Tu plan ${usuario.planNombre} no incluye esta función.`);
      router.navigate(['/suscripcion']);
      return false;
    })
  );
};