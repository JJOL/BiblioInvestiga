import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SearchResult } from '../../../models/search.model';
import { ViewerTabsComponent } from './viewer-tabs/viewer-tabs.component';
import { DocumentViewerComponent } from './document-viewer/document-viewer.component';
import { Document } from '../../../models/document.model';


@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [ViewerTabsComponent, DocumentViewerComponent],
  templateUrl: './viewer.component.html',
  styleUrl: './viewer.component.css'
})
export class ViewerComponent {

  @Output() requestFocus: EventEmitter<void> = new EventEmitter<void>();
  @Input() focused: boolean = false;
  @Input() searchResult?: SearchResult;
  @Input() isSearchOpen: boolean = false;
  
  loadedDocuments: Document[] = [];
  activeDocument?: Document;

  loadLibDocument(document: Document): void {
    this.loadedDocuments.push(document);

    this.selectDocument(document);
  }

  selectDocument(document: Document): void {
    this.activeDocument = document;
    this.requestFocus.emit();
  }
}
