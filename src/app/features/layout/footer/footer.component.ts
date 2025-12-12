import { Component } from '@angular/core';

/**
 * Componente Footer
 * Rodapé fixo da aplicação
 */
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  version = '1.0.0';
  
  displayTerms = false;
  displayPrivacy = false;
  displaySupport = false;

  showTermsDialog(): void {
    this.displayTerms = true;
  }

  showPrivacyDialog(): void {
    this.displayPrivacy = true;
  }

  showSupportDialog(): void {
    this.displaySupport = true;
  }
}
