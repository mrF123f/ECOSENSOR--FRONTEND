// src/app/pages/perfil/perfil.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '@auth0/auth0-angular';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {

  private fb             = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  public  auth           = inject(AuthService);

  usuario:     any    = null;
  cargando     = true;
  guardando    = false;
  tabActiva: 'perfil' | 'notificaciones' | 'preferencias' | 'seguridad' = 'perfil';
  mensajeExito = '';
  mensajeError = '';

  formPerfil!:        FormGroup;
  formNotificaciones!: FormGroup;
  formPreferencias!:  FormGroup;

  iniciales = '';

  // Métricas de interés disponibles
  metricasDisponibles = [
    { key: 'pm25',    label: 'Calidad del Aire (PM2.5)', icon: '🌫️',  color: '#22c55e' },
    { key: 'ph',      label: 'Calidad del Agua (pH)',    icon: '💧',  color: '#06b6d4' },
    { key: 'energia', label: 'Consumo Energético (kWh)', icon: '⚡',  color: '#facc15' },
    { key: 'co2',     label: 'CO₂ ambiental',            icon: '🌿',  color: '#34d399' },
    { key: 'temp',    label: 'Temperatura',              icon: '🌡️',  color: '#f97316' },
    { key: 'humedad', label: 'Humedad relativa',         icon: '💨',  color: '#818cf8' },
  ];

  metricasSeleccionadas = new Set<string>(['pm25', 'ph', 'energia']);

  ngOnInit(): void {
    this.initForms();
    this.cargarPerfil();
  }

  private initForms() {
    this.formPerfil = this.fb.group({
      nombre:   ['', [Validators.required, Validators.minLength(3)]],
      emailRecuperacion: ['', [Validators.email]],
    });

    this.formNotificaciones = this.fb.group({
      recibirAlertasEmail:  [true],
      frecuenciaResumen:    ['diario'],   // diario | semanal | nunca
      alertasCriticas:      [true],
      alertasAltas:         [true],
      alertasMedias:        [false],
      reporteSemanal:       [true],
    });

    this.formPreferencias = this.fb.group({
      idioma:       ['es'],
      zonaHoraria:  ['America/Lima'],
      temaOscuro:   [true],
      unidadTemp:   ['celsius'],
    });
  }

  private cargarPerfil() {
    this.cargando = true;
    this.usuarioService.getPerfil().subscribe({
      next: (u: any) => {
        this.usuario = u;
        this.iniciales = this.getIniciales(u.nombre);
        this.formPerfil.patchValue({
          nombre:            u.nombre,
          emailRecuperacion: u.emailRecuperacion ?? '',
        });
        this.formNotificaciones.patchValue({
          recibirAlertasEmail: u.recibirAlertasEmail ?? true,
        });
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  cambiarTab(tab: 'perfil' | 'notificaciones' | 'preferencias' | 'seguridad') {
    this.tabActiva    = tab;
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  guardarPerfil() {
    if (this.formPerfil.invalid) { this.formPerfil.markAllAsTouched(); return; }

    this.guardando = true;
    const datosParaGuardar = {
      ...this.formPerfil.value,
      recibirAlertasEmail: this.formNotificaciones.value.recibirAlertasEmail
    };

     this.usuarioService.actualizarPerfil(datosParaGuardar).subscribe({
    next: (user) => {
      this.guardando = false;
      this.mensajeExito = '¡Perfil actualizado correctamente!';
      // No necesitas actualizar iniciales a mano, el tap del servicio ya lo hace
      setTimeout(() => this.mensajeExito = '', 3000);
    },
    error: (err) => {
      this.guardando = false;
      this.mensajeError = 'Error al actualizar el perfil.';
    }
  });
}

  guardarNotificaciones() {
    this.guardando = true;
    setTimeout(() => {
      this.guardando    = false;
      this.mensajeExito = 'Preferencias de notificación guardadas.';
      setTimeout(() => this.mensajeExito = '', 3000);
    }, 600);
  }

  guardarPreferencias() {
    this.guardando = true;
    setTimeout(() => {
      this.guardando    = false;
      this.mensajeExito = 'Preferencias actualizadas.';
      setTimeout(() => this.mensajeExito = '', 3000);
    }, 600);
  }

  cambiarPassword() {
    // Auth0 gestiona el cambio de contraseña — se abre el portal de Auth0
    this.auth.loginWithRedirect({
      authorizationParams: { prompt: 'login' }
    });
  }

  toggleMetrica(key: string) {
    if (this.metricasSeleccionadas.has(key)) {
      this.metricasSeleccionadas.delete(key);
    } else {
      this.metricasSeleccionadas.add(key);
    }
  }

  getIniciales(nombre: string): string {
    if (!nombre) return 'U';
    const p = nombre.trim().split(' ');
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : p[0][0].toUpperCase();
  }

  getPlanColor(): string {
    const plan = this.usuario?.planNombre ?? 'Básico';
    if (plan.includes('Enterprise')) return '#f59e0b';
    if (plan.includes('Pro'))        return '#a78bfa';
    return '#64748b';
  }
}