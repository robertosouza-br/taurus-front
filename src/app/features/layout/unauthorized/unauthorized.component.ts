import { Component } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Componente de acesso não autorizado (403)
 */
@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.scss']
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/']);
  }
}
