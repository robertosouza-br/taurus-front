import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissaoGuard } from '../../core/guards/permissao.guard';
import { Funcionalidade } from '../../core/enums/funcionalidade.enum';
import { Permissao } from '../../core/enums/permissao.enum';
import { ReservasListaComponent } from './reservas-lista/reservas-lista.component';
import { ReservaNovaComponent } from './reserva-nova/reserva-nova.component';
import { ReservaEdicaoComponent } from './reserva-edicao/reserva-edicao.component';

const routes: Routes = [
  {
    path: '',
    component: ReservasListaComponent,
    canActivate: [AuthGuard, PermissaoGuard],
    data: {
      funcionalidade: Funcionalidade.RESERVA,
      permissoes: [Permissao.CONSULTAR]
    }
  },
  {
    path: 'nova',
    component: ReservaNovaComponent,
    canActivate: [AuthGuard, PermissaoGuard],
    data: {
      funcionalidade: Funcionalidade.RESERVA,
      permissoes: [Permissao.INCLUIR]
    }
  },
  {
    path: 'empreendimento/:codEmpreendimento/bloco/:bloco/unidade/:unidade/nova',
    component: ReservaNovaComponent,
    canActivate: [AuthGuard, PermissaoGuard],
    data: {
      funcionalidade: Funcionalidade.RESERVA,
      permissoes: [Permissao.INCLUIR]
    }
  },
  {
    path: ':id/editar',
    component: ReservaEdicaoComponent,
    canActivate: [AuthGuard, PermissaoGuard],
    data: {
      funcionalidade: Funcionalidade.RESERVA,
      permissoes: [Permissao.ALTERAR]
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReservasRoutingModule { }
