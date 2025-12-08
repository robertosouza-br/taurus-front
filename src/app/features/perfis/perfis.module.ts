import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PerfisRoutingModule } from './perfis-routing.module';
import { PerfisListaComponent } from './perfis-lista/perfis-lista.component';
import { PerfilNovoComponent } from './perfil-novo/perfil-novo.component';
import { PerfilConfiguracaoComponent } from './perfil-configuracao/perfil-configuracao.component';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';

// PrimeNG Services
import { MessageService, ConfirmationService } from 'primeng/api';

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
    ButtonModule,
    CardModule,
    TableModule,
    CheckboxModule,
    TagModule,
    ProgressSpinnerModule,
    ConfirmDialogModule,
    TooltipModule,
    InputTextModule,
    InputTextareaModule
  ],
  providers: [
    MessageService,
    ConfirmationService
  ]
})
export class PerfisModule { }
