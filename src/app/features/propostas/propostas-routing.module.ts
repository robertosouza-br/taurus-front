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
      // Step 1: Dados Iniciais (recebe reservaId via query param)
      {
        path: 'step1',
        loadChildren: () => import('./proposta-step1/proposta-step1.module').then(m => m.PropostaStep1Module),
        data: {
          funcionalidade: Funcionalidade.PROPOSTA,
          permissoes: [Permissao.INCLUIR]
        }
      },
      // Compatibilidade com rota antiga
      {
        path: 'novo/dados-iniciais',
        redirectTo: 'step1',
        pathMatch: 'full'
      },
      // Step 2: Dados do Cliente (recebe reservaId via query param)
      {
        path: 'step2',
        loadChildren: () => import('./proposta-step2/proposta-step2.module').then(m => m.PropostaStep2Module),
        data: {
          funcionalidade: Funcionalidade.PROPOSTA,
          permissoes: [Permissao.INCLUIR]
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PropostasRoutingModule { }
