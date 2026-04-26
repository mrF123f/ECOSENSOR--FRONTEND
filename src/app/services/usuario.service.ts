import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { switchMap, tap, filter,catchError, shareReplay } from 'rxjs/operators'; 
import { Observable, BehaviorSubject, of } from 'rxjs';
import { environment } from '../environments/environment';



export interface Usuario {
  id: number;
  empresaId: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  fechaCreacion: string;
  tipoUsuario: string;
  planNombre?:   string;
  empresaNombre?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private baseUrl = `${environment.apiUrl}/api/usuarios`;
 
  // Control de peticiones simultáneas
  private perfilPeticionInFlight$: Observable<Usuario> | null = null;

  // Estado del usuario para toda la app
  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  public usuarioActual$ = this.usuarioSubject.asObservable();

  
getPerfil(): Observable<Usuario> {
  if (this.usuarioSubject.value) return of(this.usuarioSubject.value);
  
  return this.auth.getAccessTokenSilently().pipe(
    switchMap(token => 
      this.http.get<Usuario>(`${this.baseUrl}/perfil`, {
        headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
      })
    ),
    tap(usuario => this.usuarioSubject.next(usuario)),
    // No guardes la petición en una variable externa si da error, 
    // mejor deja que el catchError limpie todo.
    catchError(err => {
      this.invalidarCache();
      throw err;
    })
  );
}

  completarPerfil(perfil: any): Observable<Usuario> {
    return this.auth.getAccessTokenSilently().pipe(
      switchMap(token => {
        const headers = new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
        return this.http.post<Usuario>(`${this.baseUrl}/completar-perfil`, perfil, { headers });
      }),
      tap(usuario => this.usuarioSubject.next(usuario)) // Actualizamos caché tras completar
    );
  }

  actualizarPerfil(perfil: any): Observable<Usuario> {
  return this.auth.getAccessTokenSilently().pipe(
    switchMap(token => {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      // Usamos PUT para actualizar datos existentes
      return this.http.put<Usuario>(`${this.baseUrl}/perfil`, perfil, { headers });
    }),
    tap(usuario => {
      // Súper importante: actualizamos el BehaviorSubject para que el 
      // Navbar y toda la app vean el nuevo nombre/datos al instante
      this.usuarioSubject.next(usuario);
    })
  );
}

  invalidarCache() {
    this.usuarioSubject.next(null);
    this.perfilPeticionInFlight$ = null;
  }

  logout() {
    this.usuarioSubject.next(null);
    this.perfilPeticionInFlight$ = null;
    // Opcional: llamar a this.auth.logout() aquí si quieres cerrar Auth0 también
  }
}

