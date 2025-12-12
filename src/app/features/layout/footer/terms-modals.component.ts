import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * Componente para os modais de Termos, Privacidade e Suporte
 */
@Component({
  selector: 'app-terms-modals',
  templateUrl: './terms-modals.component.html',
  styleUrls: ['./footer.component.scss']
})
export class TermsModalsComponent {
  @Input() displayTerms = false;
  @Output() displayTermsChange = new EventEmitter<boolean>();
  
  @Input() displayPrivacy = false;
  @Output() displayPrivacyChange = new EventEmitter<boolean>();
  
  @Input() displaySupport = false;
  @Output() displaySupportChange = new EventEmitter<boolean>();
}
