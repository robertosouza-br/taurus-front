import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';
import { PropostasListaRoutingModule } from './propostas-lista-routing.module';
import { PropostasListaComponent } from './propostas-lista.component';

@NgModule({
  declarations: [
    PropostasListaComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    PropostasListaRoutingModule
  ]
})
export class PropostasListaModule { }
