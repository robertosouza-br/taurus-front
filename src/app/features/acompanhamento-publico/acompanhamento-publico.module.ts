import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { AcompanhamentoPublicoRoutingModule } from './acompanhamento-publico-routing.module';
import { AcompanhamentoUnidadesPublicoComponent } from './acompanhamento-unidades-publico/acompanhamento-unidades-publico.component';

@NgModule({
  declarations: [AcompanhamentoUnidadesPublicoComponent],
  imports: [
    CommonModule,
    SharedModule,
    AcompanhamentoPublicoRoutingModule
  ]
})
export class AcompanhamentoPublicoModule {}