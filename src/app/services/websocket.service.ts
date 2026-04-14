import { Injectable, OnDestroy } from '@angular/core';
import { Client } from '@stomp/stompjs';
import { Subject, Observable } from 'rxjs';
import { sampleTime } from 'rxjs/operators';
import { environment } from '../environments/environment';



@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {

  private client: Client | null = null;
  private lecturasRaw$ = new Subject<any>();
  // 🔥 Filtrar para procesar SOLO una lectura cada 1 segundo (esto salva la CPU)
  private lecturasFiltradas$ = this.lecturasRaw$.pipe(sampleTime(1000));
  
  private suscripcionesActivas = new Map<string, any>(); // Guardamos el objeto suscripción para poder cancelarla

  conectar(deviceId: string) {
    if (this.suscripcionesActivas.has(deviceId)) return;

    if (!this.client) {
      this.client = new Client({
        brokerURL: environment.wsUrl,  // Cámbialo a tu URL de producción si es necesario
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => this.suscribirASensor(deviceId),
        onStompError: (frame) => console.error('STOMP error:', frame)
      });
      this.client.activate();
    } else if (this.client.connected) {
      this.suscribirASensor(deviceId);
    }
  }

 private suscribirASensor(deviceId: string) {
    if (!this.client || this.suscripcionesActivas.has(deviceId)) return;
    const sub = this.client.subscribe(`/topic/sensor/${deviceId}`, msg => {
      try { this.lecturasRaw$.next(JSON.parse(msg.body)); }
      catch { console.warn('WebSocket: mensaje no parseable', msg.body); }
    });
    this.suscripcionesActivas.set(deviceId, sub);
  }

  //  NUEVO: Método para dejar de escuchar cuando salimos de la página
  desuscribirTodo() {
    this.suscripcionesActivas.forEach(sub => { try { sub.unsubscribe(); } catch {} });
    this.suscripcionesActivas.clear();
  }

  getLecturas(): Observable<any> {
    return this.lecturasFiltradas$; // El componente solo recibe 1 dato por segundo
  }

  ngOnDestroy() {
    this.desuscribirTodo();
    if (this.client) this.client.deactivate();
  }
}