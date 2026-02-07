import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { ContatosRoutingModule } from './contatos-routing.module';
import { ContatoPublicoComponent } from './contato-publico/contato-publico.component';
import { ContatosListaComponent } from './contatos-lista/contatos-lista.component';
import { ContatoDetalhesComponent } from './contato-detalhes/contato-detalhes.component';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

@NgModule({
  declarations: [
    ContatoPublicoComponent,
    ContatosListaComponent,
    ContatoDetalhesComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    ContatosRoutingModule
  ],
  providers: [
    MessageService,
    DialogService
  ]
})
export class ContatosModule {}
