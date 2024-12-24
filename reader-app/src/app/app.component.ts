import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HeaderComponent } from './layout/header/header.component';
import { SearchPanelComponent } from './layout/search-panel/search-panel.component';
import { DocumentViewerComponent } from './layout/document-viewer/document-viewer.component';
import { CommentsPanelComponent } from './layout/comments-panel/comments-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SearchPanelComponent, DocumentViewerComponent, CommentsPanelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'reader-app';
}
