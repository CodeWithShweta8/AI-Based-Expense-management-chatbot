const { getBotReply } = require('../services/llamaService');
const { detectIntent } = require('../services/intentService');
const { execute } = require('../services/actionRouter');
const { retrieveRelevantDocs, getSystemPrompt } = require('../services/knowledgeService');

const chat = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const lastUserMsg = messages[messages.length - 1]?.content || '';
    console.log(`Chat request from user ${req.user.id} (${req.user.name}): ${lastUserMsg}`);

    // Step 1: Intent detection (now async)
    const { intent, entities } = await detectIntent(lastUserMsg);
    console.log(`Detected intent: ${intent}`, entities);

    let reply;

    if (intent !== 'general_chat') {
      // Execute action and return response
      reply = await execute(intent, entities, req.user.name);
      
      // Log action execution
      console.log(`Action executed for intent ${intent}:`, reply?.substring(0, 100) + '...');
      
      // Fall back to graceful message if execute returned null
      if (!reply) {
        reply = "I understand you want to perform an action, but I'm having trouble processing it right now. Could you please rephrase your request or try again?";
      }
    } else {
      // Handle general chat with improved error handling
      reply = await handleGeneralChat(messages, req.user.name, lastUserMsg);
    }

    // Log response
    console.log(`Response to user ${req.user.id}:`, reply.substring(0, 100) + '...');

    res.json({ reply });
  } catch (error) {
    console.error('Chat controller error:', error);
    res.status(500).json({ 
      error: 'I apologize, but I encountered an error while processing your request. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Handle general chat with RAG and system prompt guardrails
 */
async function handleGeneralChat(messages, user, lastUserMsg) {
  try {
    // Check if this is a simple out-of-domain question
    const outOfDomainResponse = checkOutOfDomain(lastUserMsg);
    if (outOfDomainResponse) {
      return outOfDomainResponse;
    }

    // Step 1: Retrieve relevant documents
    const docs = retrieveRelevantDocs(lastUserMsg, 3);
    console.log(`Retrieved ${docs.length} relevant documents for RAG`);

    // Step 2: If no relevant docs found, provide a helpful response
    if (docs.length === 0) {
      return `I'm not able to find specific information about that. I'm designed specifically to help you with expense management. 

Here's what I can help you with:
• Create expenses: "Create expense lunch 25"
• List expenses: "Show my expenses"
• Split expenses: "Split expense 123 equally"
• View profile: "Show my profile"`;
    }

    // Step 3: Generate response using retrieved documents
    const systemPrompt = getSystemPrompt();
    const botReply = await getBotReply([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: lastUserMsg }
    ], { max_tokens: 150 });

    return botReply;
  } catch (error) {
    console.error('Error handling general chat:', error);
    return "I encountered an error while processing your request. Please try again later.";
  }
}

/**
 * Check if question is clearly out of domain
 */
function checkOutOfDomain(message) {
  const lowerMsg = message.toLowerCase();
  
  // Common out-of-domain patterns
  const outOfDomainPatterns = [
    /\b(weather|temperature|forecast)\b/,
    /\b(sports|football|basketball|soccer)\b/,
    /\b(movie|film|tv|television)\b/,
    /\b(music|song|band|artist)\b/,
    /\b(recipe|cook|food|restaurant)\b/,
    /\b(travel|vacation|holiday|trip)\b/,
    /\b(stock|investment|crypto|bitcoin)\b/,
    /\b(programming|code|developer|python|javascript)\b/,
    /\b(news|politics|election|government)\b/,
    /\b(health|doctor|medicine|hospital)\b/
  ];
  
  const isOutOfDomain = outOfDomainPatterns.some(pattern => pattern.test(lowerMsg));
  
  if (isOutOfDomain) {
    return "I'm not able to answer that question. I'm designed specifically to help you with expense management. Is there anything about your expenses, splits, or profile that I can help you with?";
  }
  
  return null;
}

/**
 * Health check endpoint for chat service
 */
const healthCheck = async (req, res) => {
  try {
    // Test LLM connection
    const testResponse = await getBotReply([
      { role: 'user', content: 'Hello' }
    ], { max_tokens: 10 });
    
    res.json({ 
      status: 'healthy',
      llm_connected: !!testResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = { chat, healthCheck };