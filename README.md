# Expense Management Chatbot

This project is an expense management chatbot application with a React frontend, Node.js backend, and a PostgreSQL database.

## Environment Configuration

### Backend (.env file in `backend/` directory)

```
PORT=5000
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="your_jwt_secret"
OPENAI_API_KEY="your_openai_api_key"
LM_STUDIO_BASE_URL="http://localhost:1234/v1"
```

### Frontend (.env file in `frontend/` directory)

```
REACT_APP_API_BASE_URL="http://localhost:5000"
REACT_APP_WEBSOCKET_URL="ws://localhost:5000"
``` 


# Database Configuration
DB_USER=expense_user
DB_PASS=expense_pass
DB_HOST=localhost
DB_PORT=5432
DB_NAME=expense_db

# Authentication
# JWT Configuration - Rotate this key in production
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_secure

# AI Configuration
LLM_API_URL=https://openrouter.ai/api/v1/chat/completions
LLM_MODEL_NAME='deepseek/deepseek-chat-v3-0324:free'
# WARNING: Keep API keys secure - never commit to version control
OPENROUTER_API_KEY=

# Server Configuration
PORT=3000

# Security Settings
# Rate limiting window in milliseconds (15 minutes)
RATE_LIMIT_WINDOW=900000
