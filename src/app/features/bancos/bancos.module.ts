import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// PrimeNG
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

// Shared
import { SharedModule } from '../../shared/shared.module';

// Routing
import { BancosRoutingModule } from './bancos-routing.module';

// Components
import { BancoListaComponent } from './banco-lista/banco-lista.component';
import { BancoFormComponent } from './banco-form/banco-form.component';

@NgModule({
  declarations: [
    BancoListaComponent,
    BancoFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BancosRoutingModule,
    SharedModule,
    CardModule,
    InputTextModule,
    ButtonModule
  ]
})
export class BancosModule { }
