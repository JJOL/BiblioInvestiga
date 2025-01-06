import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SearchResult } from './models/search.model';

import { HeaderComponent } from './layout/header/header.component';
import { SearchPanelComponent } from './layout/search-panel/search-panel.component';
import { CommentsPanelComponent } from './layout/comments-panel/comments-panel.component';
import { MainPanelComponent } from './layout/main-panel/main-panel.component';
import { LibraryModalComponent } from './components/library-modal/library-modal.component';
import { Document } from './models/document.model';

interface ViewerState {
  pageNumber: number;
  occurrenceIndex: number;
  searchText: string;
  documentUrl: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, SearchPanelComponent, CommentsPanelComponent, MainPanelComponent, LibraryModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'reader-app';
  
  viewerState: ViewerState | null = null;
  selectedSearchResult?: SearchResult;
  showSearchPanel = true;
  showCommentsPanel = false;
  showSplitView = false;

  showLibraryModal = false;

  toggleSearchPanel(): void {
    this.showSearchPanel = !this.showSearchPanel;
  }

  toggleCommentsPanel(): void {
    this.showCommentsPanel = !this.showCommentsPanel;
  }

  toggleSplitView(): void {
    this.showSplitView = !this.showSplitView;
  }

  onSearchResultSelected(result: SearchResult): void {
    this.selectedSearchResult = result;
    this.viewerState = {
      pageNumber: result.page,
      occurrenceIndex: result.occurrenceIndex,
      searchText: result.text,
      documentUrl: result.document
    };
  }

  onOpenLibraryModal(): void {
    this.showLibraryModal = true;
  }

  onCloseLibraryModal(): void {
    this.showLibraryModal = false;
  }

  onOpenDocument(document: Document): void {
    this.showLibraryModal = false;
    this.selectedSearchResult = {
      document: document.id,
      page: 1,
      text: '',
      occurrenceIndex: 0,
      documentTitle: document.title,
      context: ''
    };
  }
}
