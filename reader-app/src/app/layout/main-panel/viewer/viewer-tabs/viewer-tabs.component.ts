import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DocumentService } from '../../../../services/document.service';
import { Document } from '../../../../models/document.model';

@Component({
  selector: 'app-viewer-tabs',
  standalone: true,
  imports: [],
  templateUrl: './viewer-tabs.component.html',
  styleUrl: './viewer-tabs.component.css'
})
export class ViewerTabsComponent {

  @Output() loadLibDocument: EventEmitter<Document> = new EventEmitter<Document>();
  @Output() selectDocument: EventEmitter<Document> = new EventEmitter<Document>();

  @Input() loadedDocuments: Document[] = [];
  @Input() isFocused: boolean = false;
  @Input() activeDocument?: Document;

  _libraryDocuments: Document[] = [];
  constructor(private documentService: DocumentService) {
    this.documentService.getAllDocuments()
      .subscribe((documents) => {
        this._libraryDocuments = documents;
      });
  }

  onTabClick(document: Document) {
    this.selectDocument.emit(document);
  }

  _ID = 0;
  onAddBtnClick() {
    this.loadLibDocument.emit(this._libraryDocuments[this._ID]);
    this._ID++;
  }
}
