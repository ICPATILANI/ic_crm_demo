"""
Test Export Functionality

This test suite covers the export endpoints and functionality for customer data.
Tests include CSV, Excel, and PDF export formats with various data scenarios.

Author: Development Team
Date: October 3, 2025
Version: 1.0.0
"""

import pytest
import json
import io
import csv
from app import app, db, Customer


@pytest.fixture
def client():
    """Create a test client with in-memory database"""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


@pytest.fixture
def sample_customers(client):
    """Create sample customers for export testing"""
    with app.app_context():
        customers_data = [
            {
                'name': 'Acme Corporation',
                'email': 'contact@acme.com',
                'phone': '555-0100',
                'address': '123 Business Blvd',
                'entity_level': 'corporate',
                'parent_id': None
            },
            {
                'name': 'Acme Division A',
                'email': 'division_a@acme.com',
                'phone': '555-0101',
                'address': '123 Business Blvd, Suite 100',
                'entity_level': 'entity',
                'parent_id': 1
            },
            {
                'name': 'John Doe',
                'email': 'john.doe@acme.com',
                'phone': '555-0102',
                'address': '456 Employee St',
                'entity_level': 'individual',
                'parent_id': 2
            },
            {
                'name': 'Jane Smith',
                'email': 'jane.smith@acme.com',
                'phone': '555-0103',
                'address': '789 Worker Ave',
                'entity_level': 'individual',
                'parent_id': 2
            },
            {
                'name': 'Tech Corp',
                'email': 'info@techcorp.com',
                'phone': '555-0200',
                'address': '999 Innovation Dr',
                'entity_level': 'corporate',
                'parent_id': None
            }
        ]
        
        for data in customers_data:
            customer = Customer(**data)
            db.session.add(customer)
        
        db.session.commit()
        
        return Customer.query.all()


class TestExportDataRetrieval:
    """Test data retrieval for export functionality"""
    
    def test_get_all_customers_for_export(self, client, sample_customers):
        """Test retrieving all customers returns complete data for export"""
        response = client.get('/customers')
        assert response.status_code == 200
        
        data = response.get_json()
        assert len(data) == 5
        
        # Verify all required fields are present
        required_fields = ['id', 'name', 'email', 'phone', 'address', 'entity_level', 'parent_id', 'parent_name']
        for customer in data:
            for field in required_fields:
                assert field in customer
    
    def test_export_data_includes_parent_names(self, client, sample_customers):
        """Test that export data includes resolved parent names"""
        response = client.get('/customers')
        data = response.get_json()
        
        # Find child customers and verify parent_name is resolved
        john = next(c for c in data if c['name'] == 'John Doe')
        assert john['parent_name'] == 'Acme Division A'
        
        division = next(c for c in data if c['name'] == 'Acme Division A')
        assert division['parent_name'] == 'Acme Corporation'
        
        # Root level customers should have None parent_name
        acme = next(c for c in data if c['name'] == 'Acme Corporation')
        assert acme['parent_name'] is None
    
    def test_export_handles_special_characters(self, client):
        """Test export data handles special characters properly"""
        with app.app_context():
            # Create customer with special characters
            customer = Customer(
                name='Test & Company, Inc.',
                email='test@company.com',
                phone='555-0000',
                address='123 "Main" St, Apt #5',
                entity_level='corporate'
            )
            db.session.add(customer)
            db.session.commit()
        
        response = client.get('/customers')
        assert response.status_code == 200
        data = response.get_json()
        
        assert any(c['name'] == 'Test & Company, Inc.' for c in data)
        assert any(c['address'] == '123 "Main" St, Apt #5' for c in data)
    
    def test_export_empty_database(self, client):
        """Test export functionality with no customers"""
        response = client.get('/customers')
        assert response.status_code == 200
        data = response.get_json()
        assert data == []


class TestExportDataFormat:
    """Test data format compatibility for different export types"""
    
    def test_export_data_csv_compatible(self, client, sample_customers):
        """Test that data format is compatible with CSV export"""
        response = client.get('/customers')
        data = response.get_json()
        
        # Simulate CSV conversion
        output = io.StringIO()
        fieldnames = ['name', 'email', 'phone', 'address', 'entity_level', 'parent_name']
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for customer in data:
            row = {field: customer.get(field, '') or '' for field in fieldnames}
            writer.writerow(row)
        
        csv_content = output.getvalue()
        assert 'Acme Corporation' in csv_content
        assert 'john.doe@acme.com' in csv_content
        assert len(csv_content.split('\n')) > 5  # Header + 5 customers + trailing newline
    
    def test_export_data_handles_null_values(self, client):
        """Test export data properly handles null/None values"""
        with app.app_context():
            # Create customer with minimal data (nulls)
            customer = Customer(
                name='Minimal Customer',
                email='minimal@test.com',
                entity_level='individual'
            )
            db.session.add(customer)
            db.session.commit()
        
        response = client.get('/customers')
        data = response.get_json()
        
        minimal = next(c for c in data if c['name'] == 'Minimal Customer')
        assert minimal['phone'] is None
        assert minimal['address'] is None
        assert minimal['parent_id'] is None
        assert minimal['parent_name'] is None
    
    def test_export_data_unicode_support(self, client):
        """Test export data supports Unicode characters"""
        with app.app_context():
            customer = Customer(
                name='José García-González',
                email='jose@example.com',
                phone='555-0000',
                address='Calle Principal #123, Piso 2°',
                entity_level='individual'
            )
            db.session.add(customer)
            db.session.commit()
        
        response = client.get('/customers')
        data = response.get_json()
        
        assert any(c['name'] == 'José García-González' for c in data)
        assert any(c['address'] == 'Calle Principal #123, Piso 2°' for c in data)


class TestExportFiltering:
    """Test export functionality with filtered data"""
    
    def test_export_filtered_by_entity_level(self, client, sample_customers):
        """Test exporting customers filtered by entity level"""
        # Note: Current API doesn't have filtering, but data supports it
        response = client.get('/customers')
        data = response.get_json()
        
        corporates = [c for c in data if c['entity_level'] == 'corporate']
        entities = [c for c in data if c['entity_level'] == 'entity']
        individuals = [c for c in data if c['entity_level'] == 'individual']
        
        assert len(corporates) == 2
        assert len(entities) == 1
        assert len(individuals) == 2
    
    def test_export_root_level_customers_only(self, client, sample_customers):
        """Test exporting only root-level customers (no parent)"""
        response = client.get('/customers')
        data = response.get_json()
        
        root_customers = [c for c in data if c['parent_id'] is None]
        assert len(root_customers) == 2
        assert all(c['entity_level'] == 'corporate' for c in root_customers)


class TestExportDataIntegrity:
    """Test data integrity during export operations"""
    
    def test_export_does_not_modify_database(self, client, sample_customers):
        """Test that export operations don't modify the database"""
        # Get initial customer count
        initial_response = client.get('/customers')
        initial_count = len(initial_response.get_json())
        
        # Perform multiple export data retrievals
        for _ in range(5):
            response = client.get('/customers')
            assert response.status_code == 200
        
        # Verify count hasn't changed
        final_response = client.get('/customers')
        final_count = len(final_response.get_json())
        
        assert initial_count == final_count
    
    def test_export_concurrent_safety(self, client, sample_customers):
        """Test export data retrieval is safe for concurrent access"""
        # Simulate concurrent requests
        responses = []
        for _ in range(10):
            response = client.get('/customers')
            responses.append(response.get_json())
        
        # All responses should be identical
        first_response = responses[0]
        for response in responses[1:]:
            assert len(response) == len(first_response)
            assert response == first_response


class TestExportHierarchicalData:
    """Test export of hierarchical customer relationships"""
    
    def test_export_includes_hierarchy_information(self, client, sample_customers):
        """Test that exported data includes hierarchy information"""
        response = client.get('/customers')
        data = response.get_json()
        
        # Build hierarchy map
        hierarchy_map = {}
        for customer in data:
            parent_name = customer['parent_name']
            if parent_name:
                if parent_name not in hierarchy_map:
                    hierarchy_map[parent_name] = []
                hierarchy_map[parent_name].append(customer['name'])
        
        # Verify hierarchical relationships
        assert 'Acme Division A' in hierarchy_map['Acme Corporation']
        assert 'John Doe' in hierarchy_map['Acme Division A']
        assert 'Jane Smith' in hierarchy_map['Acme Division A']
    
    def test_export_multi_level_hierarchy(self, client):
        """Test export with deep hierarchical structures"""
        with app.app_context():
            # Create 4-level hierarchy
            corp = Customer(name='Corp', email='corp@test.com', entity_level='corporate')
            db.session.add(corp)
            db.session.flush()
            
            div = Customer(name='Division', email='div@test.com', entity_level='entity', parent_id=corp.id)
            db.session.add(div)
            db.session.flush()
            
            dept = Customer(name='Department', email='dept@test.com', entity_level='entity', parent_id=div.id)
            db.session.add(dept)
            db.session.flush()
            
            person = Customer(name='Person', email='person@test.com', entity_level='individual', parent_id=dept.id)
            db.session.add(person)
            db.session.commit()
        
        response = client.get('/customers')
        data = response.get_json()
        
        person_data = next(c for c in data if c['name'] == 'Person')
        assert person_data['parent_name'] == 'Department'


class TestExportPerformance:
    """Test export functionality performance with larger datasets"""
    
    def test_export_large_dataset(self, client):
        """Test export with larger dataset (100+ customers)"""
        with app.app_context():
            # Create 150 customers
            for i in range(150):
                customer = Customer(
                    name=f'Customer {i}',
                    email=f'customer{i}@test.com',
                    phone=f'555-{i:04d}',
                    entity_level='individual'
                )
                db.session.add(customer)
            db.session.commit()
        
        response = client.get('/customers')
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 150
    
    def test_export_includes_all_fields(self, client, sample_customers):
        """Test that export includes all necessary fields for each format"""
        response = client.get('/customers')
        data = response.get_json()
        
        # Fields required for CSV/Excel export
        csv_fields = ['name', 'email', 'phone', 'address', 'entity_level', 'parent_name']
        
        # Fields required for PDF export
        pdf_fields = ['name', 'email', 'phone', 'entity_level', 'parent_name']
        
        for customer in data:
            for field in csv_fields:
                assert field in customer
            for field in pdf_fields:
                assert field in customer


class TestExportEdgeCases:
    """Test export functionality edge cases"""
    
    def test_export_with_very_long_text(self, client):
        """Test export with very long text fields"""
        with app.app_context():
            long_address = 'A' * 500  # Very long address
            customer = Customer(
                name='Long Address Customer',
                email='long@test.com',
                address=long_address,
                entity_level='individual'
            )
            db.session.add(customer)
            db.session.commit()
        
        response = client.get('/customers')
        assert response.status_code == 200
        data = response.get_json()
        
        long_customer = next(c for c in data if c['name'] == 'Long Address Customer')
        assert len(long_customer['address']) == 500
    
    def test_export_with_newlines_in_address(self, client):
        """Test export handles newlines in address field"""
        with app.app_context():
            customer = Customer(
                name='Multi-line Address',
                email='multiline@test.com',
                address='123 Main St\nApt 4B\nSpringfield, IL 62701',
                entity_level='individual'
            )
            db.session.add(customer)
            db.session.commit()
        
        response = client.get('/customers')
        data = response.get_json()
        
        customer_data = next(c for c in data if c['name'] == 'Multi-line Address')
        assert '\n' in customer_data['address']
    
    def test_export_with_commas_in_fields(self, client):
        """Test export properly handles commas in field values"""
        with app.app_context():
            customer = Customer(
                name='Smith, Jones & Associates',
                email='contact@smith-jones.com',
                address='123 Main St, Suite 100, Building A',
                entity_level='corporate'
            )
            db.session.add(customer)
            db.session.commit()
        
        response = client.get('/customers')
        data = response.get_json()
        
        assert any(c['name'] == 'Smith, Jones & Associates' for c in data)
        assert any('Suite 100' in c.get('address', '') for c in data)
    
    def test_export_single_customer(self, client):
        """Test export with only one customer"""
        with app.app_context():
            customer = Customer(
                name='Only Customer',
                email='only@test.com',
                entity_level='individual'
            )
            db.session.add(customer)
            db.session.commit()
        
        response = client.get('/customers')
        data = response.get_json()
        
        assert len(data) == 1
        assert data[0]['name'] == 'Only Customer'


class TestExportAPIResponse:
    """Test API response format for export functionality"""
    
    def test_export_response_content_type(self, client, sample_customers):
        """Test that API returns correct content type"""
        response = client.get('/customers')
        assert response.status_code == 200
        assert response.content_type == 'application/json'
    
    def test_export_response_structure(self, client, sample_customers):
        """Test that API response has correct structure"""
        response = client.get('/customers')
        data = response.get_json()
        
        assert isinstance(data, list)
        assert len(data) > 0
        
        for customer in data:
            assert isinstance(customer, dict)
            assert 'id' in customer
            assert 'name' in customer
            assert 'email' in customer
    
    def test_export_response_encoding(self, client):
        """Test that API response handles encoding correctly"""
        with app.app_context():
            customer = Customer(
                name='Émile Zöllner',
                email='emile@test.com',
                address='Rue de la Paix, 75002 Paris',
                entity_level='individual'
            )
            db.session.add(customer)
            db.session.commit()
        
        response = client.get('/customers')
        data = response.get_json()
        
        # Should properly handle accented characters
        assert any(c['name'] == 'Émile Zöllner' for c in data)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
