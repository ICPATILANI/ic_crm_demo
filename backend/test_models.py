"""
Pytest test suite for Customer CRM Database Models

Tests the Customer model, relationships, and database operations.

Run tests:
    pytest test_models.py -v

Author: Development Team
Date: October 3, 2025
"""

import pytest
from app import app, db, Customer


@pytest.fixture
def app_context():
    """Create application context with test database"""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.app_context():
        db.create_all()
        yield
        db.session.remove()
        db.drop_all()


# ============================================================================
# Customer Model Tests
# ============================================================================

def test_customer_creation(app_context):
    """Test creating a basic customer"""
    customer = Customer(
        name='John Doe',
        email='john@example.com',
        phone='555-0001',
        address='123 Main St',
        entity_level='individual'
    )
    db.session.add(customer)
    db.session.commit()
    
    assert customer.id is not None
    assert customer.name == 'John Doe'
    assert customer.email == 'john@example.com'


def test_customer_repr(app_context):
    """Test customer string representation"""
    customer = Customer(name='Test User', email='test@example.com')
    assert repr(customer) == '<Customer Test User>'


def test_customer_to_dict(app_context):
    """Test customer serialization to dictionary"""
    customer = Customer(
        name='Jane Smith',
        email='jane@example.com',
        phone='555-0002',
        address='456 Oak Ave',
        entity_level='individual',
        parent_id=None
    )
    db.session.add(customer)
    db.session.commit()
    
    customer_dict = customer.to_dict()
    
    assert customer_dict['name'] == 'Jane Smith'
    assert customer_dict['email'] == 'jane@example.com'
    assert customer_dict['phone'] == '555-0002'
    assert customer_dict['address'] == '456 Oak Ave'
    assert customer_dict['entity_level'] == 'individual'
    assert customer_dict['parent_id'] is None
    assert customer_dict['parent_name'] is None


# ============================================================================
# Hierarchical Relationship Tests
# ============================================================================

def test_parent_child_relationship(app_context):
    """Test setting up parent-child relationships"""
    parent = Customer(
        name='Parent Corp',
        email='parent@corp.com',
        entity_level='corporate'
    )
    db.session.add(parent)
    db.session.flush()
    
    child = Customer(
        name='Child Division',
        email='child@corp.com',
        entity_level='entity',
        parent_id=parent.id
    )
    db.session.add(child)
    db.session.commit()
    
    # Test parent-child relationship
    assert child.parent == parent
    assert child.parent_id == parent.id
    assert child in parent.children


def test_multiple_children(app_context):
    """Test that a customer can have multiple children"""
    parent = Customer(
        name='Parent Corp',
        email='parent@corp.com',
        entity_level='corporate'
    )
    db.session.add(parent)
    db.session.flush()
    
    child1 = Customer(
        name='Child 1',
        email='child1@corp.com',
        entity_level='entity',
        parent_id=parent.id
    )
    child2 = Customer(
        name='Child 2',
        email='child2@corp.com',
        entity_level='entity',
        parent_id=parent.id
    )
    db.session.add_all([child1, child2])
    db.session.commit()
    
    assert len(parent.children) == 2
    assert child1 in parent.children
    assert child2 in parent.children


def test_three_level_hierarchy(app_context):
    """Test creating a three-level hierarchy"""
    # Grandparent (corporate)
    grandparent = Customer(
        name='Grandparent Corp',
        email='gp@corp.com',
        entity_level='corporate'
    )
    db.session.add(grandparent)
    db.session.flush()
    
    # Parent (entity)
    parent = Customer(
        name='Parent Division',
        email='parent@corp.com',
        entity_level='entity',
        parent_id=grandparent.id
    )
    db.session.add(parent)
    db.session.flush()
    
    # Child (individual)
    child = Customer(
        name='Child User',
        email='child@corp.com',
        entity_level='individual',
        parent_id=parent.id
    )
    db.session.add(child)
    db.session.commit()
    
    # Test relationships
    assert child.parent == parent
    assert parent.parent == grandparent
    assert child in parent.children
    assert parent in grandparent.children


def test_to_dict_with_parent(app_context):
    """Test serialization includes parent name"""
    parent = Customer(
        name='Parent Corp',
        email='parent@corp.com',
        entity_level='corporate'
    )
    db.session.add(parent)
    db.session.flush()
    
    child = Customer(
        name='Child User',
        email='child@corp.com',
        entity_level='individual',
        parent_id=parent.id
    )
    db.session.add(child)
    db.session.commit()
    
    child_dict = child.to_dict()
    
    assert child_dict['parent_id'] == parent.id
    assert child_dict['parent_name'] == 'Parent Corp'


# ============================================================================
# Entity Level Tests
# ============================================================================

def test_entity_level_default(app_context):
    """Test that entity_level defaults to 'individual'"""
    customer = Customer(
        name='Default User',
        email='default@example.com'
    )
    db.session.add(customer)
    db.session.commit()
    
    assert customer.entity_level == 'individual'


def test_entity_level_values(app_context):
    """Test all entity level values"""
    levels = {
        'individual': 'Individual User',
        'entity': 'Entity Division',
        'corporate': 'Corporate HQ'
    }
    
    for level, name in levels.items():
        customer = Customer(
            name=name,
            email=f'{level}@test.com',
            entity_level=level
        )
        db.session.add(customer)
    
    db.session.commit()
    
    # Verify all customers were created with correct levels
    for level in levels.keys():
        customer = Customer.query.filter_by(entity_level=level).first()
        assert customer is not None
        assert customer.entity_level == level


# ============================================================================
# Data Validation Tests
# ============================================================================

def test_unique_email_constraint(app_context):
    """Test that email must be unique"""
    customer1 = Customer(
        name='User 1',
        email='duplicate@example.com'
    )
    db.session.add(customer1)
    db.session.commit()
    
    # Try to create another customer with same email
    customer2 = Customer(
        name='User 2',
        email='duplicate@example.com'
    )
    db.session.add(customer2)
    
    with pytest.raises(Exception):  # Should raise IntegrityError
        db.session.commit()


def test_required_fields(app_context):
    """Test that required fields must be provided"""
    # Customer without name should fail
    customer = Customer(email='noname@example.com')
    db.session.add(customer)
    
    with pytest.raises(Exception):
        db.session.commit()


# ============================================================================
# Query Tests
# ============================================================================

def test_query_all_customers(app_context):
    """Test querying all customers"""
    customers = [
        Customer(name=f'User {i}', email=f'user{i}@example.com')
        for i in range(5)
    ]
    db.session.add_all(customers)
    db.session.commit()
    
    all_customers = Customer.query.all()
    assert len(all_customers) == 5


def test_query_by_entity_level(app_context):
    """Test filtering customers by entity level"""
    customers = [
        Customer(name='Individual 1', email='ind1@test.com', entity_level='individual'),
        Customer(name='Individual 2', email='ind2@test.com', entity_level='individual'),
        Customer(name='Entity 1', email='ent1@test.com', entity_level='entity'),
        Customer(name='Corporate 1', email='corp1@test.com', entity_level='corporate'),
    ]
    db.session.add_all(customers)
    db.session.commit()
    
    individuals = Customer.query.filter_by(entity_level='individual').all()
    assert len(individuals) == 2
    
    entities = Customer.query.filter_by(entity_level='entity').all()
    assert len(entities) == 1


def test_query_root_customers(app_context):
    """Test querying root-level customers (no parent)"""
    root1 = Customer(name='Root 1', email='root1@test.com', parent_id=None)
    root2 = Customer(name='Root 2', email='root2@test.com', parent_id=None)
    db.session.add_all([root1, root2])
    db.session.flush()
    
    child = Customer(name='Child 1', email='child1@test.com', parent_id=root1.id)
    db.session.add(child)
    db.session.commit()
    
    root_customers = Customer.query.filter_by(parent_id=None).all()
    assert len(root_customers) == 2


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
