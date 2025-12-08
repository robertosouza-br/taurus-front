import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[appTableTemplate]'
})
export class DataTableTemplateDirective {
  @Input('appTableTemplate') templateName!: string;

  constructor(public template: TemplateRef<any>) {}
}
