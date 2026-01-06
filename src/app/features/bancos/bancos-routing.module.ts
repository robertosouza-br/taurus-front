import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BancoListaComponent } from './banco-lista/banco-lista.component';
import { BancoFormComponent } from './banco-form/banco-form.component';

const routes: Routes = [
  {
    path: '',
    component: BancoListaComponent
  },
  {
    path: 'novo',
    component: BancoFormComponent
  },
  {
    path: ':id/editar',
    component: BancoFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BancosRoutingModule { }
