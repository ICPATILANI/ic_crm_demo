# 🧪 Customer CRM Test Reports

This directory contains comprehensive HTML test reports for the Customer CRM application, including both backend (Python/Flask) and frontend (Angular 19) test suites.

## 📊 Test Report Dashboard

Open `index.html` in your browser to view the comprehensive test reports dashboard:

```bash
open test-reports/index.html
```

Or on Windows:
```bash
start test-reports/index.html
```

The dashboard provides:
- **Overall Summary**: Total tests, pass rate, and execution statistics
- **Backend Reports**: pytest HTML reports and code coverage
- **Frontend Reports**: Karma HTML reports, code coverage, and JUnit XML
- **Execution Details**: Platform info, execution times, and test frameworks

## 🐍 Backend Test Reports

### Generate Backend Reports

```bash
cd backend
pytest --html=test-report.html --self-contained-html --cov=. --cov-report=html
```

### Available Reports:
- **HTML Test Report**: `backend/test-report.html` - Detailed test execution results
- **Coverage Report**: `backend/htmlcov/index.html` - Code coverage analysis

### Test Statistics:
- **Total Tests**: 35
- **Pass Rate**: 100%
- **Execution Time**: 0.57 seconds
- **Warnings**: 13
- **Coverage**: Platform darwin, Python 3.11.7

## 🅰️ Frontend Test Reports

### Generate Frontend Reports

```bash
cd frontend
npm test -- --watch=false --code-coverage --browsers=ChromeHeadless
```

### Available Reports:
- **HTML Test Report**: `frontend/test-reports/html/test-report.html` - Detailed test execution results
- **Coverage Report**: `frontend/test-reports/coverage/index.html` - Code coverage analysis
- **JUnit XML**: `frontend/test-reports/junit/test-results.xml` - CI/CD integration format

### Test Statistics:
- **Total Tests**: 67
- **Pass Rate**: 100%
- **Execution Time**: 0.149 seconds
- **Code Coverage**:
  - Statements: 70.65% (65/92)
  - Branches: 40.9% (9/22)
  - Functions: 75.67% (28/37)
  - Lines: 74.41% (64/86)

## 📈 Overall Test Summary

| Metric | Backend | Frontend | Total |
|--------|---------|----------|-------|
| **Tests** | 35 | 67 | **102** |
| **Pass Rate** | 100% | 100% | **100%** |
| **Execution Time** | 0.57s | 0.149s | **0.719s** |
| **Framework** | pytest 8.4.2 | Karma 6.4.4 + Jasmine | - |

## 🛠️ Test Configuration

### Backend (pytest)
Configuration file: `backend/pytest.ini`

Key features:
- HTML report generation with `pytest-html`
- Code coverage analysis with `pytest-cov`
- Self-contained HTML reports
- Test discovery in `test_*.py` files

### Frontend (Karma/Jasmine)
Configuration file: `frontend/karma.conf.js`

Key features:
- HTML report generation with `karma-html-reporter`
- JUnit XML output for CI/CD integration
- Code coverage with Istanbul
- Chrome and ChromeHeadless browser support
- Jasmine test framework

## 🔄 Continuous Integration

### Backend CI Command
```bash
pytest --html=test-report.html --self-contained-html --cov=. --cov-report=html --junitxml=junit.xml
```

### Frontend CI Command
```bash
npm test -- --watch=false --code-coverage --browsers=ChromeHeadlessCI
```

## 📦 Dependencies

### Backend Testing:
- `pytest==8.4.2` - Testing framework
- `pytest-html==4.1.1` - HTML report generation
- `pytest-cov==7.0.0` - Code coverage
- `pytest-flask==1.3.0` - Flask testing utilities

### Frontend Testing:
- `karma==6.4.4` - Test runner
- `jasmine-core` - Testing framework
- `karma-html-reporter` - HTML report generation
- `karma-coverage` - Code coverage
- `karma-junit-reporter` - JUnit XML output

## 🎯 Test Coverage Goals

- **Backend**: Aim for 90%+ coverage across all modules
- **Frontend**: Aim for 80%+ coverage for components and services

## 📝 Report Generation Workflow

1. **Run Tests**: Execute test suites for backend and frontend
2. **Generate Reports**: Create HTML, coverage, and XML reports
3. **Review Dashboard**: Open `test-reports/index.html` to view all results
4. **Analyze Coverage**: Identify untested code paths
5. **Improve Tests**: Add tests to increase coverage

## 🔗 Links

- **GitHub Repository**: [ic_crm_demo](https://github.com/ICPATILANI/ic_crm_demo)
- **Project README**: [../README.md](../README.md)

## 📅 Last Updated

October 3, 2025

---

**Note**: All test reports are generated locally and are not committed to Git (except the dashboard HTML). Run the test commands above to generate fresh reports on your machine.
