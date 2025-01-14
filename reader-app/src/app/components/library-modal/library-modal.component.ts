import { Component, EventEmitter, Output, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Document } from '../../models/document.model';
import { DocumentService, DocumentUpload } from '../../services/document.service';

interface DocumentForm {
  file: File | null;
  title: string;
  author: string;
  publishedDate: string;
  pageCount?: number;
  documentId?: string;
}

@Component({
  selector: 'app-library-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './library-modal.component.html',
  styleUrl: './library-modal.component.css'
})
export class LibraryModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() openDocument = new EventEmitter<Document>();


  documents: Document[] = [];
  showAddForm = false;
  isValidPDF = false;
  
  newDocument: DocumentForm = {
    file: null,
    title: '',
    author: '',
    publishedDate: ''
  };

  constructor(private documentService: DocumentService) {}

  ngOnInit() {
    this.documentService.getAllDocuments()
      .subscribe(documents => {
        this.documents = documents;
      });
  }

  onClose(): void {
    this.close.emit();
  }

  onAddDocument(): void {
    this.showAddForm = true;
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.newDocument.file = input.files[0];
      let identification = await this.documentService.identifyDocumentToUpload(this.newDocument.file);

      if (identification.fileType === 'PDF') {
        this.isValidPDF = true;
        this.newDocument.pageCount = identification.numPages;
        this.newDocument.documentId = identification.documentId;
        if (!this.newDocument.title) {
          this.newDocument.title = this.newDocument.file!.name.replace('.pdf', '');
        }
      } else {
        this.isValidPDF = false;
        alert('Please select a valid PDF file');
        this.newDocument.file = null;
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    }
  }

  async onSaveDocument(): Promise<void> {
    if (!this.newDocument.file || !this.newDocument.title || !this.newDocument.author || !this.isValidPDF) {
      alert('Please fill in all required fields and ensure a valid PDF is selected');
      return;
    }

    let document = this.documentService.addDocument({
      file: this.newDocument.file,
      title: this.newDocument.title,
      author: this.newDocument.author,
      publishedDate: new Date(this.newDocument.publishedDate)
    });
    this.newDocument = {
      file: null,
      title: '',
      author: '',
      publishedDate: ''
    };
    this.isValidPDF = false;
    this.showAddForm = false;
  }

  onCancelAdd(): void {
    this.showAddForm = false;
    this.newDocument = {
      file: null,
      title: '',
      author: '',
      publishedDate: ''
    };
  }

  onOpenDocumentClick(document: Document): void {
    this.openDocument.emit(document);
  }

  @HostListener('click', ['$event'])
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).className === 'modal-backdrop') {
      this.close.emit();
    }
  }
} 