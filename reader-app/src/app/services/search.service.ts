import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SearchResult } from '../models/search.model';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  // Mock data - in a real app, this would come from an API or database
  private mockData: SearchResult[] = [
    { id: 1, occurrenceIndex: 0, text: 'Angular', page: 1, context: '...modern web development using Angular framework...', documentTitle: 'Angular Guide', documentId: 101, documentUrl: 'assets/Angular Guide.pdf' },
    { id: 2, occurrenceIndex: 0, text: 'Zacatlán a Amozoc', page: 5, context: 'Con este primer traslado de Zacatlán a Amozoc, comenzó la vida itinerante', documentTitle: 'Biografía: Moisés Lira Serafín, MSpS', documentId: 101, documentUrl: 'assets/Biografia MLS para MSpS.pdf' },
    { id: 3, occurrenceIndex: 0, text: 'La Divina Providencia', page: 3, context: '...Zacatlán, <<La Divina Providencia>>...', documentTitle: 'Biografía: Moisés Lira Serafín, MSpS', documentId: 102, documentUrl: 'assets/Biografia MLS para MSpS.pdf' },
    { id: 4, occurrenceIndex: 1, text: 'Angular', page: 3, context: '...Angular provides powerful tools...', documentTitle: 'Angular Guide', documentId: 101, documentUrl: 'assets/Angular Guide.pdf' },
    { id: 5, occurrenceIndex: 0, text: 'Divina Providencia', page: 91, context: 'situación tan terrible, la Divina Providencia pro-', documentTitle: 'FJR Autobiografía y Souvenirs', documentId: 103, documentUrl: 'assets/FJR Autobiografía y Souvenirs.pdf' },
  ];

  search(searchText: string): Observable<SearchResult[]> {
    if (!searchText.trim()) {
      return of([]);
    }

    const results = this.mockData.filter(item => 
      item.documentTitle.toLowerCase().includes(searchText.toLowerCase()) ||
      item.context.toLowerCase().includes(searchText.toLowerCase())
    );

    return of(results);
  }
} 