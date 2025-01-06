import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
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

  @Output() openLibrary = new EventEmitter<void>();

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

  constructor(private cdr: ChangeDetectorRef) { }

  focusedViewer: number = 1;

  firstSearchResult: SearchResult | undefined;
  secondSearchResult: SearchResult | undefined;
  
  ngOnInit(): void {

  }

  focusFirstViewer(): void {
    this.focusedViewer = 1;
    this.cdr.detectChanges();
  }

  focusSecondViewer(): void {
    this.focusedViewer = 2;
    this.cdr.detectChanges();
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

  onUserClickViewer(viewerIndex: number): void {
    this.focusedViewer = viewerIndex;
    // alert(`User clicked on viewer ${viewerIndex}`);
  }

  onOpenLibrary(): void {
    this.openLibrary.emit();
  }
}
