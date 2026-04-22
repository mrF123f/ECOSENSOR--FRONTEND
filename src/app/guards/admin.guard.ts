import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { UsuarioService } from '../services/usuario.service'; // Ajusta la ruta a tu servicio
import { map, take, catchError,filter } from 'rxjs/operators';
import { of } from 'rxjs';


export const adminGuard: CanActivateFn = (route, state) => {
  const usuarioService = inject(UsuarioService);
  const router = inject(Router);

  //Revisamos el usuario que tenemos en memoria
 return usuarioService.getPerfil().pipe(
    // 2. Filtramos valores nulos para que no se cierre antes de tiempo
  
    map(user => {
      // verificar SOLO el campo rol que viene de la BD, no del JWT
      if (user.rol === 'ADMIN' && !user.tipoUsuario) {
        return true;
      }

      if (user.rol === 'ADMIN' && user.tipoUsuario === 'EMPRESA') {
        console.warn('Redirigiendo a panel de empresa...');
        router.navigate(['/company']);
        return false;
      }
      
      console.warn('Acceso denegado. Rol:', user.rol);
      router.navigate(['/company']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/']);
      return of(false);
    })
  );
};