/**
 * Customer Grid Component
 * 
 * Main component for customer management featuring:
 * - AG Grid for data display with sorting, pagination, and filtering
 * - CRUD operations (Create, Read, Update, Delete)
 * - Hierarchical relationship visualization with modal
 * - Entity level classification (Individual, Entity, Corporate)
 * - Parent-child relationship management
 * 
 * This component uses Angular SSR (Server-Side Rendering) compatibility
 * with platform checks to ensure AG Grid only renders in browser context.
 * 
 * @author Development Team
 * @date October 3, 2025
 * @version 1.0.0
 */

import { Component, OnInit, PLATFORM_ID, Inject, AfterViewInit } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { CustomerService, Customer } from './customer.service';
import { ColDef, ModuleRegistry, AllCommunityModule, GridApi } from 'ag-grid-community';
import { AgGridModule } from 'ag-grid-angular';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Register AG Grid Community modules globally
// CRITICAL: Must be done before component initialization to avoid "Grid API not available" errors
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-customer-grid',
  template: `
    <div *ngIf="isBrowser" class="customer-container">
      <div class="header-section">
        <h2 class="main-title">
          <span class="title-icon">👥</span>
          Customer Management System
        </h2>
        <div class="stats-bar">
          <div class="stat-item">
            <span class="stat-number">{{customers.length}}</span>
            <span class="stat-label">Total Customers</span>
          </div>
        </div>
      </div>

      <div class="add-customer-card">
        <h3 class="card-title">
          <span class="title-icon">➕</span>
          Add New Customer
        </h3>
        <form #customerForm="ngForm" (ngSubmit)="onCreate()" class="customer-form">
          <div class="form-group">
            <label>Name</label>
            <input name="name" [(ngModel)]="newCustomer.name" placeholder="Enter customer name" required class="form-input" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input name="email" [(ngModel)]="newCustomer.email" placeholder="customer@email.com" required class="form-input" type="email" />
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input name="phone" [(ngModel)]="newCustomer.phone" placeholder="(555) 000-0000" class="form-input" />
          </div>
          <div class="form-group">
            <label>Entity Level</label>
            <select name="entity_level" [(ngModel)]="newCustomer.entity_level" class="form-input">
              <option value="individual">Individual</option>
              <option value="entity">Entity</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>
          <div class="form-group">
            <label>Parent Customer</label>
            <select name="parent_id" [(ngModel)]="newCustomer.parent_id" class="form-input">
              <option [ngValue]="undefined">None (Root Level)</option>
              <option *ngFor="let c of customers" [ngValue]="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Address</label>
            <input name="address" [(ngModel)]="newCustomer.address" placeholder="123 Main Street" class="form-input" />
          </div>
          <button type="submit" class="btn btn-success">
            <span class="btn-icon">✓</span> Add Customer
          </button>
        </form>
      </div>

      <div class="grid-container" *ngIf="isGridReady">
        <div class="grid-header">
          <h3 class="section-title">Customer Directory</h3>
          <div class="grid-actions">
            <button class="btn btn-success btn-sm" (click)="exportToCSV()" title="Export to CSV">
              <span class="btn-icon">📊</span> Export CSV
            </button>
            <button class="btn btn-primary btn-sm" (click)="exportToExcel()" title="Export to Excel">
              <span class="btn-icon">📗</span> Export Excel
            </button>
            <button class="btn btn-danger btn-sm" (click)="exportToPDF()" title="Export to PDF">
              <span class="btn-icon">📄</span> Export PDF
            </button>
            <button class="btn btn-info btn-sm" *ngIf="selectedCustomer" (click)="viewRelationship(selectedCustomer)">
              <span class="btn-icon">🔗</span> View Relationships
            </button>
          </div>
        </div>
        <ag-grid-angular
          class="ag-theme-alpine custom-grid"
          [rowData]="customers"
          [columnDefs]="columnDefs"
          [pagination]="true"
          [paginationPageSize]="10"
          [defaultColDef]="defaultColDef"
          [rowSelection]="'single'"
          [animateRows]="true"
          (rowClicked)="onRowClicked($event)"
          (gridReady)="onGridReady($event)"
        ></ag-grid-angular>
      </div>

      <div *ngIf="!isGridReady" class="loading-container">
        <div class="spinner"></div>
        <p>Initializing grid...</p>
      </div>

      <div *ngIf="selectedCustomer" class="edit-customer-card">
        <h3 class="card-title">
          <span class="title-icon">✏️</span>
          Edit Customer
        </h3>
        <form #editForm="ngForm" (ngSubmit)="onUpdate()" class="customer-form">
          <div class="form-group">
            <label>Name</label>
            <input name="name" [(ngModel)]="selectedCustomer.name" placeholder="Name" required class="form-input" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input name="email" [(ngModel)]="selectedCustomer.email" placeholder="Email" required class="form-input" type="email" />
          </div>
          <div class="form-group">
            <label>Phone</label>
            <input name="phone" [(ngModel)]="selectedCustomer.phone" placeholder="Phone" class="form-input" />
          </div>
          <div class="form-group">
            <label>Entity Level</label>
            <select name="entity_level" [(ngModel)]="selectedCustomer.entity_level" class="form-input">
              <option value="individual">Individual</option>
              <option value="entity">Entity</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>
          <div class="form-group">
            <label>Parent Customer</label>
            <select name="parent_id" [(ngModel)]="selectedCustomer.parent_id" class="form-input">
              <option [ngValue]="undefined">None (Root Level)</option>
              <option *ngFor="let c of customers" [ngValue]="c.id" [disabled]="c.id === selectedCustomer.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Address</label>
            <input name="address" [(ngModel)]="selectedCustomer.address" placeholder="Address" class="form-input" />
          </div>
          <div class="button-group">
            <button type="submit" class="btn btn-primary">
              <span class="btn-icon">💾</span> Update
            </button>
            <button type="button" (click)="viewRelationship(selectedCustomer)" class="btn btn-info">
              <span class="btn-icon">🔗</span> View Relationships
            </button>
            <button type="button" (click)="onDelete()" class="btn btn-danger">
              <span class="btn-icon">🗑️</span> Delete
            </button>
            <button type="button" (click)="selectedCustomer = null" class="btn btn-secondary">
              <span class="btn-icon">✕</span> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
    <div *ngIf="!isBrowser" class="loading-container">
      <p>Loading customer data...</p>
    </div>

    <!-- Relationship Hierarchy Modal -->
    <div *ngIf="showRelationshipMenu" class="modal-overlay" (click)="closeRelationshipMenu()">
      <div class="modal-content hierarchy-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>🌳 Customer Relationship Hierarchy</h2>
          <button class="close-btn" (click)="closeRelationshipMenu()">✕</button>
        </div>
        <div class="modal-body" *ngIf="customerHierarchy">
          <!-- Ancestors (Parents, Grandparents, etc.) -->
          <div class="hierarchy-section" *ngIf="customerHierarchy.ancestors && customerHierarchy.ancestors.length > 0">
            <h3 class="hierarchy-title">📊 Ancestors (Parent Hierarchy)</h3>
            <div class="hierarchy-tree">
              <div *ngFor="let ancestor of customerHierarchy.ancestors; let i = index" class="hierarchy-item ancestor">
                <div class="level-indicator">{{ ['Grandparent', 'Parent'][customerHierarchy.ancestors.length - 1 - i] || 'Ancestor' }}</div>
                <div class="customer-card">
                  <span class="customer-icon">👤</span>
                  <div>
                    <div class="customer-name">{{ ancestor.name }}</div>
                    <div class="customer-level">{{ ancestor.entity_level }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Current Customer -->
          <div class="hierarchy-section current-section">
            <h3 class="hierarchy-title">👉 Current Customer</h3>
            <div class="customer-card current-customer">
              <span class="customer-icon">⭐</span>
              <div>
                <div class="customer-name">{{ customerHierarchy.customer.name }}</div>
                <div class="customer-level">{{ customerHierarchy.customer.entity_level }}</div>
                <div class="customer-email">{{ customerHierarchy.customer.email }}</div>
              </div>
            </div>
          </div>

          <!-- Descendants (Children, Grandchildren, etc.) -->
          <div class="hierarchy-section" *ngIf="customerHierarchy.descendants && customerHierarchy.descendants.length > 0">
            <h3 class="hierarchy-title">👶 Descendants (Children Hierarchy)</h3>
            <div class="hierarchy-tree">
              <ng-container *ngTemplateOutlet="descendantTree; context: {$implicit: customerHierarchy.descendants, level: 0}"></ng-container>
            </div>
          </div>

          <div *ngIf="(!customerHierarchy.ancestors || customerHierarchy.ancestors.length === 0) && (!customerHierarchy.descendants || customerHierarchy.descendants.length === 0)" class="no-relationships">
            <p>This customer has no parent or child relationships.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Template for recursive descendant tree -->
    <ng-template #descendantTree let-descendants let-level="level">
      <div *ngFor="let descendant of descendants" class="hierarchy-item descendant" [style.margin-left.px]="level * 30">
        <div class="level-indicator">{{ level === 0 ? 'Child' : level === 1 ? 'Grandchild' : 'Descendant' }}</div>
        <div class="customer-card">
          <span class="customer-icon">👤</span>
          <div>
            <div class="customer-name">{{ descendant.name }}</div>
            <div class="customer-level">{{ descendant.entity_level }}</div>
          </div>
        </div>
        <ng-container *ngIf="descendant.children && descendant.children.length > 0">
          <ng-container *ngTemplateOutlet="descendantTree; context: {$implicit: descendant.children, level: level + 1}"></ng-container>
        </ng-container>
      </div>
    </ng-template>
  `,
  styles: [`
    .customer-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
    }

    .header-section {
      margin-bottom: 2rem;
    }

    .main-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 1rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .title-icon {
      font-size: 2rem;
    }

    .stats-bar {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .stat-item {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: bold;
      color: white;
    }

    .stat-label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 0.25rem;
    }

    .add-customer-card, .edit-customer-card {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.18);
      backdrop-filter: blur(10px);
    }

    .edit-customer-card {
      background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .card-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 0.5rem;
    }

    .section-title {
      font-size: 1.3rem;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 1rem;
      padding: 0.5rem 1rem;
      background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, transparent 100%);
      border-left: 4px solid #667eea;
    }

    .customer-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      align-items: end;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      font-weight: 500;
      color: #555;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .form-input {
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: white;
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      transform: translateY(-2px);
    }

    .form-input:hover {
      border-color: #999;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn-icon {
      font-size: 1.2rem;
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }

    .btn:active {
      transform: translateY(0);
    }

    .btn-success {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: white;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-danger {
      background: linear-gradient(135deg, #f85032 0%, #e73827 100%);
      color: white;
    }

    .btn-secondary {
      background: linear-gradient(135deg, #757575 0%, #616161 100%);
      color: white;
    }

    .button-group {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      grid-column: 1 / -1;
    }

    .grid-container {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .custom-grid {
      width: 100%;
      height: 500px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .loading-container {
      padding: 4rem 2rem;
      text-align: center;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Custom AG Grid Styling */
    ::ng-deep .custom-grid .ag-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: 600;
    }

    ::ng-deep .custom-grid .ag-header-cell-label {
      color: white;
      font-weight: 600;
    }

    ::ng-deep .custom-grid .ag-row-hover {
      background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, transparent 100%) !important;
    }

    ::ng-deep .custom-grid .ag-row-selected {
      background: linear-gradient(90deg, rgba(102, 126, 234, 0.2) 0%, transparent 100%) !important;
    }

    ::ng-deep .custom-grid .ag-cell {
      border-right: 1px solid #e0e0e0 !important;
    }

    ::ng-deep .custom-grid .ag-paging-panel {
      border-top: 2px solid #667eea;
      padding: 1rem;
      background: #f8f9fa;
    }

    .grid-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .grid-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }

    .btn-info {
      background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
      color: white;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: white;
      border-radius: 20px;
      max-width: 900px;
      width: 90%;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 20px 20px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.8rem;
    }

    .close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      font-size: 1.5rem;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: rotate(90deg);
    }

    .modal-body {
      padding: 2rem;
    }

    .hierarchy-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .current-section {
      background: linear-gradient(135deg, #fff3cd 0%, #fff8e1 100%);
      border: 2px solid #ffc107;
    }

    .hierarchy-title {
      font-size: 1.3rem;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #dee2e6;
    }

    .hierarchy-tree {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .hierarchy-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      animation: slideIn 0.3s ease;
    }

    .hierarchy-item.ancestor {
      margin-bottom: 0.5rem;
    }

    .hierarchy-item.descendant {
      margin-top: 0.5rem;
    }

    .level-indicator {
      font-size: 0.85rem;
      font-weight: 600;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .customer-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .customer-card:hover {
      transform: translateX(5px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .current-customer {
      background: linear-gradient(135deg, #fff 0%, #fffef7 100%);
      border: 2px solid #ffc107;
      box-shadow: 0 4px 20px rgba(255, 193, 7, 0.3);
    }

    .customer-icon {
      font-size: 2rem;
    }

    .customer-name {
      font-size: 1.1rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .customer-level {
      font-size: 0.9rem;
      color: #6c757d;
      text-transform: capitalize;
    }

    .customer-email {
      font-size: 0.85rem;
      color: #7c8088;
      margin-top: 0.25rem;
    }

    .no-relationships {
      text-align: center;
      padding: 3rem;
      color: #6c757d;
      font-size: 1.1rem;
    }

    @media (max-width: 768px) {
      .customer-container {
        padding: 1rem;
      }

      .main-title {
        font-size: 1.8rem;
      }

      .customer-form {
        grid-template-columns: 1fr;
      }

      .button-group {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }

      .modal-content {
        width: 95%;
        max-height: 90vh;
      }

      .modal-header h2 {
        font-size: 1.3rem;
      }

      .hierarchy-item.descendant {
        margin-left: 15px !important;
      }
    }
  `],
  standalone: true,
  imports: [AgGridModule, CommonModule, FormsModule],
})
/**
 * Component Class - CustomerGridComponent
 * Implements OnInit and AfterViewInit lifecycle hooks for proper initialization
 */
export class CustomerGridComponent implements OnInit, AfterViewInit {
  // ============================================================================
  // Component Properties
  // ============================================================================
  
  /** Array of all customer records displayed in the grid */
  customers: Customer[] = [];
  
  /** AG Grid column definitions - defines headers and field mappings */
  columnDefs: ColDef[] = [];
  
  /** Default column settings applied to all columns (sortable, filterable, etc.) */
  defaultColDef: any = {};
  
  /** Model for the "Add Customer" form - reset after creation */
  newCustomer: Customer = { 
    name: '', 
    email: '', 
    phone: '', 
    address: '', 
    entity_level: 'individual',  // Default to individual level
    parent_id: undefined  // No parent by default (root level)
  };
  
  /** Currently selected customer for editing (null when no selection) */
  selectedCustomer: Customer | null = null;
  
  /** Platform check - true if running in browser context (not SSR) */
  isBrowser: boolean = false;
  
  /** Flag to control grid rendering - prevents "Grid API not available" errors */
  isGridReady: boolean = false;
  
  /** Controls relationship modal visibility */
  showRelationshipMenu: boolean = false;
  
  /** Customer whose relationships are being viewed in modal */
  selectedCustomerForRelationship: Customer | null = null;
  
  /** Hierarchy data from backend (ancestors + descendants) */
  customerHierarchy: any = null;

  /**
   * Constructor with dependency injection
   * 
   * @param customerService - Service for API calls
   * @param platformId - Angular platform identifier for SSR detection
   */
  constructor(
    private customerService: CustomerService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    // Check if running in browser - AG Grid requires browser environment
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // ============================================================================
  // Lifecycle Hooks
  // ============================================================================
  
  /**
   * OnInit lifecycle hook - runs once after component initialization
   * 
   * Initializes AG Grid configuration only in browser context.
   * SSR (server-side rendering) doesn't need grid configuration.
   */
  ngOnInit() {
    if (this.isBrowser) {
      // Define grid columns - maps to Customer object properties
      this.columnDefs = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'name', headerName: 'Name', width: 180 },
        { field: 'email', headerName: 'Email', width: 200 },
        { field: 'phone', headerName: 'Phone', width: 130 },
        { field: 'entity_level', headerName: 'Level', width: 120 },
        { field: 'parent_name', headerName: 'Parent', width: 150 },  // Resolved by backend
        { field: 'address', headerName: 'Address', width: 200 }
      ];
      
      // Default settings applied to all columns
      this.defaultColDef = {
        sortable: true,    // Enable column sorting
        filter: true,      // Enable column filtering
        resizable: true    // Allow column width adjustment
      };
    }
  }

  /**
   * AfterViewInit lifecycle hook - runs after view is fully initialized
   * 
   * Adds a small delay before rendering AG Grid to ensure DOM is ready.
   * This prevents timing issues with grid initialization.
   */
  ngAfterViewInit() {
    if (this.isBrowser) {
      // Delay grid initialization to prevent "Grid API not available" errors
      setTimeout(() => {
        this.isGridReady = true;  // Enable grid rendering
        this.loadCustomers();      // Load data from backend
      }, 100);
    }
  }

  /**
   * Grid API reference for export and other operations
   */
  private gridApi!: GridApi;

  /**
   * Grid ready event handler - called when AG Grid finishes initialization
   * 
   * @param params - Grid API parameters containing the grid and column APIs
   */
  onGridReady(params: any) {
    console.log('Grid is ready!');
    this.gridApi = params.api;
  }

  // ============================================================================
  // Export Methods
  // ============================================================================

  /**
   * Export customer data to CSV format
   * 
   * Exports all columns and rows visible in the grid to a CSV file.
   * File is automatically downloaded with timestamp in filename.
   */
  exportToCSV() {
    if (!this.gridApi) {
      console.error('Grid API not available');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    this.gridApi.exportDataAsCsv({
      fileName: `customers_${timestamp}.csv`,
      columnKeys: ['name', 'email', 'phone', 'address', 'entity_level', 'parent_name'],
      processCellCallback: (params) => {
        // Handle null/undefined values
        return params.value ?? '';
      }
    });
    console.log('Customer data exported to CSV');
  }

  /**
   * Export customer data to Excel format
   * 
   * Exports all columns and rows to an Excel-compatible file (.xlsx).
   * File is automatically downloaded with timestamp in filename.
   * 
   * Note: Requires ag-grid-enterprise for full Excel export.
   * Community version exports as Excel-compatible CSV.
   */
  exportToExcel() {
    if (!this.gridApi) {
      console.error('Grid API not available');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    
    // Note: AG Grid Community edition exports Excel-compatible CSV
    // For true .xlsx format, ag-grid-enterprise is required
    this.gridApi.exportDataAsCsv({
      fileName: `customers_${timestamp}.xlsx`,
      columnKeys: ['name', 'email', 'phone', 'address', 'entity_level', 'parent_name'],
      processCellCallback: (params) => {
        // Handle null/undefined values
        return params.value ?? '';
      }
    });
    console.log('Customer data exported to Excel format');
  }

  /**
   * Export customer data to PDF format
   * 
   * Creates a professionally formatted PDF document with:
   * - Company header with gradient styling
   * - Document title and metadata
   * - Formatted table with all customer data
   * - Auto-generated filename with timestamp
   */
  exportToPDF() {
    if (!this.gridApi) {
      console.error('Grid API not available');
      return;
    }

    // Create new PDF document (A4 size, portrait orientation)
    const doc = new jsPDF();
    
    // Document title and metadata
    const timestamp = new Date().toISOString().split('T')[0];
    const title = 'Customer CRM - Customer Report';
    
    // Add gradient header background (simulated with colored rectangle)
    doc.setFillColor(119, 2, 255); // Purple gradient start
    doc.rect(0, 0, 210, 40, 'F');
    
    // Add company logo/icon (using text as emoji)
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text('👥', 10, 20);
    
    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 30, 20);
    
    // Add subtitle with date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, 30, 28);
    
    // Add total count
    doc.text(`Total Customers: ${this.customers.length}`, 30, 35);
    
    // Prepare table data
    const headers = [['Name', 'Email', 'Phone', 'Entity Level', 'Parent']];
    const data = this.customers.map(customer => [
      customer.name || '',
      customer.email || '',
      customer.phone || '',
      customer.entity_level || '',
      customer.parent_name || 'None'
    ]);
    
    // Add table with autoTable plugin
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 45,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [102, 126, 234], // Purple header
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 250]
      },
      columnStyles: {
        0: { cellWidth: 40 },  // Name
        1: { cellWidth: 50 },  // Email
        2: { cellWidth: 30 },  // Phone
        3: { cellWidth: 30 },  // Entity Level
        4: { cellWidth: 35 }   // Parent
      },
      margin: { top: 45, left: 10, right: 10 },
      didDrawPage: (data) => {
        // Add footer with page numbers
        const pageCount = doc.getNumberOfPages();
        const pageNumber = data.pageNumber;
        
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
          `Page ${pageNumber} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
        
        // Add footer text
        doc.text(
          'Customer CRM © 2025 - Confidential',
          10,
          doc.internal.pageSize.getHeight() - 10
        );
      }
    });
    
    // Save the PDF
    doc.save(`customers_report_${timestamp}.pdf`);
    console.log('Customer data exported to PDF');
  }

  // ============================================================================
  // Data Loading Methods
  // ============================================================================
  
  /**
   * Load all customers from backend API
   * 
   * Makes HTTP GET request to retrieve customer list and updates grid.
   * Called after component initialization and after any CRUD operations.
   */
  loadCustomers() {
    this.customerService.getCustomers().subscribe({
      next: (data) => {
        console.log('Customers loaded:', data);
        this.customers = data;  // Update grid data source
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        // TODO: Add user-friendly error notification
      }
    });
  }

  // ============================================================================
  // CRUD Operations
  // ============================================================================
  
  /**
   * Create a new customer (triggered by "Add Customer" form submission)
   * 
   * Validates required fields, sends POST request to backend,
   * resets form, and reloads grid data.
   */
  onCreate() {
    // Validate required fields
    if (!this.newCustomer.name || !this.newCustomer.email) return;
    
    this.customerService.createCustomer(this.newCustomer).subscribe({
      next: (response) => {
        console.log('Customer created:', response);
        // Reset form to empty state
        this.newCustomer = { 
          name: '', 
          email: '', 
          phone: '', 
          address: '', 
          entity_level: 'individual', 
          parent_id: undefined 
        };
        // Reload grid to show new customer
        this.loadCustomers();
      },
      error: (error) => {
        console.error('Error creating customer:', error);
        // TODO: Show user-friendly error message (e.g., "Email already exists")
      }
    });
  }

  /**
   * Handle grid row click event
   * 
   * Populates the edit form with selected customer data.
   * Uses spread operator to create a copy (prevents direct grid data modification).
   * 
   * @param event - AG Grid row click event containing customer data
   */
  onRowClicked(event: any) {
    // Create a copy of the row data to avoid mutating grid data directly
    this.selectedCustomer = { ...event.data };
  }

  /**
   * Update existing customer (triggered by "Update" button in edit form)
   * 
   * Sends PUT request with modified customer data, clears selection,
   * and reloads grid to show updates.
   */
  onUpdate() {
    // Validate customer is selected and has an ID
    if (!this.selectedCustomer || !this.selectedCustomer.id) return;
    
    this.customerService.updateCustomer(this.selectedCustomer.id, this.selectedCustomer).subscribe(() => {
      this.selectedCustomer = null;  // Close edit form
      this.loadCustomers();           // Refresh grid data
    });
  }

  /**
   * Delete customer (triggered by "Delete" button in edit form)
   * 
   * Shows confirmation dialog, sends DELETE request, clears selection,
   * and reloads grid.
   * 
   * NOTE: Child customers will have their parent_id set to NULL.
   */
  onDelete() {
    // Validate customer is selected and has an ID
    if (!this.selectedCustomer || !this.selectedCustomer.id) return;
    
    // Confirm deletion with user
    if (confirm('Are you sure you want to delete this customer?')) {
      this.customerService.deleteCustomer(this.selectedCustomer.id).subscribe(() => {
        this.selectedCustomer = null;  // Close edit form
        this.loadCustomers();           // Refresh grid data
      });
    }
  }

  // ============================================================================
  // Relationship Visualization Methods
  // ============================================================================
  
  /**
   * Open relationship hierarchy modal for a customer
   * 
   * Fetches complete family tree (ancestors and descendants) from backend
   * and displays in a modal overlay with tree visualization.
   * 
   * @param customer - Customer to view relationships for
   */
  viewRelationship(customer: Customer) {
    // Validate customer has an ID
    if (!customer.id) return;
    
    this.selectedCustomerForRelationship = customer;
    
    // Fetch hierarchy data from backend
    this.customerService.getCustomerHierarchy(customer.id).subscribe({
      next: (data) => {
        // data contains: { customer, ancestors: [], descendants: [] }
        this.customerHierarchy = data;
        this.showRelationshipMenu = true;  // Show modal
      },
      error: (error) => {
        console.error('Error loading hierarchy:', error);
        // TODO: Show user-friendly error notification
      }
    });
  }

  /**
   * Close relationship hierarchy modal
   * 
   * Resets all relationship-related state variables.
   */
  closeRelationshipMenu() {
    this.showRelationshipMenu = false;
    this.customerHierarchy = null;
    this.selectedCustomerForRelationship = null;
  }

  /**
   * Get human-readable relationship level for a customer
   * 
   * Helper method to display relationship status in UI.
   * 
   * @param customer - Customer to get level for
   * @returns String describing relationship level
   */
  getRelationshipLevel(customer: Customer): string {
    if (!customer.parent_id) return 'Root Level';
    return 'Child of ' + (customer.parent_name || 'Unknown');
  }
}
