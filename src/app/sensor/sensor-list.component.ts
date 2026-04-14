// sensor-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sensor, SensorService } from '../services/sensor.service';
import { Router } from '@angular/router';
import { UsuarioService } from '../services/usuario.service';

@Component({
  selector: 'app-sensor-list',
  standalone: true,
  imports: [CommonModule],  // FormsModule no se necesita aquí
  templateUrl: './sensor-list.component.html',
  styleUrls: ['./sensor-list.component.css']
})
export class SensorListComponent implements OnInit {

  sensores: Sensor[] = [];
  cargando = true;
  error: string | null = null;

  constructor(
    private sensorService: SensorService,
    private router: Router,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.cargarSensores();
  }

  cargarSensores() {
    this.cargando = true;
    this.sensorService.getMisSensores().subscribe({
      next: (data) => {
        this.sensores = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error cargando sensores';
        console.error(err);
        this.cargando = false;
      }
    });
  }

  irCrearSensor() {
    this.router.navigate(['/sensores/crear']);
  }

  toggleSensor(sensor: Sensor) {
    if (!sensor.id) return;
  const estadoOriginal = sensor.activo;
  
  const accion = sensor.activo ? 
    this.sensorService.desactivarSensor(sensor.id) : 
    this.sensorService.activarSensor(sensor.id);

  accion.subscribe({
    next: () => sensor.activo = !estadoOriginal,
    error: (err) => {
      console.error("No se pudo cambiar el estado", err);
      // Opcional: mostrar una notificación de error aquí
    }
  });
  }

  irDashboard() {
 this.usuarioService.getPerfil().subscribe({
    next: (user) => {
      if (user.tipoUsuario === 'EMPRESA') {
        this.router.navigate(['/company']);
      } else {
        this.router.navigate(['/home']);
      }
    },
    error: () => this.router.navigate(['/home'])
  });
}

  // 🔥 helpers para el template

  get sensoresActivos(): number {
    return this.sensores.filter(s => s.activo).length;
  }

  contarTipo(tipo: string): number {
    return this.sensores.filter(s => s.tipo === tipo).length;
  }

  getTipoIcon(tipo: string): string {
    const icons: Record<string, string> = {
      'AIRE': '🌫',
      'AGUA': '💧',
      'ENERGIA': '⚡'
    };
    return icons[tipo] ?? '📡';
  }

  getTipoClass(tipo: string): string {
    const classes: Record<string, string> = {
      'AIRE': 'tipo-aire',
      'AGUA': 'tipo-agua',
      'ENERGIA': 'tipo-energia'
    };
    return classes[tipo] ?? 'tipo-default';
  }
}