import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PropostasListaComponent } from './propostas-lista.component';

const routes: Routes = [
  {
    path: '',
    component: PropostasListaComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PropostasListaRoutingModule { }
