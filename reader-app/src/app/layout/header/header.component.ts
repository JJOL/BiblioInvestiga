import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibraryModalComponent } from '../../components/library-modal/library-modal.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LibraryModalComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Output() toggleSearch = new EventEmitter<void>();
  @Output() toggleComments = new EventEmitter<void>();
  @Output() toggleSplitView = new EventEmitter<void>();
  
  showLibrary = false;

  openLibrary(): void {
    this.showLibrary = true;
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
