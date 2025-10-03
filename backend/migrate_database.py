"""Database Migration Script

Creates a new database with the latest schema and populates it with sample
hierarchical customer data demonstrating parent-child relationships.

Usage:
    python3 migrate_database.py

NOTE: This script should be run with the Flask server STOPPED to avoid
      database locking issues.

Author: Development Team
Date: October 3, 2025
"""

import os
from app import app, db, Customer

# Clean up old database file if it exists
# This ensures we start with a fresh schema
if os.path.exists('customers.db'):
    os.remove('customers.db')
    print("Old database removed")

# Create application context for database operations
with app.app_context():
    # Create all database tables based on model definitions in app.py
    db.create_all()
    print("Database tables created successfully with new schema!")
    
    # ========================================================================
    # Sample Data Creation - Hierarchical Customer Structure
    # ========================================================================
    # This creates a 3-level hierarchy demonstrating the relationship system:
    #
    # ABC Corporation (Corporate - Root)
    # ├── ABC East Division (Entity)
    # │   ├── John Doe (Individual)
    # │   └── Jane Smith (Individual)
    # └── ABC West Division (Entity)
    #     └── Bob Johnson (Individual)
    #
    # Plus 2 independent root-level individuals
    # ========================================================================
    
    # LEVEL 1: Corporate (Root Level)
    # parent_id=None indicates this is a top-level entity
    corporate1 = Customer(
        name='ABC Corporation', 
        email='info@abccorp.com', 
        phone='555-1000', 
        address='100 Corporate Plaza', 
        entity_level='corporate', 
        parent_id=None  # Root level - no parent
    )
    db.session.add(corporate1)
    # flush() saves to database and assigns ID without committing transaction
    # This allows us to use corporate1.id for parent_id in child records
    db.session.flush()
    
    # LEVEL 2: Entities (Divisions under Corporate)
    # These are children of ABC Corporation
    entity1 = Customer(
        name='ABC East Division', 
        email='east@abccorp.com', 
        phone='555-1001', 
        address='200 East Ave', 
        entity_level='entity', 
        parent_id=corporate1.id  # References ABC Corporation
    )
    entity2 = Customer(
        name='ABC West Division', 
        email='west@abccorp.com', 
        phone='555-1002', 
        address='300 West Ave', 
        entity_level='entity', 
        parent_id=corporate1.id  # Also references ABC Corporation
    )
    db.session.add_all([entity1, entity2])
    # Flush again to get entity IDs for individual-level customers
    db.session.flush()
    
    # LEVEL 3: Individuals (End customers under Entities)
    # These demonstrate grandchild relationships
    individual1 = Customer(
        name='John Doe', 
        email='john@example.com', 
        phone='555-0101', 
        address='123 Main St', 
        entity_level='individual', 
        parent_id=entity1.id  # Child of ABC East Division, grandchild of ABC Corporation
    )
    individual2 = Customer(
        name='Jane Smith', 
        email='jane@example.com', 
        phone='555-0102', 
        address='456 Oak Ave', 
        entity_level='individual', 
        parent_id=entity1.id  # Also under ABC East Division (sibling of John)
    )
    individual3 = Customer(
        name='Bob Johnson', 
        email='bob@example.com', 
        phone='555-0103', 
        address='789 Pine Rd', 
        entity_level='individual', 
        parent_id=entity2.id  # Child of ABC West Division
    )
    
    # INDEPENDENT CUSTOMERS (Root Level)
    # These demonstrate customers without parents (not part of any organization)
    independent1 = Customer(
        name='Alice Williams', 
        email='alice@example.com', 
        phone='555-0104', 
        address='321 Elm St', 
        entity_level='individual', 
        parent_id=None  # No parent - standalone customer
    )
    independent2 = Customer(
        name='Charlie Brown', 
        email='charlie@example.com', 
        phone='555-0105', 
        address='654 Maple Dr', 
        entity_level='individual', 
        parent_id=None  # No parent - standalone customer
    )
    
    # Add all individual-level customers
    db.session.add_all([individual1, individual2, individual3, independent1, independent2])
    
    # Commit transaction - this saves all changes permanently to the database
    db.session.commit()
    
    # ========================================================================
    # Verification and Output
    # ========================================================================
    print("\nAdded hierarchical customer data:")
    print("  - 1 Corporate (ABC Corporation)")
    print("    - 2 Entities (ABC East Division, ABC West Division)")
    print("      - 3 Individuals under entities")
    print("  - 2 Independent individuals")
    
    # Query and display all customers with their relationships
    all_customers = Customer.query.all()
    print(f"\nTotal customers in database: {len(all_customers)}")
    for c in all_customers:
        # Show parent relationship (or "Root Level" if no parent)
        parent_info = f" (Parent: {c.parent.name})" if c.parent else " (Root Level)"
        print(f"  - {c.name} [{c.entity_level}]{parent_info}")

print("\n" + "="*60)
print("Migration completed successfully!")
print("You can now start the Flask server with: python3 app.py")
print("="*60)
