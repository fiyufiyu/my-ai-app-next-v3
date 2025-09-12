'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import MoodPopup from '../components/MoodPopup';

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
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string>('');
  const [showMoodPopup, setShowMoodPopup] = useState(false);
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
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: 'smooth'
      });
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

    setIsLoadingHistory(true);
    setLoadingMessage('Retrieving your conversation history...');

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
    } finally {
      setIsLoadingHistory(false);
      setLoadingMessage('');
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
    setIsLoadingHistory(true);
    setLoadingMessage('Checking for existing conversations...');
    
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
    } finally {
      setIsLoadingHistory(false);
      setLoadingMessage('');
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

  // Handle mood submission
  const handleMoodSubmit = async (emotion: string, explanation: string) => {
    console.log('handleMoodSubmit called with:', emotion, explanation);
    const moodMessage = `I am feeling like "${emotion}", and i am thinking "${explanation}".`;
    console.log('Mood message:', moodMessage);
    
    try {
      // Add mood message to UI immediately
      addMessage(moodMessage, 'user');
      console.log('Message added to UI');
      
      // Save mood message to database
      const saveResult = await saveMessageToDB(moodMessage, 'user');
      console.log('Message saved to DB:', saveResult);
      
      // Get AI response to the mood
      await getAIResponse(moodMessage);
      console.log('AI response received');
      
      // Close the popup
      setShowMoodPopup(false);
      console.log('Popup closed');
    } catch (error) {
      console.error('Error in handleMoodSubmit:', error);
    }
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
      setIsLoadingHistory(true);
      setLoadingMessage('Initializing your chat session...');
      
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
      } finally {
        setIsLoadingHistory(false);
        setLoadingMessage('');
        setIsInitialized(true);
      }
    };

    initializeChat();
  }, [addMessage, loadMessagesFromDB]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messages.length > 0) {
      // Use setTimeout to ensure DOM is updated before scrolling
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, isLoading]);

  return (
    <div className="min-h-screen flex flex-col overflow-hidden font-sans" style={{
      background: 'radial-gradient(ellipse at center, #0f0f0f 0%, #000 70%)',
      color: '#e0e0e0'
    }}>
      {/* Mood Popup */}
      <MoodPopup
        isOpen={showMoodPopup}
        onClose={() => setShowMoodPopup(false)}
        onSubmit={handleMoodSubmit}
      />
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
      <div className="max-w-4xl w-full mx-auto p-4">
        {/* Loading State */}
        {!isInitialized && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center max-w-md mx-auto">
              {/* Animated Symbiont Logo */}
              <div className="mb-8">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-white/5 animate-pulse"></div>
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 to-white/10 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-white/30 to-white/15 animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-2xl font-bold">S</div>
                </div>
              </div>
              
              {/* Loading Message */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">Symbiont AI</h3>
                <p className="text-gray-400 text-sm mb-4">
                  {loadingMessage || 'Preparing your personalized MBTI experience...'}
                </p>
              </div>
              
              {/* Animated Dots */}
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-6 w-full bg-white/10 rounded-full h-1 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-white/30 to-white/60 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {/* Compact Messages Area - Small scrollable container */}
        {isInitialized && (
          <div 
            ref={chatBoxRef}
            className="overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-black/20 border border-white/10 rounded-xl mb-4"
            style={{ 
              scrollbarWidth: 'thin', 
              scrollbarColor: 'rgba(255, 255, 255, 0.1) transparent',
              height: '400px',
              maxHeight: '400px'
            }}
          >
            {/* History Loading Indicator */}
            {isLoadingHistory && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '-0.32s' }}></div>
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '-0.16s' }}></div>
                    <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-sm text-gray-400">{loadingMessage}</span>
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] p-3 rounded-xl leading-relaxed animate-fade-in ${
                  message.sender === 'ai'
                    ? 'bg-white/5 border border-white/10 self-start rounded-bl-md text-sm font-medium'
                    : 'bg-gray-800 self-end rounded-br-md text-white text-sm font-semibold'
                }`}
              >
                {message.text}
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-center gap-1 p-3 bg-white/5 border border-white/10 rounded-xl rounded-bl-md self-start max-w-[85%]">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '-0.32s' }}></div>
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '-0.16s' }}></div>
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fixed Bottom Section - Outside of scroll area */}
        {isInitialized && (
          <>
            {/* Mood Button */}
            <div className="mb-4">
              <button
                onClick={() => setShowMoodPopup(true)}
                className="flex items-center justify-center gap-3 px-6 py-3 bg-white border border-white rounded-xl text-black text-sm font-semibold transition-all duration-300 hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/10 active:translate-y-0 active:shadow-none w-full"
              >
                <span className="text-xl">😊</span>
                <span>Share your mood</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isLoadingHistory ? "Loading your conversation..." : "Ask me anything about your MBTI..."}
                disabled={isLoading || isLoadingHistory}
                className="flex-1 px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white text-base transition-all duration-300 backdrop-blur-sm focus:outline-none focus:border-white/30 focus:bg-black/80 focus:shadow-lg focus:shadow-white/5 placeholder:text-gray-500 focus:placeholder:text-gray-400 disabled:opacity-50"
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={isLoading || isLoadingHistory || !inputValue.trim()}
                className="flex items-center justify-center w-12 h-12 bg-white border-none rounded-xl cursor-pointer transition-all duration-300 hover:bg-gray-100 hover:-translate-y-0.5 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50"
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
          </>
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