import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Document } from '../models/document.model';
import {} from './apis';

export interface DocumentIdentification {
  fileType: string;
  numPages?: number;
  filename: string;
  documentId: string;
}

export interface DocumentIdentificationResponse {
  success: boolean;
  info: DocumentIdentification;
}

export interface DocumentUpload {
  title: string;
  author: string;
  publishedDate: Date;
  file: File;
}

export interface DocumentUploadResponse {
  success: boolean;
  document: Document;
}

export interface DocumentsListResponse {
  documents: Document[];
}

// interface ElectronAPI {
//   uploadDocument(uploadPayload: { documentInfo: Document, file: File }): Promise<void>;
// }

// declare global {
//   interface Window {
//     electronAPI: ElectronAPI
//   }
// }

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private documents: Document[] = [];
  private documentsSubject = new BehaviorSubject<Document[]>([]);
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {
    this._loadSavedDocuments();
  }

  private _loadSavedDocuments() {
    if (window.electronAPI) {
      this._electronLoadDocuments();
    } else {
      this._httpLoadDocuments();
    }
  }

  private _electronLoadDocuments() {
    throw new Error('Method not implemented.');
  }

  private _httpLoadDocuments() {
    this.http.get<DocumentsListResponse>(`${this.apiUrl}/documents`)
      .subscribe(resp => {
        this.documents = resp.documents;
        this.documentsSubject.next(this.documents);
      });
  }

  getAllDocuments(): Observable<Document[]> {
    return this.documentsSubject.asObservable();
  }

  async addDocument(doc: DocumentUpload): Promise<Document> {
    if (window.electronAPI) {
      return this._electronUploadDocument(doc);
    } else {
      return this._httpUploadDocument(doc);
    }
  }

  private async _electronUploadDocument(upload: DocumentUpload): Promise<Document> {
    throw new Error('Method not implemented.');
  }

  private async _httpUploadDocument(upload: DocumentUpload): Promise<Document> {
    return new Promise<Document>((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', upload.file);
      formData.append('title', upload.title);
      formData.append('author', upload.author);
      formData.append('publishedDate', upload.publishedDate.toISOString());
  
      this.http.post<DocumentUploadResponse>(`${this.apiUrl}/documents`, formData)
        .subscribe({
          next: resp => {
            this.documents.push(resp.document);
            this.documentsSubject.next(this.documents);
            resolve(resp.document);
          },
          error: reject
        });
    });
    
    
  }

  async identifyDocumentToUpload(file: File): Promise<DocumentIdentification> {
    if (window.electronAPI) {
      return this._electronIdentifyDocumentToUpload(file);
    } else {
      return this._httpIdentifyDocumentToUpload(file);
    }
  }

  private _electronIdentifyDocumentToUpload(file: File): Promise<DocumentIdentification> {
    throw new Error('Method not implemented.');
  }

  private _httpIdentifyDocumentToUpload(file: File): Promise<DocumentIdentification> {
    return new Promise<DocumentIdentification>((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      this.http.post<DocumentIdentificationResponse>(`${this.apiUrl}/identify-document`, formData)
      .subscribe({
        next: resp => {
          resolve(resp.info)
        },
        error: reject
      })
    });
  }

  getDocumentById(id: string): Document | undefined {
    return this.documents.find(doc => doc.id === id);
  }

  getDocumentContentById(id: string): Observable<Uint8Array> {
    return this.http.get(`${this.apiUrl}/documents/${id}/file`, { responseType: 'arraybuffer' })
      .pipe(
        map((response: any) => new Uint8Array(response))
      );
  }
} 