import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Document } from '../models/document.model';
import * as crypto from 'crypto-js';

export interface DocumentIdentification {
  fileType: string;
  numPages?: number;
  filename: string;
  documentId: string;
}

export interface DocumentUploadResponse {
  success: boolean;
  document: Document;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private documents: Document[] = [];
  private documentsSubject = new BehaviorSubject<Document[]>([]);
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {
    const savedDocs = localStorage.getItem('documents');
    if (savedDocs) {
      this.documents = JSON.parse(savedDocs);
      this.documentsSubject.next(this.documents);
    }
  }

  getAllDocuments(): Observable<Document[]> {
    return this.documentsSubject.asObservable();
  }

  addDocument(doc: Omit<Document, 'addedDate'>): Document {
    const newDoc: Document = {
      ...doc,
      addedDate: new Date()
    };

    this.documents.push(newDoc);
    this.documentsSubject.next(this.documents);
    localStorage.setItem('documents', JSON.stringify(this.documents));

    return newDoc;
  }

  identifyDocumentToUpload(file: File): Observable<DocumentIdentification> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<DocumentIdentification>(`${this.apiUrl}/identify-document`, formData);
  }

  private generateDocumentId(title: string, filename: string): string {
    const uniqueString = `${title}-${filename}-${Date.now()}`;
    return crypto.MD5(uniqueString).toString();
  }

  uploadDocument(file: File, metadata: Omit<Document, 'addedDate'>): Observable<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify({
      ...metadata
    }));
    
    return this.http.post<DocumentUploadResponse>(`${this.apiUrl}/upload-document`, formData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.documents.push(response.document);
            this.documentsSubject.next(this.documents);
            localStorage.setItem('documents', JSON.stringify(this.documents));
          }
        })
      );
  }

  getDocumentById(id: string): Document | undefined {
    return this.documents.find(doc => doc.id === id);
  }
} 