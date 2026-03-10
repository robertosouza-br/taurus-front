import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { PropostaHeaderComponent } from './proposta-header/proposta-header.component';

/**
 * Módulo compartilhado para componentes reutilizáveis entre os módulos de propostas
 * NÃO inclui routing para evitar conflitos em lazy loading
 */
@NgModule({
  declarations: [
    PropostaHeaderComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports: [
    PropostaHeaderComponent
  ]
})
export class PropostasSharedModule { }
