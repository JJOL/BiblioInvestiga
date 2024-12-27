import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SearchResult } from './models/search.model';

import { HeaderComponent } from './layout/header/header.component';
import { SearchPanelComponent } from './layout/search-panel/search-panel.component';
import { DocumentViewerComponent } from './layout/document-viewer/document-viewer.component';
import { CommentsPanelComponent } from './layout/comments-panel/comments-panel.component';

interface ViewerState {
  pageNumber: number;
  occurrenceIndex: number;
  searchText: string;
  documentUrl: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SearchPanelComponent, DocumentViewerComponent, CommentsPanelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'reader-app';
  
  viewerState: ViewerState | null = null;
  showSearchPanel = true;
  showCommentsPanel = true;

  pdfUrl = "assets/FJR Autobiografía y Souvenirs.pdf"

  toggleSearchPanel(): void {
    this.showSearchPanel = !this.showSearchPanel;
  }

  toggleCommentsPanel(): void {
    this.showCommentsPanel = !this.showCommentsPanel;
  }

  onSearchResultSelected(result: SearchResult): void {
    this.viewerState = {
      pageNumber: result.page,
      occurrenceIndex: result.occurrenceIndex,
      searchText: result.text,
      documentUrl: result.documentUrl
    };
  }
}
