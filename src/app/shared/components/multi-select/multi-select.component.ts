import { Component, Input, forwardRef, Output, EventEmitter, ElementRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-multi-select',
  templateUrl: './multi-select.component.html',
  styleUrls: ['./multi-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSelectComponent),
      multi: true
    }
  ]
})
export class MultiSelectComponent implements ControlValueAccessor {
  @Input() id: string = '';
  @Input() label: string = '';
  @Input() placeholder: string = 'Selecione';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() showValidation: boolean = false;
  @Input() errorMessage: string = '';
  @Input() options: any[] = [];
  @Input() optionLabel: string = 'label';
  @Input() optionValue: string = ''; // Vazio para usar o objeto inteiro por padrão
  @Input() filter: boolean = true;
  @Input() filterBy: string = '';
  @Input() emptyMessage: string = 'Nenhum resultado encontrado';
  @Input() emptyFilterMessage: string = 'Nenhum resultado encontrado';
  @Input() display: string = 'chip'; // 'comma' | 'chip'
  @Input() showClear: boolean = true;
  @Input() maxSelectedLabels: number = 3;
  @Input() selectedItemsLabel: string = '{0} itens selecionados';
  @Input() appendTo: any = 'body';
  @Input() panelStyleClass: string = 'app-multi-select-panel';
  @Input() panelStyle: Record<string, string | number> = {};
  
  @Output() onChange = new EventEmitter<any>();

  value: any[] = [];
  touched: boolean = false;
  isFocused: boolean = false;
  private _generatedId: string = `multi-select-${Math.random().toString(36).substr(2, 9)}`;
  private onChangeCallback: (value: any) => void = () => {};
  private onTouchedCallback: () => void = () => {};

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  writeValue(value: any): void {
    this.value = value || [];
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onValueChange(event: any): void {
    this.value = event.value;
    this.onChangeCallback(this.value);
    this.onChange.emit(event);
  }

  onFocus(): void {
    this.isFocused = true;
  }

  onBlur(): void {
    this.isFocused = false;
    this.touched = true;
    this.onTouchedCallback();
  }

  get inputId(): string {
    return this.id || this._generatedId;
  }

  get displayLabel(): string {
    return this.required ? `${this.label} *` : this.label;
  }

  get isInvalid(): boolean {
    return this.showValidation && this.required && (!this.value || this.value.length === 0) && this.touched;
  }

  get displayErrorMessage(): string {
    if (this.errorMessage) {
      return this.errorMessage;
    }
    return this.required ? `${this.label} é obrigatório` : '';
  }

  get shouldShowLabel(): boolean {
    return this.isFocused || (this.value && this.value.length > 0);
  }

  get filterByField(): string {
    return this.filterBy || this.optionLabel;
  }

  get resolvedPanelStyle(): Record<string, string | number> {
    const fieldWidth = this.elementRef.nativeElement.getBoundingClientRect().width;
    const panelWidth = Math.max(Math.round(fieldWidth || 0), 320);

    return {
      width: `${panelWidth}px`,
      maxWidth: 'calc(100vw - 2rem)',
      ...this.panelStyle
    };
  }

  get selectedCount(): number {
    return Array.isArray(this.value) ? this.value.length : 0;
  }

  get visibleSelectedLabels(): string[] {
    if (!this.selectedCount) {
      return [];
    }

    return this.value
      .slice(0, this.maxSelectedLabels)
      .map(item => this.resolveOptionLabel(item))
      .filter((label): label is string => !!label);
  }

  get hiddenSelectedCount(): number {
    return Math.max(this.selectedCount - this.maxSelectedLabels, 0);
  }

  get hiddenSelectedItemsLabel(): string {
    if (this.hiddenSelectedCount <= 0) {
      return '';
    }

    return `+${this.hiddenSelectedCount}`;
  }

  get summarySelectedItemsLabel(): string {
    return this.selectedItemsLabel.replace('{0}', String(this.selectedCount));
  }

  private resolveOptionLabel(item: any): string {
    if (!item) {
      return '';
    }

    if (!this.optionValue) {
      return this.resolveLabelFromOption(item);
    }

    const option = this.options.find(opt => opt?.[this.optionValue] === item);
    return option ? this.resolveLabelFromOption(option) : String(item);
  }

  private resolveLabelFromOption(option: any): string {
    const label = option?.[this.optionLabel];
    return label != null ? String(label) : '';
  }
}
