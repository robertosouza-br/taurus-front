import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';

import { HasRoleDirective, HasPermissionDirective, TemPermissaoDirective } from './directives';
import { DataTableComponent } from './components/data-table/data-table.component';
import { DataTableTemplateDirective } from './components/data-table/data-table-template.directive';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { ActionButtonComponent } from './components/action-button/action-button.component';
import { CustomButtonComponent } from './components/custom-button/custom-button.component';

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
    CustomButtonComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule
  ],
  exports: [
    CommonModule,
    HasRoleDirective,
    HasPermissionDirective,
    TemPermissaoDirective,
    DataTableComponent,
    PageHeaderComponent,
    BreadcrumbComponent,
    ActionButtonComponent,
    DataTableTemplateDirective,
    CustomButtonComponent
  ]
})
export class SharedModule { }
