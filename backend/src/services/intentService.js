const { getBotReply } = require('./llamaService');

/**
 * Enhanced intent detector and entity extractor using LLM-based classification
 * and regex fallback for expense management actions
 */
async function detectIntent(message) {
  const text = message.toLowerCase().trim();

  // Handle greetings and simple responses first
  if (isGreeting(text)) {
    return { intent: 'greeting', entities: {} };
  }

  // Handle help requests
  if (isHelpRequest(text)) {
    return { intent: 'help', entities: {} };
  }

  // Quick regex-based detection for common patterns
  const regexIntent = detectIntentRegex(text);
  if (regexIntent.intent !== 'general_chat') {
    return regexIntent;
  }

  // Use LLM for more complex intent detection with shorter timeout
  try {
    const llmIntent = await detectIntentLLM(message);

    // Post-process LLM intent: Ensure create_expense intent has both description and amount
    if (
      llmIntent.intent === 'create_expense' &&
      (
        !llmIntent.entities ||
        !llmIntent.entities.description ||
        !llmIntent.entities.total_amount ||
        isNaN(Number(llmIntent.entities.total_amount)) ||
        !/\d/.test(message) || // message must contain a number
        !/[a-zA-Z]/.test(message) // message must contain a word (description)
      )
    ) {
      return { intent: 'general_chat', entities: {} };
    }

    // Add fallback for ambiguous intents
    if (!llmIntent.intent || llmIntent.intent === 'general_chat') {
      console.warn('Ambiguous intent detected, falling back to general_chat');
      return {
        intent: 'general_chat',
        entities: {},
        reply: "Sorry, your request is outside my context. I am only able to help with expense management tasks."
      };
    }

    return llmIntent;
  } catch (error) {
    console.error('LLM intent detection failed:', error);
    // Return general_chat for safer fallback
    return {
      intent: 'general_chat',
      entities: {},
      reply: "Sorry, your request is outside my context. I am only able to help with expense management tasks."
    };
  }
}

/**
 * Check if message is a greeting
 */
function isGreeting(text) {
  const greetingPatterns = [
    /^(hi|hello|hey|good morning|good afternoon|good evening)$/,
    /^(hi there|hello there|hey there)$/,
    /^(how are you|how's it going)$/,
    /^(greetings|salutations)$/
  ];
  return greetingPatterns.some(pattern => pattern.test(text));
}

/**
 * Check if message is a help request
 */
function isHelpRequest(text) {
  const helpPatterns = [
    /^(help|assistance|support)$/,
    /^(what can you do|what do you do)$/,
    /^(how can you help|can you help)$/,
    /^(commands|features|capabilities)$/
  ];
  return helpPatterns.some(pattern => pattern.test(text));
}

/**
 * Regex-based intent detection for fast processing
 */
function detectIntentRegex(text) {
  // Help/how-to/instructions patterns (more robust)
  if (/(\bhow to\b|\bhow do i\b|\binstructions\b|\bguide\b|\busage\b|\bhelp\b|\bmanual\b|\btutorial\b|\bsteps to\b|\bhow can i\b)/i.test(text)) {
    return { intent: 'help', entities: {} };
  }
  // Create expense patterns - be more specific
  // Only match if both a description (at least one word) and an amount are present
  if ((/\b(create|add|new)\s+(expense|expesne|expence|bill|cost)\s+([a-zA-Z][a-zA-Z0-9\s]*)\s+(\d+(\.\d+)?)/.test(text)) ||
      (/\b(i\s+)?(spent|paid)\s+(\$?\d+(\.\d+)?|\d+(\.\d+)?\s*(dollars?|bucks?|usd))\s+on\s+([a-zA-Z][a-zA-Z0-9\s]*)/.test(text))) {
    return extractCreateExpenseEntities(text);
  }
  // If user says 'create expense', 'add expense', or 'new expense' without details, start multi-turn flow
  if (/\b(create|add|new)\s+(expense|expesne|expence|bill|cost)\b/i.test(text)) {
    return { intent: 'create_expense_request', entities: {} };
  }

  // List expenses patterns
  if (/\b(list|show|get|view)\s+(my\s+)?(expenses|expesnes|expences|bills|costs)\b/.test(text) ||
      /\b(my\s+)?(recent\s+)?(expenses|expesnes|expences|bills|costs)\b/.test(text) ||
      /\bwhat.*?(expenses|expesnes|expences|bills|costs).*?(do\s+i\s+have|have\s+i)\b/.test(text)) {
    return { intent: 'list_expenses', entities: {} };
  }

  // Delete expense patterns - match with or without ID
  if (/\b(delete|remove|cancel)\s+(expense|expesne|expence|bill)\b/i.test(text)) {
    // Try to extract ID
    const idMatch = text.match(/\b(\d+)\b/);
    if (idMatch) {
      return extractDeleteExpenseEntities(text);
    } else {
      return { intent: 'delete_expense_request', entities: {} };
    }
  }
  if (/(remove|delete).*?(expense|expesne|expence|bill).*?(\d+)/i.test(text)) {
    return extractDeleteExpenseEntities(text);
  }

  // Update expense patterns - be more specific
  if (/\b(update|edit|change|modify)\s+(expense|bill)\s+(\d+)\b/.test(text)) {
    return extractUpdateExpenseEntities(text);
  }

  // Split expense patterns
  if (/\b(split|divide)\s+(expense|bill)\s+(\d+)\b/.test(text) ||
      /\bsplit.*?(expense|bill).*?(\d+).*?(equally|custom)\b/.test(text)) {
    return extractSplitExpenseEntities(text);
  }

  // Profile management patterns
  if (/\b(show|view|get)\s+(my\s+)?(profile|account|info)\b/.test(text) ||
      /\b(my\s+)?(profile|account|info)\b/.test(text)) {
    return { intent: 'show_profile', entities: {} };
  }

  if (/\b(update|edit|change)\s+(my\s+)?(profile|account|info)\b/.test(text)) {
    return extractUpdateProfileEntities(text);
  }

  // User management patterns (admin only)
  if (/\b(add|create|new)\s+(user|member|person)\s+/.test(text)) {
    return extractAddUserEntities(text);
  }

  // Improved: match 'how to see all users', 'how to list all users', 'list me all users', 'show me all users', etc.
  if (/\b(how to|how do i|how can i|show|get|list|view)\s+(me\s+)?(all\s+)?(users|members|people)\b/i.test(text)) {
    return { intent: 'list_users', entities: {} };
  }

  if (/\b(list|show|get)\s+(all\s+)?(users|members|people)\b/.test(text)) {
    return { intent: 'list_users', entities: {} };
  }

  return { intent: 'general_chat', entities: {} };
}

/**
 * LLM-based intent detection for complex queries with improved prompt
 */
async function detectIntentLLM(message) {
  const prompt = `You are an intent classifier for an expense management system.\n\nUser message: "${message}"\n\nIMPORTANT:\n- ONLY return a single JSON object with real values.\n- Do NOT include explanations, code blocks, or type placeholders (e.g., do NOT use 'number' or 'string').\n- For amounts or IDs, use realistic example values (e.g., 123.45, 42).\n- Do NOT return any text, code blocks, or explanations. Only output a single JSON object.\n\nAvailable intents:\n- create_expense\n- list_expenses\n- delete_expense\n- delete_expense_request\n- update_expense\n- split_expense\n- show_profile\n- update_profile\n- add_user\n- list_users\n- help\n- general_chat\n\nRespond with JSON only: {"intent": "intent_name", "entities": {}}\n\nFor create_expense, extract: {"description": "Lunch with team", "total_amount": 123.45}\nFor delete_expense, extract: {"id": 42}\nFor add_user, extract: {"name": "John Doe", "email": "john@example.com", "role": "user"}\nFor other intents, use empty entities: {}`;

  const response = await getBotReply([
    { role: 'user', content: prompt }
  ], { temperature: 0.1, max_tokens: 100 });

  try {
    // 1. Clean response from markdown code blocks first
    let cleanResponse = response.replace(/```json\n?|```/g, '').trim();

    // 2. Extract all JSON objects from the response
    const jsonMatches = cleanResponse.match(/\{[\s\S]*?\}/g);
    if (jsonMatches && jsonMatches.length > 0) {
      for (const jsonStr of jsonMatches) {
        // Ignore JSON with type placeholders
        if (/"(number|string|boolean)"/.test(jsonStr) || /: ?number|: ?string|: ?boolean/.test(jsonStr)) {
          continue;
        }
        try {
          const result = JSON.parse(jsonStr);
          if (result.intent) {
            // If intent is general_chat, return a user-friendly fallback message
            if (result.intent === 'general_chat') {
              return { intent: 'general_chat', entities: {}, message: "I'm here to help with expense management. Please ask a specific question or action." };
            }
            return result;
          }
        } catch (jsonErr) {
          // Try next JSON block
          continue;
        }
      }
    }
    throw new Error('No valid intent JSON found in response');
  } catch (error) {
    console.error('Failed to parse LLM intent response:', response);
    // Fallback: use regex-based intent detection
    return detectIntentRegex(message);
  }
}

/**
 * Extract entities for create expense intent
 */
function extractCreateExpenseEntities(text) {
  const entities = {};
  
  // Extract amount (handles various formats: $25, 25.50, twenty-five)
  const amountPatterns = [
    /\$(\d+(?:\.\d{2})?)/,
    /(\d+(?:\.\d{2})?)\s*(?:dollars?|bucks?|usd|\$)/,
    /(\d+(?:\.\d{2})?)/
  ];
  
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      entities.total_amount = parseFloat(match[1]);
      break;
    }
  }
  
  // Extract description (everything except amount and trigger words)
  let description = text
    .replace(/\b(create|add|new|spent|paid|cost|expense|bill|i|on|for|dollars?|bucks?|usd|\$)\b/g, '')
    .replace(/\d+(?:\.\d{2})?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (description) {
    entities.description = description;
  }
  
  return { intent: 'create_expense', entities };
}

/**
 * Extract entities for delete expense intent
 */
function extractDeleteExpenseEntities(text) {
  const idMatch = text.match(/\b(\d+)\b/);
  return {
    intent: 'delete_expense',
    entities: { id: idMatch ? parseInt(idMatch[1]) : undefined }
  };
}

/**
 * Extract entities for update expense intent
 */
function extractUpdateExpenseEntities(text) {
  const entities = {};

  // Extract ID if present
  const idMatch = text.match(/\b(\d+)\b/);
  if (idMatch) {
    entities.id = parseInt(idMatch[1]);
  }

  // Extract amount if present
  const amountMatch = text.match(/\$?(\d+(?:\.\d{2})?)/);
  if (amountMatch) {
    entities.total_amount = parseFloat(amountMatch[1]);
  }

  // Extract description (expense name)
  // Match phrases like 'update my expense food to 500', 'change expense lunch to 100', etc.
  const descMatch = text.match(/expense\s+([a-zA-Z][a-zA-Z0-9\s]*)\s+(to\s+)?\d+/i);
  if (descMatch) {
    entities.description = descMatch[1].trim();
  } else {
    // Fallback: try to extract description from the text
    let description = text
      .replace(/\b(update|edit|change|modify|expense|bill|id|to)\b/g, '')
      .replace(/\d+(?:\.\d{2})?/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (description) {
      entities.description = description;
    }
  }

  return { intent: 'update_expense', entities };
}

/**
 * Extract entities for split expense intent
 */
function extractSplitExpenseEntities(text) {
  const entities = {};
  
  // Extract expense ID
  const idMatch = text.match(/\b(\d+)\b/);
  if (idMatch) {
    entities.id = parseInt(idMatch[1]);
  }
  
  // Determine split type
  if (/\bequally?\b/.test(text)) {
    entities.type = 'equal';
  } else if (/\bcustom\b/.test(text)) {
    entities.type = 'custom';
  }
  
  return { intent: 'split_expense', entities };
}

/**
 * Extract entities for update profile intent
 */
function extractUpdateProfileEntities(text) {
  const entities = {};

  // Extract field and value for name
  if (/\bname\b/.test(text)) {
    // Match 'update my name to Super admin', 'change name to ...', etc.
    const nameMatch = text.match(/name\s+(to\s+)?([a-zA-Z][a-zA-Z\s]*)/i);
    if (nameMatch) {
      entities.field = 'name';
      entities.value = nameMatch[2].trim();
    }
  } else if (/\bemail\b/.test(text)) {
    entities.field = 'email';
    const emailMatch = text.match(/email\s+(to\s+)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch) {
      entities.value = emailMatch[2];
    }
  }

  return { intent: 'update_profile', entities };
}

/**
 * Extract entities for add user intent
 */
function extractAddUserEntities(text) {
  const entities = {};
  
  // Extract name
  const nameMatch = text.match(/(?:name|user)\s+([a-zA-Z\s]+)/);
  if (nameMatch) {
    entities.name = nameMatch[1].trim();
  }
  
  // Extract email
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    entities.email = emailMatch[1];
  }
  
  // Extract role
  if (/\badmin\b/.test(text)) {
    entities.role = 'admin';
  } else {
    entities.role = 'user';
  }
  
  return { intent: 'add_user', entities };
}

module.exports = { detectIntent };