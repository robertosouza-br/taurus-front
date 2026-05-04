import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
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
  layoutLimpo = false;
  private subscription?: Subscription;
  private loadingSubscription?: Subscription;
  private messageSubscription?: Subscription;
  private routerSubscription?: Subscription;

  constructor(
    private sidebarService: SidebarService,
    private loadingService: LoadingService,
    private router: Router,
    private activatedRoute: ActivatedRoute
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

    this.atualizarModoLayout();
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.atualizarModoLayout());
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.loadingSubscription?.unsubscribe();
    this.messageSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  private atualizarModoLayout(): void {
    let route = this.activatedRoute;

    while (route.firstChild) {
      route = route.firstChild;
    }

    this.layoutLimpo = route.snapshot.data['layoutLimpo'] === true;
  }
}
