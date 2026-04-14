import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {

  private http = inject(HttpClient);
    private auth    = inject(AuthService);
  private baseUrl = `${environment.apiUrl}/api/empresas`;

  // ✅ Crear una empresa vinculada a un creador (Multi-empresa)
  crear(empresa: any): Observable<any> {
    return this.auth.getAccessTokenSilently().pipe(
      switchMap(token =>
        this.http.post<any>(`${this.baseUrl}/registro`, empresa, {
          headers: new HttpHeaders({
            Authorization:  `Bearer ${token}`,
            'Content-Type': 'application/json'
          })
        })
          )
    );
  }

  // ✅ Listar solo las empresas de un usuario específico
  listarMisEmpresas(usuarioId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/mis-empresas/${usuarioId}`);
  }

  // ✅ Obtener detalle de una empresa
  obtenerPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }
}