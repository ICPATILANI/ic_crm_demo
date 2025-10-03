# Random Data Generation

This directory contains a script for generating random customer data with hierarchical relationships for testing and demonstration purposes.

## 🎲 Generate Random Data

### Full Dataset Generation

Generate a complete hierarchical dataset with:
- 5 Corporate customers (root level)
- 15 Entity customers (mid level - divisions, departments, branches)
- 50 Individual customers (leaf level)

```bash
cd backend
python3 generate_random_data.py
```

**Warning**: This will clear all existing customer data and generate fresh random data.

### Add Specific Customers

Add a specific number of customers without clearing existing data:

```bash
# Add 20 random individual customers
python3 generate_random_data.py add 20 individual

# Add 5 entity customers with parent_id=3
python3 generate_random_data.py add 5 entity 3

# Add 2 corporate customers (root level)
python3 generate_random_data.py add 2 corporate
```

**Syntax:**
```bash
python3 generate_random_data.py add [count] [entity_level] [parent_id]
```

**Parameters:**
- `count` (optional): Number of customers to add (default: 10)
- `entity_level` (optional): Type of customer - 'individual', 'entity', or 'corporate' (default: 'individual')
- `parent_id` (optional): Parent customer ID for hierarchical relationships (default: None)

## 📦 Dependencies

The script requires the `faker` library:

```bash
pip3 install --user faker
```

Or install from requirements:
```bash
pip3 install -r requirements-test.txt
```

## 🌳 Generated Data Structure

### Hierarchical Relationships

The script creates realistic hierarchical relationships:

```
Corporate Customer (e.g., "Acme Corporation")
├── Entity Customer (e.g., "Acme Corporation - Division Manufacturing")
│   ├── Individual Customer (e.g., "John Doe")
│   └── Individual Customer (e.g., "Jane Smith")
└── Entity Customer (e.g., "Acme Corporation - Branch Northeast")
    ├── Individual Customer (e.g., "Bob Johnson")
    └── Individual Customer (e.g., "Alice Williams")
```

### Data Fields

Each customer includes:
- **Name**: Realistic names using Faker
  - Corporate: Company names
  - Entity: Division/Department/Branch/Subsidiary/Unit + descriptor
  - Individual: Person names
- **Email**: Unique email addresses
- **Phone**: Realistic phone numbers
- **Address**: Full addresses
- **Entity Level**: 'corporate', 'entity', or 'individual'
- **Parent ID**: References parent customer for hierarchy

## 🔧 Customization

Edit the configuration in `generate_random_data.py`:

```python
# Configuration
NUM_CORPORATE_CUSTOMERS = 5      # Top-level corporate entities
NUM_ENTITY_CUSTOMERS = 15        # Mid-level entities
NUM_INDIVIDUAL_CUSTOMERS = 50    # Bottom-level individuals
```

## 📊 Output Example

```
============================================================
🎲 RANDOM CUSTOMER DATA GENERATOR
============================================================
Clearing existing customer data...

🏢 Generating Corporate Customers (Root Level)...
  ✅ Created: Ray-Calhoun
  ✅ Created: Snyder-Jones
  ✅ Created: Ramos and Sons
  ✅ Created: Murphy-Fisher
  ✅ Created: Haynes, Jones and Lopez

✅ Created 5 corporate customers

🏭 Generating Entity Customers (Mid Level)...
  ✅ Created: Haynes, Jones and Lopez - Unit Its
  ✅ Created: Ramos and Sons - Division Begin
  ...

✅ Created 15 entity customers

👤 Generating Individual Customers (Leaf Level)...
  ✅ Created 10 individuals...
  ✅ Created 20 individuals...
  ...

✅ Created 50 individual customers

============================================================
📊 SUMMARY
============================================================
  Corporate Customers: 5
  Entity Customers:    15
  Individual Customers: 50
  TOTAL:               70
============================================================
```

## 🔄 Integration with Application

After generating random data:
1. The Flask server will automatically serve the new data
2. Refresh the Angular frontend to see the updated customer list
3. Test hierarchical relationships using the "View Relationships" button
4. Test export functionality with the larger dataset

## ⚠️ Important Notes

- **Data Persistence**: Random data is stored in `customers_v2.db`
- **Data Clearing**: Full generation clears existing data - backup if needed
- **Unique Emails**: Faker generates unique emails to satisfy database constraints
- **Realistic Data**: Uses Faker library for realistic names, addresses, and contact info
- **Hierarchical Integrity**: Maintains proper parent-child relationships

## 🎯 Use Cases

- **Testing**: Generate large datasets for performance testing
- **Demos**: Create realistic demo data for presentations
- **Development**: Quickly populate database during development
- **Load Testing**: Generate thousands of records for stress testing
- **UI Testing**: Test grid pagination, sorting, and filtering with varied data

## 📝 Examples

### Generate 100 Individual Customers
```bash
python3 generate_random_data.py add 100 individual
```

### Create Hierarchical Structure
```bash
# Create a corporate customer
python3 generate_random_data.py add 1 corporate

# Assuming the corporate customer got ID 71, add entities under it
python3 generate_random_data.py add 5 entity 71

# Add individuals under the entities
python3 generate_random_data.py add 20 individual 72
```

## 🔗 Related Files

- **Script**: `generate_random_data.py` - Random data generation
- **Database**: `customers_v2.db` - SQLite database file
- **Migration**: `migrate_database.py` - Database schema migration
- **Sample Data**: `add_sample_data.py` - Add predefined sample data
- **App**: `app.py` - Main Flask application

---

**Last Updated**: October 3, 2025  
**Script Version**: 1.0.0
