import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ImobiliariasListaComponent } from './imobiliarias-lista/imobiliarias-lista.component';
import { ImobiliariaFormComponent } from './imobiliaria-form/imobiliaria-form.component';

const routes: Routes = [
  {
    path: '',
    component: ImobiliariasListaComponent
  },
  {
    path: 'novo',
    component: ImobiliariaFormComponent
  },
  {
    path: ':id/editar',
    component: ImobiliariaFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ImobiliariasRoutingModule { }
