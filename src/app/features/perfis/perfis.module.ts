import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PerfisRoutingModule } from './perfis-routing.module';
import { PerfisListaComponent } from './perfis-lista/perfis-lista.component';
import { PerfilNovoComponent } from './perfil-novo/perfil-novo.component';
import { PerfilConfiguracaoComponent } from './perfil-configuracao/perfil-configuracao.component';

// Shared Module
import { SharedModule } from '../../shared/shared.module';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DynamicDialogModule } from 'primeng/dynamicdialog';

// PrimeNG Services
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

@NgModule({
  declarations: [
    PerfisListaComponent,
    PerfilNovoComponent,
    PerfilConfiguracaoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PerfisRoutingModule,
    SharedModule,
    ButtonModule,
    CardModule,
    CheckboxModule,
    TagModule,
    ConfirmDialogModule,
    TooltipModule,
    InputTextModule,
    InputTextareaModule,
    DynamicDialogModule
  ]
})
export class PerfisModule { }
