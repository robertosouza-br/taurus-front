import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AnaliseListaComponent } from './analise-lista.component';

const routes: Routes = [
  {
    path: '',
    component: AnaliseListaComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnaliseListaRoutingModule { }
