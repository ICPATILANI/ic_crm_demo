/**
 * Customer Service Test Suite
 * 
 * Comprehensive tests for CustomerService covering:
 * - HTTP request generation
 * - API endpoint calls
 * - Request/response handling
 * - Error scenarios
 * 
 * @author Development Team
 * @date October 3, 2025
 * @version 1.0.0
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CustomerService, Customer } from './customer.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:5001/customers';

  // Sample test data
  const mockCustomer: Customer = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-0100',
    address: '123 Main St',
    entity_level: 'individual',
    parent_id: undefined
  };

  const mockCustomers: Customer[] = [
    mockCustomer,
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-0101',
      address: '456 Oak Ave',
      entity_level: 'individual',
      parent_id: 1,
      parent_name: 'John Doe'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CustomerService]
    });
    service = TestBed.inject(CustomerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verify no outstanding HTTP requests after each test
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCustomers', () => {
    it('should retrieve all customers via GET request', () => {
      service.getCustomers().subscribe(customers => {
        expect(customers).toEqual(mockCustomers);
        expect(customers.length).toBe(2);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockCustomers);
    });

    it('should handle empty customer list', () => {
      service.getCustomers().subscribe(customers => {
        expect(customers).toEqual([]);
        expect(customers.length).toBe(0);
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush([]);
    });

    it('should handle HTTP error on getCustomers', () => {
      const errorMessage = 'Server error';
      
      service.getCustomers().subscribe({
        next: () => fail('should have failed with 500 error'),
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.statusText).toBe('Server Error');
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getCustomer', () => {
    it('should retrieve a single customer by ID', () => {
      const customerId = 1;

      service.getCustomer(customerId).subscribe(customer => {
        expect(customer).toEqual(mockCustomer);
        expect(customer.id).toBe(customerId);
        expect(customer.name).toBe('John Doe');
      });

      const req = httpMock.expectOne(`${apiUrl}/${customerId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCustomer);
    });

    it('should retrieve customer with children', () => {
      const customerWithChildren = {
        ...mockCustomer,
        children: [mockCustomers[1]]
      };

      service.getCustomer(1).subscribe(customer => {
        expect(customer.children).toBeDefined();
        expect(customer.children?.length).toBe(1);
        expect(customer.children?.[0].parent_id).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/1`);
      req.flush(customerWithChildren);
    });

    it('should handle 404 error when customer not found', () => {
      service.getCustomer(999).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/999`);
      req.flush('Customer not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createCustomer', () => {
    it('should create a new customer via POST request', () => {
      const newCustomer: Customer = {
        name: 'Alice Williams',
        email: 'alice@example.com',
        entity_level: 'individual'
      };
      const response = { id: 3 };

      service.createCustomer(newCustomer).subscribe(res => {
        expect(res.id).toBe(3);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newCustomer);
      req.flush(response);
    });

    it('should create customer with parent relationship', () => {
      const newCustomer: Customer = {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        entity_level: 'individual',
        parent_id: 1
      };
      const response = { id: 4 };

      service.createCustomer(newCustomer).subscribe(res => {
        expect(res.id).toBe(4);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.body.parent_id).toBe(1);
      req.flush(response);
    });

    it('should handle validation error on create', () => {
      const invalidCustomer: Customer = {
        name: '',
        email: 'invalid-email'
      };

      service.createCustomer(invalidCustomer).subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush({ error: 'Validation failed' }, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle duplicate email error', () => {
      const duplicateCustomer: Customer = {
        name: 'John Doe',
        email: 'john@example.com',  // Already exists
        entity_level: 'individual'
      };

      service.createCustomer(duplicateCustomer).subscribe({
        next: () => fail('should have failed with 400 error'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush({ error: 'Email address already exists' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateCustomer', () => {
    it('should update an existing customer via PUT request', () => {
      const customerId = 1;
      const updatedData: Customer = {
        name: 'John Updated',
        email: 'john.updated@example.com',
        phone: '555-9999'
      };
      const response = { message: 'Customer updated successfully' };

      service.updateCustomer(customerId, updatedData).subscribe(res => {
        expect(res.message).toContain('updated successfully');
      });

      const req = httpMock.expectOne(`${apiUrl}/${customerId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedData);
      req.flush(response);
    });

    it('should update customer parent relationship', () => {
      const customerId = 2;
      const updatedData: Customer = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        parent_id: 3  // Change parent
      };
      const response = { message: 'Customer updated successfully' };

      service.updateCustomer(customerId, updatedData).subscribe(res => {
        expect(res.message).toBeDefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/${customerId}`);
      expect(req.request.body.parent_id).toBe(3);
      req.flush(response);
    });

    it('should handle 404 error when updating non-existent customer', () => {
      const customerId = 999;
      const updatedData: Customer = {
        name: 'Non Existent',
        email: 'none@example.com'
      };

      service.updateCustomer(customerId, updatedData).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${customerId}`);
      req.flush({ error: 'Customer not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('deleteCustomer', () => {
    it('should delete a customer via DELETE request', () => {
      const customerId = 1;
      const response = { message: 'Customer deleted successfully' };

      service.deleteCustomer(customerId).subscribe(res => {
        expect(res.message).toContain('deleted successfully');
      });

      const req = httpMock.expectOne(`${apiUrl}/${customerId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(response);
    });

    it('should handle 404 error when deleting non-existent customer', () => {
      const customerId = 999;

      service.deleteCustomer(customerId).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${customerId}`);
      req.flush({ error: 'Customer not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getCustomerHierarchy', () => {
    it('should retrieve customer hierarchy with ancestors and descendants', () => {
      const customerId = 2;
      const mockHierarchy = {
        customer: mockCustomers[1],
        ancestors: [mockCustomer],
        descendants: []
      };

      service.getCustomerHierarchy(customerId).subscribe(hierarchy => {
        expect(hierarchy.customer).toBeDefined();
        expect(hierarchy.ancestors).toBeDefined();
        expect(hierarchy.descendants).toBeDefined();
        expect(hierarchy.ancestors.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/${customerId}/hierarchy`);
      expect(req.request.method).toBe('GET');
      req.flush(mockHierarchy);
    });

    it('should retrieve root customer hierarchy with no ancestors', () => {
      const customerId = 1;
      const mockHierarchy = {
        customer: mockCustomer,
        ancestors: [],
        descendants: [mockCustomers[1]]
      };

      service.getCustomerHierarchy(customerId).subscribe(hierarchy => {
        expect(hierarchy.ancestors.length).toBe(0);
        expect(hierarchy.descendants.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/${customerId}/hierarchy`);
      req.flush(mockHierarchy);
    });

    it('should retrieve multi-level hierarchy', () => {
      const customerId = 3;
      const mockHierarchy = {
        customer: { id: 3, name: 'Grandchild', email: 'gc@example.com' },
        ancestors: [
          { id: 1, name: 'Grandparent', entity_level: 'corporate' },
          { id: 2, name: 'Parent', entity_level: 'entity' }
        ],
        descendants: []
      };

      service.getCustomerHierarchy(customerId).subscribe(hierarchy => {
        expect(hierarchy.ancestors.length).toBe(2);
        expect(hierarchy.ancestors[0].name).toBe('Grandparent');
      });

      const req = httpMock.expectOne(`${apiUrl}/${customerId}/hierarchy`);
      req.flush(mockHierarchy);
    });

    it('should handle 404 error when hierarchy customer not found', () => {
      const customerId = 999;

      service.getCustomerHierarchy(customerId).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${customerId}/hierarchy`);
      req.flush({ error: 'Customer not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('API URL configuration', () => {
    it('should use correct base API URL', () => {
      service.getCustomers().subscribe();
      const req = httpMock.expectOne(apiUrl);
      expect(req.request.url).toBe('http://localhost:5001/customers');
    });

    it('should construct correct endpoint URLs with IDs', () => {
      service.getCustomer(123).subscribe();
      const req = httpMock.expectOne(`${apiUrl}/123`);
      expect(req.request.url).toBe('http://localhost:5001/customers/123');
    });

    it('should construct correct hierarchy endpoint URL', () => {
      service.getCustomerHierarchy(456).subscribe();
      const req = httpMock.expectOne(`${apiUrl}/456/hierarchy`);
      expect(req.request.url).toBe('http://localhost:5001/customers/456/hierarchy');
    });
  });
});
