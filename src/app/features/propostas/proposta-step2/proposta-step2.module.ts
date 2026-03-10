import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { PropostaStep2RoutingModule } from './proposta-step2-routing.module';
import { PropostaStep2Component } from './proposta-step2.component';
import { PropostasSharedModule } from '../propostas-shared.module';

@NgModule({
  declarations: [
    PropostaStep2Component
  ],
  imports: [
    CommonModule,
    SharedModule,
    PropostasSharedModule,
    PropostaStep2RoutingModule
  ]
})
export class PropostaStep2Module { }
