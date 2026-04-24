// completar-perfil.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '@auth0/auth0-angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmpresaService } from '../../services/empresa.service';


@Component({
  selector: 'app-completar-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  templateUrl: './completar-perfil.component.html',
  styleUrls: ['./completar-perfil.component.scss']
})
export class CompletarPerfilComponent implements OnInit {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private usuarioService = inject(UsuarioService);
  private empresaService = inject(EmpresaService); // Necesitaremos este servicio
  public auth = inject(AuthService);




  form!:       FormGroup;
  cargando   = false;
  errorMsg   = '';
  emailAuth0 = '';

  

   ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      tipoUsuario: ['HOGAR', Validators.required],
      recibirAlertasEmail: [true],
      // Campos de empresa agrupados para mejor control
      datosEmpresa: this.fb.group({
        nombreEmpresa: [''],
        ruc: ['', [Validators.pattern('^[0-9]{11}$')]],
        planId: [1] // Plan básico por defecto
      })
    });
    
      this.form.get('tipoUsuario')?.valueChanges.subscribe(tipo => {
        const empresaGroup = this.form.get('datosEmpresa');
        if (tipo === 'EMPRESA') {
        empresaGroup?.get('nombreEmpresa')?.setValidators([Validators.required]);
      } else {
        empresaGroup?.get('nombreEmpresa')?.clearValidators();
        empresaGroup?.reset({ planId: 1 });
      }
        empresaGroup?.get('nombreEmpresa')?.updateValueAndValidity();
      });

      this.auth.user$.subscribe((user:any) => this.emailAuth0 = user?.email || '');
    }

   submit() {
    if (this.form.invalid) {
    // Marcamos todo como tocado para que veas qué falta
    this.form.markAllAsTouched();
    return;
  }
    this.cargando = true;
    this.errorMsg = '';


    const values = this.form.getRawValue();
    
    const perfilDTO = {
      nombre: values.nombre,
      email: this.emailAuth0,
      tipoUsuario: values.tipoUsuario,
      recibirAlertasEmail: values.recibirAlertasEmail,
      empresaNombre: values.datosEmpresa?.nombreEmpresa || null,
      ruc: values.datosEmpresa?.ruc  || null,
       planId:              values.datosEmpresa?.planId        ?? 1,
    };


      // 2. Si es empresa, primero la creamos o preparamos la lógica  
      // Aquí llamamos a tu nuevo endpoint VIP que vincula al creador
      this.usuarioService.completarPerfil(perfilDTO).subscribe({
        next: () => {
          this.usuarioService.invalidarCache(); 

        this.router.navigate([values.tipoUsuario === 'EMPRESA' ? '/suscripcion' : '/home']);

        },
        error: (err: any) => {
        this.cargando = false;
        if (err.status === 200) {
          this.usuarioService.invalidarCache();

        this.router.navigate([values.tipoUsuario === 'EMPRESA' ? '/suscripcion' : '/home']);
          return;
        }
        this.errorMsg = err?.error?.message ?? 'Error al guardar el perfil.';
      }
      
      });
    
    
  }

  private crearEmpresaYVincular(usuarioId: number, values:any) {

    const empresaDTO = {
      nombre:    values.datosEmpresa.nombreEmpresa,
      ruc:       values.datosEmpresa.ruc || null,
      planId:    values.datosEmpresa.planId ?? 1,
      creadorId: usuarioId
    };

    this.empresaService.crear(empresaDTO).subscribe({
      next: () => {
        // Redirección profesional según el flujo de negocio
        this.usuarioService.invalidarCache();
        this.router.navigate(['/suscripcion']);
      }, 
      error: (err: any) => {
        this.cargando = false;
        this.errorMsg = 'Tu perfil fue creado pero hubo un error al registrar la empresa. '
          + 'Contacta soporte si el problema persiste.';
        console.error('Error crear empresa:', err);
      }  
    });
  }
 
  
}
