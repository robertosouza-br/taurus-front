import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { PermissaoGuard } from '../../core/guards/permissao.guard';
import { Funcionalidade } from '../../core/enums/funcionalidade.enum';
import { Permissao } from '../../core/enums/permissao.enum';
import { ModalidadesSnapshotConsultaComponent } from './modalidades-snapshot-consulta/modalidades-snapshot-consulta.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'modalidades-snapshot',
    pathMatch: 'full'
  },
  {
    path: 'modalidades-snapshot',
    component: ModalidadesSnapshotConsultaComponent,
    canActivate: [AuthGuard, PermissaoGuard],
    data: {
      funcionalidade: Funcionalidade.PROPOSTA,
      permissoes: [Permissao.CONSULTAR]
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConsultasRoutingModule { }