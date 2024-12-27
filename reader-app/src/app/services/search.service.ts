import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SearchResult } from '../models/search.model';

interface BackendSearchResult {
  document: string;
  page: number;
  occurrenceIndex: number;
  text: string;
  context: string;
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

  constructor(private http: HttpClient) {}

  search(searchText: string, filename?: string): Observable<SearchResult[]> {
    const payload = {
      searchedText: searchText,
      filename: filename
    };

    return this.http.post<SearchResponse>(`${this.apiUrl}/search-document`, payload)
      .pipe(
        map(response => response.results.map(result => this.mapToSearchResult(result, searchText)))
      );
  }

  private mapToSearchResult(result: BackendSearchResult, searchText: string): SearchResult {

    console.log(`documentUrl: '${result.document}'`);

    return {
      id: this.nextId++,
      text: searchText,
      page: result.page,
      context: result.context,
      documentTitle: result.document,
      documentId: this.nextId, // Using same as id for simplicity
      documentUrl: `assets/${result.document}`,
      occurrenceIndex: result.occurrenceIndex
    };
  }
} 