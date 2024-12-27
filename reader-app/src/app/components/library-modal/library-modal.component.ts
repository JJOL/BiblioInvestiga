import { Component, EventEmitter, Output, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Document } from '../../models/document.model';
import { DocumentService } from '../../services/document.service';

import { PDFDocumentLoadingTask } from '../../../types/pdfjs/pdf';
import { DocumentInitParameters, RenderParameters, TypedArray } from '../../../types/pdfjs/display/api';

interface DocumentForm {
  file: File | null;
  title: string;
  author: string;
  publishedDate: string;
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
  documents: Document[] = [];
  showAddForm = false;
  
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.newDocument.file = input.files[0];
      this.documentService.identifyDocumentToUpload(this.newDocument.file)
      .subscribe({
          next: (identification) => {
              console.log(identification);
          },
          error: (error) => {
              console.error('Error identifying document', error);
          }
      });
    }

  }




  onSaveDocument(): void {
    if (!this.newDocument.file || !this.newDocument.title || !this.newDocument.author) {
      alert('Please fill in all required fields');
      return;
    }

    const doc = {
      title: this.newDocument.title,
      author: this.newDocument.author,
      publishedDate: new Date(this.newDocument.publishedDate),
      filename: this.newDocument.file.name,
      pageCount: 100, // Default page count as specified
    };

    

    this.documentService.addDocument(doc);
    
    // Reset form
    this.newDocument = {
      file: null,
      title: '',
      author: '',
      publishedDate: ''
    };
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

  @HostListener('click', ['$event'])
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).className === 'modal-backdrop') {
      this.close.emit();
    }
  }
} 