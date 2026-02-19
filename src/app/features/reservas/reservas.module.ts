import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ReservasRoutingModule } from './reservas-routing.module';
import { SharedModule } from '../../shared/shared.module';

import { ReservasListaComponent } from './reservas-lista/reservas-lista.component';
import { ReservaNovaComponent } from './reserva-nova/reserva-nova.component';
import { ReservaEdicaoComponent } from './reserva-edicao/reserva-edicao.component';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { PanelModule } from 'primeng/panel';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { CalendarModule } from 'primeng/calendar';
import { AutoCompleteModule } from 'primeng/autocomplete';

@NgModule({
  declarations: [
    ReservasListaComponent,
    ReservaNovaComponent,
    ReservaEdicaoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ReservasRoutingModule,
    SharedModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    CheckboxModule,
    TagModule,
    DialogModule,
    TooltipModule,
    PanelModule,
    DividerModule,
    TableModule,
    ProgressSpinnerModule,
    MessageModule,
    ConfirmDialogModule,
    CalendarModule,
    AutoCompleteModule
  ],
  providers: [ConfirmationService]
})
export class ReservasModule { }
