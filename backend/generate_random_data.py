"""Generate Random Customer Data

This script generates random customer data with hierarchical relationships
and inserts it into the database. Useful for testing and demonstration purposes.

Author: Development Team
Date: October 3, 2025
"""

import random
from faker import Faker
from app import app, db, Customer

# Initialize Faker for generating realistic random data
fake = Faker()

# Configuration
NUM_CORPORATE_CUSTOMERS = 5      # Top-level corporate entities
NUM_ENTITY_CUSTOMERS = 15        # Mid-level entities (divisions, subsidiaries)
NUM_INDIVIDUAL_CUSTOMERS = 50    # Bottom-level individuals

def generate_random_customers():
    """Generate random customer data with hierarchical relationships"""
    
    with app.app_context():
        # Clear existing data (optional - comment out to keep existing data)
        print("Clearing existing customer data...")
        Customer.query.delete()
        db.session.commit()
        
        print("\n🏢 Generating Corporate Customers (Root Level)...")
        corporate_customers = []
        for i in range(NUM_CORPORATE_CUSTOMERS):
            customer = Customer(
                name=fake.company(),
                email=f"corporate_{i+1}@{fake.domain_name()}",
                phone=fake.phone_number(),
                address=fake.address().replace('\n', ', '),
                entity_level='corporate',
                parent_id=None  # Root level - no parent
            )
            db.session.add(customer)
            db.session.flush()  # Get the ID without committing
            corporate_customers.append(customer)
            print(f"  ✅ Created: {customer.name}")
        
        db.session.commit()
        print(f"\n✅ Created {len(corporate_customers)} corporate customers")
        
        print("\n🏭 Generating Entity Customers (Mid Level)...")
        entity_customers = []
        for i in range(NUM_ENTITY_CUSTOMERS):
            # Randomly assign to a corporate parent
            parent = random.choice(corporate_customers)
            
            # Generate entity names related to parent company
            entity_types = ['Division', 'Department', 'Branch', 'Subsidiary', 'Unit']
            entity_name = f"{parent.name} - {random.choice(entity_types)} {fake.word().capitalize()}"
            
            customer = Customer(
                name=entity_name,
                email=f"entity_{i+1}@{fake.domain_name()}",
                phone=fake.phone_number(),
                address=fake.address().replace('\n', ', '),
                entity_level='entity',
                parent_id=parent.id
            )
            db.session.add(customer)
            db.session.flush()
            entity_customers.append(customer)
            print(f"  ✅ Created: {customer.name} (Parent: {parent.name})")
        
        db.session.commit()
        print(f"\n✅ Created {len(entity_customers)} entity customers")
        
        print("\n👤 Generating Individual Customers (Leaf Level)...")
        individual_customers = []
        for i in range(NUM_INDIVIDUAL_CUSTOMERS):
            # Randomly assign to either entity or corporate parent
            all_parents = entity_customers + corporate_customers
            parent = random.choice(all_parents)
            
            customer = Customer(
                name=fake.name(),
                email=fake.email(),
                phone=fake.phone_number(),
                address=fake.address().replace('\n', ', '),
                entity_level='individual',
                parent_id=parent.id
            )
            db.session.add(customer)
            individual_customers.append(customer)
            if (i + 1) % 10 == 0:
                print(f"  ✅ Created {i + 1} individuals...")
        
        db.session.commit()
        print(f"\n✅ Created {len(individual_customers)} individual customers")
        
        # Summary
        total = len(corporate_customers) + len(entity_customers) + len(individual_customers)
        print("\n" + "="*60)
        print("📊 SUMMARY")
        print("="*60)
        print(f"  Corporate Customers: {len(corporate_customers)}")
        print(f"  Entity Customers:    {len(entity_customers)}")
        print(f"  Individual Customers: {len(individual_customers)}")
        print(f"  TOTAL:               {total}")
        print("="*60)
        
        # Display some example hierarchies
        print("\n🌳 Example Hierarchies:")
        for corp in corporate_customers[:2]:
            print(f"\n  {corp.name} (Corporate)")
            children = [c for c in entity_customers if c.parent_id == corp.id]
            for entity in children[:3]:
                print(f"    └─ {entity.name} (Entity)")
                grandchildren = [c for c in individual_customers if c.parent_id == entity.id]
                for individual in grandchildren[:2]:
                    print(f"        └─ {individual.name} (Individual)")
        
        print("\n✅ Random data generation complete!")
        print(f"Database location: {app.config['SQLALCHEMY_DATABASE_URI']}")

def add_random_customers(count=10, entity_level='individual', parent_id=None):
    """Add a specific number of random customers
    
    Args:
        count (int): Number of customers to add
        entity_level (str): 'individual', 'entity', or 'corporate'
        parent_id (int): Parent customer ID (optional)
    """
    with app.app_context():
        print(f"\n➕ Adding {count} random {entity_level} customers...")
        
        for i in range(count):
            if entity_level == 'corporate':
                name = fake.company()
            elif entity_level == 'entity':
                name = f"{fake.company()} - {random.choice(['Division', 'Branch', 'Unit'])} {fake.word().capitalize()}"
            else:  # individual
                name = fake.name()
            
            customer = Customer(
                name=name,
                email=fake.email(),
                phone=fake.phone_number(),
                address=fake.address().replace('\n', ', '),
                entity_level=entity_level,
                parent_id=parent_id
            )
            db.session.add(customer)
            print(f"  ✅ {i+1}. {customer.name}")
        
        db.session.commit()
        print(f"\n✅ Added {count} customers successfully!")

if __name__ == '__main__':
    import sys
    
    # Check if Faker is installed
    try:
        from faker import Faker
    except ImportError:
        print("❌ Error: 'faker' library is not installed.")
        print("\n📦 Install it with:")
        print("   pip3 install faker")
        sys.exit(1)
    
    print("="*60)
    print("🎲 RANDOM CUSTOMER DATA GENERATOR")
    print("="*60)
    
    # Check command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == 'add':
            # Add mode: python3 generate_random_data.py add [count] [entity_level] [parent_id]
            count = int(sys.argv[2]) if len(sys.argv) > 2 else 10
            entity_level = sys.argv[3] if len(sys.argv) > 3 else 'individual'
            parent_id = int(sys.argv[4]) if len(sys.argv) > 4 else None
            add_random_customers(count, entity_level, parent_id)
        else:
            print("Usage:")
            print("  python3 generate_random_data.py              # Generate full dataset")
            print("  python3 generate_random_data.py add [count] [entity_level] [parent_id]")
            print("\nExample:")
            print("  python3 generate_random_data.py add 20 individual 5")
    else:
        # Default: generate full hierarchical dataset
        generate_random_customers()
