# LM Studio Setup Guide for Expense Management Chatbot

## 1. Prerequisites

- LM Studio installed and running
- llama-2-7b-chat model loaded in LM Studio
- Backend server configured

## 2. LM Studio Configuration

### Step 1: Start LM Studio
1. Open LM Studio
2. Go to the "Chat" tab
3. Load the llama-2-7b-chat model
4. Start the local server

### Step 2: Configure Server Settings
1. Go to "Local Server" tab in LM Studio
2. Set the following settings:
   - **Port**: 1234 (default)
   - **Model**: llama-2-7b-chat
   - **Context Length**: 4096
   - **GPU Acceleration**: Enable if available
   - **Server Log Level**: Info

### Step 3: Test Connection
1. Start the server in LM Studio
2. The server will be available at `http://localhost:1234`
3. Test the endpoint: `GET http://localhost:1234/v1/models`

## 3. Environment Configuration

Create a `.env` file in the backend directory with:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=expense_management
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=24h

# LM Studio Configuration
LLM_API_URL=http://192.168.205.149:1234/v1/chat/completions
LLM_MODEL_NAME=llama-2-7b-chat
LLM_API_KEY=not-needed

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

## 4. Testing the Setup

### Backend Health Check
```bash
curl http://localhost:3000/api/chat/health
```

### Test Chat Endpoint
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello, can you help me with expenses?"}
    ]
  }'
```

## 5. Chatbot Capabilities

### Expense Management
- ✅ Create expenses: "Create expense lunch 25"
- ✅ List expenses: "Show my expenses"
- ✅ Delete expenses: "Delete expense 123"
- ✅ Update expenses: "Update expense 123 dinner 30"

### Expense Splitting
- ✅ Split equally: "Split expense 123 equally"
- ✅ View splits: "Show split for expense 123"

### Profile Management
- ✅ View profile: "Show my profile"
- ✅ Update profile: "Update profile name John Doe"

### Admin Features (Super Admin only)
- ✅ Add users: "Add user Jane Doe jane@example.com"
- ✅ List users: "Show all users"

### General Questions
- ✅ How-to questions about expense management
- ✅ Feature explanations
- ✅ Domain-specific help

## 6. Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure LM Studio is running
   - Check the IP address and port
   - Verify firewall settings

2. **Model Not Found**
   - Confirm llama-2-7b-chat is loaded
   - Check model name in environment

3. **Slow Responses**
   - Increase timeout in llamaService.js
   - Reduce max_tokens parameter
   - Enable GPU acceleration in LM Studio

4. **Empty Responses**
   - Check LM Studio logs
   - Verify model is properly loaded
   - Test with simple prompts first

## 7. Performance Optimization

### For Better Performance
1. Use GPU acceleration if available
2. Adjust context length based on needs
3. Fine-tune temperature and top_p parameters
4. Consider model quantization for speed

### Model Settings in LM Studio
- **Temperature**: 0.7 (balance creativity/consistency)
- **Top P**: 0.9 (nucleus sampling)
- **Repeat Penalty**: 1.1 (avoid repetition)
- **Context Length**: 4096 (sufficient for conversations)

## 8. Security Notes

- LM Studio runs locally, so no external API calls
- No sensitive data leaves your machine
- JWT tokens still required for authentication
- Standard web security practices apply 