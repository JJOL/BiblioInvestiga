import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { SearchResult } from '../../models/search.model';
import { ViewerComponent } from './viewer/viewer.component';

@Component({
  selector: 'app-main-panel',
  standalone: true,
  imports: [ViewerComponent],
  templateUrl: './main-panel.component.html',
  styleUrl: './main-panel.component.css'
})
export class MainPanelComponent implements OnInit {
  private _showSplitView = false;

  @Input()
  public set showSplitView(value: boolean) {
    this._showSplitView = value;

    if (this._showSplitView) {
      this.focusedViewer = 2;
    } else {
      this.focusedViewer = 1;
      this.secondSearchResult = undefined;
    }
  };

  public get showSplitView(): boolean {
    return this._showSplitView;
  }

  private _searchResult: SearchResult | undefined;
  @Input()
  public set searchResult(value: SearchResult | undefined) {
    this._searchResult = value;

    if (this._searchResult) {
      if (this.focusedViewer === 1) {
        this.firstSearchResult = this._searchResult;
      } else {
        this.secondSearchResult = this._searchResult;
      }
    }
  }

  @Input() isSearchOpen: boolean = false;
  
  @ViewChild('firstViewer') firstViewer!: ViewerComponent;
  @ViewChild('secondViewer') secondViewer?: ViewerComponent;

  focusedViewer: number = 1;

  firstSearchResult: SearchResult | undefined;
  secondSearchResult: SearchResult | undefined;
  
  ngOnInit(): void {

  }

  focusFirstViewer(): void {
    this.focusedViewer = 1;
  }

  focusSecondViewer(): void {
    this.focusedViewer = 2;
  }

  isFirstViewerFocused(): boolean {
    return this.focusedViewer === 1;
  }

  isSecondViewerFocused(): boolean {
    return this.focusedViewer === 2;
  }

  getViewerSearchResult(viewerIndex: number): SearchResult | undefined {
    return viewerIndex === 1 ? this.firstSearchResult : this.secondSearchResult;
  }
}
