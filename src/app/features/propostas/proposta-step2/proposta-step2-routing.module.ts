import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PropostaStep2Component } from './proposta-step2.component';

const routes: Routes = [
  {
    path: '',
    component: PropostaStep2Component
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PropostaStep2RoutingModule { }
