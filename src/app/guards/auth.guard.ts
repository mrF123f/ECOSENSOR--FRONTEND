import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { map, tap } from 'rxjs/operators';


export const authGuard: CanActivateFn = () => {

  const auth = inject(AuthService);
    const router = inject(Router);


  return auth.isAuthenticated$.pipe(
    map(isAuth => {
      if (!isAuth) {
        auth.loginWithRedirect();
        return false;
        }
        return true;
      })
    
  );

};