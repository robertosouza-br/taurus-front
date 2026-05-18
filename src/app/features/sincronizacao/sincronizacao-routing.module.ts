import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SincronizacaoEmpreendimentosComponent } from './sincronizacao-empreendimentos/sincronizacao-empreendimentos.component';

const routes: Routes = [
  {
    path: '',
    component: SincronizacaoEmpreendimentosComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SincronizacaoRoutingModule { }
