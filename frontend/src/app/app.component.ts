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
  showMobileMenu = false;

  /**
   * Open the About modal
   */
  openAbout() {
    this.showAboutModal = true;
    this.showMobileMenu = false;
  }

  /**
   * Close the About modal
   */
  closeAbout() {
    this.showAboutModal = false;
  }

  /**
   * Toggle the hamburger menu
   */
  toggleMenu() {
    this.showMobileMenu = !this.showMobileMenu;
  }

  /**
   * Close the hamburger menu
   */
  closeMenu() {
    this.showMobileMenu = false;
  }
}
