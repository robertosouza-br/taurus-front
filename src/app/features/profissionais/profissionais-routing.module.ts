import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfissionaisListaComponent } from './profissionais-lista/profissionais-lista.component';
import { ProfissionalFormComponent } from './profissional-form/profissional-form.component';

const routes: Routes = [
  {
    path: '',
    component: ProfissionaisListaComponent
  },
  {
    path: 'novo',
    component: ProfissionalFormComponent
  },
  {
    path: ':id/editar',
    component: ProfissionalFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfissionaisRoutingModule { }