import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PropostaStep1Component } from './proposta-step1.component';

const routes: Routes = [
  {
    path: '',
    component: PropostaStep1Component
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PropostaStep1RoutingModule { }
