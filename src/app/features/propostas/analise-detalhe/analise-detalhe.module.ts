import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { DialogModule } from 'primeng/dialog';
import { AnaliseDetalheRoutingModule } from './analise-detalhe-routing.module';
import { AnaliseDetalheComponent } from './analise-detalhe.component';

@NgModule({
  declarations: [
    AnaliseDetalheComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    DialogModule,
    AnaliseDetalheRoutingModule
  ]
})
export class AnaliseDetalheModule { }
