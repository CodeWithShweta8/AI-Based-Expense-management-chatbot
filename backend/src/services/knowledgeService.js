const fs = require('fs');
const path = require('path');
const stringSimilarity = require('string-similarity');

const DOCS_DIR = path.join(__dirname, '../../../application_docs');

// Enhanced knowledge base with structured chunks
let knowledgeBase = [];

/**
 * Create structured knowledge base from application documentation
 */
function createKnowledgeBase() {
  const docs = [];
  
  // Load application documentation
  const docFiles = fs.readdirSync(DOCS_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const content = fs.readFileSync(path.join(DOCS_DIR, file), 'utf8');
      return { file, content };
    });

  // Add expense management schema and business rules
  const expenseSchema = {
    file: 'expense_schema.md',
    content: `# Expense Management Schema

## Database Tables

### Users Table
- id (Primary Key): Unique user identifier
- name: User's full name
- email: User's email address (unique)
- password_hash: Encrypted password
- role: 'user' or 'super_admin'

### Expenses Table
- id (Primary Key): Unique expense identifier
- description: Expense description/title
- total_amount: Total expense amount (decimal)
- created_by (Foreign Key): User ID who created the expense
- created_at: Timestamp of creation

### Expense_Splits Table
- id (Primary Key): Unique split identifier
- expense_id (Foreign Key): Associated expense ID
- user_id (Foreign Key): User assigned to this split
- amount: Split amount for this user

## Business Rules

### Expense Creation
- Only authenticated users can create expenses
- Description and total_amount are required
- total_amount must be positive
- User automatically becomes the creator

### Expense Splitting
- Equal Split: Total amount divided equally among selected users
- Custom Split: User specifies exact amounts for each user
- Validation: Sum of all splits must equal total_amount
- Only expense creator or super_admin can modify splits

### User Roles
- User: Can manage own expenses, view own splits
- Admin: Can manage all expenses, add/remove users

### API Endpoints
- POST /api/expenses - Create new expense
- GET /api/expenses - List user's expenses
- PUT /api/expenses/:id - Update expense (creator only)
- DELETE /api/expenses/:id - Delete expense (creator only)
- POST /api/expenses/:id/split - Split expense among users
`
  };

  const chatbotCommands = {
    file: 'chatbot_commands.md',
    content: `# Expense Management Chatbot Commands

## Supported Commands

### Expense Management
- "Create expense [description] [amount]" - Create new expense
- "Add expense [description] [amount]" - Create new expense
- "List expenses" - Show all user's expenses
- "Show expenses" - Show all user's expenses
- "Delete expense [id]" - Delete specific expense
- "Update expense [id] [description] [amount]" - Update expense details

### Expense Splitting
- "Split expense [id] equally" - Split expense equally among users
- "Split expense [id] custom" - Split expense with custom amounts
- "Show split for expense [id]" - Display split details

### User Management (Admin only)
- "Add user [name] [email] [role]" - Add new user
- "List users" - Show all users
- "Update user [id] [field] [value]" - Update user information

### Profile Management
- "Show profile" - Display user profile
- "Update profile [field] [value]" - Update profile information

## Natural Language Examples
- "I spent 50 dollars on lunch" → Create expense
- "What are my recent expenses?" → List expenses
- "Remove the expense with ID 123" → Delete expense
- "How much do I owe for expense 456?" → Show split details
`
  };

  // Combine all documents
  docs.push(...docFiles, expenseSchema, chatbotCommands);

  // Create knowledge base with chunked content
  knowledgeBase = [];
  
  docs.forEach(doc => {
    // Split content into chunks for better retrieval
    const chunks = chunkContent(doc.content, 800);
    chunks.forEach((chunk, index) => {
      knowledgeBase.push({
        id: `${doc.file}_chunk_${index}`,
        file: doc.file,
        content: chunk,
        metadata: {
          source: doc.file,
          chunk_index: index,
          total_chunks: chunks.length
        }
      });
    });
  });

  console.log(`KnowledgeService: Created knowledge base with ${knowledgeBase.length} chunks from ${docs.length} documents.`);
}

/**
 * Retrieve relevant documents using enhanced similarity matching
 */
function retrieveRelevantDocs(query, topK = 3) {
  const queryLower = query.toLowerCase();

  // Use string similarity to rank documents
  const rankedDocs = docs.map(doc => {
    const similarity = stringSimilarity.compareTwoStrings(queryLower, doc.content.toLowerCase());
    return { doc, similarity };
  }).sort((a, b) => b.similarity - a.similarity);

  // Filter out documents with low similarity scores
  const filteredDocs = rankedDocs.filter(item => item.similarity > 0.5);

  // Return top K relevant documents
  return filteredDocs.slice(0, topK).map(item => item.doc);
}

/**
 * Split content into overlapping chunks
 */
function chunkContent(content, maxChunkSize = 800, overlap = 100) {
  const chunks = [];
  for (let i = 0; i < content.length; i += maxChunkSize - overlap) {
    const chunk = content.slice(i, i + maxChunkSize);
    chunks.push(chunk);
  }
  return chunks;
}

/**
 * Get system prompt with domain-specific context
 */
function getSystemPrompt() {
  return `You are the Expense Management Assistant. You help users manage their expenses, split costs with others, and navigate the expense management system.

IMPORTANT RULES:
1. Only provide information about expense management, user accounts, and splitting costs
2. If asked about anything outside the expense management domain, respond politely: "I'm not able to answer that question. I'm designed specifically to help you with expense management. Is there anything about your expenses, splits, or profile that I can help you with?"
3. Always use the provided context to answer questions
4. For actions like creating, updating, or deleting expenses, guide users with the correct format
5. Be helpful, friendly, and concise
6. If you don't understand something, ask for clarification politely

PERSONALITY:
- Be warm and friendly
- Use emojis appropriately
- Be encouraging when users successfully complete actions
- Stay focused on expense management

Available Actions:
- Create expenses: "Create expense [description] [amount]"
- List expenses: "List expenses" or "Show expenses"
- Delete expenses: "Delete expense [id]"
- Split expenses: "Split expense [id] equally" or "Split expense [id] custom"
- Profile management: "Show profile" or "Update profile"
- User management (Admin only): "Add user", "List users"

Current User Role: {userRole}`;
}

// Initialize knowledge base
createKnowledgeBase();

module.exports = { 
  retrieveRelevantDocs, 
  getSystemPrompt,
  createKnowledgeBase
};