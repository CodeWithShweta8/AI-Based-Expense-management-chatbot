# Expense Management Backend API

A comprehensive REST API for managing expenses and splitting them among users, built with Node.js, Express, and PostgreSQL.

## 🚀 Features

- **JWT Authentication** with role-based access control
- **User Management** (Admin can create users)
- **Expense CRUD Operations** with ownership validation
- **Expense Splitting** (Equal and custom splits)
- **PostgreSQL Database** with proper relationships
- **Swagger Documentation** for easy API testing
- **Automatic Admin User Creation** on startup

## 🛠️ Technology Stack

- **Backend:** Node.js with Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt
- **Documentation:** Swagger/OpenAPI 3.0
- **Environment:** Docker Compose for database

## 📋 Prerequisites

- Node.js (v14 or higher)
- Docker and Docker Compose
- npm or yarn

## 🚀 Quick Start

### 1. Start PostgreSQL Database

```bash
# From project root
docker-compose up -d
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Environment Setup

Create a `.env` file in the `backend` directory:

```env
DB_USER=expense_user
DB_PASS=expense_pass
DB_HOST=localhost
DB_PORT=5432
DB_NAME=expense_db
JWT_SECRET=your_jwt_secret_here
PORT=3000
```

### 4. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will automatically:
- Create database tables
- Create an admin user (if not exists)
- Display available endpoints

## 📚 API Documentation

### Swagger UI
Once the server is running, visit: **http://localhost:3000/api-docs**

### Default Admin Credentials
- **Email:** `admin@test.com`
- **Password:** `admin`

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Users
- `POST /api/users` - Create user (Admin only)
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile

### Expenses
- `GET /api/expenses` - Get user's expenses
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `POST /api/expenses/:id/split` - Split expense among users

### Health Check
- `GET /api/health` - Server health status

## 🔐 Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 💾 Database Schema

### Users Table
- `id` (Primary Key)
- `name` (VARCHAR)
- `email` (VARCHAR, Unique)
- `password_hash` (VARCHAR)
- `role` (VARCHAR: 'user' | 'admin')
- `created_at` (TIMESTAMP)

### Expenses Table
- `id` (Primary Key)
- `description` (VARCHAR)
- `total_amount` (DECIMAL)
- `created_by` (Foreign Key → users.id)
- `created_at` (TIMESTAMP)

### Expense Splits Table
- `id` (Primary Key)
- `expense_id` (Foreign Key → expenses.id)
- `user_id` (Foreign Key → users.id)
- `amount` (DECIMAL)
- `created_at` (TIMESTAMP)

## 🧩 Expense Splitting Logic

### Equal Split (Default)
If no splits are provided when creating an expense, it's assigned entirely to the creator.

### Custom Split
You can specify exact amounts for each user:
```json
{
  "description": "Dinner",
  "total_amount": 500.00,
  "splits": [
    { "user_id": 1, "amount": 300.00 },
    { "user_id": 2, "amount": 200.00 }
  ]
}
```

**Note:** Split amounts must equal the total expense amount.

## 📝 Example Usage

### 1. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "admin"}'
```

### 2. Create Expense
```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"description": "Team Lunch", "total_amount": 150.00}'
```

### 3. Split Expense
```bash
curl -X POST http://localhost:3000/api/expenses/1/split \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "splits": [
      {"user_id": 1, "amount": 75.00},
      {"user_id": 2, "amount": 75.00}
    ]
  }'
```

## 🔧 Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Project Structure
```
backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Authentication & authorization
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Helper functions
│   ├── config/         # Configuration files
│   └── app.js          # Express app setup
├── sql/                # Database initialization
├── server.js           # Server entry point
└── package.json
```

## 🐛 Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `500` - Internal Server Error

## 🚦 Health Check

Check if the server is running:
```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "OK",
  "message": "Expense Management API is running"
}
```

## 📄 License

This project is licensed under the ISC License. 