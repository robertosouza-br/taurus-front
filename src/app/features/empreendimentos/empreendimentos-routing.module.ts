import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissaoGuard } from '../../core/guards/permissao.guard';
import { Funcionalidade } from '../../core/enums/funcionalidade.enum';
import { Permissao } from '../../core/enums/permissao.enum';
import { EmpreendimentosListaComponent } from './empreendimentos-lista/empreendimentos-lista.component';
import { EmpreendimentoImagensComponent } from './empreendimento-imagens/empreendimento-imagens.component';

const routes: Routes = [
  {
    path: '',
    component: EmpreendimentosListaComponent,
    canActivate: [AuthGuard, PermissaoGuard],
    data: {
      funcionalidade: Funcionalidade.IMOVEL,
      permissoes: [Permissao.CONSULTAR]
    }
  },
  {
    path: ':codigo/imagens',
    component: EmpreendimentoImagensComponent,
    canActivate: [AuthGuard, PermissaoGuard],
    data: {
      funcionalidade: Funcionalidade.IMOVEL,
      permissoes: [Permissao.CONSULTAR]
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmpreendimentosRoutingModule { }
