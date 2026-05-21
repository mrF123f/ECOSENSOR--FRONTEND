import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { planGuard } from './guards/plan.guard';
import { CallbackComponent } from './callback/callback.component';




export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.component')
      .then(m => m.LandingComponent)
  },
{
    path: 'callback',
    component: CallbackComponent   // No usar lazy loading aquí
  },
 
  {
    path:'home',
    canActivate:[authGuard],
    loadComponent:() => import('./pages/home-dashboard/home-dashboard.component')
    .then(m => m.HomeDashboardComponent)
  },

  {
    path:'company',
    canActivate:[authGuard],
    loadComponent:() => import('./pages/company-dashboard/company-dashboard.component')
    .then(m => m.CompanyDashboardComponent)
  },

  { path:'suscripcion',
  canActivate:[authGuard],
  loadComponent:() => import('./suscripcion/suscripcion.component')
  .then(m => m.SuscripcionComponent) },

  {
  path: 'completar-perfil',
  canActivate: [authGuard],
  loadComponent: () => import('./pages/completar-perfil/completar-perfil.component')
    .then(m => m.CompletarPerfilComponent)
},
{
  path: 'mis-sensores',
  canActivate: [authGuard],
  loadComponent: () => import('./sensor/sensor-list.component')
    .then(m => m.SensorListComponent)
},
{
  path: 'sensores/crear',
  canActivate: [authGuard],
  loadComponent: () => import('./sensor/sensor-form.component')
    .then(m => m.SensorFormComponent)
},
{
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/admin/admin.component')
      .then(m => m.AdminComponent)
  },

  {
  path: 'suscripcion/confirmado',
  canActivate: [authGuard],
  loadComponent: () => import('./pages/pagoconfirmado/pagoconfirmado.component')
    .then(m => m.PagoConfirmadoComponent)
},

{
  path: 'predicciones',
  canActivate: [authGuard, planGuard],
  data: { planes: ['PRO', 'ENTERPRISE'] },
  loadComponent: () => import('./predicciones/predicciones.component')
    .then(m => m.PrediccionesComponent)
},
{
  path: 'perfil',
  canActivate: [authGuard],
  loadComponent: () => import('./pages/perfil/perfil.component')
    .then(m => m.PerfilComponent)
},

  {
    path: '**',
    redirectTo:''
  }

];