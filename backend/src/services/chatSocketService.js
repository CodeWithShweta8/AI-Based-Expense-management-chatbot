const { getBotReply } = require('./llamaService');
const { detectIntent } = require('./intentService');
const { execute } = require('./actionRouter');
const { retrieveRelevantDocs, getSystemPrompt } = require('./knowledgeService');

// In-memory state for multi-turn flows (per socket)
const pendingExpenseCreation = new Map();
const pendingExpenseUpdate = new Map();
const pendingExpenseDelete = new Map();

const handleChatMessage = async (socket, data) => {
  try {
    const { messages, message } = data;
    
    if (!message || !message.trim()) {
      socket.emit('chat_error', { error: 'Message is required' });
      return;
    }

    // Out-of-domain check FIRST
    if (checkOutOfDomain(message)) {
      socket.emit('chat_reply', {
        role: 'assistant',
        content: "I'm designed to help with expense management tasks. Could you please ask something related to expenses, budgets, or financial management?",
        timestamp: new Date().toISOString()
      });
      return;
    }

    const userMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString()
    };

    // Send user message confirmation
    socket.emit('chat_message_received', userMessage);

    // Create user object for services
    const user = {
      id: socket.userId,
      email: socket.userEmail,
      name: socket.userName
    };

    console.log(`WebSocket chat request from user ${user.id} (${user.name}): ${message}`);

    // Multi-turn expense update flow
    const updateState = pendingExpenseUpdate.get(socket.id);
    if (updateState && updateState.step === 1) {
      // Expecting expense ID
      const id = parseInt(message.trim());
      if (isNaN(id) || id <= 0) {
        socket.emit('chat_reply', {
          role: 'assistant',
          content: 'Please provide a valid expense ID (e.g., 123).',
          timestamp: new Date().toISOString()
        });
        return;
      }
      updateState.id = id;
      updateState.step = 2;
      pendingExpenseUpdate.set(socket.id, updateState);
      socket.emit('chat_reply', {
        role: 'assistant',
        content: 'What is the new description? (Or type "skip" to leave unchanged)',
        timestamp: new Date().toISOString()
      });
      return;
    } else if (updateState && updateState.step === 2) {
      // Expecting new description
      if (message.trim().toLowerCase() !== 'skip') {
        updateState.description = message.trim();
      }
      updateState.step = 3;
      pendingExpenseUpdate.set(socket.id, updateState);
      socket.emit('chat_reply', {
        role: 'assistant',
        content: 'What is the new amount? (Or type "skip" to leave unchanged)',
        timestamp: new Date().toISOString()
      });
      return;
    } else if (updateState && updateState.step === 3) {
      // Expecting new amount
      let amount = undefined;
      if (message.trim().toLowerCase() !== 'skip') {
        amount = parseFloat(message.trim());
        if (isNaN(amount) || amount <= 0) {
          socket.emit('chat_reply', {
            role: 'assistant',
            content: 'Please provide a valid amount (e.g., 25.50) or type "skip".',
            timestamp: new Date().toISOString()
          });
          return;
        }
      }
      // Update expense
      const entities = { id: updateState.id };
      if (updateState.description) entities.description = updateState.description;
      if (amount !== undefined) entities.total_amount = amount;
      const reply = await execute('update_expense', entities, user);
      pendingExpenseUpdate.delete(socket.id);
      socket.emit('chat_reply', {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Multi-turn expense creation flow
    const state = pendingExpenseCreation.get(socket.id);
    if (state && state.step === 1) {
      // Expecting description
      state.description = message.trim();
      state.step = 2;
      pendingExpenseCreation.set(socket.id, state);
      socket.emit('chat_reply', {
        role: 'assistant',
        content: 'Great! What is the amount for this expense?',
        timestamp: new Date().toISOString()
      });
      return;
    } else if (state && state.step === 2) {
      // Expecting amount
      const amount = parseFloat(message.trim());
      if (isNaN(amount) || amount <= 0) {
        socket.emit('chat_reply', {
          role: 'assistant',
          content: 'Please provide a valid amount (e.g., 25.50).',
          timestamp: new Date().toISOString()
        });
        return;
      }
      // Create expense
      const entities = { description: state.description, total_amount: amount };
      const reply = await execute('create_expense', entities, user);
      pendingExpenseCreation.delete(socket.id);
      socket.emit('chat_reply', {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Multi-turn expense delete flow
    const deleteState = pendingExpenseDelete.get(socket.id);
    if (deleteState && deleteState.step === 1) {
      // Expecting expense ID
      const id = parseInt(message.trim());
      if (isNaN(id) || id <= 0) {
        socket.emit('chat_reply', {
          role: 'assistant',
          content: 'Please provide a valid expense ID (e.g., 123).',
          timestamp: new Date().toISOString()
        });
        return;
      }
      deleteState.id = id;
      deleteState.step = 2;
      pendingExpenseDelete.set(socket.id, deleteState);
      socket.emit('chat_reply', {
        role: 'assistant',
        content: `Are you sure you want to delete expense #${id}? Type "yes" to confirm or "no" to cancel.`,
        timestamp: new Date().toISOString()
      });
      return;
    } else if (deleteState && deleteState.step === 2) {
      // Confirm deletion
      if (message.trim().toLowerCase() === 'yes') {
        const entities = { id: deleteState.id };
        const reply = await execute('delete_expense', entities, user);
        pendingExpenseDelete.delete(socket.id);
        socket.emit('chat_reply', {
          role: 'assistant',
          content: reply,
          timestamp: new Date().toISOString()
        });
        return;
      } else {
        pendingExpenseDelete.delete(socket.id);
        socket.emit('chat_reply', {
          role: 'assistant',
          content: 'Deletion cancelled.',
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    // Step 1: Intent detection
    const { intent, entities, reply: intentReply } = await detectIntent(message);
    console.log(`Detected intent: ${intent}`, entities);

    // If intent is general_chat and intentReply is present, send the reply to the user
    if (intent === 'general_chat' && intentReply) {
      socket.emit('chat_reply', {
        role: 'assistant',
        content: intentReply,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // If intent is general_chat and message is out-of-domain, reply politely and do not call LLM
    if (intent === 'general_chat' && checkOutOfDomain(message)) {
      socket.emit('chat_reply', {
        role: 'assistant',
        content: "I'm designed to help with expense management tasks. Could you please ask something related to expenses, budgets, or financial management?",
        timestamp: new Date().toISOString()
      });
      return;
    }

    // If intent is general_chat (even if in-domain), always send a user-friendly fallback
    if (intent === 'general_chat') {
      socket.emit('chat_reply', {
        role: 'assistant',
        content: "I'm here to help with expense management. Please ask a specific question or action related to expenses, budgets, or financial management.",
        timestamp: new Date().toISOString()
      });
      return;
    }

    let reply;

    // Log detected intent and message for debugging
    console.log('[HELP INTENT DEBUG]', { intent, message });

    // Flexible regex for help with creating an expense
    if (intent === 'help' && /(create.*expense|add.*expense|guide.*expense|how.*expense|help.*expense)/i.test(message)) {
      socket.emit('chat_reply', {
        role: 'assistant',
        content: `Here's how to create a new expense in the Expense Management system:\n\n1. Click the 'Add Expense' button on your dashboard, or type: Create expense [description] [amount]\n2. Enter the expense description (e.g., "Lunch with team")\n3. Enter the amount (e.g., "250")\n4. Click 'Save' or confirm\n5. The new expense will appear in your list!\n\nYou can also ask me to create an expense by saying, for example: Create expense lunch 250`,
        timestamp: new Date().toISOString()
      });
      return;
    }
    if (intent === 'help' && /update.*expense|modify.*expense|edit.*expense/i.test(message)) {
      pendingExpenseUpdate.set(socket.id, { step: 1 });
      socket.emit('chat_reply', {
        role: 'assistant',
        content: 'Sure! What is the ID of the expense you want to update?',
        timestamp: new Date().toISOString()
      });
      return;
    }
    if (intent === 'help' && /delete.*expense|remove.*expense/i.test(message)) {
      pendingExpenseDelete.set(socket.id, { step: 1 });
      socket.emit('chat_reply', {
        role: 'assistant',
        content: 'Sure! What is the ID of the expense you want to delete?',
        timestamp: new Date().toISOString()
      });
      return;
    }
    if (intent === 'help') {
      // Default help/guide response
      socket.emit('chat_reply', {
        role: 'assistant',
        content: `Here is a step-by-step guide to using the Expense Management system:\n\n1. **Create an Expense:** Click 'Add Expense' or ask me to create an expense. Provide a description and amount.\n2. **List Expenses:** View your expenses on the dashboard or ask me to list your expenses.\n3. **Update an Expense:** Select an expense and choose 'Edit', or ask me to update an expense by ID.\n4. **Delete an Expense:** Select an expense and choose 'Delete', or ask me to delete an expense by ID.\n5. **Split Costs:** Use the split feature to divide expenses among users.\n6. **Profile Management:** View or update your profile from the profile section.\n7. **User Management (Admin):** Admins can add, edit, or remove users.\n8. **Notifications:** Get alerts for important actions.\n\nYou can ask me to perform any of these actions using natural language! If you need help with a specific action, just ask.`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Handle create_expense_request intent (multi-turn flow)
    if (intent === 'create_expense_request') {
      pendingExpenseCreation.set(socket.id, { step: 1 });
      socket.emit('chat_reply', {
        role: 'assistant',
        content: 'Sure! What is the description of the expense?',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (intent !== 'general_chat') {
      // Execute action and return response
      reply = await execute(intent, entities, user);
      
      // Log action execution
      console.log(`Action executed for intent ${intent}:`, reply?.substring(0, 100) + '...');
      
      // Fall back to graceful message if execute returned null
      if (!reply) {
        reply = "I understand you want to perform an action, but I'm having trouble processing it right now. Could you please rephrase your request or try again?";
      }
    } else {
      // Handle general chat
      reply = await handleGeneralChat(messages || [userMessage], user, message);
    }

    // Clean up LLM reply: remove artifacts and truncate
    reply = reply
      // Prioritize removal of known LLM artifacts and markdown code blocks
      .replace(/istant\|>/gi, '') // Specific artifact
      .replace(/```[\s\S]*?```/g, '') // Remove markdown code blocks
      .replace(/assistant:?/gi, '') // Common LLM prefixes
      .replace(/bot:?/gi, '')
      .replace(/\[INST\]|\[\/INST\]/gi, '') // Instruction tokens
      .replace(/<\|.*?\|>/g, ''); // Other special tokens

    // Aggressively remove any remaining leading/trailing non-word characters and whitespace
    // This catches stray punctuation, symbols, and extra spaces at the ends
    reply = reply.replace(/^[\W\s]+|[\W\s]+$/g, '');

    // Normalize internal whitespace (multiple spaces to single space) and trim
    reply = reply.replace(/\s{2,}/g, ' ').trim(); 

    // Truncate to 500 characters
    if (reply.length > 500) {
      reply = reply.slice(0, 500) + '...';
    }

    // Ensure reply is always a non-empty string for the frontend
    if (!reply || typeof reply !== 'string' || !reply.trim()) {
      reply = "I'm sorry, I couldn't generate a response. Please try again.";
    }

    // Create assistant response
    const assistantMessage = {
      role: 'assistant',
      content: reply,
      timestamp: new Date().toISOString()
    };

    // Send assistant reply
    socket.emit('chat_reply', assistantMessage);

    // Log response
    console.log(`WebSocket response to user ${user.id}:`, reply.substring(0, 100) + '...');

  } catch (error) {
    console.error('WebSocket chat error:', error);
    socket.emit('chat_error', { 
      error: "I'm sorry, I couldn't process your request. Please try again or ask something related to expense management.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

async function handleGeneralChat(messages, user, lastUserMsg) {
  try {
    // Out-of-domain check (redundant safety)
    if (checkOutOfDomain(lastUserMsg)) {
      return "I'm designed to help with expense management tasks. Could you please ask something related to expenses, budgets, or financial management?";
    }
    // Enhanced context for general chat with user info
    const userContext = `User: ${user.name} (${user.email})`;
    const contextualMessages = [
      { role: 'system', content: `${await getSystemPrompt()}\n\n${userContext}` },
      ...messages
    ];

    // Get relevant documents for context
    const relevantDocs = await retrieveRelevantDocs(lastUserMsg);
    
    if (relevantDocs.length > 0) {
      const contextPrompt = `Based on the following relevant information:\n\n${relevantDocs.join('\n\n')}\n\n`;
      contextualMessages[0].content += `\n\n${contextPrompt}`;
    }

    // Check if query seems out of domain
    if (checkOutOfDomain(lastUserMsg)) {
      return "I'm designed to help with expense management tasks. Could you please ask something related to expenses, budgets, or financial management?";
    }

    // Get bot reply
    const reply = await getBotReply(contextualMessages);
    
    return reply || "I'm having trouble generating a response right now. Please try again.";
    
  } catch (error) {
    console.error('General chat error:', error);
    return "I apologize, but I'm having trouble processing your request. Please try again.";
  }
}

function checkOutOfDomain(message) {
  const lowerMessage = message.toLowerCase();
  
  // Keywords that are clearly out of domain
  const outOfDomainKeywords = [
    'weather', 'joke', 'recipe', 'movie', 'music', 'sports', 'games',
    'code', 'programming', 'technology', 'science', 'history', 'geography',
    'math', 'homework', 'school', 'university', 'dating', 'relationship'
  ];
  
  // Keywords that suggest expense/finance domain
  const inDomainKeywords = [
    'expense', 'money', 'budget', 'cost', 'price', 'payment', 'finance',
    'spending', 'income', 'receipt', 'transaction', 'account', 'balance',
    'save', 'saving', 'invest', 'purchase', 'buy', 'sell', 'report'
  ];
  
  // Check if message contains out-of-domain keywords
  const hasOutOfDomainKeywords = outOfDomainKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  // Check if message contains in-domain keywords
  const hasInDomainKeywords = inDomainKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  // Consider out of domain if it has out-of-domain keywords and no in-domain keywords
  return hasOutOfDomainKeywords && !hasInDomainKeywords;
}

module.exports = {
  handleChatMessage
};