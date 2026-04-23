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
      if (!user || !user.rol) {
        router.navigate(['/login']);
        return false;
      }


    const rolUpper = user.rol.toUpperCase();

      // 3. Si es ADMIN del sistema (el que no tiene empresa asignada en la tabla)
      if (rolUpper === 'ADMIN' && !user.empresaId) {
        console.log('Bienvenido, Super Admin. Accediendo al panel de control global.');
        return true;
      }

      console.warn('Acceso denegado al panel global. Redirigiendo a vista de cliente...');

      
      if (user.empresaId) {
        router.navigate(['/company']);
      } else {
        router.navigate(['/dashboard']);
      }
      
      return false;
    }),
    catchError(() => {
      router.navigate(['/']);
      return of(false);
    })
  );
};