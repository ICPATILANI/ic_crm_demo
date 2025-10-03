"""Customer CRM Backend Application

Flask-based REST API server for managing customer records with hierarchical relationships.
Supports CRUD operations, entity level classification, and recursive parent-child relationships.

Author: Development Team
Date: October 3, 2025
Version: 1.0.0
"""

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

# Initialize Flask application
app = Flask(__name__)

# Database Configuration
# Using SQLite for development - change to PostgreSQL for production:
# 'postgresql://user:password@host:port/database'
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///customers_v2.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Disable modification tracking to save resources

# Initialize SQLAlchemy ORM
db = SQLAlchemy(app)

# ============================================================================
# CORS Configuration (Cross-Origin Resource Sharing)
# ============================================================================
# Allow all origins for development - CHANGE FOR PRODUCTION!
# Production example: CORS(app, origins=['https://yourdomain.com'])
CORS(app, origins='*', allow_headers=['Content-Type', 'Authorization'], methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Add CORS headers to every response as a fallback
# This ensures OPTIONS preflight requests work correctly
@app.after_request
def after_request(response):
    """Middleware to add CORS headers to all responses"""
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    return response

# ============================================================================
# Database Models
# ============================================================================
# Models are defined directly in app.py to avoid circular import issues

class User(db.Model):
    """User model for authentication (future implementation)
    
    Currently unused but reserved for future authentication features.
    """
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'

class Customer(db.Model):
    """Customer model with hierarchical self-referential relationships
    
    Supports unlimited hierarchy depth through self-referential foreign key.
    Entity levels: 'individual', 'entity', 'corporate'
    
    Relationships:
        - parent: References the parent customer (one-to-one)
        - children: Backref to all child customers (one-to-many)
    
    Example hierarchy:
        Corporate (parent_id=None) → Entity (parent_id=1) → Individual (parent_id=2)
    """
    # Primary Fields
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.String(200))
    
    # Entity classification: 'individual', 'entity', or 'corporate'
    entity_level = db.Column(db.String(50), default='individual')
    
    # Self-referential relationship for unlimited hierarchy depth
    # parent_id references another customer's id (NULL for root-level customers)
    parent_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=True)
    
    # Relationship definitions:
    # - remote_side=[id] tells SQLAlchemy which side is the "remote" side in self-reference
    # - backref='children' creates a reverse relationship so parent.children returns all children
    parent = db.relationship('Customer', remote_side=[id], backref='children')

    def __repr__(self):
        return f'<Customer {self.name}>'
    
    def to_dict(self):
        """Convert customer object to dictionary for JSON serialization
        
        Returns:
            dict: Customer data including parent name if applicable
        """
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'entity_level': self.entity_level,
            'parent_id': self.parent_id,
            'parent_name': self.parent.name if self.parent else None  # Resolve parent name from relationship
        }

# ============================================================================
# API Routes
# ============================================================================

@app.route('/')
def index():
    """Health check endpoint
    
    Returns:
        dict: Status message confirming API is running
    """
    return {'message': 'Customer CRM Backend API is running!'}

# ----------------------------------------------------------------------------
# Customer CRUD Operations
# ----------------------------------------------------------------------------

@app.route('/customers', methods=['GET'])
def get_customers():
    """Retrieve all customers
    
    Returns:
        JSON array: List of all customers with their basic information
    
    Example:
        GET /customers
        Response: [{id: 1, name: 'John Doe', email: 'john@example.com', ...}, ...]
    """
    customers = Customer.query.all()
    return jsonify([c.to_dict() for c in customers])

@app.route('/customers/<int:id>', methods=['GET'])
def get_customer(id):
    """Retrieve a single customer by ID with children information
    
    Args:
        id (int): Customer ID from URL path
    
    Returns:
        JSON object: Customer data including array of direct children
    
    Raises:
        404: If customer with given ID doesn't exist
    
    Example:
        GET /customers/1
        Response: {id: 1, name: 'ABC Corp', children: [{id: 2, name: 'Division A'}, ...]}
    """
    customer = Customer.query.get_or_404(id)
    result = customer.to_dict()
    # Add direct children information (not recursive)
    result['children'] = [{'id': c.id, 'name': c.name, 'entity_level': c.entity_level} for c in customer.children]
    return jsonify(result)

@app.route('/customers', methods=['POST'])
def create_customer():
    """Create a new customer
    
    Request Body:
        JSON object with customer fields (name, email, phone, address, entity_level, parent_id)
    
    Returns:
        JSON object: Created customer data with 201 status code
    
    Example:
        POST /customers
        Body: {"name": "John Doe", "email": "john@example.com", "entity_level": "individual", "parent_id": 1}
        Response: {id: 3, name: "John Doe", ...}
    """
    data = request.json
    customer = Customer(
        name=data.get('name'),
        email=data.get('email'),
        phone=data.get('phone'),
        address=data.get('address'),
        entity_level=data.get('entity_level', 'individual'),  # Default to 'individual' if not specified
        parent_id=data.get('parent_id')  # None for root-level customers
    )
    db.session.add(customer)
    db.session.commit()
    return jsonify(customer.to_dict()), 201

@app.route('/customers/<int:id>', methods=['PUT'])
def update_customer(id):
    """Update an existing customer
    
    Args:
        id (int): Customer ID from URL path
    
    Request Body:
        JSON object with fields to update
    
    Returns:
        JSON object: Updated customer data
    
    Raises:
        404: If customer with given ID doesn't exist
    
    Example:
        PUT /customers/1
        Body: {"name": "Jane Doe", "phone": "555-0102"}
        Response: {id: 1, name: "Jane Doe", phone: "555-0102", ...}
    """
    customer = Customer.query.get_or_404(id)
    data = request.json
    # Update fields only if provided in request (preserves existing values)
    customer.name = data.get('name', customer.name)
    customer.email = data.get('email', customer.email)
    customer.phone = data.get('phone', customer.phone)
    customer.address = data.get('address', customer.address)
    customer.entity_level = data.get('entity_level', customer.entity_level)
    customer.parent_id = data.get('parent_id')  # Allow setting to None to remove parent
    db.session.commit()
    return jsonify(customer.to_dict())

@app.route('/customers/<int:id>', methods=['DELETE'])
def delete_customer(id):
    """Delete a customer
    
    Args:
        id (int): Customer ID from URL path
    
    Returns:
        JSON object: Success message
    
    Raises:
        404: If customer with given ID doesn't exist
    
    Note:
        Child customers will have their parent_id set to NULL automatically.
        Consider handling orphaned children in production.
    
    Example:
        DELETE /customers/1
        Response: {"message": "Customer deleted"}
    """
    customer = Customer.query.get_or_404(id)
    db.session.delete(customer)
    db.session.commit()
    return jsonify({'message': 'Customer deleted'})

@app.route('/customers/<int:id>/hierarchy', methods=['GET'])
def get_customer_hierarchy(id):
    """Get full hierarchical family tree for a customer
    
    Retrieves the complete ancestor chain (parents, grandparents, etc.) 
    and descendant tree (children, grandchildren, etc.) for a given customer.
    
    Args:
        id (int): Customer ID from URL path
    
    Returns:
        JSON object: {
            'customer': {customer data},
            'ancestors': [{parent}, {grandparent}, ...] (ordered root to immediate parent),
            'descendants': [{child with nested children}, ...] (recursive tree structure)
        }
    
    Raises:
        404: If customer with given ID doesn't exist
    
    Example:
        GET /customers/3/hierarchy
        Response: {
            "customer": {id: 3, name: "John Doe", ...},
            "ancestors": [{id: 1, name: "ABC Corp"}, {id: 2, name: "East Division"}],
            "descendants": []
        }
    """
    customer = Customer.query.get_or_404(id)
    
    def get_ancestors(cust):
        """Recursively traverse up the parent chain
        
        Args:
            cust: Customer object
        
        Returns:
            list: Ancestors ordered from root to immediate parent
        """
        ancestors = []
        current = cust.parent
        # Walk up the parent chain until we reach a root-level customer (parent_id is None)
        while current:
            ancestors.append({'id': current.id, 'name': current.name, 'entity_level': current.entity_level})
            current = current.parent
        # Reverse to show root first (e.g., [Corporate, Entity, immediate Parent])
        return list(reversed(ancestors))
    
    def get_descendants(cust):
        """Recursively traverse down the children tree
        
        Args:
            cust: Customer object
        
        Returns:
            list: Nested structure of all descendants
        """
        descendants = []
        # For each direct child, create an object with their info and their children recursively
        for child in cust.children:
            descendants.append({
                'id': child.id,
                'name': child.name,
                'entity_level': child.entity_level,
                'children': get_descendants(child)  # Recursive call for unlimited depth
            })
        return descendants
    
    return jsonify({
        'customer': customer.to_dict(),
        'ancestors': get_ancestors(customer),
        'descendants': get_descendants(customer)
    })

# ============================================================================
# Application Startup
# ============================================================================

if __name__ == '__main__':
    # Create database tables if they don't exist
    # This runs before the Flask server starts
    with app.app_context():
        # create_all() only creates tables that don't exist - it won't modify existing tables
        # For schema changes, use migration scripts or delete the database file
        db.create_all()
        print("Database tables created successfully!")
    
    # Start Flask development server
    # debug=True enables:
    #   - Auto-reload on code changes
    #   - Detailed error pages
    #   - Debug toolbar
    # IMPORTANT: Set debug=False in production!
    # Port 5001 used instead of default 5000 (which conflicts with macOS ControlCenter)
    app.run(debug=True, port=5001)
