import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Shared
import { SharedModule } from '../../shared/shared.module';

// Routing
import { ImobiliariasRoutingModule } from './imobiliarias-routing.module';

// Components
import { ImobiliariasListaComponent } from './imobiliarias-lista/imobiliarias-lista.component';
import { ImobiliariaFormComponent } from './imobiliaria-form/imobiliaria-form.component';

@NgModule({
  declarations: [
    ImobiliariasListaComponent,
    ImobiliariaFormComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ImobiliariasRoutingModule
  ]
})
export class ImobiliariasModule { }
