import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SearchResult } from './models/search.model';

import { HeaderComponent } from './layout/header/header.component';
import { SearchPanelComponent } from './layout/search-panel/search-panel.component';
import { CommentsPanelComponent } from './layout/comments-panel/comments-panel.component';
import { PdfJsViewerModule, PdfJsViewerComponent } from 'ng2-pdfjs-viewer';
import { DocumentService } from './services/document.service';
import { MainPanelComponent } from './layout/main-panel/main-panel.component';

interface ViewerState {
  pageNumber: number;
  occurrenceIndex: number;
  searchText: string;
  documentUrl: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SearchPanelComponent, CommentsPanelComponent, MainPanelComponent],
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

  pdfUrl = "assets/FJR Autobiografía y Souvenirs.pdf"
  pdfContent!: Uint8Array;

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
}
