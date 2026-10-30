const axios = require('axios');

// LM Studio configuration
const LLM_API_URL = process.env.LLM_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_NAME = process.env.LLM_MODEL_NAME || 'anthropic/claude-3-haiku:beta';
const DEFAULT_TIMEOUT = 30000; // 30 seconds timeout

/**
 * Optimized Llama.cpp API call for faster responses and better memory management
 */
async function getBotReply(messages, options = {}) {
  const defaultOptions = {
    max_tokens: 150,
    temperature: 0.7,
    top_p: 0.9,
    frequency_penalty: 0,
    presence_penalty: 0
  };

  const requestOptions = { ...defaultOptions, ...options };

  // Prepare headers for OpenRouter API
  const headers = {
    'Content-Type': 'application/json',
  };
  if (process.env.OPENROUTER_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.OPENROUTER_API_KEY}`;
  }
  if (process.env.OPENROUTER_REFERER) {
    headers['HTTP-Referer'] = process.env.OPENROUTER_REFERER;
  }
  if (process.env.OPENROUTER_TITLE) {
    headers['X-Title'] = process.env.OPENROUTER_TITLE;
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('Warning: OPENROUTER_API_KEY environment variable is not set. The OpenRouter API will reject requests without a valid key.');
  }

  try {
    const response = await fetch(LLM_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: MODEL_NAME,
        messages,
        ...requestOptions
      })
    });

    if (!response.ok) {
      let errorMsg = `Llama.cpp API error: ${response.statusText}`;
      if (response.status === 401) {
        errorMsg = 'Unauthorized: Check your OPENROUTER_API_KEY environment variable.';
      } else if (response.status === 500) {
        const errorBody = await response.text();
        console.error('Llama.cpp API Internal Server Error response:', errorBody);
        errorMsg = 'Internal Server Error: The LLM API failed to process your request. Please check your model configuration and server logs.';
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I'm sorry, I couldn't process your request.";
  } catch (error) {
    console.error('Error calling Llama.cpp API:', error);
    return "I encountered an error while processing your request. Please try again later.";
  }
}

/**
 * Test LLM connection
 */
async function testConnection() {
  try {
    const response = await getBotReply([
      { role: 'user', content: 'Hello' }
    ], { max_tokens: 10 });
    
    return {
      connected: true,
      model: MODEL_NAME,
      url: LLM_API_URL,
      response: response.substring(0, 50)
    };
  } catch (error) {
    return {
      connected: false,
      model: MODEL_NAME,
      url: LLM_API_URL,
      error: error.message
    };
  }
}

/**
 * Get LLM configuration info
 */
function getConfig() {
  return {
    model: MODEL_NAME,
    url: LLM_API_URL,
    timeout: DEFAULT_TIMEOUT,
    configured: !!(process.env.LLM_API_URL && process.env.LLM_MODEL_NAME)
  };
}

module.exports = { 
  getBotReply, 
  testConnection, 
  getConfig 
};