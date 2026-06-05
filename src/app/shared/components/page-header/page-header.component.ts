import { Component, Input, TemplateRef } from '@angular/core';

export interface HeaderAction {
  label: string;
  icon: string;
  severity?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'help' | 'contrast';
  size?: 'small' | 'normal' | 'large';
  outlined?: boolean;
  rounded?: boolean;
  text?: boolean;
  raised?: boolean;
  visible?: boolean | (() => boolean);
  disabled?: boolean | (() => boolean);
  loading?: boolean | (() => boolean);
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  styleClass?: string;
  action?: () => void;
  command?: () => void;
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

  executeAction(action: HeaderAction): void {
    if (this.isActionDisabled(action) || this.isActionLoading(action)) {
      return;
    }

    const handler = action.command || action.action;
    if (handler) {
      handler();
    }
  }

  isActionVisible(action: HeaderAction): boolean {
    return this.resolveActionState(action.visible, true);
  }

  isActionDisabled(action: HeaderAction): boolean {
    return this.resolveActionState(action.disabled, false);
  }

  isActionLoading(action: HeaderAction): boolean {
    return this.resolveActionState(action.loading, false);
  }

  private resolveActionState(value: boolean | (() => boolean) | undefined, defaultValue: boolean): boolean {
    if (typeof value === 'function') {
      return value();
    }

    return value ?? defaultValue;
  }
}
