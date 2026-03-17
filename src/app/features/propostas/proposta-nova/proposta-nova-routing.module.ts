import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PropostaNovaComponent } from './proposta-nova.component';

const routes: Routes = [
  {
    path: '',
    component: PropostaNovaComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PropostaNovaRoutingModule { }
