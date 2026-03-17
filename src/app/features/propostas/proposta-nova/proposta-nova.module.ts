import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { PropostaNovaRoutingModule } from './proposta-nova-routing.module';
import { PropostaNovaComponent } from './proposta-nova.component';
import { PropostasSharedModule } from '../propostas-shared.module';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CheckboxModule } from 'primeng/checkbox';
import { ChartModule } from 'primeng/chart';

@NgModule({
  declarations: [
    PropostaNovaComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    DialogModule,
    ProgressSpinnerModule,
    CheckboxModule,
    ChartModule,
    PropostasSharedModule,
    PropostaNovaRoutingModule
  ]
})
export class PropostaNovaModule { }
