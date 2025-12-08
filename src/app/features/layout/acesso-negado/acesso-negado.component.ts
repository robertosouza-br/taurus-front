import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

/**
 * Componente de Acesso Negado
 * Exibido quando o usuário tenta acessar um recurso sem permissão (403)
 */
@Component({
  selector: 'app-acesso-negado',
  templateUrl: './acesso-negado.component.html',
  styleUrls: ['./acesso-negado.component.scss']
})
export class AcessoNegadoComponent {

  constructor(
    private router: Router,
    private location: Location
  ) {}

  /**
   * Volta para a página anterior
   */
  voltar(): void {
    this.location.back();
  }

  /**
   * Navega para o dashboard
   */
  irParaDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
