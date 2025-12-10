import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsuariosListaComponent } from './usuarios-lista/usuarios-lista.component';
import { UsuarioNovoComponent } from './usuario-novo/usuario-novo.component';
import { UsuarioEdicaoComponent } from './usuario-edicao/usuario-edicao.component';

const routes: Routes = [
  { path: '', component: UsuariosListaComponent },
  { path: 'novo', component: UsuarioNovoComponent },
  { path: 'editar/:id', component: UsuarioEdicaoComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsuariosRoutingModule { }
