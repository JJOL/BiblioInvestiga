import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Output() toggleSearch = new EventEmitter<void>();
  @Output() toggleComments = new EventEmitter<void>();
  @Output() toggleSplitView = new EventEmitter<void>();
  @Output() openLibrary = new EventEmitter<void>();
  
  showLibrary = false;

  onOpenLibrary(): void {
    this.openLibrary.emit();
  }

  closeLibrary(): void {
    this.showLibrary = false;
  }

  onToggleSearch(): void {
    this.toggleSearch.emit();
  }

  onToggleComments(): void {
    this.toggleComments.emit();
  }

  onToggleSplitView(): void {
    this.toggleSplitView.emit();
  }
}
