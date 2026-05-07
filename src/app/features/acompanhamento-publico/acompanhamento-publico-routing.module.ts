import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AcompanhamentoUnidadesPublicoComponent } from './acompanhamento-unidades-publico/acompanhamento-unidades-publico.component';

const routes: Routes = [
  {
    path: 'unidades',
    component: AcompanhamentoUnidadesPublicoComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AcompanhamentoPublicoRoutingModule {}