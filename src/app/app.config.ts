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
      domain: 'dev-khvop4d61s5ip8d3.us.auth0.com',
      clientId: 'TGa8Wkq9JDBkcgYOzMIZbOZ2LVzrpI94',

      authorizationParams: {
        redirect_uri:`${window.location.origin}/callback`,
        audience: 'https://ecosensor-api',
        scope: 'openid profile email offline_access'
        
      },

      cacheLocation: 'localstorage',     // Recomendado
    useRefreshTokens: true

    }),


 provideHttpClient(withInterceptors([
      (req, next) => {

        if (!req.url.startsWith(environment.apiUrl)) return next(req);
        const auth = inject(AuthService);

        return auth.getAccessTokenSilently().pipe(
          catchError(() => of(null)),
          switchMap(token => {
            if (token) {
                req = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${token}`)
            });
          }
            return next(req);
          })
        );
      }  
    ])),

    provideAnimations()
  ]

  
};