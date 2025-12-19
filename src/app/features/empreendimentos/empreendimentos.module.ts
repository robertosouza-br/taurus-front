import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ChipModule } from 'primeng/chip';
import { PaginatorModule } from 'primeng/paginator';
import { DataViewModule } from 'primeng/dataview';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { AutoCompleteModule } from 'primeng/autocomplete';

// Shared
import { SharedModule } from '../../shared/shared.module';

// Routing
import { EmpreendimentosRoutingModule } from './empreendimentos-routing.module';

// Components
import { EmpreendimentosListaComponent } from './empreendimentos-lista/empreendimentos-lista.component';
import { EmpreendimentoDetalhesComponent } from './empreendimento-detalhes/empreendimento-detalhes.component';

@NgModule({
  declarations: [
    EmpreendimentosListaComponent,
    EmpreendimentoDetalhesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    EmpreendimentosRoutingModule,
    SharedModule,
    // PrimeNG
    CardModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    TooltipModule,
    SkeletonModule,
    ChipModule,
    PaginatorModule,
    DataViewModule,
    BadgeModule,
    DividerModule,
    DialogModule,
    SelectButtonModule,
    DropdownModule,
    ProgressSpinnerModule,
    ToastModule,
    AutoCompleteModule
  ]
})
export class EmpreendimentosModule { }
