// pago-confirmado.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-pago-confirmado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagoconfirmado.component.html',
  styleUrls: ['./pagoconfirmado.component.css']
})
export class PagoConfirmadoComponent implements OnInit {

  estado: 'exitoso' | 'pendiente' | 'error' = 'pendiente';
  planNombre = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    // Pay-me redirige con ?status=APPROVED o ?status=REJECTED
    const status = this.route.snapshot.queryParamMap.get('status') ?? '';
    const order  = this.route.snapshot.queryParamMap.get('orderId') ?? '';

    if (status === 'APPROVED' || status === 'PAGADO') {
      this.estado = 'exitoso';
    } else if (status === 'REJECTED' || status === 'CANCELLED') {
      this.estado = 'error';
    } else {
      this.estado = 'pendiente';
    }

    // cargar el plan actual del perfil
    if (this.estado === 'exitoso') {
      this.usuarioService.getPerfil().subscribe({
        next: (user: any) => {
          this.planNombre = user.planNombre ?? 'Pro';
        }
      });
    }
  }

  irDashboard() {
    this.usuarioService.getPerfil().subscribe({
      next: (user: any) => {
        if (user.tipoUsuario === 'EMPRESA') {
          this.router.navigate(['/company']);
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: () => this.router.navigate(['/home'])
    });
  }

  irSuscripcion() {
    this.router.navigate(['/suscripcion']);
  }
}