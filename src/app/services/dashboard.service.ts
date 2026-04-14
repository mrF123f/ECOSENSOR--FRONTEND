import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { AuthService, GetTokenSilentlyOptions } from '@auth0/auth0-angular';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private http    = inject(HttpClient);
  private auth    = inject(AuthService);
  private baseUrl = `${environment.apiUrl}/api/dashboard`;


getDashboardPorSensor(sensorId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/sensor/${sensorId}`);
  }


  descargarReporte(empresaId: number): Observable<Blob> {
    return this.auth.getAccessTokenSilently().pipe(
      switchMap(token =>
        this.http.get(`${this.baseUrl}/empresa/${empresaId}/reporte`, {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
          responseType: 'blob'
        })
      )
    );
  
}

getDashboardEmpresa(empresaId: number): Observable<any> {
    return this.auth.getAccessTokenSilently().pipe(
      switchMap(token =>
        this.http.get<any>(`${this.baseUrl}/empresa/${empresaId}`, {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
        })
      )
    );
  
}

getSensores(empresaId: number): Observable<any[]> {
  return this.auth.getAccessTokenSilently().pipe(
    switchMap(token => 
      this.http.get<any[]>(`${this.baseUrl}/empresa/${empresaId}/sensores`, {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
        })
      
    )
  );
}
}