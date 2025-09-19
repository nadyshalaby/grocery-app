# Grocery List API

A RESTful API for managing grocery lists built with Next.js, PostgreSQL, and Docker. Features JWT authentication, user isolation, and comprehensive data analysis.

## Features

- **JWT Authentication** with bcrypt password hashing
- **Complete CRUD Operations** for grocery items
- **User Isolation** - users can only access their own items
- **Input Validation** using Zod schemas
- **Docker Containerization** for easy deployment
- **Python Analytics** with interactive visualizations
- **Clean Architecture** following SOLID principles

## Quick Start

### Prerequisites
- Node.js 20+ or Docker
- pnpm (or npm/yarn)
- PostgreSQL (or use Docker)

### Option 1: Docker (Recommended)

```bash
# Start all services
docker-compose -f docker/docker-compose.yml up -d

# The API will be available at http://localhost:3000
# PostgreSQL at localhost:5432

# Database credentials (configured in docker-compose.yml):
# Database: grocery_app
# User: grocery_user
# Password: grocery_password
```

### Option 2: Local Development

1. **Install dependencies**
```bash
pnpm install
```

2. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your database credentials
```

3. **Initialize database**
```bash
# Ensure PostgreSQL is running
# Run the migration script
psql -U postgres -d grocery_db < docker/postgres/init.sql
```

4. **Start development server**
```bash
pnpm dev
```

## API Endpoints

### Authentication

#### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Login User
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response:
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "createdAt": "2025-09-19T22:40:26.704Z",
    "updatedAt": "2025-09-19T22:40:26.704Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI5NiIs..."
  }
}
```

### Grocery Items

All grocery endpoints require authentication:
```bash
Authorization: Bearer <token>
```

#### Create Item
```bash
POST /api/grocery-items
Content-Type: application/json

{
  "name": "Milk",
  "quantity": 2,
  "store": "Walmart",
  "category": "Dairy",
  "notes": "2% milk"
}
```

#### List Items
```bash
GET /api/grocery-items
# Optional query parameters:
# ?category=Dairy
# ?store=Walmart
# ?is_purchased=false
```

#### Get Single Item
```bash
GET /api/grocery-items/:id
```

#### Update Item
```bash
PUT /api/grocery-items/:id
Content-Type: application/json

{
  "name": "Whole Milk",
  "quantity": 3,
  "is_purchased": true
}
```

#### Delete Item
```bash
DELETE /api/grocery-items/:id
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Grocery Items Table
```sql
CREATE TABLE grocery_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  quantity INTEGER DEFAULT 1,
  store VARCHAR(255),
  category VARCHAR(100),
  notes TEXT,
  is_purchased BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Python Data Analysis

A Python script is included for analyzing grocery shopping patterns.

### Running the Analysis

#### With Docker
```bash
docker-compose -f docker/docker-compose.yml --profile analysis up analysis
```

#### Standalone
```bash
cd analysis
pip install -r requirements.txt
python grocery_analysis.py --dashboard
```

### Analysis Features
- Top 5 most frequently purchased items
- Store distribution analysis
- User shopping patterns
- Interactive Plotly visualizations
- Comprehensive dashboard view

### Command Line Options
```bash
python grocery_analysis.py [options]

Options:
  -o, --output FILE     Output HTML file (default: grocery_analysis.html)
  -d, --dashboard       Create comprehensive dashboard
  --db-url URL         Database connection URL
```

## Project Structure

```
grocery-app/
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts
│   │       │   └── login/route.ts
│   │       ├── grocery-items/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       └── health/route.ts
│   └── lib/
│       ├── auth/           # JWT and bcrypt utilities
│       ├── database/       # PostgreSQL connection
│       ├── repositories/   # Data access layer
│       ├── services/       # Business logic
│       ├── types/         # TypeScript definitions
│       └── utils/         # Validation and errors
├── docker/
│   ├── Dockerfile         # App container
│   ├── docker-compose.yml # Full stack setup
│   └── postgres/
│       └── init.sql       # Database initialization
├── analysis/
│   ├── grocery_analysis.py
│   ├── requirements.txt
│   └── Dockerfile
└── package.json
```

## Environment Variables

Create a `.env.local` file with:

```bash
# Database
# For Docker: connection is handled by docker-compose.yml
# For local development:
DATABASE_URL=postgresql://grocery_user:grocery_password@localhost:5432/grocery_app
DB_MAX_CONNECTIONS=20

# JWT Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12

# Node Environment
NODE_ENV=development
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Docker commands
pnpm docker:up      # Start containers
pnpm docker:down    # Stop containers
pnpm docker:logs    # View logs
pnpm docker:build   # Build images
```

## Testing

### Using Postman Collection

A complete Postman collection is included for testing all API endpoints:

1. **Import Collection**
   - Open Postman
   - Click "Import" → Select `Grocery_API.postman_collection.json`
   - Import the environment file: `Grocery_API.postman_environment.json`

2. **Collection Features**
   - Pre-configured requests for all endpoints
   - Environment variables for easy configuration
   - Automatic token management
   - Pre-request scripts with random data generation
   - Comprehensive test scripts
   - Complete user flow scenarios

3. **Available Endpoints**
   - Health Check
   - Authentication (Register, Login)
   - Grocery Items (CRUD operations)
   - Filtered queries
   - Error handling tests

4. **Dynamic Variables Used**
   - `{{$randomEmail}}` - Random email generation
   - `{{$randomProductName}}` - Random item names
   - `{{$randomCompanyName}}` - Random store names
   - `{{$randomInt}}` - Random quantities
   - `{{$timestamp}}` - Current timestamp

### Manual Testing with cURL

1. **Register a user**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

2. **Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

3. **Create item** (use token from login)
```bash
curl -X POST http://localhost:3000/api/grocery-items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Apples","quantity":5,"store":"Whole Foods","category":"Produce"}'
```

4. **List items**
```bash
curl http://localhost:3000/api/grocery-items \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Security Features

- **Password Security**: bcrypt with configurable rounds
- **JWT Tokens**: Signed tokens with expiration
- **SQL Injection Protection**: Parameterized queries
- **Input Validation**: Zod schema validation
- **User Isolation**: Row-level security
- **Security Headers**: XSS and clickjacking protection

## Architecture Principles

- **SOLID Principles**: Single responsibility, dependency inversion
- **Clean Architecture**: Separation of concerns with layers
- **Repository Pattern**: Database abstraction
- **Service Layer**: Business logic encapsulation
- **Type Safety**: Full TypeScript coverage

## Production Deployment

### Checklist
- [ ] Change JWT_SECRET to secure random value
- [ ] Update database credentials
- [ ] Set NODE_ENV=production
- [ ] Configure SSL certificates
- [ ] Set up monitoring/logging
- [ ] Configure backup strategy
- [ ] Review security headers

### Docker Production Build
```bash
docker build -f docker/Dockerfile -t grocery-api .
docker run -p 3000:3000 --env-file .env.production grocery-api
```

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose -f docker/docker-compose.yml ps

# View database logs
docker-compose -f docker/docker-compose.yml logs postgres
```

### Build Issues
```bash
# Clear dependencies and rebuild
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear Docker cache
docker-compose -f docker/docker-compose.yml down -v
docker-compose -f docker/docker-compose.yml build --no-cache
```

## License

MIT