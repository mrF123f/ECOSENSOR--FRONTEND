import { state } from '@angular/animations';
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { map, take } from 'rxjs/operators';


export const authGuard: CanActivateFn = (route, routerState) => {

  const auth = inject(AuthService);
    const router = inject(Router);


  return auth.isAuthenticated$.pipe(
    take(1),
    map(isAuth => {
      if (!isAuth) {
        router.navigate(['/'], { 
          queryParams: { returnUrl: routerState.url } 
        });
        return false;
        }
        return true;
      })
    
  );

};