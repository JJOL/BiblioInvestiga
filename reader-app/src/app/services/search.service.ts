import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, defer } from 'rxjs';
import { map } from 'rxjs/operators';
import { SearchResult } from '../models/search.model';
import { DocumentService } from './document.service';
import { Document } from '../models/document.model';
import {} from './apis';

export interface Search {
  searchedText: string;
  documentId?: string;
}

export interface SearchResponse {
  results: SearchResult[];
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

    if (window.electronAPI) {
      return this._electronSearch(payload);
    } else {
      return this._httpSearch(payload);
    }
  }

  private _electronSearch(payload: Search): Observable<SearchResult[]> {
    return from(window.electronAPI.ipcCall<Search, SearchResponse>('search-document', payload))
      .pipe(
        map(response => response.results)
      );
  }

  private _httpSearch(search: Search): Observable<SearchResult[]> {
    let options = {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
    };

    let urlSearchParams = new URLSearchParams();
    urlSearchParams.append('searchedText', search.searchedText);
    if (search.documentId) {
      urlSearchParams.append('documentId', search.documentId);
    }

    return this.http.post<SearchResponse>(`${this.apiUrl}/search-document`, urlSearchParams.toString(), options)
      .pipe(
        map(response => response.results)
      );
  }

} 