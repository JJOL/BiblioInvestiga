import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Document } from '../models/document.model';
import * as crypto from 'crypto-js';

export interface DocumentIdentification {
  fileType: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private documents: Document[] = [];
  private documentsSubject = new BehaviorSubject<Document[]>([]);
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {
    // Load documents from localStorage on service initialization
    const savedDocs = localStorage.getItem('documents');
    if (savedDocs) {
      this.documents = JSON.parse(savedDocs);
    } else {
      // Initialize with default documents if localStorage is empty
      this.documents = [
        {
          title: 'Biografía: Moisés Lira Serafín, MSpS',
          filename: 'Biografia MLS para MSpS.pdf',
          author: 'Congregación de los Misioneros del Espíritu Santo',
          publishedDate: new Date('2023-01-01'),
          addedDate: new Date('2024-01-15'),
          pageCount: 245,
          id: crypto.MD5('Biografía: Moisés Lira Serafín, MSpS').toString()
        },
        {
          title: 'FJR Autobiografía y Souvenirs',
          filename: 'FJR Autobiografía y Souvenirs.pdf',
          author: 'Félix de Jesús Rougier, MSpS',
          publishedDate: new Date('2022-01-01'),
          addedDate: new Date('2024-01-15'),
          pageCount: 180,
          id: crypto.MD5('FJR Autobiografía y Souvenirs').toString()
        }
      ];
      
      localStorage.setItem('documents', JSON.stringify(this.documents));
    }
    
    this.documentsSubject.next(this.documents);
  }

  getAllDocuments(): Observable<Document[]> {
    return this.documentsSubject.asObservable();
  }

  addDocument(doc: Omit<Document, 'id' | 'addedDate'>): Document {
    const newDoc: Document = {
      ...doc,
      id: this.generateDocumentId(doc.title),
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

  private generateDocumentId(title: string): string {
    return crypto.MD5(title).toString();
  }
} 