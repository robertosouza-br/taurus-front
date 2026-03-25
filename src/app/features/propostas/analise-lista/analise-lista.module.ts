import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { AnaliseListaRoutingModule } from './analise-lista-routing.module';
import { AnaliseListaComponent } from './analise-lista.component';

@NgModule({
  declarations: [
    AnaliseListaComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    AnaliseListaRoutingModule
  ]
})
export class AnaliseListaModule { }
