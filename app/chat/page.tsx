'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  sessionId?: string;
}

interface ChatSession {
  id: string;
  email: string;
  createdAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  lastMessage?: string;
  lastSender?: 'user' | 'ai';
  status: 'active' | 'archived';
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string>('');
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // Fallback responses if AI fails
  const fallbackResponses = [
    "I'm having trouble connecting right now, but I'm here to help. Could you try again?",
    "Let me think about that... Sometimes the best insights come from taking a moment to reflect.",
    "That's really interesting. I'd love to explore that more with you when my connection is better.",
  ];

  // Function to scroll to the bottom of the chat
  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  };

  // Function to add a message to the chat
  const addMessage = useCallback((text: string, sender: 'user' | 'ai', sessionId?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
      sessionId: sessionId || currentSession?.id,
    };
    setMessages(prev => [...prev, newMessage]);
  }, [currentSession?.id]);

  // Function to save message to database
  const saveMessageToDB = useCallback(async (text: string, sender: 'user' | 'ai') => {
    if (!userEmail) return null;

    try {
      const response = await fetch('/api/chat/save-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          message: text,
          sender,
          chatSessionId: currentSession?.id || undefined
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Update current session if we get one back
        if (result.sessionId && result.sessionId !== currentSession?.id) {
          // Fetch the updated session info
          const sessionResponse = await fetch(`/api/chat/get-latest-session?email=${encodeURIComponent(userEmail)}`);
          const sessionResult = await sessionResponse.json();
          if (sessionResult.success && sessionResult.session) {
            setCurrentSession(sessionResult.session);
          }
        }
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  }, [userEmail, currentSession?.id]);

  // Function to load messages from database
  const loadMessagesFromDB = useCallback(async (sessionId?: string) => {
    if (!userEmail) return;

    try {
      const targetSessionId = sessionId || currentSession?.id;
      const response = await fetch(`/api/chat/get-messages?email=${encodeURIComponent(userEmail)}&sessionId=${targetSessionId || ''}&limit=50`);
      const result = await response.json();
      
      if (result.success) {
        const loadedMessages = result.messages.map((msg: { timestamp: string; sessionId?: string; [key: string]: unknown }) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(loadedMessages);
        
        // Update session info if provided
        if (result.sessionInfo) {
          setCurrentSession(result.sessionInfo);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    }
  }, [userEmail, currentSession?.id]);

  // Function to get user email from session
  const getUserEmail = async () => {
    try {
      const response = await fetch('/api/user/me');
      const result = await response.json();
      
      if (result.success) {
        setUserEmail(result.email);
        return result.email;
      }
    } catch (error) {
      console.error('Error getting user email:', error);
    }
    return null;
  };

  // Function to get or create latest session
  const getOrCreateLatestSession = async (email: string) => {
    try {
      const response = await fetch(`/api/chat/get-latest-session?email=${encodeURIComponent(email)}`);
      const result = await response.json();
      
      if (result.success) {
        if (result.session) {
          setCurrentSession(result.session);
          return result.session;
        } else {
          // No active session found, we'll create one when the first message is sent
          return null;
        }
      }
    } catch (error) {
      console.error('Error getting latest session:', error);
    }
    return null;
  };

  // Function to get AI response from OpenAI
  const getAIResponse = async (userMessage: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat/ai-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          email: userEmail,
          sessionId: currentSession?.id
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        addMessage(result.response, 'ai');
        await saveMessageToDB(result.response, 'ai');
      } else {
        // Fallback to mock response if AI fails
        const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        addMessage(fallbackResponse, 'ai');
        await saveMessageToDB(fallbackResponse, 'ai');
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Fallback to mock response on error
      const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      addMessage(fallbackResponse, 'ai');
      await saveMessageToDB(fallbackResponse, 'ai');
    }
    
    setIsLoading(false);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userMessage = inputValue.trim();

    if (userMessage && !isLoading && userEmail) {
      // Add message to UI immediately
      addMessage(userMessage, 'user');
      setInputValue('');
      
      // Save user message to database
      await saveMessageToDB(userMessage, 'user');
      
      // Get AI response
      await getAIResponse(userMessage);
    }
  };

  // Initialize chat - get user email and load messages
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const email = await getUserEmail();
        if (email) {
          // Get or create latest session
          const session = await getOrCreateLatestSession(email);
          
          if (session) {
            // Load messages for existing session
            await loadMessagesFromDB(session.id);
          } else {
            // No existing session, show welcome message
            const welcomeMessage = "Hello! I'm your personal MBTI Symbiont. I'm here to help you understand yourself better. What's on your mind today?";
            addMessage(welcomeMessage, 'ai');
            // Don't save welcome message to DB yet - wait for first user message
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        setError('Failed to initialize chat');
      }
      setIsInitialized(true);
    };

    initializeChat();
  }, [addMessage, loadMessagesFromDB]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="min-h-screen flex flex-col overflow-hidden font-sans" style={{
      background: 'radial-gradient(ellipse at center, #0f0f0f 0%, #000 70%)',
      color: '#e0e0e0'
    }}>
      {/* Navbar */}
      <nav className="px-4 sm:px-8 py-3 sm:py-5 border-b border-white/10 bg-black/80 backdrop-blur-xl relative z-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight uppercase bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
            Symbiont AI
          </div>
          {currentSession && (
            <div className="text-xs text-gray-400">
              Session: {currentSession.messageCount} messages
            </div>
          )}
        </div>
      </nav>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 overflow-hidden relative">
        {/* Loading State */}
        {!isInitialized && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your chat...</p>
            </div>
          </div>
        )}

        {/* Chat Box */}
        {isInitialized && (
          <div 
            ref={chatBoxRef}
            className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent' }}
          >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[80%] p-3 sm:p-4 rounded-2xl leading-relaxed animate-fade-in ${
                message.sender === 'ai'
                  ? 'bg-white/5 border border-white/10 self-start rounded-bl-md text-base font-medium'
                  : 'bg-gray-800 self-end rounded-br-md text-white text-base font-semibold'
              }`}
            >
              {message.text}
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-center gap-1 p-3 sm:p-4 bg-white/5 border border-white/10 rounded-2xl rounded-bl-md self-start max-w-[80%]">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '-0.32s' }}></div>
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '-0.16s' }}></div>
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          </div>
        )}

        {/* Input Form */}
        {isInitialized && (
          <form onSubmit={handleSubmit} className="flex gap-3 p-4 border-t border-white/10 bg-transparent mt-auto flex-shrink-0">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about your MBTI..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white text-base transition-all duration-300 backdrop-blur-sm focus:outline-none focus:border-white/30 focus:bg-black/80 focus:shadow-lg focus:shadow-white/5 placeholder:text-gray-500 focus:placeholder:text-gray-400"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="flex items-center justify-center w-12 h-12 bg-white border-none rounded-xl cursor-pointer transition-all duration-300 hover:bg-gray-100 hover:-translate-y-0.5 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="w-5 h-5 stroke-black"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
          </form>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out;
        }
        
        .animate-bounce {
          animation: bounce 1.4s infinite ease-in-out both;
        }
        
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
    </div>
  );
}