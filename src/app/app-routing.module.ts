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
      },
      {
        path: 'admin/usuarios',
        loadChildren: () => import('./features/usuarios/usuarios.module').then(m => m.UsuariosModule)
      },
      {
        path: 'cadastros/corretores',
        loadChildren: () => import('./features/corretores/corretores.module').then(m => m.CorretoresModule)
      },
      {
        path: 'bancos',
        loadChildren: () => import('./features/bancos/bancos.module').then(m => m.BancosModule)
      },
      {
        path: 'meu-perfil',
        loadChildren: () => import('./features/meu-perfil/meu-perfil.module').then(m => m.MeuPerfilModule)
      },
      {
        path: 'imoveis/empreendimentos',
        loadChildren: () => import('./features/empreendimentos/empreendimentos.module').then(m => m.EmpreendimentosModule)
      },
      {
        path: 'auditoria',
        loadChildren: () => import('./features/auditoria/auditoria.module').then(m => m.AuditoriaModule)
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
