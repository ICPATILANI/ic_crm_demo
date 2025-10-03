from app import app, db, Customer

with app.app_context():
    # Clear existing data
    Customer.query.delete()
    
    # Add sample customers
    customers = [
        Customer(name='John Doe', email='john@example.com', phone='555-0101', address='123 Main St'),
        Customer(name='Jane Smith', email='jane@example.com', phone='555-0102', address='456 Oak Ave'),
        Customer(name='Bob Johnson', email='bob@example.com', phone='555-0103', address='789 Pine Rd'),
        Customer(name='Alice Williams', email='alice@example.com', phone='555-0104', address='321 Elm St'),
        Customer(name='Charlie Brown', email='charlie@example.com', phone='555-0105', address='654 Maple Dr'),
    ]
    
    for customer in customers:
        db.session.add(customer)
    
    db.session.commit()
    print(f"Added {len(customers)} sample customers to the database!")
    
    # Verify
    all_customers = Customer.query.all()
    print(f"\nTotal customers in database: {len(all_customers)}")
    for c in all_customers:
        print(f"  - {c.name} ({c.email})")
