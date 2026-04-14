import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { mergeMap  } from 'rxjs/operators';
import { AuthService } from '@auth0/auth0-angular';
import { environment } from '../environments/environment'; 

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
   

   private readonly apiBase = `${environment.apiUrl}/api`;

  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Sólo interceptamos llamadas a nuestra API
    if (!req.url.startsWith(this.apiBase)) {
      return next.handle(req);
    }

    // getAccessTokenSilently devuelve Observable<string>
    return this.auth.getAccessTokenSilently({
      authorizationParams: {
        scope: 'openid profile email' // <--- ESTO ES VITAL
      }
    }).pipe(
      mergeMap(token => {
        const cloned = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next.handle(cloned);
      })
    );
  }
}