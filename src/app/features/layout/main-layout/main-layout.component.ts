import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SidebarService } from '../../../core/services';

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
  private subscription?: Subscription;

  constructor(private sidebarService: SidebarService) {}

  ngOnInit(): void {
    this.subscription = this.sidebarService.isExpanded$.subscribe(
      isExpanded => this.isSidebarExpanded = isExpanded
    );
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
