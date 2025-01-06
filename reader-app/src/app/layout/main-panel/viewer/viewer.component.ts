import { AfterContentInit, AfterViewInit, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { SearchResult } from '../../../models/search.model';
import { ViewerTabsComponent } from './viewer-tabs/viewer-tabs.component';
import { DocumentViewerComponent } from './document-viewer/document-viewer.component';
import { Document } from '../../../models/document.model';
import { DocumentService } from '../../../services/document.service';


@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [ViewerTabsComponent, DocumentViewerComponent],
  templateUrl: './viewer.component.html',
  styleUrl: './viewer.component.css'
})
export class ViewerComponent implements OnInit, OnChanges, AfterContentInit, AfterViewInit, OnDestroy {

  @Output() openLibrary: EventEmitter<void> = new EventEmitter<void>();
  @Output() requestFocus: EventEmitter<void> = new EventEmitter<void>();
  @Input() focused: boolean = false;
  private _searchResult?: SearchResult;
  @Input()
  public set searchResult(value: SearchResult | undefined) {
    if (value) {
      this._searchResult = value;
      let foundDocument = this.loadedDocuments.find(doc => doc.id === value.document);
      if (!foundDocument) {
        foundDocument = this.libraryDocuments.find(doc => doc.id === value.document);
        if (!foundDocument) {
          console.error('Document not found');
          return
        }

        this.loadedDocuments.push(foundDocument);
      }

      this.selectDocument(foundDocument!);
    }

  }
  public get searchResult(): SearchResult | undefined {
    return this._searchResult;
  }
  @Input() isSearchOpen: boolean = false;
  
  loadedDocuments: Document[] = [];
  activeDocument?: Document;
  libraryDocuments: Document[] = [];

  constructor(private documentService: DocumentService) {
    this.documentService.getAllDocuments().subscribe((documents) => {
      this.libraryDocuments = documents
    });
  }
  ngAfterViewInit(): void {
    console.log('Viewer.ngAfterViewInit');
  }
  ngAfterContentInit(): void {
    console.log('Viewer.ngAfterContentInit');
  }
  ngOnChanges(changes: SimpleChanges): void {
    console.log('Viewer.ngOnChanges');
  }
  ngOnInit(): void {
    console.log('Viewer.ngOnInit');
  }
  ngOnDestroy(): void {
    console.log('Viewer.ngOnDestroy');
  }

  selectDocument(document: Document): void {
    this.activeDocument = document;
  }

  onTabsLoadLibDocument(document: Document): void {
    this.loadedDocuments.push(document);
    this.searchResult = undefined;
    this.selectDocument(document);
    // this.requestFocus.emit();
  }

  onTabsOpenLibrary(): void {
    this.openLibrary.emit();
  }

  onTabsSelectionChange(document: Document): void {
    this.searchResult = undefined;
    this.selectDocument(document);
    // this.requestFocus.emit();
  }

  onViewerClicked(): void {
    this.requestFocus.emit();
  }
}
