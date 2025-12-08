import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HasRoleDirective, HasPermissionDirective } from './directives';

/**
 * SharedModule
 * Módulo compartilhado contendo componentes, diretivas e pipes reutilizáveis
 * Deve ser importado em módulos de features que necessitem dessas funcionalidades
 */
@NgModule({
  declarations: [
    HasRoleDirective,
    HasPermissionDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    CommonModule,
    HasRoleDirective,
    HasPermissionDirective
  ]
})
export class SharedModule { }
