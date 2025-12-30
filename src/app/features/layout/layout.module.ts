import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

// PrimeNG Services
import { MessageService } from 'primeng/api';

// Shared Module
import { SharedModule } from '../../shared/shared.module';

import { MainLayoutComponent } from './main-layout/main-layout.component';
import { HeaderComponent } from './header/header.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { FooterComponent } from './footer/footer.component';
import { TermsModalsComponent } from './footer/terms-modals.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { AcessoNegadoComponent } from './acesso-negado/acesso-negado.component';

@NgModule({
  declarations: [
    MainLayoutComponent,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    TermsModalsComponent,
    DashboardComponent,
    NotFoundComponent,
    UnauthorizedComponent,
    AcessoNegadoComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SharedModule,
    // PrimeNG modules
    ButtonModule,
    MenuModule,
    TooltipModule,
    BadgeModule,
    CardModule,
    ToastModule,
    DialogModule,
    InputTextModule
  ],
  providers: [
    MessageService
  ],
  exports: [
    MainLayoutComponent
  ]
})
export class LayoutModule { }
