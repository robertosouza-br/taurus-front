import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissaoGuard } from '../../core/guards/permissao.guard';
import { Funcionalidade } from '../../core/enums/funcionalidade.enum';
import { Permissao } from '../../core/enums/permissao.enum';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard, PermissaoGuard],
    data: {
      funcionalidade: Funcionalidade.PROPOSTA,
      permissoes: [Permissao.CONSULTAR]
    },
    children: [
      {
        path: '',
        redirectTo: 'lista',
        pathMatch: 'full'
      },
      // Lista de reservas para criar proposta
      {
        path: 'lista',
        loadChildren: () => import('./propostas-lista/propostas-lista.module').then(m => m.PropostasListaModule)
      },
      // Nova Proposta - Formulário Unificado (recebe reservaId via query param)
      {
        path: 'nova',
        loadChildren: () => import('./proposta-nova/proposta-nova.module').then(m => m.PropostaNovaModule),
        data: {
          funcionalidade: Funcionalidade.PROPOSTA,
          permissoes: [Permissao.INCLUIR]
        }
      },
      // Fila de Análise de Propostas
      {
        path: 'analise',
        data: {
          funcionalidade: Funcionalidade.PROPOSTA,
          permissoes: [Permissao.APROVAR, Permissao.REPROVAR],
          qualquerPermissao: true
        },
        children: [
          {
            path: '',
            loadChildren: () => import('./analise-lista/analise-lista.module').then(m => m.AnaliseListaModule)
          },
          {
            path: ':id',
            loadChildren: () => import('./analise-detalhe/analise-detalhe.module').then(m => m.AnaliseDetalheModule)
          }
        ]
      },
      // Compatibilidade com rotas antigas - redirecionam para nova rota unificada
      {
        path: 'step1',
        redirectTo: 'nova',
        pathMatch: 'full'
      },
      {
        path: 'step2',
        redirectTo: 'nova',
        pathMatch: 'full'
      },
      {
        path: 'novo/dados-iniciais',
        redirectTo: 'nova',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PropostasRoutingModule { }
