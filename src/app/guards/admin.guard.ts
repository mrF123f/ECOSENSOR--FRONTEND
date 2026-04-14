import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UsuarioService } from '../services/usuario.service'; // Ajusta la ruta a tu servicio
import { map, take, catchError,filter } from 'rxjs/operators';
import { of } from 'rxjs';


export const adminGuard: CanActivateFn = (route, state) => {
  const usuarioService = inject(UsuarioService);
  const router = inject(Router);

  // 🛡️ Revisamos el usuario que tenemos en memoria
 return usuarioService.getPerfil().pipe(
    // 2. Filtramos valores nulos para que no se cierre antes de tiempo
   take(1),
    map((u: any) => {
      // 🔥 verificar SOLO el campo rol que viene de la BD, no del JWT
      if (u?.rol === 'ADMIN') {
        return true;
      }
      console.warn('Acceso denegado. Rol:', u?.rol);
      router.navigate(['/company']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/company']);
      return of(false);
    })
  );
};