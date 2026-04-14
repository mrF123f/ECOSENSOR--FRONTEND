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
    // 1. Si ya tenemos el usuario en el BehaviorSubject, lo devolvemos de inmediato
    if (this.usuarioSubject.value) {
      return of(this.usuarioSubject.value);
    }

    // 2. Si hay una petición cargando, devolvemos la misma para no duplicar
    if (this.perfilPeticionInFlight$) {
      return this.perfilPeticionInFlight$;
    }

    // 3. Creamos la petición y la guardamos en 'perfilPeticionInFlight$'
    this.perfilPeticionInFlight$ = this.auth.getAccessTokenSilently().pipe(
      switchMap(token => 
        this.http.get<Usuario>(`${this.baseUrl}/perfil`, {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
        })
      ),
      tap(usuario => {
        this.usuarioSubject.next(usuario); // Actualizamos el estado global
        this.perfilPeticionInFlight$ = null; // Liberamos la bandera
      }),
      catchError((err:any) => {
        this.perfilPeticionInFlight$ = null; // Liberamos en caso de error
        throw err;
      }),
      shareReplay(1) // Mantiene la respuesta para suscriptores tardíos
    );

    return this.perfilPeticionInFlight$;
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

