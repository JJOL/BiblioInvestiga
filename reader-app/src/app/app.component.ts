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

  onSearchResultSelected(result: SearchResult): void {
    // TODO: Handle the search result, e.g., navigate to the page and highlight the text
    console.log('Search result selected:', result);
    this.viewerState = {
      pageNumber: result.page,
      occurrenceIndex: result.occurrenceIndex,
      searchText: result.text,
      documentUrl: result.documentUrl
    };
  }
}
