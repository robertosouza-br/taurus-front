import { Component, Input, TemplateRef } from '@angular/core';

export interface HeaderAction {
  label: string;
  icon: string;
  severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';
  outlined?: boolean;
  visible?: boolean;
  disabled?: boolean;
  action: () => void;
}

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.scss'
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() actions: HeaderAction[] = [];
  @Input() customTemplate?: TemplateRef<any>;
  @Input() showDivider = true;
  @Input() gradient = true;
}
