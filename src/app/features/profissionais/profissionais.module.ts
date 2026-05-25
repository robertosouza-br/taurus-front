import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckboxModule } from 'primeng/checkbox';
import { ProfissionaisRoutingModule } from './profissionais-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { ProfissionaisListaComponent } from './profissionais-lista/profissionais-lista.component';
import { ProfissionalFormComponent } from './profissional-form/profissional-form.component';

@NgModule({
  declarations: [
    ProfissionaisListaComponent,
    ProfissionalFormComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    CheckboxModule,
    ProfissionaisRoutingModule
  ]
})
export class ProfissionaisModule { }