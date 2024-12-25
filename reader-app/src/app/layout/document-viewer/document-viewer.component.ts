import { ChangeDetectorRef, Component, Input, NgZone, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { NgxExtendedPdfViewerComponent, NgxExtendedPdfViewerModule, PageRenderedEvent } from 'ngx-extended-pdf-viewer';



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
  imports: [NgxExtendedPdfViewerModule],
  templateUrl: './document-viewer.component.html',
  styleUrl: './document-viewer.component.css'
})
export class DocumentViewerComponent implements OnInit, OnChanges {
  @ViewChild('pdfViewer') pdfViewer!: NgxExtendedPdfViewerComponent;
  zoom = 'auto';

  @Input() pdfSrc: string = '';
  @Input() pageNumber: number = 5;
  @Input() lookingForText: string = 'Zacatlán a Amozoc';
  @Input() occurrenceIndex: number = 0;

  previousHighlighted: HighlightableText[] = [];

  constructor(private ngZone: NgZone) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    console.log('Changed looking for text:', this.lookingForText);

    this.applyHighlight(this.lookingForText);

  }

  findTextInElements(text: string, elements: HTMLElement[]): HighlightableText[] {
    let found: HighlightableText[] = [];
    // text = text.toLowerCase();
    console.log('Looking for text: "' + text + '"');
    
    let currentLookingText = text;
    let partialFound: AnnotatedSpan[] = [];
    for (let i = 0; i < elements.length; i++) {
      var span = elements[i];
      let spanText = span.textContent || '';

      if (spanText.trim().length == 0) {
        continue;
      }

      if (spanText.includes(text)) {
        found.push(new SingleSpanHighlightableText(span, text));
        continue;
      }

      let spanContainsText = false;
      let textLimit = currentLookingText.length;
      if (partialFound.length == 0) {
        while (!spanContainsText && textLimit > 0) {
          if (spanText.endsWith(currentLookingText.substring(0, textLimit))) {
            spanContainsText = true;
          } else {
            textLimit--;
          }
        }
      } else {
        while (!spanContainsText && textLimit > 0) {
          if (spanText.startsWith(currentLookingText.substring(0, textLimit))) {
            spanContainsText = true;
          } else {
            textLimit--;
          }
        }
      }

      if (spanContainsText) {
        console.log('Span: "' + spanText + '"');
        console.log('Contains text: "' + currentLookingText.substring(0, textLimit) + '"');
        partialFound.push({
          span: span,
          text: currentLookingText.substring(0, textLimit).trim()
        });
        currentLookingText = currentLookingText.substring(textLimit).trimStart();
        // console.log('Current looking text: "' + currentLookingText + '"');
        if (currentLookingText.length === 0) {
          found.push(new MultipleSpanHighlightableText(partialFound));
          partialFound = [];
          break;
        }
      } else {
        currentLookingText = text;
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

  onPageRendered(event: PageRenderedEvent) {
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
