import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SidebarService } from '../../../core/services';
import { LoadingService } from '../../../core/services/loading.service';

/**
 * Componente Main Layout
 * Layout principal da aplicação com header, sidebar, footer e área de conteúdo
 */
@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  isSidebarExpanded = false;
  isLoading = false;
  loadingMessage = '';
  private subscription?: Subscription;
  private loadingSubscription?: Subscription;
  private messageSubscription?: Subscription;

  constructor(
    private sidebarService: SidebarService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.subscription = this.sidebarService.isExpanded$.subscribe(
      isExpanded => this.isSidebarExpanded = isExpanded
    );
    
    this.loadingSubscription = this.loadingService.loading$.subscribe(
      loading => this.isLoading = loading
    );
    
    this.messageSubscription = this.loadingService.message$.subscribe(
      message => this.loadingMessage = message
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.loadingSubscription?.unsubscribe();
    this.messageSubscription?.unsubscribe();
  }
}
