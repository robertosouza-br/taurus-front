import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { ConsultasRoutingModule } from './consultas-routing.module';
import { ModalidadesSnapshotConsultaComponent } from './modalidades-snapshot-consulta/modalidades-snapshot-consulta.component';

@NgModule({
  declarations: [ModalidadesSnapshotConsultaComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    ConsultasRoutingModule
  ]
})
export class ConsultasModule { }