import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TooltipModule } from 'primeng/tooltip';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { PasswordModule } from 'primeng/password';
import { SpeedDialModule } from 'primeng/speeddial';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { HasRoleDirective, HasPermissionDirective, TemPermissaoDirective } from './directives';
import { DataTableComponent } from './components/data-table/data-table.component';
import { DataTableTemplateDirective } from './components/data-table/data-table-template.directive';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { ActionButtonComponent } from './components/action-button/action-button.component';
import { CustomButtonComponent } from './components/custom-button/custom-button.component';
import { InputTextComponent } from './components/input-text/input-text.component';
import { InputTextareaComponent } from './components/input-textarea/input-textarea.component';
import { InputCpfComponent } from './components/input-cpf/input-cpf.component';
import { InputTelefoneComponent } from './components/input-telefone/input-telefone.component';
import { InputPasswordComponent } from './components/input-password/input-password.component';
import { InputDateComponent } from './components/input-date/input-date.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { DialogService } from 'primeng/dynamicdialog';
import { AutocompleteComponent } from './components/autocomplete/autocomplete.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { ExportSpeedDialComponent } from './components/export-speed-dial/export-speed-dial.component';
import { CalendarModule } from 'primeng/calendar';

/**
 * SharedModule
 * Módulo compartilhado contendo componentes, diretivas e pipes reutilizáveis
 * Deve ser importado em módulos de features que necessitem dessas funcionalidades
 */
@NgModule({
  declarations: [
    HasRoleDirective,
    HasPermissionDirective,
    TemPermissaoDirective,
    DataTableComponent,
    PageHeaderComponent,
    BreadcrumbComponent,
    ActionButtonComponent,
    DataTableTemplateDirective,
    CustomButtonComponent,
    InputTextComponent,
    InputTextareaComponent,
    InputCpfComponent,
    InputTelefoneComponent,
    InputPasswordComponent,
    InputDateComponent,
    ConfirmationDialogComponent,
    AutocompleteComponent,
    LoadingSpinnerComponent,
    ExportSpeedDialComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    TooltipModule,
    DynamicDialogModule,
    AutoCompleteModule,
    CalendarModule,
    PasswordModule,
    SpeedDialModule,
    ProgressSpinnerModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    HasRoleDirective,
    HasPermissionDirective,
    TemPermissaoDirective,
    DataTableComponent,
    PageHeaderComponent,
    BreadcrumbComponent,
    ActionButtonComponent,
    DataTableTemplateDirective,
    CustomButtonComponent,
    InputTextComponent,
    InputTextareaComponent,
    InputCpfComponent,
    InputTelefoneComponent,
    InputPasswordComponent,
    InputDateComponent,
    AutocompleteComponent,
    LoadingSpinnerComponent,
    ExportSpeedDialComponent,
    // PrimeNG modules necessários pelos componentes
    CalendarModule
  ],
  providers: [DialogService]
})
export class SharedModule { }
