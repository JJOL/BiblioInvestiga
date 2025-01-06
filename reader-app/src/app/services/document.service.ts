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

export interface DocumentIdentificationRequest {
  file: {
    filename: string;
    data: Uint8Array;
  }
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

export interface DocumentUploadRequest {
  title: string;
  author: string;
  publishedDate: string;
  file: {
    filename: string;
    data: Uint8Array;
  }
}

export interface DocumentUploadResponse {
  success: boolean;
  document: Document;
}

export interface DocumentListRequest {}

export interface DocumentsListResponse {
  documents: Document[];
}

export interface GetDocumentContentRequest {
  documentId: string;
}

export interface GetDocumentContentResponse {
  success: boolean;
  data: Uint8Array;
}

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
    window.electronAPI.ipcCall<DocumentListRequest, DocumentsListResponse>('get-documents', {})
      .then(resp => {
        this.documents = resp.documents;
        this.documentsSubject.next(this.documents);
      });
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
    let req: DocumentUploadRequest = {
      title: upload.title,
      author: upload.author,
      publishedDate: upload.publishedDate.toISOString(),
      file: {
        filename: upload.file.name,
        data: new Uint8Array(await upload.file.arrayBuffer())
      }
    };
    let resp = await window.electronAPI.ipcCall<DocumentUploadRequest, DocumentUploadResponse>('upload-document', req);
    this.documents.push(resp.document);
    this.documentsSubject.next(this.documents);
    return resp.document;
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

  private async _electronIdentifyDocumentToUpload(file: File): Promise<DocumentIdentification> {
    let req: DocumentIdentificationRequest = {
      file: {
        filename: file.name,
        data: new Uint8Array(await file.arrayBuffer())
      }
    };
    let resp = await window.electronAPI.ipcCall<DocumentIdentificationRequest, DocumentIdentificationResponse>('identify-document', req);
    return resp.info;
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

  getDocumentContentById(id: string): Promise<Uint8Array> {
    if (window.electronAPI) {
      return this._electronGetDocumentContent(id);
    } else {
      return this._httpGetDocumentContent(id);
    }
  }

  private async _electronGetDocumentContent(id: string): Promise<Uint8Array> {
    let resp = await window.electronAPI.ipcCall<GetDocumentContentRequest, GetDocumentContentResponse>('get-document', { documentId: id });
    return resp.data;
  }

  private _httpGetDocumentContent(id: string): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
      this.http.get(`${this.apiUrl}/documents/${id}/file`, { responseType: 'arraybuffer' })
        .pipe(
          map((response: any) => new Uint8Array(response))
        ).subscribe({
          next: resolve,
          error: reject
        });
    });
  }
} 