// sensor.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../environments/environment';


export interface Sensor {
  id?: number;
  tipo: string;
  modelo: string;
  ubicacion: string;
  latitud: number;
  longitud: number;
  activo?: boolean;
  alturaInstalacion?: number;
  esGlobal?:          boolean;
  fechaInstalacion?: string;
  deviceId: string;
}

@Injectable({ providedIn: 'root' })
export class SensorService {

  
  private http    = inject(HttpClient);
  private auth    = inject(AuthService);
  private baseUrl = `${environment.apiUrl}/api/sensores`;


  private withToken<T>(fn: (token: string) => Observable<T>): Observable<T> {
    return this.auth.getAccessTokenSilently().pipe(switchMap(fn));
  }

getMisSensores(): Observable<Sensor[]> {
    return this.auth.getAccessTokenSilently().pipe(
      switchMap(token => this.http.get<Sensor[]>(`${this.baseUrl}/mis-sensores`, {
        headers: { Authorization: `Bearer ${token}` }
      }))
    );
    
  }

  

 crearSensor(sensor: Partial<Sensor>): Observable<Sensor> {
    return this.auth.getAccessTokenSilently().pipe(
      switchMap(token => this.http.post<Sensor>(this.baseUrl, sensor, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      }))
    );
  }

  
  desactivarSensor(id: number): Observable<any> {
    return this.auth.getAccessTokenSilently().pipe(
      switchMap(token => this.http.put(`${this.baseUrl}/${id}/desactivar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }))
    );
  }

  
  activarSensor(id: number): Observable<any> {
    return this.auth.getAccessTokenSilently().pipe(
      switchMap(token => this.http.put(`${this.baseUrl}/${id}/activar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }))
    );
  }
  getSensor(id: number): Observable<Sensor> {
    return this.withToken(token =>
      this.http.get<Sensor>(`${this.baseUrl}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );
  }

  // extraer zonas únicas ordenadas
 getZonas(sensores: Sensor[]): string[] {
    const zonas = sensores.map(s => s.ubicacion?.trim()).filter((z): z is string => !!z);
    return [...new Set(zonas)];
  }
}