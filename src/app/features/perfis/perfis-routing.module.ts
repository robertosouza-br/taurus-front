import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PerfisListaComponent } from './perfis-lista/perfis-lista.component';
import { PerfilNovoComponent } from './perfil-novo/perfil-novo.component';
import { PerfilConfiguracaoComponent } from './perfil-configuracao/perfil-configuracao.component';

const routes: Routes = [
  {
    path: '',
    component: PerfisListaComponent
  },
  {
    path: 'novo',
    component: PerfilNovoComponent
  },
  {
    path: ':id/configuracao',
    component: PerfilConfiguracaoComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PerfisRoutingModule { }
