# Application‑Domain‑Only Chatbot Instructions

This guide shows how to build a chatbot that knows *only* your application’s data and automatically calls your backend APIs (with the current user’s authentication) for create/read/update/delete actions.

---

## 1. Restrict Bot Knowledge with RAG

1. **Collect Source Documents**

   * Application schema docs, user guides, business rules, data model definitions.
2. **Embed & Index**

   * Use an embedding model (e.g., OpenAI, Cohere) to encode each doc chunk.
   * Store embeddings in a vector database (Pinecone, Weaviate, or FAISS).
3. **Retrieve Context**

   * For each user query: embed the query and fetch top‑K relevant docs.
   * Prepend these passages as “context” in the LLM prompt.

---

## 2. Enforce System Prompt Guardrails

Use a strict system prompt at conversation start:

```text
System: "You are the ACME App assistant. Only use knowledge from the provided context. " +
  "If asked about anything outside the ACME App domain, respond: " +
  ""Sorry, I can’t help with that.""
```

This prevents hallucinations and limits responses to your domain.

---

## 3. Intent & Entity Extraction

1. **Detect Intent**

   * Fine‑tuned classification model or prompt-based chain.
   * Labels: `create_item`, `list_items`, `update_item`, `delete_item`, `general_chat`.
2. **Extract Entities**

   * Use regex/rule engine or LLM chain to pull parameters (e.g. IDs, field values).
3. **Validation**

   * Ensure extracted values match expected types/format (dates, enums, IDs).

---

## 4. Action Execution Layer

1. **Map Intent → Endpoint**

   * e.g. `create_project` → `POST /api/projects`
2. **Attach Auth Token**

   * Forward the user’s JWT/OAuth token in the `Authorization` header.
3. **Call Backend API**

   * Send parsed parameters as JSON payload.
4. **Handle Response**

   * Parse API JSON, map errors → user‑friendly messages.

```javascript
async function executeAction(intent, params, token) {
  const endpoint = intentToEndpoint[intent];
  return fetch(endpoint, {
    method: endpoint.startsWith('GET') ? 'GET' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(params),
  }).then(res => res.json());
}
```

---

## 5. End‑to‑End Flow

1. **User→Chat Backend**

   * Sends message + auth token.
2. **RAG Retriever**

   * Fetches context docs for prompt.
3. **LLM Decision**

   * Generates intent & entities or a free‑text reply.
4. **Action Router**

   * If intent ≠ `general_chat`, call `executeAction`.
5. **Response Formatter**

   * For actions: build success/error message.
   * For chat: return LLM text.
6. **Return to Frontend**

   * Bot’s reply appears in the chat widget.

---

## 6. Example: Creating a Project

1. **User**: “Create a project named ‘Apollo’ with deadline tomorrow.”
2. **Retriever**: pulls project‑schema doc.
3. **LLM**: detects `create_project`, entities `{ name: 'Apollo', deadline: '2025-07-12' }`.
4. **Backend**: `POST /api/projects` + token.
5. **API**: returns `{ id: 42, name: 'Apollo', deadline: '2025-07-12' }`.
6. **Bot**: “✅ Project ‘Apollo’ (ID 42) created with deadline July 12, 2025.”

---

## 7. Security & Best Practices

* **Validate All Inputs**: on both parser and API layers.
* **Authorize on Backend**: enforce user permissions server‑side.
* **Logging & Auditing**: log every action call with user ID and timestamp.
* **Rate Limiting**: protect your API from abuse.
* **Error Handling**: fallback gracefully if the model or API fails.

---

## 8. Next Steps

* **Fine‑Tune RAG**: adjust number of docs, chunk sizes, and MMR re‑ranking.
* **Improve Intent Model**: gather user dialogues to refine classification.
* **Monitor & Iterate**: track incorrect actions or misunderstandings and retrain.
