import { ApplicationConfig, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors  } from '@angular/common/http';
import { routes } from './app.routes';
import { provideAuth0, AuthService } from '@auth0/auth0-angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { switchMap, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from './environments/environment';




export const appConfig: ApplicationConfig = {
  providers: [

    provideRouter(routes),

    //AUTH0 CONFIG
    provideAuth0({
      domain: 'dev-6u1q0s2nx3pub4do.us.auth0.com',
      clientId: '6E6cqN5AhiK1oIEWD8p1FUlqrYc4TyX4',

      authorizationParams: {
        redirect_uri:`${window.location.origin}/callback`,
        audience: 'https://ecosensor-api',
        scope: 'openid profile email'
        
      },

      cacheLocation: 'localstorage',     // Recomendado
    useRefreshTokens: false,               // ← DESACTIVADO
  useRefreshTokensFallback: false,

    }),


 provideHttpClient(withInterceptors([
      (req, next) => {

        if (!req.url.startsWith(environment.apiUrl)){
          return next(req);
        }
        const auth = inject(AuthService);

        return auth.isAuthenticated$.pipe(
          switchMap(isAuth => {
            if (!isAuth) {
              return next(req); // No intentar token si no está logueado
            }
            return auth.getAccessTokenSilently().pipe(
              switchMap(token => {
                if (token) {
                  const clonedReq = req.clone({
                    headers: req.headers.set('Authorization', `Bearer ${token}`)
                  });
                  return next(clonedReq);
                }
                return next(req);
              }),
              catchError(() => {
                console.warn('⚠️ No token disponible');
                return next(req);
              })
              );
      })
        );
      }  
    ])),
  
    provideAnimations()
  ]

  
};