import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, List, ListItem, ListItemText, Paper } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic'; // Import MicIcon
import VolumeUpIcon from '@mui/icons-material/VolumeUp'; // Import VolumeUpIcon
import VolumeOffIcon from '@mui/icons-material/VolumeOff'; // Import VolumeOffIcon
import { useAuth } from '../contexts/AuthContext';

const Chat = () => {
  const { apiClient } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  const recognitionRef = useRef(null); // Ref for SpeechRecognition
  const [isListening, setIsListening] = useState(false); // State for listening status
  const [isSpeaking, setIsSpeaking] = useState(false); // State for speaking status
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true); // State for voice output toggle

  // Scroll to bottom whenever messages change
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Only listen for a single utterance
      recognitionRef.current.interimResults = true; // Get interim results
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        console.log('Speech recognition started');
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        console.log('Speech recognition ended');
        // If there's input, send the message after recognition ends
        if (input.trim()) {
          sendMessage();
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    } else {
      console.warn('Speech Recognition API not supported in this browser.');
    }

    // Clean up speech synthesis on component unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text-to-Speech for assistant replies
  useEffect(() => {
    if (voiceOutputEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content && !isSpeaking) {
        speakText(lastMessage.content);
      }
    }
  }, [messages, voiceOutputEnabled, isSpeaking]);

  const speakText = (text) => {
    if (window.speechSynthesis && text) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleVoiceOutput = () => {
    setVoiceOutputEnabled(prev => {
      if (prev) {
        // If voice output is being turned off, cancel any ongoing speech
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      }
      return !prev;
    });
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setInput(''); // Clear previous input before listening
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const sendMessage = async () => {
    // Stop listening if active before sending message
    if (isListening) {
      stopListening();
    }

    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');

    try {
      const res = await apiClient.post('/chat', { messages: newMessages });
      const assistantReply = res.data.reply;
      if (assistantReply) {
        setMessages([...newMessages, { role: 'assistant', content: assistantReply }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '70vh' }}>
      <Paper sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <List>
          {messages.map((m, i) => (
            <ListItem key={i} sx={{ justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <ListItemText
                primary={m.content}
                sx={{
                  backgroundColor: m.role === 'user' ? 'primary.main' : 'grey.300',
                  color: m.role === 'user' ? 'common.white' : 'text.primary',
                  borderRadius: 1,
                  p: 1,
                  maxWidth: '70%',
                  whiteSpace: 'pre-wrap',
                }}
              />
            </ListItem>
          ))}
          <div ref={endRef} />
        </List>
      </Paper>
      <Box sx={{ display: 'flex', p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          multiline
        />
        <IconButton
          color="primary"
          onClick={startListening}
          disabled={isListening}
          sx={{ ml: 1 }}
        >
          <MicIcon />
        </IconButton>
        <IconButton
          color="primary"
          onClick={toggleVoiceOutput}
          sx={{ ml: 1 }}
        >
          {voiceOutputEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
        </IconButton>
        <IconButton color="primary" onClick={sendMessage} sx={{ ml: 1 }}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Chat; 