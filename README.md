# Customer CRM

A modern, full-stack Customer Relationship Management (CRM) application built with Angular 19 and Flask, featuring hierarchical customer relationships and an intuitive data grid interface.

## 🌟 Features

- **Customer Management**: Complete CRUD operations for customer records
- **Hierarchical Relationships**: Define parent-child-grandparent customer relationships with unlimited depth
- **Entity Level Classification**: Categorize customers as Individual, Entity, or Corporate
- **Interactive Data Grid**: Powered by AG Grid Community with custom styling and animations
- **Relationship Visualization**: Beautiful modal interface displaying full customer family trees
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

## 🚀 Future Enhancements

- [ ] Advanced search and filtering functionality
- [ ] User authentication and authorization
- [ ] Export to CSV/Excel
- [ ] Bulk import customers
- [ ] Activity logging and audit trail
- [ ] Email integration
- [ ] Dashboard with analytics
- [ ] PostgreSQL migration for production
- [ ] Docker containerization
- [ ] Unit and integration tests

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
