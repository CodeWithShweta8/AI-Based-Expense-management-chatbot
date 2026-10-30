import axios from 'axios';
import { API_BASE_URL } from '../contexts/AuthContext';

const client = axios.create({ baseURL: API_BASE_URL });

export const getChatReply = async (messages) => {
  const res = await client.post('/chat', { messages });
  return res.data.reply;
}; 