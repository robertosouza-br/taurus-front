import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MeuPerfilRoutingModule } from './meu-perfil-routing.module';
import { MeusDadosComponent } from './meus-dados/meus-dados.component';

// Shared Module
import { SharedModule } from '../../shared/shared.module';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';

@NgModule({
  declarations: [
    MeusDadosComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MeuPerfilRoutingModule,
    SharedModule,
    ButtonModule,
    CardModule,
    PasswordModule,
    DividerModule,
    TagModule,
    DialogModule
  ]
})
export class MeuPerfilModule { }
