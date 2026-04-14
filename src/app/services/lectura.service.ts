import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';


export interface LecturaRequest {
  deviceId: string;
  tipoMetrica: string;
  valor: number;
  temperatura?: number;
  humedad?: number;
}

@Injectable({
  providedIn: 'root'
})
export class LecturaService {

  private http    = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/lecturas`;


  enviarLectura(data: LecturaRequest): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }
}