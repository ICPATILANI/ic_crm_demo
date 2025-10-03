"""
Pytest test suite for Customer CRM Backend API

Tests all API endpoints including CRUD operations and hierarchical relationships.

Run tests:
    pytest test_app.py -v
    pytest test_app.py -v --cov=app  # With coverage

Author: Development Team
Date: October 3, 2025
"""

import pytest
import json
from app import app, db, Customer


@pytest.fixture
def client():
    """Create a test client for the Flask application
    
    Sets up an in-memory SQLite database for testing and provides
    a test client to make requests to the API.
    """
    # Configure test database (in-memory SQLite)
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            # Create all tables
            db.create_all()
            yield client
            # Cleanup after tests
            db.session.remove()
            db.drop_all()


@pytest.fixture
def sample_customers(client):
    """Create sample customer data for testing
    
    Creates a hierarchical structure:
    - Test Corp (corporate, root)
      - Test Division (entity, child)
        - Test User (individual, grandchild)
    """
    with app.app_context():
        # Create corporate customer
        corporate = Customer(
            name='Test Corporation',
            email='test@corp.com',
            phone='555-1000',
            address='100 Test Plaza',
            entity_level='corporate',
            parent_id=None
        )
        db.session.add(corporate)
        db.session.flush()
        
        # Create entity customer
        entity = Customer(
            name='Test Division',
            email='division@corp.com',
            phone='555-1001',
            address='200 Test Ave',
            entity_level='entity',
            parent_id=corporate.id
        )
        db.session.add(entity)
        db.session.flush()
        
        # Create individual customer
        individual = Customer(
            name='Test User',
            email='user@test.com',
            phone='555-0001',
            address='123 Test St',
            entity_level='individual',
            parent_id=entity.id
        )
        db.session.add(individual)
        db.session.commit()
        
        return {
            'corporate': corporate.id,
            'entity': entity.id,
            'individual': individual.id
        }


# ============================================================================
# Health Check Tests
# ============================================================================

def test_health_check(client):
    """Test the root endpoint returns a success message"""
    response = client.get('/')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'Customer CRM Backend API is running' in data['message']


# ============================================================================
# GET /customers Tests
# ============================================================================

def test_get_all_customers_empty(client):
    """Test getting customers when database is empty"""
    response = client.get('/customers')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 0


def test_get_all_customers_with_data(client, sample_customers):
    """Test getting all customers returns correct data"""
    response = client.get('/customers')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) == 3
    
    # Check that customer names are present
    names = [customer['name'] for customer in data]
    assert 'Test Corporation' in names
    assert 'Test Division' in names
    assert 'Test User' in names


# ============================================================================
# GET /customers/<id> Tests
# ============================================================================

def test_get_customer_by_id(client, sample_customers):
    """Test getting a specific customer by ID"""
    customer_id = sample_customers['corporate']
    response = client.get(f'/customers/{customer_id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['id'] == customer_id
    assert data['name'] == 'Test Corporation'
    assert data['email'] == 'test@corp.com'
    assert data['entity_level'] == 'corporate'
    assert 'children' in data


def test_get_customer_not_found(client):
    """Test getting a non-existent customer returns 404"""
    response = client.get('/customers/9999')
    assert response.status_code == 404


def test_get_customer_with_children(client, sample_customers):
    """Test that getting a customer includes its children"""
    corporate_id = sample_customers['corporate']
    response = client.get(f'/customers/{corporate_id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'children' in data
    assert len(data['children']) == 1
    assert data['children'][0]['name'] == 'Test Division'


# ============================================================================
# POST /customers Tests
# ============================================================================

def test_create_customer_root_level(client):
    """Test creating a root-level customer"""
    new_customer = {
        'name': 'New Corporation',
        'email': 'new@corp.com',
        'phone': '555-2000',
        'address': '300 New Plaza',
        'entity_level': 'corporate',
        'parent_id': None
    }
    response = client.post('/customers', 
                          data=json.dumps(new_customer),
                          content_type='application/json')
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['name'] == 'New Corporation'
    assert data['email'] == 'new@corp.com'
    assert data['entity_level'] == 'corporate'
    assert data['parent_id'] is None


def test_create_customer_with_parent(client, sample_customers):
    """Test creating a customer with a parent relationship"""
    parent_id = sample_customers['corporate']
    new_customer = {
        'name': 'New Division',
        'email': 'newdiv@corp.com',
        'phone': '555-2001',
        'address': '400 New Ave',
        'entity_level': 'entity',
        'parent_id': parent_id
    }
    response = client.post('/customers',
                          data=json.dumps(new_customer),
                          content_type='application/json')
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['parent_id'] == parent_id
    assert data['parent_name'] == 'Test Corporation'


def test_create_customer_missing_required_fields(client):
    """Test creating a customer without required fields fails"""
    incomplete_customer = {
        'phone': '555-2000'
    }
    response = client.post('/customers',
                          data=json.dumps(incomplete_customer),
                          content_type='application/json')
    # Should fail due to database constraints
    assert response.status_code in [400, 500]


# ============================================================================
# PUT /customers/<id> Tests
# ============================================================================

def test_update_customer(client, sample_customers):
    """Test updating an existing customer"""
    customer_id = sample_customers['individual']
    updated_data = {
        'name': 'Updated User',
        'email': 'updated@test.com',
        'phone': '555-9999'
    }
    response = client.put(f'/customers/{customer_id}',
                         data=json.dumps(updated_data),
                         content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['name'] == 'Updated User'
    assert data['email'] == 'updated@test.com'
    assert data['phone'] == '555-9999'


def test_update_customer_not_found(client):
    """Test updating a non-existent customer returns 404"""
    updated_data = {'name': 'Updated Name'}
    response = client.put('/customers/9999',
                         data=json.dumps(updated_data),
                         content_type='application/json')
    assert response.status_code == 404


def test_update_customer_parent_relationship(client, sample_customers):
    """Test changing a customer's parent relationship"""
    customer_id = sample_customers['individual']
    corporate_id = sample_customers['corporate']
    
    # Change parent from entity to corporate
    updated_data = {
        'parent_id': corporate_id
    }
    response = client.put(f'/customers/{customer_id}',
                         data=json.dumps(updated_data),
                         content_type='application/json')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['parent_id'] == corporate_id
    assert data['parent_name'] == 'Test Corporation'


# ============================================================================
# DELETE /customers/<id> Tests
# ============================================================================

def test_delete_customer(client, sample_customers):
    """Test deleting a customer"""
    customer_id = sample_customers['individual']
    response = client.delete(f'/customers/{customer_id}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'deleted' in data['message'].lower()
    
    # Verify customer is actually deleted
    get_response = client.get(f'/customers/{customer_id}')
    assert get_response.status_code == 404


def test_delete_customer_not_found(client):
    """Test deleting a non-existent customer returns 404"""
    response = client.delete('/customers/9999')
    assert response.status_code == 404


# ============================================================================
# GET /customers/<id>/hierarchy Tests
# ============================================================================

def test_get_customer_hierarchy(client, sample_customers):
    """Test getting full hierarchy for a customer"""
    individual_id = sample_customers['individual']
    response = client.get(f'/customers/{individual_id}/hierarchy')
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Check structure
    assert 'customer' in data
    assert 'ancestors' in data
    assert 'descendants' in data
    
    # Check customer data
    assert data['customer']['id'] == individual_id
    assert data['customer']['name'] == 'Test User'
    
    # Check ancestors (should have 2: corporate and entity)
    assert len(data['ancestors']) == 2
    assert data['ancestors'][0]['name'] == 'Test Corporation'
    assert data['ancestors'][1]['name'] == 'Test Division'
    
    # Check descendants (individual has no children)
    assert len(data['descendants']) == 0


def test_get_hierarchy_root_customer(client, sample_customers):
    """Test getting hierarchy for a root-level customer"""
    corporate_id = sample_customers['corporate']
    response = client.get(f'/customers/{corporate_id}/hierarchy')
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Root customer should have no ancestors
    assert len(data['ancestors']) == 0
    
    # Should have descendants
    assert len(data['descendants']) > 0


def test_get_hierarchy_with_descendants(client, sample_customers):
    """Test that hierarchy includes all descendants recursively"""
    corporate_id = sample_customers['corporate']
    response = client.get(f'/customers/{corporate_id}/hierarchy')
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # Check descendants structure
    descendants = data['descendants']
    assert len(descendants) == 1  # Test Division
    assert descendants[0]['name'] == 'Test Division'
    
    # Check nested children
    assert 'children' in descendants[0]
    assert len(descendants[0]['children']) == 1  # Test User
    assert descendants[0]['children'][0]['name'] == 'Test User'


def test_get_hierarchy_not_found(client):
    """Test getting hierarchy for non-existent customer returns 404"""
    response = client.get('/customers/9999/hierarchy')
    assert response.status_code == 404


# ============================================================================
# CORS Tests
# ============================================================================

def test_cors_headers(client):
    """Test that CORS headers are present in responses"""
    response = client.get('/customers')
    assert 'Access-Control-Allow-Origin' in response.headers
    assert response.headers['Access-Control-Allow-Origin'] == '*'


# ============================================================================
# Data Integrity Tests
# ============================================================================

def test_email_uniqueness(client, sample_customers):
    """Test that duplicate email addresses are rejected"""
    duplicate_customer = {
        'name': 'Duplicate User',
        'email': 'test@corp.com',  # Email already exists
        'phone': '555-3000',
        'entity_level': 'individual'
    }
    response = client.post('/customers',
                          data=json.dumps(duplicate_customer),
                          content_type='application/json')
    # Should fail due to unique constraint
    assert response.status_code in [400, 500]


def test_entity_level_values(client):
    """Test that all entity level values are accepted"""
    entity_levels = ['individual', 'entity', 'corporate']
    
    for level in entity_levels:
        customer = {
            'name': f'Test {level}',
            'email': f'test_{level}@test.com',
            'entity_level': level
        }
        response = client.post('/customers',
                              data=json.dumps(customer),
                              content_type='application/json')
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['entity_level'] == level


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
