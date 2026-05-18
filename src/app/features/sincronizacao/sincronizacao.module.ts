import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SincronizacaoRoutingModule } from './sincronizacao-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { SincronizacaoEmpreendimentosComponent } from './sincronizacao-empreendimentos/sincronizacao-empreendimentos.component';

@NgModule({
  declarations: [
    SincronizacaoEmpreendimentosComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    SincronizacaoRoutingModule
  ]
})
export class SincronizacaoModule { }
