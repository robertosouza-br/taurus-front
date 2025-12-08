import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HasRoleDirective, HasPermissionDirective, TemPermissaoDirective } from './directives';

/**
 * SharedModule
 * Módulo compartilhado contendo componentes, diretivas e pipes reutilizáveis
 * Deve ser importado em módulos de features que necessitem dessas funcionalidades
 */
@NgModule({
  declarations: [
    HasRoleDirective,
    HasPermissionDirective,
    TemPermissaoDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    CommonModule,
    HasRoleDirective,
    HasPermissionDirective,
    TemPermissaoDirective
  ]
})
export class SharedModule { }
