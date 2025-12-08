import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  icon?: string;
  url?: string;
  command?: () => void;
}

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
  @Input() home: BreadcrumbItem = { label: 'Início', icon: 'pi pi-home', url: '/' };

  constructor(private router: Router) {}

  navigate(item: BreadcrumbItem): void {
    if (item.command) {
      item.command();
    } else if (item.url) {
      this.router.navigate([item.url]);
    }
  }
}
