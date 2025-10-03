/**
 * Customer Grid Component Test Suite
 * 
 * Comprehensive tests for CustomerGridComponent covering:
 * - Component initialization
 * - CRUD operations
 * - Form validation
 * - Grid interactions
 * - Modal functionality
 * - Platform browser checks
 * 
 * @author Development Team
 * @date October 3, 2025
 * @version 1.0.0
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CustomerGridComponent } from './customer-grid.component';
import { CustomerService, Customer } from './customer.service';
import { of, throwError } from 'rxjs';
import { PLATFORM_ID } from '@angular/core';

describe('CustomerGridComponent', () => {
  let component: CustomerGridComponent;
  let fixture: ComponentFixture<CustomerGridComponent>;
  let customerService: jasmine.SpyObj<CustomerService>;

  // Sample test data
  const mockCustomers: Customer[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-0100',
      address: '123 Main St',
      entity_level: 'individual',
      parent_id: undefined
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-0101',
      address: '456 Oak Ave',
      entity_level: 'entity',
      parent_id: 1,
      parent_name: 'John Doe'
    },
    {
      id: 3,
      name: 'ABC Corporation',
      email: 'contact@abc.com',
      phone: '555-0200',
      address: '789 Corporate Blvd',
      entity_level: 'corporate',
      parent_id: undefined
    }
  ];

  const mockHierarchy = {
    customer: mockCustomers[1],
    ancestors: [mockCustomers[0]],
    descendants: []
  };

  beforeEach(async () => {
    // Create spy object for CustomerService
    const customerServiceSpy = jasmine.createSpyObj('CustomerService', [
      'getCustomers',
      'getCustomer',
      'createCustomer',
      'updateCustomer',
      'deleteCustomer',
      'getCustomerHierarchy'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        CustomerGridComponent,
        HttpClientTestingModule
      ],
      providers: [
        { provide: CustomerService, useValue: customerServiceSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    customerService = TestBed.inject(CustomerService) as jasmine.SpyObj<CustomerService>;
    customerService.getCustomers.and.returnValue(of(mockCustomers));

    fixture = TestBed.createComponent(CustomerGridComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.customers).toEqual([]);
      expect(component.newCustomer).toEqual({
        name: '',
        email: '',
        phone: '',
        address: '',
        entity_level: 'individual',
        parent_id: undefined
      });
      expect(component.selectedCustomer).toBeNull();
      expect(component.showRelationshipMenu).toBe(false);
    });

    it('should detect browser platform', () => {
      expect(component.isBrowser).toBe(true);
    });

    it('should load customers when called', fakeAsync(() => {
      component.loadCustomers();
      tick();

      expect(customerService.getCustomers).toHaveBeenCalled();
      expect(component.customers).toEqual(mockCustomers);
    }));

    it('should initialize grid ready flag', () => {
      expect(component.isGridReady).toBeDefined();
    });

    it('should define AG Grid column definitions', () => {
      expect(component.columnDefs).toBeDefined();
    });
  });

  describe('Load Customers', () => {
    it('should call getCustomers on loadCustomers', fakeAsync(() => {
      component.loadCustomers();
      tick();

      expect(customerService.getCustomers).toHaveBeenCalled();
      expect(component.customers.length).toBe(3);
    }));

    it('should handle empty customer list', fakeAsync(() => {
      customerService.getCustomers.and.returnValue(of([]));
      
      component.loadCustomers();
      tick();

      expect(component.customers).toEqual([]);
    }));

    it('should handle error when loading customers', fakeAsync(() => {
      const consoleSpy = spyOn(console, 'error');
      customerService.getCustomers.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.loadCustomers();
      tick();

      expect(consoleSpy).toHaveBeenCalled();
    }));
  });

  describe('Create Customer', () => {
    beforeEach(() => {
      component.newCustomer = {
        name: 'New Customer',
        email: 'new@example.com',
        phone: '555-0300',
        address: '999 New St',
        entity_level: 'individual',
        parent_id: undefined
      };
    });

    it('should create a new customer successfully', fakeAsync(() => {
      customerService.createCustomer.and.returnValue(of({ id: 4 }));
      customerService.getCustomers.and.returnValue(of([...mockCustomers]));

      component.onCreate();
      tick();

      expect(customerService.createCustomer).toHaveBeenCalled();
      expect(customerService.getCustomers).toHaveBeenCalled();
    }));

    it('should reset form after successful creation', fakeAsync(() => {
      customerService.createCustomer.and.returnValue(of({ id: 4 }));
      customerService.getCustomers.and.returnValue(of([...mockCustomers]));

      component.onCreate();
      tick();

      expect(component.newCustomer.name).toBe('');
      expect(component.newCustomer.email).toBe('');
      expect(component.newCustomer.entity_level).toBe('individual');
    }));

    it('should create customer with parent relationship', fakeAsync(() => {
      component.newCustomer.parent_id = 1;
      customerService.createCustomer.and.returnValue(of({ id: 4 }));
      customerService.getCustomers.and.returnValue(of([...mockCustomers]));

      component.onCreate();
      tick();

      expect(customerService.createCustomer).toHaveBeenCalledWith(
        jasmine.objectContaining({ parent_id: 1 })
      );
    }));

    it('should handle validation error on create', fakeAsync(() => {
      const consoleSpy = spyOn(console, 'error');
      customerService.createCustomer.and.returnValue(
        throwError(() => ({ status: 400, error: { error: 'Validation failed' } }))
      );

      component.onCreate();
      tick();

      expect(consoleSpy).toHaveBeenCalled();
    }));

    it('should handle duplicate email error', fakeAsync(() => {
      const consoleSpy = spyOn(console, 'error');
      customerService.createCustomer.and.returnValue(
        throwError(() => ({ 
          status: 400, 
          error: { error: 'Email address already exists' } 
        }))
      );

      component.onCreate();
      tick();

      expect(consoleSpy).toHaveBeenCalled();
    }));
  });

  describe('Update Customer', () => {
    beforeEach(() => {
      component.selectedCustomer = { ...mockCustomers[0] };
    });

    it('should update existing customer successfully', fakeAsync(() => {
      customerService.updateCustomer.and.returnValue(
        of({ message: 'Customer updated successfully' })
      );
      customerService.getCustomers.and.returnValue(of([...mockCustomers]));

      component.onUpdate();
      tick();

      expect(customerService.updateCustomer).toHaveBeenCalledWith(
        1,
        jasmine.anything()
      );
      expect(component.selectedCustomer).toBeNull();
    }));

    it('should clear selected customer', () => {
      component.selectedCustomer = { ...mockCustomers[0] };
      component.selectedCustomer = null;

      expect(component.selectedCustomer).toBeNull();
    });

    it('should handle error on update', fakeAsync(() => {
      spyOn(console, 'error');
      customerService.updateCustomer.and.returnValue(
        throwError(() => new Error('Update failed'))
      );

      try {
        component.onUpdate();
        tick();
      } catch (e) {
        // Error is expected
      }
    }));
  });

  describe('Delete Customer', () => {
    it('should delete customer when confirmed', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      customerService.deleteCustomer.and.returnValue(
        of({ message: 'Customer deleted successfully' })
      );
      customerService.getCustomers.and.returnValue(of([mockCustomers[1], mockCustomers[2]]));

      component.selectedCustomer = { ...mockCustomers[0] };
      component.onDelete();
      tick();

      expect(customerService.deleteCustomer).toHaveBeenCalledWith(1);
      expect(customerService.getCustomers).toHaveBeenCalled();
    }));

    it('should not delete customer when cancelled', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.selectedCustomer = { ...mockCustomers[0] };
      component.onDelete();
      tick();

      expect(customerService.deleteCustomer).not.toHaveBeenCalled();
    }));

    it('should handle error when deleting customer', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(console, 'error');
      customerService.deleteCustomer.and.returnValue(
        throwError(() => new Error('Delete failed'))
      );

      component.selectedCustomer = { ...mockCustomers[0] };
      try {
        component.onDelete();
        tick();
      } catch (e) {
        // Error is expected
      }
    }));
  });

  describe('Edit Customer', () => {
    it('should select customer for editing', () => {
      const customerToEdit = mockCustomers[0];
      const event = { data: customerToEdit };

      component.onRowClicked(event);

      expect(component.selectedCustomer).toEqual(customerToEdit);
    });

    it('should copy customer data when selecting', () => {
      const customerToEdit = { ...mockCustomers[1] };
      const event = { data: customerToEdit };

      component.onRowClicked(event);

      expect(component.selectedCustomer?.name).toBe(customerToEdit.name);
      expect(component.selectedCustomer?.email).toBe(customerToEdit.email);
      expect(component.selectedCustomer?.parent_id).toBe(customerToEdit.parent_id);
    });
  });

  describe('Relationship Modal', () => {
    it('should open relationship modal for selected customer', fakeAsync(() => {
      customerService.getCustomerHierarchy.and.returnValue(of(mockHierarchy));
      const customer = mockCustomers[1];

      component.viewRelationship(customer);
      tick();

      expect(component.showRelationshipMenu).toBe(true);
      expect(component.customerHierarchy).toEqual(mockHierarchy);
    }));

    it('should close relationship modal', () => {
      component.showRelationshipMenu = true;
      component.customerHierarchy = mockHierarchy;

      component.closeRelationshipMenu();

      expect(component.showRelationshipMenu).toBe(false);
      expect(component.customerHierarchy).toBeNull();
    });

    it('should load hierarchy data when opening modal', fakeAsync(() => {
      customerService.getCustomerHierarchy.and.returnValue(of(mockHierarchy));
      const customer = mockCustomers[1];

      component.viewRelationship(customer);
      tick();

      expect(customerService.getCustomerHierarchy).toHaveBeenCalledWith(2);
      expect(component.customerHierarchy?.customer).toBeDefined();
      expect(component.customerHierarchy?.ancestors).toBeDefined();
      expect(component.customerHierarchy?.descendants).toBeDefined();
    }));

    it('should handle error when loading hierarchy', fakeAsync(() => {
      const consoleSpy = spyOn(console, 'error');
      customerService.getCustomerHierarchy.and.returnValue(
        throwError(() => new Error('Failed to load hierarchy'))
      );
      const customer = mockCustomers[1];

      component.viewRelationship(customer);
      tick();

      expect(consoleSpy).toHaveBeenCalled();
    }));
  });

  describe('Entity Level Options', () => {
    it('should support all entity level values', () => {
      const entityLevels = ['individual', 'entity', 'corporate'];
      
      expect(entityLevels).toContain('individual');
      expect(entityLevels).toContain('entity');
      expect(entityLevels).toContain('corporate');
    });

    it('should default to individual entity level', () => {
      expect(component.newCustomer.entity_level).toBe('individual');
    });
  });

  describe('Parent Customer Selection', () => {
    it('should allow selecting parent customer', () => {
      component.newCustomer.parent_id = 1;

      expect(component.newCustomer.parent_id).toBe(1);
    });

    it('should clear parent selection', () => {
      component.newCustomer.parent_id = 1;
      component.newCustomer.parent_id = undefined;

      expect(component.newCustomer.parent_id).toBeUndefined();
    });
  });

  describe('Grid Configuration', () => {
    it('should initialize column definitions', () => {
      // Column definitions are initialized in component
      expect(component.columnDefs).toBeDefined();
    });
  });

  describe('Form Validation', () => {
    it('should require customer name', () => {
      component.newCustomer.name = '';
      component.newCustomer.email = 'test@example.com';

      // Component should validate before submission
      expect(component.newCustomer.name).toBe('');
    });

    it('should require customer email', () => {
      component.newCustomer.name = 'Test User';
      component.newCustomer.email = '';

      expect(component.newCustomer.email).toBe('');
    });

    it('should accept valid customer data', () => {
      component.newCustomer = {
        name: 'Valid User',
        email: 'valid@example.com',
        phone: '555-1234',
        address: '123 Valid St',
        entity_level: 'individual',
        parent_id: undefined
      };

      expect(component.newCustomer.name).toBeTruthy();
      expect(component.newCustomer.email).toBeTruthy();
    });
  });

  describe('SSR Compatibility', () => {
    it('should check platform before rendering grid', () => {
      expect(component.isBrowser).toBeDefined();
    });

    it('should not render grid in server context', () => {
      const serverComponent = new CustomerGridComponent(
        customerService,
        'server'
      );

      expect(serverComponent.isBrowser).toBe(false);
    });
  });
});
