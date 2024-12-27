import { Component, EventEmitter, Output, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Document } from '../../models/document.model';
import { DocumentService } from '../../services/document.service';

interface DocumentForm {
  file: File | null;
  title: string;
  author: string;
  publishedDate: string;
  pageCount?: number;
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.newDocument.file = input.files[0];
      this.documentService.identifyDocumentToUpload(this.newDocument.file)
        .subscribe({
          next: (identification) => {
            if (identification.fileType === 'PDF') {
              this.isValidPDF = true;
              this.newDocument.pageCount = identification.numPages;
              // Suggest a title from filename if empty
              if (!this.newDocument.title) {
                this.newDocument.title = this.newDocument.file!.name.replace('.pdf', '');
              }
            } else {
              this.isValidPDF = false;
              alert('Please select a valid PDF file');
              this.newDocument.file = null;
              // Reset file input
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileInput) fileInput.value = '';
            }
          },
          error: (error) => {
            console.error('Error identifying document', error);
            this.isValidPDF = false;
            alert('Error processing file. Please try again.');
          }
        });
    }
  }

  onSaveDocument(): void {
    if (!this.newDocument.file || !this.newDocument.title || !this.newDocument.author || !this.isValidPDF) {
      alert('Please fill in all required fields and ensure a valid PDF is selected');
      return;
    }

    const metadata = {
      title: this.newDocument.title,
      author: this.newDocument.author,
      publishedDate: new Date(this.newDocument.publishedDate),
      filename: this.newDocument.file.name,
      pageCount: this.newDocument.pageCount!
    };

    this.documentService.uploadDocument(this.newDocument.file, metadata)
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Reset form
            this.newDocument = {
              file: null,
              title: '',
              author: '',
              publishedDate: ''
            };
            this.isValidPDF = false;
            this.showAddForm = false;
          } else {
            alert('Error saving document');
          }
        },
        error: (error) => {
          console.error('Error uploading document:', error);
          alert('Error uploading document. Please try again.');
        }
      });
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