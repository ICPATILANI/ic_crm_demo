import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { CustomerGridComponent } from './customer-grid.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CustomerGridComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Customer CRM';
  showAboutModal = false;

  /**
   * Open the About modal
   */
  openAbout() {
    this.showAboutModal = true;
  }

  /**
   * Close the About modal
   */
  closeAbout() {
    this.showAboutModal = false;
  }
}
