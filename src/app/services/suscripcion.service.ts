import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SuscripcionService {

  private http    = inject(HttpClient);
  private auth    = inject(AuthService);
  private baseUrl = `${environment.apiUrl}/api/suscripciones`;


  crearSuscripcion(empresaId:number, planId:number):Observable<any>{
    return this.auth.getAccessTokenSilently().pipe(
      switchMap(token =>
        this.http.post(this.baseUrl, { empresaId, planId }, {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
        })
      )
    );
  }

  listarPorEmpresa(empresaId:number){
    return this.auth.getAccessTokenSilently().pipe(
      switchMap(token =>
        this.http.get<any[]>(`${this.baseUrl}/empresa/${empresaId}`, {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
        })
      )
    );
  }

  listarPorUsuario(usuarioId: number): Observable<any[]> {
    return this.auth.getAccessTokenSilently().pipe(
      switchMap(token =>
        this.http.get<any[]>(`${this.baseUrl}/usuario/${usuarioId}`, {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
        })
      )
    );
  }

  cancelar(id:number){
    return this.auth.getAccessTokenSilently().pipe(
      switchMap(token =>
        this.http.put(`${this.baseUrl}/${id}/cancelar`, {}, {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
        })
      )
    );
  
  }

}