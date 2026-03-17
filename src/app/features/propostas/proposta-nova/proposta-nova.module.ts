import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { PropostaNovaRoutingModule } from './proposta-nova-routing.module';
import { PropostaNovaComponent } from './proposta-nova.component';
import { PropostasSharedModule } from '../propostas-shared.module';

@NgModule({
  declarations: [
    PropostaNovaComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    PropostasSharedModule,
    PropostaNovaRoutingModule
  ]
})
export class PropostaNovaModule { }
