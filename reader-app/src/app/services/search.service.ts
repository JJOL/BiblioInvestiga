import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SearchResult } from '../models/search.model';
import { DocumentService } from './document.service';
import { Document } from '../models/document.model';

interface BackendSearchResult {
  document: string;
  page: number;
  occurrenceIndex: number;
  text: string;
  context: string;
  documentId: string;
}

interface SearchResponse {
  results: BackendSearchResult[];
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl = 'http://localhost:3000';
  private nextId = 1;

  constructor(
    private http: HttpClient,
    private documentService: DocumentService
  ) {}

  search(searchText: string, documentId?: string): Observable<SearchResult[]> {
    const payload = {
      searchedText: searchText,
      documentId: documentId
    };

    return this.http.post<SearchResponse>(`${this.apiUrl}/search-document`, payload)
      .pipe(
        map(response => response.results.map(result => {
          const document = this.documentService.getDocumentById(result.document);
          return this.mapToSearchResult(result, searchText, document);
        }))
      );
  }

  private mapToSearchResult(
    result: BackendSearchResult, 
    searchText: string,
    document?: Document
  ): SearchResult {
    return {
      id: this.nextId++,
      text: searchText,
      page: result.page,
      context: result.context,
      documentTitle: document?.title || result.document,
      documentUrl: `${this.apiUrl}/documents/${result.document}`,
      occurrenceIndex: result.occurrenceIndex,
      documentId: document?.id || result.document
    };
  }
} 