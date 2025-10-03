# Customer CRM

A modern, full-stack Customer Relationship Management (CRM) application built with Angular 19 and Flask, featuring hierarchical customer relationships and an intuitive data grid interface.

## 🌟 Features

- **Customer Management**: Complete CRUD operations for customer records
- **Hierarchical Relationships**: Define parent-child-grandparent customer relationships with unlimited depth
- **Entity Level Classification**: Categorize customers as Individual, Entity, or Corporate
- **Interactive Data Grid**: Powered by AG Grid Community with custom styling and animations
- **Data Export**: Export customer data to CSV and Excel formats with one click
- **Relationship Visualization**: Beautiful modal interface displaying full customer family trees
- **Navigation Bar**: Modern navigation with About section showing application details
- **Responsive Design**: Modern gradient UI with glass morphism effects
- **Real-time Updates**: Live data synchronization between frontend and backend

## 🏗️ Architecture

### Frontend
- **Framework**: Angular 19 with Server-Side Rendering (SSR)
- **UI Components**: Standalone components with TypeScript
- **Data Grid**: AG Grid Community (v34.2.0)
- **Styling**: Custom CSS with gradients, animations, and modern effects
- **HTTP Client**: RxJS-powered service layer

### Backend
- **Framework**: Flask 3.1.2
- **ORM**: SQLAlchemy 2.0.43 with Flask-SQLAlchemy 3.1.1
- **Database**: SQLite (easily migrated to PostgreSQL)
- **CORS**: Flask-CORS 6.0.1 for cross-origin requests
- **API**: RESTful endpoints with JSON responses

## 📋 Prerequisites

- **Node.js**: v20.19.5 or higher (required for Angular 19)
- **Python**: v3.8 or higher
- **npm**: v10 or higher
- **pip**: Latest version

## 🚀 Installation

### 1. Clone the Repository
```bash
cd /Users/patilani/Desktop/ICyteEnhancedSearch
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip3 install flask flask_sqlalchemy flask-cors

# Initialize database with sample hierarchical data
python3 migrate_database.py
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install Node.js dependencies
npm install
```

## ▶️ Running the Application

### Start Backend Server
```bash
# From backend directory
cd backend
python3 app.py
```
Backend will run on: **http://localhost:5001**

### Start Frontend Server
```bash
# From frontend directory (in a new terminal)
cd frontend
npm start
```
Frontend will run on: **http://localhost:4200**

### Access the Application
Open your browser and navigate to: **http://localhost:4200**

## 📊 Database Schema

### Customer Model
| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Primary key |
| `name` | String(100) | Customer name |
| `email` | String(120) | Customer email (unique) |
| `phone` | String(20) | Customer phone number |
| `address` | String(200) | Customer address |
| `entity_level` | String(50) | Classification: Individual/Entity/Corporate |
| `parent_id` | Integer | Foreign key referencing parent customer |

### Relationship Structure
- Self-referential foreign key enables unlimited hierarchy depth
- `parent` relationship provides access to parent customer
- `children` relationship provides access to all child customers

## 🔌 API Endpoints

### Customer Endpoints
- `GET /customers` - Retrieve all customers
- `GET /customers/<id>` - Get specific customer with children
- `POST /customers` - Create new customer
- `PUT /customers/<id>` - Update existing customer
- `DELETE /customers/<id>` - Delete customer
- `GET /customers/<id>/hierarchy` - Get full customer hierarchy (ancestors and descendants)

### Health Check
- `GET /` - API health check

## 🧪 Testing

The application includes a comprehensive pytest test suite with 35 tests covering all functionality.

### Test Suite Overview
- **test_app.py**: 21 API endpoint tests
  - Health check validation
  - CRUD operations (GET, POST, PUT, DELETE)
  - Hierarchical relationship queries
  - Error handling and validation
  - CORS configuration
  - Data integrity constraints

- **test_models.py**: 14 database model tests
  - Customer model creation and serialization
  - Parent-child relationships
  - Multi-level hierarchies (3+ levels)
  - Database constraints (unique email, required fields)
  - Query and filter operations

### Running Tests

#### Install Test Dependencies
```bash
# From backend directory
cd backend

# Install testing packages
pip3 install --index-url https://pypi.org/simple pytest pytest-flask pytest-cov
```

#### Run All Tests
```bash
# From backend directory
pytest -v
```

Expected output:
```
35 passed in 0.42s
```

#### Run Tests with Coverage Report
```bash
# Generate HTML coverage report
pytest --cov=app --cov-report=html --cov-report=term-missing

# View report in browser
open htmlcov/index.html
```

#### Run Specific Test Categories
```bash
# Run only API tests
pytest test_app.py -v

# Run only model tests
pytest test_models.py -v

# Run tests matching a pattern
pytest -k "hierarchy" -v

# Run tests with specific markers (if configured)
pytest -m "unit" -v
```

#### Test Configuration
The `pytest.ini` file configures test discovery and execution:
- Test files: `test_*.py`
- Test functions: `test_*`
- Output: Verbose with short tracebacks
- Custom markers: unit, integration, database, hierarchy

### Test Coverage
Current test coverage includes:
- ✅ All API endpoints (GET, POST, PUT, DELETE)
- ✅ Customer creation with validation
- ✅ Hierarchical relationships (parent-child)
- ✅ Error handling (missing fields, duplicate emails)
- ✅ Data integrity constraints
- ✅ CORS headers
- ✅ Database queries and filters
- ✅ Model serialization and deserialization
- ✅ Multi-level relationship traversal

### Writing New Tests
To add new tests, follow these patterns:

**API Endpoint Test Example:**
```python
def test_my_new_endpoint(client):
    """Test description"""
    response = client.get('/my-endpoint')
    assert response.status_code == 200
    data = response.get_json()
    assert 'expected_key' in data
```

**Model Test Example:**
```python
def test_my_model_feature(app_context):
    """Test description"""
    customer = Customer(name="Test", email="test@example.com")
    db.session.add(customer)
    db.session.commit()
    assert customer.id is not None
```

### Continuous Integration
For automated testing in CI/CD pipelines:

**GitHub Actions Example:**
```yaml
- name: Run Tests
  run: |
    cd backend
    pip install pytest pytest-flask pytest-cov
    pytest --cov=app --cov-report=xml
```

### Test Database
Tests use an in-memory SQLite database (`:memory:`), ensuring:
- Fast test execution (no disk I/O)
- Isolated test environment (no impact on production database)
- Clean state for each test (database recreated per test)
- No cleanup required after tests

## 🧪 Frontend Testing (Angular)

The Angular application includes comprehensive Karma/Jasmine tests with 62 tests covering all functionality.

### Test Suite Overview
- **customer.service.spec.ts**: 22 service tests
  - HTTP request generation
  - API endpoint calls (GET, POST, PUT, DELETE)
  - Request/response handling
  - Error scenarios (404, 400, 500)
  - Hierarchy endpoint testing

- **customer-grid.component.spec.ts**: 37 component tests
  - Component initialization and lifecycle
  - CRUD operations integration
  - Form validation and user interactions
  - Relationship modal functionality
  - Grid configuration and data binding
  - SSR platform browser checks

- **app.component.spec.ts**: 3 app-level tests
  - Component creation
  - Template rendering
  - Dependency injection

### Running Angular Tests

#### Run All Tests
```bash
# From frontend directory
cd frontend

# Run tests in headless Chrome
npm test

# Run tests once without watch mode
npm test -- --watch=false

# Run with code coverage
npm test -- --code-coverage
```

Expected output:
```
Chrome Headless: Executed 67 of 67 SUCCESS
```

#### Run Tests in Watch Mode (Development)
```bash
# Tests will re-run on file changes
npm test -- --watch=true
```

#### Run Tests with Coverage Report
```bash
# Generate coverage report
npm test -- --code-coverage --watch=false

# View coverage report in browser
open coverage/index.html
```

### Test Configuration
Tests are configured in:
- `karma.conf.js` - Karma test runner configuration
- `tsconfig.spec.json` - TypeScript configuration for tests
- Test files use `.spec.ts` extension

### Angular Test Coverage
Current test coverage includes:
- ✅ CustomerService HTTP operations
- ✅ API endpoint URL construction
- ✅ Request/response data handling
- ✅ Error handling for all HTTP methods
- ✅ Component initialization and lifecycle
- ✅ Form submission and validation
- ✅ CRUD operation integration
- ✅ User interaction events (click, input)
- ✅ Modal open/close functionality
- ✅ Data binding and display
- ✅ SSR compatibility checks

### Writing New Angular Tests
To add new tests, create or update `.spec.ts` files:

**Service Test Example:**
```typescript
it('should retrieve customer by ID', () => {
  service.getCustomer(1).subscribe(customer => {
    expect(customer.id).toBe(1);
  });

  const req = httpMock.expectOne('http://localhost:5001/customers/1');
  expect(req.request.method).toBe('GET');
  req.flush(mockCustomer);
});
```

**Component Test Example:**
```typescript
it('should create a new customer', fakeAsync(() => {
  component.newCustomer = { name: 'Test', email: 'test@example.com' };
  component.onCreate();
  tick();

  expect(customerService.createCustomer).toHaveBeenCalled();
}));
```

### Test Debugging
If tests fail, check:
- Browser console in Karma test runner
- Check network requests in test output
- Verify mock data matches expected format
- Ensure HttpClientTestingModule is imported

## 🎨 Key Features Explained

### Hierarchical Relationships
The system supports complex organizational structures:
- **Corporate Level**: Top-level organizations (e.g., ABC Corporation)
- **Entity Level**: Divisions or departments (e.g., ABC East Division)
- **Individual Level**: End customers (e.g., John Doe)

### Relationship Visualization
Click "View Relationships" on any customer to see:
- **Ancestors**: Parents, grandparents, great-grandparents (unlimited depth)
- **Current Customer**: Highlighted with entity level and contact info
- **Descendants**: Children, grandchildren, great-grandchildren (recursive tree view)

### Sample Data
The migration script creates a sample hierarchy:
```
ABC Corporation (Corporate)
├── ABC East Division (Entity)
│   ├── John Doe (Individual)
│   └── Jane Smith (Individual)
└── ABC West Division (Entity)
    └── Bob Johnson (Individual)

Independent Customers:
- Alice Williams (Individual)
- Charlie Brown (Individual)
```

## 🛠️ Technology Stack

### Frontend Dependencies
```json
{
  "@angular/core": "^17.1.0",
  "@angular/forms": "^17.1.0",
  "ag-grid-angular": "^34.2.0",
  "ag-grid-community": "^34.2.0",
  "rxjs": "~7.8.0"
}
```

### Backend Dependencies
```
Flask==3.1.2
Flask-SQLAlchemy==3.1.1
SQLAlchemy==2.0.43
Flask-CORS==6.0.1
```

## 🎯 Usage Guide

### Creating a Customer
1. Click "Add Customer" button
2. Fill in customer details (name, email, phone, address)
3. Select entity level (Individual, Entity, or Corporate)
4. Optionally select a parent customer
5. Click "Save Customer"

### Editing a Customer
1. Click the edit icon (✏️) in the grid
2. Modify customer details
3. Update entity level or parent relationship
4. Click "Update Customer"

### Viewing Relationships
1. Click any customer row in the grid
2. Click "View Relationships" button (top-right of grid)
3. Modal displays full family tree with ancestors and descendants

### Deleting a Customer
1. Click the delete icon (🗑️) in the grid
2. Confirm deletion (note: child relationships will need to be updated)

### Exporting Customer Data
1. Click "Export CSV" button to download data as CSV file
2. Click "Export Excel" button to download data in Excel-compatible format
3. Files are automatically named with current date: `customers_YYYY-MM-DD.csv`
4. Exported data includes: Name, Email, Phone, Address, Entity Level, and Parent Name

## 🔧 Configuration

### Port Configuration
- **Frontend**: Default port 4200 (configurable in `angular.json`)
- **Backend**: Port 5001 (configured in `app.py`)

### Database Configuration
Current: SQLite (`sqlite:///customers_v2.db`)

To migrate to PostgreSQL:
```python
# In app.py, update:
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:password@host:port/database'
```

### CORS Configuration
Current: Wildcard origin (`*`) for development

For production, update in `app.py`:
```python
CORS(app, origins=['https://your-domain.com'])
```

## 🐛 Troubleshooting

### Backend won't start
- Check if port 5001 is available: `lsof -i:5001`
- Verify Python dependencies are installed
- Ensure database file permissions are correct

### Frontend won't start
- Verify Node.js version: `node -v` (should be 20+)
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### CORS errors
- Verify backend is running on port 5001
- Check browser console for specific error messages
- Ensure CORS configuration matches frontend URL

### AG Grid not displaying
- Verify AG Grid CSS is loaded in `angular.json`
- Check browser console for module registration errors
- Ensure `AllCommunityModule` is registered in component

## 📝 Development Notes

### SSR Compatibility
The application uses Angular SSR. AG Grid is conditionally rendered client-side only:
```typescript
@if (isBrowser && isGridReady) {
  <ag-grid-angular ...></ag-grid-angular>
}
```

### Database Migrations
When changing the schema:
1. Stop Flask server
2. Delete or backup existing database file
3. Update model in `app.py`
4. Run migration script or let Flask recreate tables

### Adding New Features
- Backend: Add routes in `app.py`
- Frontend: Add methods in `customer.service.ts`
- UI: Update `customer-grid.component.ts`

## � HTML Test Reports

The project includes comprehensive HTML test reports with a centralized dashboard for easy viewing of all test results.

### View Test Reports Dashboard
```bash
# Open the test reports dashboard in your browser
open test-reports/index.html

# Or on Windows
start test-reports/index.html
```

The dashboard provides:
- **Overall Summary**: 102 total tests, 100% pass rate
- **Backend Reports**: pytest HTML report and code coverage (35 tests)
- **Frontend Reports**: Karma HTML report, code coverage, and JUnit XML (67 tests)
- **Execution Details**: Platform info, execution times, test frameworks

### Generate Fresh Test Reports

**Backend (pytest with HTML + coverage):**
```bash
cd backend
pytest --html=test-report.html --self-contained-html --cov=. --cov-report=html
```

**Frontend (Karma with HTML + coverage):**
```bash
cd frontend
npm test -- --watch=false --code-coverage --browsers=ChromeHeadless
```

### Available Reports
- **Dashboard**: `test-reports/index.html` - Central hub for all reports
- **Backend Test Report**: `backend/test-report.html` - pytest execution results
- **Backend Coverage**: `backend/htmlcov/index.html` - Code coverage analysis
- **Frontend Test Report**: `frontend/test-reports/html/test-report.html` - Karma results
- **Frontend Coverage**: `frontend/test-reports/coverage/index.html` - Code coverage
- **JUnit XML**: `frontend/test-reports/junit/test-results.xml` - CI/CD format

For detailed documentation on test reports, see [test-reports/README.md](test-reports/README.md)

## �🚀 Future Enhancements

- [ ] Advanced search and filtering functionality
- [ ] User authentication and authorization
- [x] ✅ Export to CSV/Excel (one-click export with AG Grid)
- [ ] Bulk import customers
- [ ] Activity logging and audit trail
- [ ] Email integration
- [ ] Dashboard with analytics
- [ ] PostgreSQL migration for production
- [ ] Docker containerization
- [x] ✅ Backend tests: pytest suite (35 tests, 100% pass rate)
- [x] ✅ Frontend tests: Karma/Jasmine suite (67 tests, 100% pass rate)
- [x] ✅ HTML test reports with dashboard

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Contributors

- Development Team

## 📞 Support

For issues or questions, please contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: October 3, 2025  
**Status**: Active Development
