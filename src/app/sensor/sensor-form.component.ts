// sensor-form.component.ts
import { Component, OnInit } from '@angular/core';
import { SensorService, Sensor } from '../services/sensor.service';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sensor-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sensor-form.component.html',
  styleUrls: ['./sensor-form.component.css']
})
export class SensorFormComponent implements OnInit {

  sensor: Sensor = {
    tipo: '', modelo: '', ubicacion: '',
    latitud: 0, longitud: 0, deviceId: ''
  };

  // Estado UI
  mensaje        = '';
  mensajeError   = false;
  guardando      = false;
  obtenendoUbicacion = false;

  // Zonas
  zonasExistentes: string[] = [];   // zonas que ya tiene el usuario
  modoZona: 'existente' | 'nueva' = 'existente';
  zonaSeleccionada = '';            // zona elegida del selector
  zonaNueva = '';                   // zona escrita manualmente
    sugerencias: string[] = [];


     // ── REGLAS DE ZONA → TIPOS PERMITIDOS ────────────────────────
  // Basado en lógica física real:
  // Tablero / eléctrico → solo ENERGIA
  // Cisterna / tubería / baño → solo AGUA
  // Cocina → AGUA + ENERGIA (nunca AIRE — el humo altera lecturas)
  // Sala / dormitorio / oficina → AIRE + ENERGIA
  // Jardín / exterior → AIRE + AGUA
  // Todo lo demás → los tres tipos
  private readonly reglasZona: Record<string, string[]> = {
    // SOLO ENERGÍA
    'tablero':          ['ENERGIA'],
    'tablero eléctrico':['ENERGIA'],
    'tablero principal':['ENERGIA'],
    'panel eléctrico':  ['ENERGIA'],
    'cuarto de maquinas':['ENERGIA'],
    // SOLO AGUA
    'cisterna':         ['AGUA'],
    'tanque de agua':   ['AGUA'],
    'tubería':          ['AGUA'],
    'cuarto de agua':   ['AGUA'],
    'planta de agua':   ['AGUA'],
    // AGUA + ENERGÍA (NO AIRE — humo / vapor altera lecturas)
    'cocina':           ['AGUA', 'ENERGIA'],
    'lavandería':       ['AGUA', 'ENERGIA'],
    'lavadero':         ['AGUA', 'ENERGIA'],
    'comedor':          ['AGUA', 'ENERGIA'],
    // AGUA + AIRE (exterior)
    'jardín':           ['AIRE', 'AGUA'],
    'exterior':         ['AIRE', 'AGUA'],
    'azotea':           ['AIRE', 'AGUA'],
    'terraza':          ['AIRE', 'AGUA'],
    'piscina':          ['AGUA'],
    // AIRE + ENERGÍA (interiores habitables)
    'sala':             ['AIRE', 'ENERGIA'],
    'dormitorio':       ['AIRE', 'ENERGIA'],
    'habitación':       ['AIRE', 'ENERGIA'],
    'oficina':          ['AIRE', 'ENERGIA'],
    'recepción':        ['AIRE', 'ENERGIA'],
    'sala de reuniones':['AIRE', 'ENERGIA'],
    'garaje':           ['AIRE', 'ENERGIA'],
    // BAÑO → AGUA + AIRE (humedad, no energía normalmente)
    'baño':             ['AGUA', 'AIRE'],
    'baños':            ['AGUA', 'AIRE'],
    'servicio':         ['AGUA', 'AIRE'],
    // INDUSTRIAL — los tres
    'producción':       ['AIRE', 'AGUA', 'ENERGIA'],
    'almacén':          ['AIRE', 'ENERGIA'],
    'área de carga':    ['ENERGIA'],
  };
 
  // Sugerencias con su ícono y tipo principal
  readonly sugerenciasHogar = [
    { label: 'Sala',              icon: '🛋️' },
    { label: 'Cocina',            icon: '🍳' },
    { label: 'Dormitorio',        icon: '🛏️' },
    { label: 'Baño',              icon: '🚿' },
    { label: 'Garaje',            icon: '🚗' },
    { label: 'Jardín',            icon: '🌿' },
    { label: 'Tablero eléctrico', icon: '⚡' },
    { label: 'Tanque de agua',    icon: '💧' },
  ];
 
  readonly sugerenciasEmpresa = [
    { label: 'Oficina',           icon: '💼' },
    { label: 'Producción',        icon: '🏭' },
    { label: 'Almacén',           icon: '📦' },
    { label: 'Recepción',         icon: '🏢' },
    { label: 'Baños',             icon: '🚿' },
    { label: 'Tablero principal', icon: '⚡' },
    { label: 'Cisterna',          icon: '💧' },
    { label: 'Área de carga',     icon: '🚛' },
  ];
 
  sugerenciasConIcono: { label: string; icon: string }[] = [];

  // Modelos disponibles por tipo
  readonly modelos: Record<string, {value: string, label: string}[]> = {
   AIRE: [
      // Partículas y Calidad General
      { value: 'PMS5003', label: 'Plantower PMS5003 — Partículas PM2.5' },
      { value: 'SDS011', label: 'Nova Fitness SDS011 — Partículas Finas' },
      { value: 'SPS30', label: 'Sensirion SPS30 — Partículas Grado MCERTS' },
      { value: 'BME680', label: 'Bosch BME680 — Gas VOC / Calidad 4-en-1' },
      { value: 'MQ135', label: 'MQ135 — Calidad de Aire General' },
      // Gases Específicos e Industriales
      { value: 'SCD30', label: 'SCD30 — CO2 NDIR de alta precisión' },
      { value: 'SCD41', label: 'SCD41 — CO2 Fotoacústico (Mini)' },
      { value: 'MQ7', label: 'MQ7 — Monóxido de Carbono (CO)' },
      { value: 'MQ9', label: 'MQ9 — Gas Combustible y CO' },
      { value: 'MQ131', label: 'MQ131 — Ozono (O3)' },
      { value: 'ZE08-CH2O', label: 'ZE08 — Formaldehído' },
      { value: 'MICS-6814', label: 'MICS-6814 — NO2, CO, NH3' },
      { value: 'OX-B431', label: 'Alphasense OX-B431 — Ozono Industrial' },
      { value: 'MH-Z19B', label: 'MH-Z19B — CO2 por Infrarrojo' },
      { value: 'SenseAir S8', label: 'SenseAir S8 — Monitor CO2 Profesional' },
      { value: 'BME280', label: 'BME280 — Presión/Humedad Ambiental' },
      { value: 'MQ4', label: 'MQ4 — Metano / Gas Natural' },
      { value: 'MQ8', label: 'MQ8 — Hidrógeno' },
      { value: 'MICS-5524', label: 'MICS-5524 — Humos y Fugas' },
      { value: 'SPEC-CO-1000', label: 'SPEC — CO Grado Médico' },
      { value: 'Libelium-SC', label: 'Libelium — Smart City Air Node' },
      { value: 'Vaisala-GMP252', label: 'Vaisala — CO2 Industrial' },
      { value: 'Aeroqual-S500', label: 'Aeroqual — Estación Portátil' },
      { value: 'Alphasense-NO2', label: 'Alphasense — Dióxido de Nitrógeno' },
      { value: 'Honeywell-HPM', label: 'Honeywell HPMA — Particulado' },
      { value: 'Plantower-G5', label: 'Plantower G5 — Sensor Láser' },
      { value: 'Winsen-ZH03B', label: 'Winsen — Sensor Láser PM2.5' },
      { value: 'Figaro-TGS2600', label: 'Figaro — Contaminantes de Cocina' },
      { value: 'K-30-NDIR', label: 'K-30 — CO2 para Refrigeración' },
      { value: 'DHT22', label: 'DHT22 — Temperatura y Humedad Aire' }
    ],
    AGUA: [
      // Industrial y Tratamiento
      { value: 'YF-DN50', label: 'YF-DN50 — Caudal Industrial 2"' },
      { value: 'Atlas-pH-Kit', label: 'Atlas Scientific — Kit pH Pro' },
      { value: 'DO-600', label: 'DO-600 — Oxígeno Disuelto' },
      { value: 'TSW-20M', label: 'TSW-20M — Turbidez Analógica' },
      { value: 'DFR-Conductivity', label: 'DFRobot — Conductividad Eléctrica' },
      { value: 'ORP-203', label: 'ORP-203 — Potencial Redox' },
      { value: 'Gravity-TDS', label: 'Gravity — Medidor Sólidos Disueltos' },
      { value: 'Ultrasonic-DYP', label: 'DYP — Nivel de Tanque Ultrasónico' },
      { value: 'Submersible-P', label: 'Submersible — Presión Hidrostática' },
      { value: 'Nitrate-Pro', label: 'Nitrate-Pro — Monitoreo Nitratos' },
      { value: 'Chlorine-CL2', label: 'CL2 — Analizador de Cloro Libre' },
      // Hogar y Domótica
      { value: 'YF-S201', label: 'YF-S201 — Caudalímetro 1/2"' },
      { value: 'YF-S401', label: 'YF-S401 — Medidor de Goteo' },
      { value: 'D-Leak-01', label: 'D-Leak — Sensor Inundación Suelo' },
      { value: 'Non-Contact-L', label: 'Non-Contact — Nivel Externo Tanque' },
      { value: 'Smart-Valve-01', label: 'Smart Valve — Corte Automático' },
      { value: 'Rain-Sensor-V3', label: 'Rain-V3 — Detector de Lluvia' },
      { value: 'Soil-Moisture-V2', label: 'Soil-V2 — Humedad de Jardín' },
      { value: 'DS18B20-IND', label: 'DS18B20 — Temperatura Sumergible' },
      { value: 'LS-304', label: 'LS-304 — Switch de Nivel Vertical' },
      { value: 'MagFlow-Meter', label: 'MagFlow — Caudal Electromagnético' },
      { value: 'TDS-Stick', label: 'TDS Stick — Calidad de Agua Bebida' },
      { value: 'NTC-10K-W', label: 'NTC 10K — Sensor Temperatura Termo' },
      { value: 'Gravity-PH-H', label: 'Gravity-PH — Control de Piscinas' },
      { value: 'Flow-Hall-01', label: 'Hall Effect — Sensor de Fugas' },
      { value: 'Hardness-S', label: 'Hardness-S — Ablandador de Agua' },
      { value: 'UV-Disinfection', label: 'UV Monitor — Esterilización' },
      { value: 'Pressure-H-01', label: 'Pressure-H — Presión Domiciliaria' },
      { value: 'FS400A', label: 'FS400A — Caudalímetro 1"' },
      { value: 'E-Tape-Liquid', label: 'eTape — Regla de Nivel Electrónica' }
    ],
    ENERGIA: [
      // Industrial / Tableros
      { value: 'PZEM-016', label: 'PZEM-016 — Monitor Trifásico Modbus' },
      { value: 'SCT-013-100', label: 'SCT-013 — Transformador AC 100A' },
      { value: 'PZEM-004T', label: 'PZEM-004T — Medidor Multifunción AC' },
      { value: 'Shelly-Pro-3EM', label: 'Shelly Pro — Energía Trifásica DIN' },
      { value: 'EM24-DIN', label: 'Carlo Gavazzi — Analizador Red' },
      { value: 'LEM-LTS-25', label: 'LEM — Sensor Corriente Solar DC' },
      { value: 'PZEM-017', label: 'PZEM-017 — Medidor de Corriente DC' },
      { value: 'ADE7753', label: 'ADE7753 — Integrado Medición Watt' },
      { value: 'Current-Trans-50A', label: 'CT 50A — Split Core (Abatible)' },
      { value: 'ZMPT101B', label: 'ZMPT101B — Sensor Voltaje AC' },
      { value: 'ACS712-30A', label: 'ACS712 — Corriente por Efecto Hall' },
      // Hogar
      { value: 'Shelly-EM', label: 'Shelly EM — Monitor de 2 Canales' },
      { value: 'Shelly-1PM', label: 'Shelly 1PM — Relé con Medidor' },
      { value: 'Sonoff-POW-R3', label: 'Sonoff POW — Alta Potencia 25A' },
      { value: 'SCT-013-030', label: 'SCT-013 — Medidor Termas 30A' },
      { value: 'INA219', label: 'INA219 — Monitor de Voltaje/Corriente DC' },
      { value: 'HLW8012', label: 'HLW8012 — Chip Medición Energía' },
      { value: 'DDS238', label: 'DDS238 — Medidor Energía Riel DIN' },
      { value: 'Watt-Monitor-V2', label: 'Watt-V2 — Enchufe Inteligente' },
      { value: 'Shelly-Plus-Plug-S', label: 'Shelly Plug — Monitor Portátil' },
      { value: 'INA226', label: 'INA226 — Precisión para Paneles' },
      { value: 'SCT-013-005', label: 'SCT-013 — Carga Vehículo (EV)' },
      { value: 'Current-Hall-50', label: 'Hall 50 — Monitor Ascensores' },
      { value: 'ACS712-20A', label: 'ACS712 — Monitor de Standby' },
      { value: 'PZEM-004T-V3', label: 'PZEM-004T V3 — Versión Actualizada' },
      { value: 'Smart-Meter-Zigbee', label: 'Zigbee Meter — Domótica' },
      { value: 'CT-Split-200A', label: 'CT 200A — Tablero Industrial' },
      { value: 'DC-Shunt-100A', label: 'Shunt 100A — Medición Baterías' },
      { value: 'Voltage-Divider-H', label: 'Voltage Divider — Alta Tensión' },
      { value: 'Energy-Logger-SD', label: 'Logger SD — Registro Autónomo' }
    ]
  };


  constructor(
    private sensorService: SensorService,
    public router: Router
  ) {}

  ngOnInit(): void {
    // cargar zonas existentes del usuario
    this.sensorService.getMisSensores().subscribe({
      next: (sensores) => {
        this.zonasExistentes = this.sensorService.getZonas(sensores);
        this.modoZona        = this.zonasExistentes.length === 0 ? 'nueva' : 'existente';
        if (this.zonasExistentes.length > 0) {
          this.zonaSeleccionada = this.zonasExistentes[0];
          this.sensor.ubicacion = this.zonaSeleccionada;
          // Auto-seleccionar tipo si la zona solo admite uno
          this.aplicarReglaZona(this.zonaSeleccionada);
        }
        this.sugerenciasConIcono = this.sugerenciasHogar;
        this.sugerencias         = this.sugerenciasHogar.map(s => s.label);
      },
      error: () => {
        this.modoZona            = 'nueva';
        this.sugerenciasConIcono = this.sugerenciasHogar;
        this.sugerencias         = this.sugerenciasHogar.map(s => s.label);
      }
    });
  }


 


  // Devuelve los tipos permitidos para la zona actual
  get tiposPermitidos(): string[] {
    const zona = (this.sensor.ubicacion || '').toLowerCase().trim();
    for (const [key, tipos] of Object.entries(this.reglasZona)) {
      if (zona.includes(key)) return tipos;
    }
    return ['AIRE', 'AGUA', 'ENERGIA']; // sin restricción si zona desconocida
  }
 
  isTipoPermitido(tipo: string): boolean {
    return this.tiposPermitidos.includes(tipo);
  }


  
  get mensajeRestriccion(): string {
    const zona = (this.sensor.ubicacion || '').toLowerCase().trim();
    for (const [key] of Object.entries(this.reglasZona)) {
      if (zona.includes(key)) {
        const permitidos = this.tiposPermitidos;
        if (permitidos.length === 1) {
          return `En "${this.sensor.ubicacion}" solo se recomienda sensor de ${this.getTipoLabel(permitidos[0])}.`;
        }
        if (permitidos.length === 2) {
          return `En "${this.sensor.ubicacion}" se recomienda ${permitidos.map(t => this.getTipoLabel(t)).join(' o ')}.`;
        }
      }
    }
    return '';
  }

  
  private aplicarReglaZona(zona: string) {
    const tipos = this.tiposPermitidos;
    // Si la zona solo permite un tipo, seleccionarlo automáticamente
    if (tipos.length === 1) {
      this.sensor.tipo   = tipos[0];
      this.sensor.modelo = '';
    } else if (this.sensor.tipo && !tipos.includes(this.sensor.tipo)) {
      // Si el tipo actual no está permitido, limpiarlo
      this.sensor.tipo   = '';
      this.sensor.modelo = '';
    }
  }

  //TIPO
  
  seleccionarTipo(tipo: string) {
    if (!this.isTipoPermitido(tipo)) return;
    if (this.sensor.tipo === tipo) return;
    this.sensor.tipo   = tipo;
    this.sensor.modelo = '';
    this.mensaje       = '';
  }
 
  get modelosDisponibles() {
    return this.modelos[this.sensor.tipo] ?? [];
  }


  //zona
  seleccionarZonaExistente(zona: string) {
    this.zonaSeleccionada = zona;
    this.sensor.ubicacion = zona;
    this.aplicarReglaZona(zona);

  }

  elegirSugerencia(label: string) {
    this.zonaNueva        = label;
    this.sensor.ubicacion = label;
    this.aplicarReglaZona(label);
  }

  onZonaNuevaChange() {
    this.sensor.ubicacion = this.zonaNueva.trim();
    this.aplicarReglaZona(this.zonaNueva);
  }

  onZonaExistenteChange(event: any) {
    this.zonaSeleccionada = event.target.value;
    this.sensor.ubicacion = this.zonaSeleccionada;
  }

  cambiarModoZona(modo: 'existente' | 'nueva') {
    this.modoZona = modo;
    if (modo === 'existente') {
      this.sensor.ubicacion = this.zonaSeleccionada || this.zonasExistentes[0] || '';
    } else {
      this.sensor.ubicacion = this.zonaNueva.trim();
    }
    this.aplicarReglaZona(this.sensor.ubicacion);
  }

  // ── DEVICE ID ─────────────────────────────────────────────────

  generarDeviceId() {
    const a = Math.random().toString(36).substring(2, 6).toUpperCase();
    const b = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.sensor.deviceId = `DEV-${a}-${b}`;
  }

  // ── GPS ───────────────────────────────────────────────────────

  obtenerUbicacion() {
    if (!navigator.geolocation) {
      this.setError('Tu dispositivo no soporta geolocalización');
      return;
    }
    this.obtenendoUbicacion = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.sensor.latitud  = +pos.coords.latitude.toFixed(6);
        this.sensor.longitud = +pos.coords.longitude.toFixed(6);
        this.obtenendoUbicacion = false;
        this.mensaje = '';
      },
      () => {
        this.obtenendoUbicacion = false;
        this.setError('No se pudo obtener tu ubicación. Permite el acceso en tu navegador.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  // ── GUARDAR ───────────────────────────────────────────────────

  guardar(form: NgForm) {
    if (!form.valid || !this.sensor.tipo) {
      this.setError('Completa todos los campos requeridos');
      return;
    }
    if (!this.sensor.ubicacion?.trim()) {
      this.setError('Selecciona o escribe una zona para el sensor');
      return;
    }
    if (!this.isTipoPermitido(this.sensor.tipo)) {
      this.setError(`El tipo ${this.sensor.tipo} no es recomendado para esta zona.`);
      return;
    }
    if (!this.sensor.deviceId?.trim()) {
      this.generarDeviceId();
    }

    this.guardando = true;
    this.mensaje = '';

    this.sensorService.crearSensor(this.sensor).subscribe({
      next: (s) => {
        this.mensaje = `✓ Sensor de ${this.getTipoLabel(s.tipo)} registrado en "${s.ubicacion}"`;
        this.mensajeError = false;
        this.guardando = false;
        setTimeout(() => this.router.navigate(['/mis-sensores']), 1400);
      },
      error: (err) => {
        const msg = err.error?.message || err.message || '';
        if (msg.includes('deviceId ya registrado')) {
          this.setError('Este ID ya está en uso. Genera uno nuevo.');
        } else if (msg.includes('Límite de sensores')) {
          this.setError('Alcanzaste el límite de sensores de tu plan. Actualiza para agregar más.');
        } else {
          this.setError(msg || 'Error al registrar el sensor');
        }
        this.guardando = false;
      }
    });
  }

  // ── HELPERS ───────────────────────────────────────────────────

  private setError(msg: string) {
    this.mensaje = msg;
    this.mensajeError = true;
  }

 
  getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      AIRE:    'calidad del aire',
      AGUA:    'calidad del agua',
      ENERGIA: 'consumo energético'
    };
    return labels[tipo] ?? tipo;
  }

  get formularioListo(): boolean {
    return !!this.sensor.tipo
      && !!this.sensor.modelo
      && !!this.sensor.ubicacion?.trim()
      && !!this.sensor.deviceId?.trim()
      && this.isTipoPermitido(this.sensor.tipo);
  }
}