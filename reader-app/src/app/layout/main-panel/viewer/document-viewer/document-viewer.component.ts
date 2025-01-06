import { AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
// import { NgxExtendedPdfViewerComponent, NgxExtendedPdfViewerModule, PageRenderedEvent, PDFScriptLoaderService } from 'ngx-extended-pdf-viewer';
import { PdfJsViewerModule, PdfJsViewerComponent } from 'ng2-pdfjs-viewer';
import { DocumentService } from '../../../../services/document.service';
import { Document } from '../../../../models/document.model';
import { SearchResult } from '../../../../models/search.model';


interface HighlightableText {
  highlight(): void
  unhighlight(): void
}

class SingleSpanHighlightableText implements HighlightableText {
  originalText: string = '';
  constructor(private span: HTMLElement, private text: string) {}

  highlight(): void {
    this.originalText = this.span.textContent || '';
    const textBefore = this.span.textContent?.substring(0, this.span.textContent?.indexOf(this.text));
    const textAfter = this.span.textContent?.substring(this.span.textContent?.indexOf(this.text) + this.text.length);
    const highlightedText = `${textBefore}<span class="highlight selected appended">${this.text}</span>${textAfter}`;
    this.span.innerHTML = highlightedText;
  }
// 
  unhighlight(): void {
    this.span.innerHTML = this.originalText;
  }
}

type AnnotatedSpan = {
  span: HTMLElement;
  text: string;
}

class MultipleSpanHighlightableText implements HighlightableText {

  originalTexts: string[] = [];

  constructor(private spans: AnnotatedSpan[]) {}

  highlight(): void {
    for (let i = 0; i < this.spans.length; i++) {
      var span = this.spans[i].span;
      let textInSpan = this.spans[i].text;
      this.originalTexts.push(span.textContent || '');

      const textBefore = span.textContent?.substring(0, span.textContent?.indexOf(textInSpan));
      const textAfter = span.textContent?.substring(span.textContent?.indexOf(textInSpan) + textInSpan.length);
      const highlightedText = `${textBefore}<span class="highlight selected appended">${textInSpan}</span>${textAfter}`;
      span.innerHTML = highlightedText;
    }
  }

  unhighlight(): void {
    for (let i = 0; i < this.spans.length; i++) {
      var span = this.spans[i].span;
      span.innerHTML = this.originalTexts[i];
    }
  }
}

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [PdfJsViewerModule],
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.css'
})
export class DocumentViewerComponent implements OnInit, OnChanges, AfterContentInit, AfterViewInit, OnDestroy {
  @ViewChild('pdfViewerEl') pdfViewerEl: PdfJsViewerComponent | undefined;
  
  @Output() viewerClicked = new EventEmitter<void>();

  @Input() src: string | Uint8Array = '';

  private _document?: Document;
  @Input()
  public set document(value: Document | undefined) {
    console.log('DocumentViewer.setDocument', value);
    this._document = value;
    if (this._document) {
      console.log('Opening document...', this._document);
        this.documentService.getDocumentContentById(this._document.id).then((content) => {
          console.log('Document Loaded!');
          this.src = content;
          if (this.pdfViewerEl) {
            console.log('Refreshing PDF Viewer');
            this.pdfViewerEl.pdfSrc = content;
            this.pdfViewerEl.refresh();
          }
        });
    }
  };
  public get document(): Document | undefined {
    return this._document;
  }

  private _searchResult?: SearchResult;
  @Input()
  public set searchResult(value: SearchResult | undefined) {
    console.log('DocumentViewer.setSearchResult', value);
    if (value) {
      this._searchResult = value;

      if (this.lastLoadedDocumentId != this._searchResult.document) {
        this.bufferedPageNumber = this._searchResult.page;
      } else {
        this.pageNumber = this._searchResult.page;
        // this.applyHighlight(this._searchResult.text);
      }

      if (this.pdfViewerEl) {
        // DO HIGHILIGHT Searched Text
      } else {
      }
    }
  }
  public get searchResult(): SearchResult | undefined {
    return this._searchResult;
  }

  pageNumber: number = 1;
  bufferedPageNumber?: number;
  lastLoadedDocumentId?: string;

  @Input() isSearchOpen = false;

  _hasInitPdfApplication = false;

  previousHighlighted: HighlightableText[] = [];

  readyToShow = false;

  constructor(
    private ngZone: NgZone,
    private documentService: DocumentService,
  ) {}
  
  onDocumentLoaded(event: any): void {
    console.log('DocumentViewer.onDocumentLoaded', event);

    console.log('Initializing PDF Application Listeners');
    this.pdfViewerEl!.PDFViewerApplication.eventBus.on('pagerendered', (event: any) => {
      this.onPageRendered(event);
    });
    this.pdfViewerEl!.PDFViewerApplication.eventBus.on('textlayerrendered', (event: any) => {
      this.onPageTextLayerRendered(event);
    });

    // mouse "click" event on document to refocus the viewer
    this.pdfViewerEl!.PDFViewerApplication.appConfig.viewerContainer.addEventListener('click', () => {
      this.onViewerClicked();
    });


    this.lastLoadedDocumentId = this._document?.id;
  }

  ngOnInit() {
    console.log('DocumentViewer.ngOnInit');
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('DocumentViewer.ngOnChanges');
    // console.log('Changed looking for text:', this.lookingForText);

    // if (this.documentId.trim().length > 0 && this.delay == 0) {
    //   this.documentService.getDocumentContentById(this.documentId).then((content) => {
    //     console.log('Document content:', content);
    //     this.src = content;
    //     this.readyToShow = true;
    //     this.applyHighlight(this.lookingForText);
    //   });
    // }
  }
  ngAfterViewInit(): void {
    console.log('DocumentViewer.ngAfterViewInit');
  }
  ngAfterContentInit(): void {
    console.log('DocumentViewer.ngAfterContentInit');
  }

  ngOnDestroy(): void {
    console.log('DocumentViewer.ngOnDestroy');
  }

  findTextInElements(text: string, elements: HTMLElement[]): HighlightableText[] {
    let found: HighlightableText[] = [];
    
    // Normalize the search text (case-insensitive, remove diacritics)
    const normalizedSearchText = text
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    
    console.log('Looking for text: "' + text + '"');
    
    let currentLookingText = normalizedSearchText;
    let partialFound: AnnotatedSpan[] = [];
    for (let i = 0; i < elements.length; i++) {
      var span = elements[i];
      // Normalize the span text for comparison
      let normalizedSpanText = (span.textContent || '')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

      if (normalizedSpanText.trim().length == 0) {
        continue;
      }

      // For exact matches, use the original text length but normalized content
      if (normalizedSpanText.includes(normalizedSearchText)) {
        found.push(new SingleSpanHighlightableText(span, span.textContent!.substring(
          normalizedSpanText.indexOf(normalizedSearchText),
          normalizedSpanText.indexOf(normalizedSearchText) + text.length
        )));
        continue;
      }

      let spanContainsText = false;
      let textLimit = currentLookingText.length;
      if (partialFound.length == 0) {
        while (!spanContainsText && textLimit > 0) {
          if (normalizedSpanText.endsWith(currentLookingText.substring(0, textLimit))) {
            spanContainsText = true;
          } else {
            textLimit--;
          }
        }
      } else {
        while (!spanContainsText && textLimit > 0) {
          if (normalizedSpanText.startsWith(currentLookingText.substring(0, textLimit))) {
            spanContainsText = true;
          } else {
            textLimit--;
          }
        }
      }

      if (spanContainsText) {
        console.log('Span: "' + span.textContent + '"');
        const matchedText = currentLookingText.substring(0, textLimit);
        console.log('Contains text: "' + matchedText + '"');
        
        // Get the original text from the span that matches the normalized position
        const originalSpanText = span.textContent || '';
        const matchStart = normalizedSpanText.indexOf(matchedText);
        const originalMatchedText = originalSpanText.substring(
          matchStart,
          matchStart + (partialFound.length === 0 ? textLimit : text.length - currentLookingText.length + textLimit)
        );

        partialFound.push({
          span: span,
          text: originalMatchedText.trim()
        });
        
        currentLookingText = currentLookingText.substring(textLimit).trimStart();
        if (currentLookingText.length === 0) {
          found.push(new MultipleSpanHighlightableText(partialFound));
          partialFound = [];
          break;
        }
      } else {
        currentLookingText = normalizedSearchText;
        partialFound = [];
      }
    }

    console.log('Found:', found);
    return found;
  }

  clearPreviousHighlight() {
    for (let i = 0; i < this.previousHighlighted.length; i++) {
      this.previousHighlighted[i].unhighlight();
    }
    this.previousHighlighted = [];
  }

  applyHighlight(text: string, providedDivEl: HTMLElement): boolean {
    console.log('applyHighight().Looking for text:', text);
    // let pageElement = document.querySelector(`.page[data-page-number="${this.pageNumber}"]`);
    // if (providedDivEl) {
    //   pageElement = providedDivEl; 
    // }
    let pageElement = providedDivEl;
    if (pageElement) {
      console.log('FOUND DIV ')
      // const textLayerElement = pageElement.querySelector('.textLayer');
      let textLayerElement = pageElement;

      if (textLayerElement) {
        console.log('FOUND TEXT LAYER')
        this.clearPreviousHighlight();
        const spanElements = Array.from(textLayerElement.querySelectorAll('span'));
        console.log('Checking elements:', spanElements);
        const checkingElementTexts = spanElements.map((el) => el.textContent);
        console.log('Checking elements text:', checkingElementTexts);
        const foundElements = this.findTextInElements(this.searchResult!.text, spanElements);
        console.log('Found elements:', foundElements);

        if (this.searchResult!.occurrenceIndex < foundElements.length) {
          foundElements[this.searchResult!.occurrenceIndex].highlight();
          this.previousHighlighted.push(foundElements[this.searchResult!.occurrenceIndex]);
        } else {
          console.log('No more occurrences found');
        }

        return true;
      }
    }

    return false;
  }

  onPageRendered(event: any) {
    console.log('DocumentViewer.onPageRendered', event);
    if (this.bufferedPageNumber && this.bufferedPageNumber != this.pageNumber) {
      setTimeout(() => {
        this.ngZone.run(() => {
          this.pageNumber = this.bufferedPageNumber!;
          this.bufferedPageNumber = undefined;
        });
      }, 200);
    }

    if (event.pageNumber === this.pageNumber && this.searchResult) {
      // setTimeout(() => {
        console.log('onPageRendered(). Looking for text:', this.searchResult?.text);
        let pageEl = event.source.div;
        console.log('Can use:', pageEl)
        
    }
  }

  onPageTextLayerRendered(event: any) {
    console.log('DocumentViewer.onPageTextLayerRendered', event);
    if (event.pageNumber === this.pageNumber && this.searchResult) {
      console.log('onPageTextLayerRendered(): Target page Text Layer rendered! Ready to highlight text');
      let pageEl = event.source.textLayerDiv;
      setTimeout(() => {
        this.applyHighlight(this.searchResult!.text, pageEl);
      }, 200);
    }
  }

  onViewerClicked() {
    this.viewerClicked.emit();
  }
}
