import { ChangeDetectorRef, Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { NgxExtendedPdfViewerComponent, NgxExtendedPdfViewerModule, PageRenderedEvent } from 'ngx-extended-pdf-viewer';



interface HighlightableText {
  highlight(): void
}

class SingleSpanHighlightableText implements HighlightableText {
  constructor(private span: HTMLElement, private text: string) {}

  highlight(): void {
    const textBefore = this.span.textContent?.substring(0, this.span.textContent?.indexOf(this.text));
    const textAfter = this.span.textContent?.substring(this.span.textContent?.indexOf(this.text) + this.text.length);
    const highlightedText = `${textBefore}<span class="highlight selected appended">${this.text}</span>${textAfter}`;
    this.span.innerHTML = highlightedText;
  }
}

type AnnotatedSpan = {
  span: HTMLElement;
  text: string;
}

class MultipleSpanHighlightableText implements HighlightableText {
  constructor(private spans: AnnotatedSpan[]) {}

  highlight(): void {
    for (let i = 0; i < this.spans.length; i++) {
      var span = this.spans[i].span;
      let textInSpan = this.spans[i].text;

      const textBefore = span.textContent?.substring(0, span.textContent?.indexOf(textInSpan));
      const textAfter = span.textContent?.substring(span.textContent?.indexOf(textInSpan) + textInSpan.length);
      const highlightedText = `${textBefore}<span class="highlight selected appended">${textInSpan}</span>${textAfter}`;
      span.innerHTML = highlightedText;
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
export class DocumentViewerComponent implements OnInit {
  @ViewChild('pdfViewer') pdfViewer!: NgxExtendedPdfViewerComponent;
  pdfSrc = 'assets/Biografia MLS para MSpS.pdf';
  zoom = 'auto';

  pageNumber = 4;
  lookingForText = 'de promover la educación rural, con la falta de maestros y de instituciones educativas que caracterizó a esta época y debido al interés de superación que caracterizaba a los zacatecos, se acos';
  // lookingForText = 'Moisés';
  occurrenceIndex = 0;

  constructor(private ngZone: NgZone) {}

  ngOnInit() {}

  findTextInElements(text: string, elements: HTMLElement[]): HighlightableText[] {
    let found: HighlightableText[] = [];
    // text = text.toLowerCase();
    console.log('Looking for text:', text);
    
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

  onPageRendered(event: PageRenderedEvent) {
    setTimeout(() => {
      if (event.pageNumber === this.pageNumber) {
        let currentMatchIndex = 0;  

        const pageElement = document.querySelector(`.page[data-page-number="${this.pageNumber}"]`);
        if (pageElement) {
          console.log('Page element found');
          const textLayerElement = pageElement.querySelector('.textLayer');

          if (textLayerElement) {
            const spanElements = Array.from(textLayerElement.querySelectorAll('span'));
            // console.log('Span elements found:', spanElements);

            const foundElements = this.findTextInElements(this.lookingForText, spanElements);
            console.log('Found elements:', foundElements);

            if (this.occurrenceIndex < foundElements.length) {
              foundElements[this.occurrenceIndex].highlight();
            } else {
              console.log('No more occurrences found');
            }

            // const combinedFoundText = foundElements.map(element => element.textContent).join('');
            // console.log('Combined found text:', combinedFoundText);

            // spanElements.forEach((span) => {
            //   if (span.textContent?.includes(this.lookingForText)) {
            //     if (currentMatchIndex !== this.occurrenceIndex) {
            //       currentMatchIndex++;
            //       return;
            //     }

            //     console.log('Changing background color of span element');

            //     const textBefore = span.textContent?.substring(0, span.textContent?.indexOf(this.lookingForText));
            //     const textAfter = span.textContent?.substring(span.textContent?.indexOf(this.lookingForText) + this.lookingForText.length);
            //     console.log('Text before:', textBefore);
            //     console.log('Text after:', textAfter);

            //     const highlightedText = `${textBefore}<span class="highlight selected appended">${this.lookingForText}</span>${textAfter}`;
            //     span.innerHTML = highlightedText;
            //     currentMatchIndex++;
            //   }
            // });
            
          }
        }
      }
    }, 100);
  }

  openPageOfInterest(pageNumber: number) {
    this.pageNumber = pageNumber;
  }

  zoomIn() {
    //this.zoom *= 1.1;
  }

  zoomOut() {
    //this.zoom /= 1.1;
  }

  getCurrentPage(): number {
    return this.pdfViewer.page!;
  }

  setPage(pageNumber: number): void {
    this.pdfViewer.page = pageNumber;
  }

  rotateClockwise(): void {
    this.pdfViewer.rotation += 90;
  }

  async getTotalPages(): Promise<number> {
    return 0;
  }
}
