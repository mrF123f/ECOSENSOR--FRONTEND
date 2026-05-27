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
  
    take(1),
    map(user => {
      if (!user) {
        router.navigate(['/']);
        return false;
      }

      const esAdminSistema = user.rol?.toUpperCase() === 'ADMIN';

      if (esAdminSistema) {
        console.log('✅ Acceso autorizado al panel Admin');
        return true;
      }

      console.warn('⛔ Acceso denegado - No es ADMIN');
      router.navigate(['/']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/']);
      return of(false);
    })
  );
};