import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SearchResult } from '../../models/search.model';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-search-panel',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './search-panel.component.html',
  styleUrl: './search-panel.component.css'
})
export class SearchPanelComponent {
  @Output() searchResultSelected = new EventEmitter<SearchResult>();
  
  searchText: string = '';
  results: SearchResult[] = [];
  
  constructor(private searchService: SearchService) {}

  onSearch(): void {
    this.searchService.search(this.searchText)
      .subscribe(results => {
        this.results = results;
      });
  }

  selectResult(result: SearchResult): void {
    this.searchResultSelected.emit(result);
  }
}
