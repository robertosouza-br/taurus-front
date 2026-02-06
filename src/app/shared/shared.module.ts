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
import { DialogModule } from 'primeng/dialog';
import { SliderModule } from 'primeng/slider';
import { ChipsModule } from 'primeng/chips';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PaginatorModule } from 'primeng/paginator';

// Image Cropper
import { ImageCropperComponent } from 'ngx-image-cropper';

import { HasRoleDirective, HasPermissionDirective, TemPermissaoDirective } from './directives';
import { TelefonePipe } from './pipes/telefone.pipe';
import { CpfPipe } from './pipes/cpf.pipe';
import { DataBrPipe } from './pipes/data-br.pipe';
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
import { InputEmailsComponent } from './components/input-emails/input-emails.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { DialogService } from 'primeng/dynamicdialog';
import { AutocompleteComponent } from './components/autocomplete/autocomplete.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { ExportSpeedDialComponent } from './components/export-speed-dial/export-speed-dial.component';
import { UploadFotoComponent } from './components/upload-foto/upload-foto.component';
import { CardPaginatorComponent } from './components/card-paginator/card-paginator.component';
import { SearchFilterComponent } from './components/search-filter/search-filter.component';
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
    TelefonePipe,
    CpfPipe,
    DataBrPipe,
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
    InputEmailsComponent,
    ConfirmationDialogComponent,
    AutocompleteComponent,
    LoadingSpinnerComponent,
    ExportSpeedDialComponent,
    UploadFotoComponent,
    CardPaginatorComponent,
    SearchFilterComponent
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
    DialogModule,
    SliderModule,
    ChipsModule,
    CardModule,
    TagModule,
    DropdownModule,
    DividerModule,
    ToastModule,
    ConfirmDialogModule,
    PaginatorModule,
    ImageCropperComponent
  ],
  exports: [
    CommonModule,
    FormsModule,
    TelefonePipe,
    CpfPipe,
    DataBrPipe,
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
    InputEmailsComponent,
    AutocompleteComponent,
    LoadingSpinnerComponent,
    UploadFotoComponent,
    ExportSpeedDialComponent,
    CardPaginatorComponent,
    SearchFilterComponent,
    // PrimeNG modules necessários pelos componentes
    CalendarModule,
    SliderModule,
    TooltipModule,
    CardModule,
    TagModule,
    DropdownModule,
    DividerModule,
    TableModule,
    ToastModule,
    ConfirmDialogModule,
    PaginatorModule,
    // Image Cropper (componente standalone)
    ImageCropperComponent
  ],
  providers: [DialogService]
})
export class SharedModule { }
