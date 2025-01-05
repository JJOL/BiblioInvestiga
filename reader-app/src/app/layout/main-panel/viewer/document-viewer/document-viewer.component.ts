import { ChangeDetectorRef, Component, Input, NgZone, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
// import { NgxExtendedPdfViewerComponent, NgxExtendedPdfViewerModule, PageRenderedEvent, PDFScriptLoaderService } from 'ngx-extended-pdf-viewer';
import { DocumentService } from '../../../../services/document.service';
import { Document } from '../../../../models/document.model';


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
  imports: [],
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.css'
})
export class DocumentViewerComponent implements OnInit, OnChanges {
  @ViewChild('pdfViewer') pdfViewer!: any;
  zoom = 'auto';

  @Input() src: string | Uint8Array = '';
  @Input() pdfSrc: string = '';
  @Input() documentId: string = '';
  @Input() document?: Document;
  @Input() pageNumber: number = 5;
  @Input() lookingForText: string = 'Zacatlán a Amozoc';
  @Input() occurrenceIndex: number = 0;

  @Input() isSearchOpen = false;

  @Input() delay = 0;

  previousHighlighted: HighlightableText[] = [];

  readyToShow = false;

  constructor(
    private ngZone: NgZone,
    // // private readonly pdfScriptLoaderService: PDFScriptLoaderService,
    private documentService: DocumentService,
  ) {}

  ngOnInit() {
    if (this.delay > 0) {
      setTimeout(() => {
        this.documentService.getDocumentContentById(this.documentId).then((content) => {
          console.log('Document content:', content);
          this.src = content;
          this.readyToShow = true;
          this.applyHighlight(this.lookingForText);
        });
      }, this.delay);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('Changed looking for text:', this.lookingForText);

    if (this.documentId.trim().length > 0 && this.delay == 0) {
      this.documentService.getDocumentContentById(this.documentId).then((content) => {
        console.log('Document content:', content);
        this.src = content;
        this.readyToShow = true;
        this.applyHighlight(this.lookingForText);
      });
    }


  }

  findTextInElements(text: string, elements: HTMLElement[]): HighlightableText[] {
    let found: HighlightableText[] = [];
    
    // Normalize the search text (case-insensitive, remove diacritics)
    const normalizedSearchText = text
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

  applyHighlight(text: string): boolean {
    const pageElement = document.querySelector(`.page[data-page-number="${this.pageNumber}"]`);
    if (pageElement) {
      const textLayerElement = pageElement.querySelector('.textLayer');

      console.log('PDFViewer', this.pdfViewer);

      if (textLayerElement) {
        this.clearPreviousHighlight();
        const spanElements = Array.from(textLayerElement.querySelectorAll('span'));
        const foundElements = this.findTextInElements(this.lookingForText, spanElements);

        if (this.occurrenceIndex < foundElements.length) {
          foundElements[this.occurrenceIndex].highlight();
          this.previousHighlighted.push(foundElements[this.occurrenceIndex]);
        } else {
          console.log('No more occurrences found');
        }

        return true;
      }
    }

    return false;
  }

  onPageRendered(event: any) {
    setTimeout(() => {
      console.log('Looking for text:', this.lookingForText);
      if (event.pageNumber === this.pageNumber) {
        this.applyHighlight(this.lookingForText);
      }
    }, 100);
  }

  openPageOfInterest(pageNumber: number) {
    this.pageNumber = pageNumber;
  }

  setPage(): number {
    return this.pdfViewer.page!;
  }
}
