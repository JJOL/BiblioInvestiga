import { Component, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SearchResult } from './models/search.model';

import { HeaderComponent } from './layout/header/header.component';
import { SearchPanelComponent } from './layout/search-panel/search-panel.component';
import { DocumentViewerComponent } from './layout/document-viewer/document-viewer.component';
import { CommentsPanelComponent } from './layout/comments-panel/comments-panel.component';
import { PdfJsViewerModule, PdfJsViewerComponent } from 'ng2-pdfjs-viewer';
import { DocumentService } from './services/document.service';

interface ViewerState {
  pageNumber: number;
  occurrenceIndex: number;
  searchText: string;
  documentUrl: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SearchPanelComponent, CommentsPanelComponent, DocumentViewerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'reader-app';
  
  viewerState: ViewerState | null = null;
  showSearchPanel = true;
  showCommentsPanel = false;

  pdfUrl = "assets/FJR Autobiografía y Souvenirs.pdf"
  pdfContent!: Uint8Array;

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
      documentUrl: result.document
    };
  }

  constructor(private documentService: DocumentService) {}

  async ngOnInit(): Promise<void> {
    this.pdfSrc = await this.documentService.getDocumentContentById('b17f58de102ffa70e76e24a5107b3478');
  }

  pageToView = 1

  @ViewChild('pdfViewer') pdfViewer: PdfJsViewerComponent | undefined;

  pdfSrc: string | Uint8Array | undefined = undefined;
  onDocumentLoaded(event: any): void {
    console.log('Document loaded:', event);
    this.pageToView = 81;

    if (this.pdfViewer) {
      let app = this.pdfViewer.PDFViewerApplication;
      console.log('PDFViewerApplication:', app);
      app.eventBus.on('pagerendered', (x: any) => {
        console.log('Page rendered:', x);
      });
    }
  }

  onDocumentPageChanged(event: any): void {
    console.log('Document page changed:', event);
  }
}
