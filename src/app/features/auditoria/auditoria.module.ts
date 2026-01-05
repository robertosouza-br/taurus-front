import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';

// Routing
import { AuditoriaRoutingModule } from './auditoria-routing.module';

// Components
import { AuditoriaListaComponent } from './auditoria-lista/auditoria-lista.component';
import { AuditoriaDetalhesComponent } from './auditoria-detalhes/auditoria-detalhes.component';

// Shared Components
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    AuditoriaListaComponent,
    AuditoriaDetalhesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    AuditoriaRoutingModule,
    SharedModule,
    // PrimeNG
    CardModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    TooltipModule,
    TagModule,
    ProgressSpinnerModule,
    MessageModule
  ]
})
export class AuditoriaModule { }

