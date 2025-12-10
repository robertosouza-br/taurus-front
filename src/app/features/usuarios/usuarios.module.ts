import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UsuariosRoutingModule } from './usuarios-routing.module';
import { SharedModule } from '../../shared/shared.module';

import { UsuariosComponent } from './usuarios.component';
import { UsuariosListaComponent } from './usuarios-lista/usuarios-lista.component';
import { UsuarioNovoComponent } from './usuario-novo/usuario-novo.component';
import { UsuarioEdicaoComponent } from './usuario-edicao/usuario-edicao.component';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CheckboxModule } from 'primeng/checkbox';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';

@NgModule({
  declarations: [
    UsuariosComponent,
    UsuariosListaComponent,
    UsuarioNovoComponent,
    UsuarioEdicaoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    UsuariosRoutingModule,
    SharedModule,
    CardModule,
    ProgressSpinnerModule,
    CheckboxModule,
    AutoCompleteModule,
    MessageModule,
    DialogModule,
    TagModule
  ]
})
export class UsuariosModule { }

