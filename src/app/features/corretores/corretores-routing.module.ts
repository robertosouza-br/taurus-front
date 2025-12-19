import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CorretoresListaComponent } from './corretores-lista/corretores-lista.component';
import { CorretorNovoComponent } from './corretor-novo/corretor-novo.component';
import { CorretorEdicaoComponent } from './corretor-edicao/corretor-edicao.component';

const routes: Routes = [
  { path: '', component: CorretoresListaComponent },
  { path: 'novo', component: CorretorNovoComponent },
  { path: 'editar/:id', component: CorretorEdicaoComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CorretoresRoutingModule { }
