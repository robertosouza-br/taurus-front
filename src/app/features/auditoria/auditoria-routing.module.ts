import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuditoriaListaComponent } from './auditoria-lista/auditoria-lista.component';
import { AuditoriaDetalhesComponent } from './auditoria-detalhes/auditoria-detalhes.component';
import { AuthGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: AuditoriaListaComponent,
    canActivate: [AuthGuard],
    data: { breadcrumb: 'Auditoria' }
  },
  {
    path: ':id',
    component: AuditoriaDetalhesComponent,
    canActivate: [AuthGuard],
    data: { breadcrumb: 'Detalhes' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuditoriaRoutingModule { }
