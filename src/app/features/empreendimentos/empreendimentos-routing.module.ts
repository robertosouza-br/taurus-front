import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmpreendimentosListaComponent } from './empreendimentos-lista/empreendimentos-lista.component';
import { EmpreendimentoDetalhesComponent } from './empreendimento-detalhes/empreendimento-detalhes.component';
import { AuthGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: EmpreendimentosListaComponent,
    canActivate: [AuthGuard],
    data: {
      funcionalidade: 'IMOVEL',
      permissao: 'CONSULTAR'
    }
  },
  {
    path: ':id',
    component: EmpreendimentoDetalhesComponent,
    canActivate: [AuthGuard],
    data: {
      funcionalidade: 'IMOVEL',
      permissao: 'CONSULTAR'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmpreendimentosRoutingModule { }
