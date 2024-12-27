import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SearchService } from '../../services/search.service';
import { SearchResult } from '../../models/search.model';

@Component({
  selector: 'app-search-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-panel.component.html',
  styleUrl: './search-panel.component.css'
})
export class SearchPanelComponent {
  @Output() searchResultSelected = new EventEmitter<SearchResult>();

  searchText: string = '';
  results: SearchResult[] = [];
  private searchSubject = new Subject<string>();

  constructor(private searchService: SearchService) {
    // Subscribe to the search subject with debounce
    this.searchSubject.pipe(
      debounceTime(500),  // Wait 500ms after the last event
      distinctUntilChanged()  // Only emit if value is different from previous
    ).subscribe(text => {
      this.performSearch(text);
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchText);
  }

  private performSearch(text: string): void {
    if (!text.trim()) {
      this.results = [];
      return;
    }

    this.searchService.search(text).subscribe(results => {
      this.results = results;
    });
  }

  selectResult(result: SearchResult): void {
    this.searchResultSelected.emit(result);
  }
}
