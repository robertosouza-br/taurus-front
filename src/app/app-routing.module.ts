import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards';
import { MainLayoutComponent } from './features/layout/main-layout/main-layout.component';
import { DashboardComponent } from './features/layout/dashboard/dashboard.component';
import { NotFoundComponent } from './features/layout/not-found/not-found.component';
import { UnauthorizedComponent } from './features/layout/unauthorized/unauthorized.component';
import { AcessoNegadoComponent } from './features/layout/acesso-negado/acesso-negado.component';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'unauthorized',
        component: UnauthorizedComponent
      },
      {
        path: 'acesso-negado',
        component: AcessoNegadoComponent
      },
      {
        path: 'admin/perfis',
        loadChildren: () => import('./features/perfis/perfis.module').then(m => m.PerfisModule)
      }
    ]
  },
  {
    path: '**',
    component: NotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
