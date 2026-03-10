import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { PropostaStep1RoutingModule } from './proposta-step1-routing.module';
import { PropostaStep1Component } from './proposta-step1.component';
import { PropostasSharedModule } from '../propostas-shared.module';

@NgModule({
  declarations: [
    PropostaStep1Component
  ],
  imports: [
    CommonModule,
    SharedModule,
    PropostasSharedModule,
    PropostaStep1RoutingModule
  ]
})
export class PropostaStep1Module { }
