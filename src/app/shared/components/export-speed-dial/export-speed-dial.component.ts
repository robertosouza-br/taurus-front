import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface ExportOption {
  icon: string;
  label: string;
  format: string;
  tooltipLabel: string;
}

@Component({
  selector: 'app-export-speed-dial',
  templateUrl: './export-speed-dial.component.html',
  styleUrls: ['./export-speed-dial.component.scss']
})
export class ExportSpeedDialComponent {
  @Input() loading = false;
  @Input() options: ExportOption[] = [];
  @Output() onExport = new EventEmitter<string>();

  menuItems: any[] = [];

  ngOnInit(): void {
    this.initializeMenu();
  }

  ngOnChanges(): void {
    this.initializeMenu();
  }

  private initializeMenu(): void {
    this.menuItems = this.options.map(option => ({
      icon: option.icon,
      command: () => this.onExport.emit(option.format),
      tooltipOptions: {
        tooltipLabel: option.tooltipLabel,
        tooltipPosition: 'left'
      }
    }));
  }
}
