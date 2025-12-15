import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MeusDadosComponent } from './meus-dados/meus-dados.component';
import { AuthGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: MeusDadosComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MeuPerfilRoutingModule { }
