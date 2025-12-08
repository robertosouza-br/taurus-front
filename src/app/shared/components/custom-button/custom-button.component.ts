import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-custom-button',
  templateUrl: './custom-button.component.html',
  styleUrl: './custom-button.component.scss'
})
export class CustomButtonComponent {
  @Input() label: string = '';
  @Input() icon: string = '';
  @Input() severity: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'help' | 'contrast' = 'primary';
  @Input() size: 'small' | 'normal' | 'large' = 'normal';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() outlined: boolean = false;
  @Input() rounded: boolean = false;
  @Input() text: boolean = false;
  @Input() raised: boolean = false;
  @Input() type: 'button' | 'submit' = 'button';
  @Input() tooltip: string = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() iconPos: 'left' | 'right' = 'left';
  
  @Output() onClick = new EventEmitter<Event>();

  handleClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.onClick.emit(event);
    }
  }

  getButtonClass(): string {
    const classes = ['custom-btn'];
    
    if (this.outlined) classes.push('p-button-outlined');
    if (this.text) classes.push('p-button-text');
    if (this.raised) classes.push('p-button-raised');
    if (this.rounded) classes.push('p-button-rounded');
    
    classes.push(`btn-${this.size}`);
    classes.push(`p-button-${this.severity}`);
    
    return classes.join(' ');
  }
}
