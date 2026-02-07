import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { EmpreendimentosRoutingModule } from './empreendimentos-routing.module';
import { EmpreendimentosListaComponent } from './empreendimentos-lista/empreendimentos-lista.component';
import { EmpreendimentoImagensComponent } from './empreendimento-imagens/empreendimento-imagens.component';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { RippleModule } from 'primeng/ripple';
import { GalleriaModule } from 'primeng/galleria';

@NgModule({
  declarations: [
    EmpreendimentosListaComponent,
    EmpreendimentoImagensComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    EmpreendimentosRoutingModule,
    // PrimeNG
    ButtonModule,
    InputTextModule,
    CardModule,
    TagModule,
    PaginatorModule,
    ProgressSpinnerModule,
    ToastModule,
    TooltipModule,
    DialogModule,
    FileUploadModule,
    DropdownModule,
    InputNumberModule,
    CheckboxModule,
    InputTextareaModule,
    RippleModule,
    GalleriaModule
  ]
})
export class EmpreendimentosModule { }
