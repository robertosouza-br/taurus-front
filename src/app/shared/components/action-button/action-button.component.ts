import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-action-button',
  templateUrl: './action-button.component.html',
  styleUrl: './action-button.component.scss'
})
export class ActionButtonComponent {
  @Input() label: string = '';
  @Input() icon: string = '';
  @Input() severity: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'help' | 'contrast' = 'primary';
  @Input() size: 'small' | 'normal' | 'large' = 'normal';
  @Input() outlined = false;
  @Input() text = false;
  @Input() raised = false;
  @Input() rounded = false;
  @Input() disabled = false;
  @Input() loading = false;
  @Input() iconPos: 'left' | 'right' | 'top' | 'bottom' = 'left';
  @Input() tooltip: string = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
  
  @Output() onClick = new EventEmitter<MouseEvent>();

  handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.onClick.emit(event);
    }
  }

  getButtonClass(): string {
    const classes = ['p-button'];
    classes.push(`p-button-${this.severity}`);
    
    if (this.outlined) classes.push('p-button-outlined');
    if (this.text) classes.push('p-button-text');
    if (this.raised) classes.push('p-button-raised');
    if (this.rounded) classes.push('p-button-rounded');
    
    if (this.size === 'small') classes.push('p-button-sm');
    if (this.size === 'large') classes.push('p-button-lg');
    
    if (this.iconPos === 'right') classes.push('p-button-icon-right');
    if (this.iconPos === 'top') classes.push('p-button-icon-top');
    if (this.iconPos === 'bottom') classes.push('p-button-icon-bottom');
    
    return classes.join(' ');
  }
}
