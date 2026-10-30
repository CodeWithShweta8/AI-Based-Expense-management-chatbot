# Chatbot Integration with llama.cpp

This guide walks you through turning your locally hosted llama.cpp model into a chatbot you can embed in your application. Follow each section in order.

---

## 1. Prepare & Quantize Your Model

1. **Export the model** from LLM Studio as a GGML-format `.bin`:

   ```bash
   # Example: export path in LLM Studio -> ./models/your-model.bin
   ```
2. **Quantize** for speed and smaller size (e.g., 4-bit):

   ```bash
   ./quantize ./models/your-model.bin ./models/your-model-4bit.bin 4
   ```
3. **Verify** local chatbot REPL:

   ```bash
   ./main -m ./models/your-model-4bit.bin --chat
   ```

   You should see a prompt like:

   ```text
   llama.cpp: loaded model with size ...
   >>> Hello
   ```

---

## 2. Run llama.cpp as an API Server

1. In your llama.cpp build directory, launch the server:

   ```bash
   ./main \
     -m ./models/your-model-4bit.bin \
     --chat \
     --api \
     --api-port 5000
   ```
2. The server exposes a JSON-RPC endpoint at:

   ```text
   http://localhost:5000/v1/chat/completions
   ```
3. POST requests must include `model`, `messages`, `max_tokens`, etc.

---

## 3. Build Your Backend Connector

### A. Node.js HTTP Client

```javascript
import axios from 'axios';

export async function getBotReply(messages) {
  const payload = {
    model: 'llama',
    messages,              // [{ role: 'user', content: 'Hi' }, ...]
    max_tokens: 256,
  };

  const res = await axios.post(
    'http://localhost:5000/v1/chat/completions',
    payload,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return res.data.choices[0].message.content;
}
```

### B. Python Microservice (FastAPI)

```python
from fastapi import FastAPI
from pydantic import BaseModel
from llama_cpp import Llama

app = FastAPI()
llm = Llama(model_path='models/your-model-4bit.bin')

class Msg(BaseModel):
    role: str
    content: str

@app.post('/chat')
def chat(messages: list[Msg]):
    prompt = ''.join(f"{m.role}: {m.content}\n" for m in messages)
    resp = llm(chat=prompt, max_tokens=256)
    return {'reply': resp.choices[0].message['content']}
```

---

## 4. Frontend Chat Widget

```jsx
import { useState } from 'react';
import { getBotReply } from './api';

export default function Chat() {
  const [msgs, setMsgs] = useState([]);
  const [inText, setInText] = useState('');

  const send = async () => {
    if (!inText) return;
    const newMsgs = [...msgs, { role: 'user', content: inText }];
    setMsgs(newMsgs);
    setInText('');

    const reply = await getBotReply(newMsgs);
    setMsgs([...newMsgs, { role: 'assistant', content: reply }]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <p className="inline-block bg-gray-200 p-2 rounded">{m.content}</p>
          </div>
        ))}
      </div>
      <div className="p-4 flex">
        <input
          className="flex-1 p-2 border rounded"
          value={inText}
          onChange={(e) => setInText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="ml-2 p-2 bg-blue-600 text-white rounded" onClick={send}>
          Send
        </button>
      </div>
    </div>
  );
}
```

---

## 5. Context Management & Memory

* **Short-Term:** Keep the last *N* turns in memory (client or server).
* **Long-Term:** Store key facts in a database or JSON store; prepend relevant info to prompts.
* **Sessions:** Generate and persist unique session IDs per user.

---

## 6. Deployment & Monitoring

1. **Containerize** your server and API (Docker).
2. **Host** on VPS or platforms like Render/Heroku/Vercel.
3. **Logs:** Capture transcripts, latencies, errors (Winston, Sentry).
4. **Scale:** Use multiple containers with a load balancer.

---

## 7. Next Steps

* **Prompt Engineering:** Refine system/user prompts for domain-specific behavior.
* **Safety & Filters:** Add content moderation or profanity checks.
* **Analytics:** Track usage patterns to build FAQ fallbacks.
* **Optimization:** Experiment with different quantization levels and model sizes.
