import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AnaliseDetalheComponent } from './analise-detalhe.component';

const routes: Routes = [
  {
    path: '',
    component: AnaliseDetalheComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AnaliseDetalheRoutingModule { }
