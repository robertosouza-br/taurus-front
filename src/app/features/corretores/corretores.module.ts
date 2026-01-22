import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { CorretoresRoutingModule } from './corretores-routing.module';
import { SharedModule } from '../../shared/shared.module';

import { CorretoresListaComponent } from './corretores-lista/corretores-lista.component';
import { CorretorNovoComponent } from './corretor-novo/corretor-novo.component';
import { CorretorEdicaoComponent } from './corretor-edicao/corretor-edicao.component';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ChipsModule } from 'primeng/chips';

@NgModule({
  declarations: [
    CorretoresListaComponent,
    CorretorNovoComponent,
    CorretorEdicaoComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CorretoresRoutingModule,
    SharedModule,
    CardModule,
    ProgressSpinnerModule,
    CheckboxModule,
    MessageModule,
    DialogModule,
    TagModule,
    DropdownModule,
    InputTextModule,
    ButtonModule,
    ChipsModule
  ]
})
export class CorretoresModule { }
