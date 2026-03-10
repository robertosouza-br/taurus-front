import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

import { PropostasRoutingModule } from './propostas-routing.module';
import { PropostasSharedModule } from './propostas-shared.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SharedModule,
    PropostasSharedModule,
    PropostasRoutingModule
  ]
})
export class PropostasModule { }
