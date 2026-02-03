import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContatoPublicoComponent } from './contato-publico/contato-publico.component';
import { ContatosListaComponent } from './contatos-lista/contatos-lista.component';
import { ContatoDetalhesComponent } from './contato-detalhes/contato-detalhes.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissaoGuard } from '../../core/guards/permissao.guard';
import { Funcionalidade } from '../../core/enums/funcionalidade.enum';
import { Permissao } from '../../core/enums/permissao.enum';

const routes: Routes = [
  {
    path: '',
    component: ContatoPublicoComponent
  },
  {
    path: 'lista',
    component: ContatosListaComponent,
    canActivate: [AuthGuard, PermissaoGuard],
    data: {
      funcionalidade: Funcionalidade.CONTATO,
      permissoes: [Permissao.CONSULTAR]
    }
  },
  {
    path: 'detalhes/:id',
    component: ContatoDetalhesComponent,
    canActivate: [AuthGuard, PermissaoGuard],
    data: {
      funcionalidade: Funcionalidade.CONTATO,
      permissoes: [Permissao.CONSULTAR]
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContatosRoutingModule {}
