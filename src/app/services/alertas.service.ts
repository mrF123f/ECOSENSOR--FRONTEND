import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class AlertaService {

  private http    = inject(HttpClient);
  private auth    = inject(AuthService);
  private baseUrl = `${environment.apiUrl}/api/alertas`;

  getAlertas(): Observable<any[]> {
    return this.auth.getAccessTokenSilently().pipe(
      switchMap(token =>
        this.http.get<any[]>(`${this.baseUrl}/mis-alertas`, {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
        })
      )
    );
  }

  atenderAlerta(sensorId: number): Observable<any> {
    return this.auth.getAccessTokenSilently().pipe(
      switchMap(token =>
        this.http.put(`${this.baseUrl}/sensor/${sensorId}/atender`, {}, {
          headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
        })
      )
    );
  }
}