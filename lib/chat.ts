import { getDatabase } from './mongodb';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  sessionId: string;
}

export interface ChatSession {
  id: string;
  email: string;
  createdAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  lastMessage?: string;
  lastSender?: 'user' | 'ai';
  status: 'active' | 'archived';
}

// Create a new chat session
export async function createChatSession(email: string): Promise<string> {
  const db = await getDatabase();
  const sessionsCollection = db.collection('chat_sessions');
  
  const session = await sessionsCollection.insertOne({
    email: email.toLowerCase(),
    createdAt: new Date(),
    lastMessageAt: new Date(),
    messageCount: 0,
    status: 'active'
  });
  
  return session.insertedId.toString();
}

// Save a message to the database
export async function saveMessage(
  email: string, 
  message: string, 
  sender: 'user' | 'ai', 
  sessionId?: string
): Promise<{ messageId: string; sessionId: string }> {
  const db = await getDatabase();
  const messagesCollection = db.collection('chat_messages');
  const sessionsCollection = db.collection('chat_sessions');

  let finalSessionId = sessionId;

  // Create new session if none provided
  if (!finalSessionId) {
    finalSessionId = await createChatSession(email);
  }

  // Save the message
  const messageDoc = {
    sessionId: finalSessionId,
    email: email.toLowerCase(),
    text: message,
    sender,
    timestamp: new Date(),
    createdAt: new Date()
  };

  const result = await messagesCollection.insertOne(messageDoc);

  // Update session with latest message info
  await sessionsCollection.updateOne(
    { _id: new (await import('mongodb')).ObjectId(finalSessionId) },
    { 
      $set: { 
        lastMessageAt: new Date(),
        lastMessage: message,
        lastSender: sender
      },
      $inc: { messageCount: 1 }
    }
  );

  return {
    messageId: result.insertedId.toString(),
    sessionId: finalSessionId
  };
}

// Get messages for a specific session or all messages for an email
export async function getMessages(email: string, sessionId?: string): Promise<ChatMessage[]> {
  const db = await getDatabase();
  const messagesCollection = db.collection('chat_messages');

  const query: Record<string, unknown> = { email: email.toLowerCase() };
  
  if (sessionId) {
    query.sessionId = sessionId;
  }

  const messages = await messagesCollection
    .find(query)
    .sort({ timestamp: 1 })
    .toArray();

  return messages.map(msg => ({
    id: msg._id.toString(),
    text: msg.text,
    sender: msg.sender,
    timestamp: msg.timestamp,
    sessionId: msg.sessionId
  }));
}

// Get all chat sessions for an email
export async function getChatSessions(email: string): Promise<ChatSession[]> {
  const db = await getDatabase();
  const sessionsCollection = db.collection('chat_sessions');

  const sessions = await sessionsCollection
    .find({ email: email.toLowerCase() })
    .sort({ lastMessageAt: -1 })
    .toArray();

  return sessions.map(session => ({
    id: session._id.toString(),
    email: session.email,
    createdAt: session.createdAt,
    lastMessageAt: session.lastMessageAt,
    messageCount: session.messageCount,
    lastMessage: session.lastMessage,
    lastSender: session.lastSender,
    status: session.status
  }));
}

// Get the latest active session for an email
export async function getLatestSession(email: string): Promise<ChatSession | null> {
  const db = await getDatabase();
  const sessionsCollection = db.collection('chat_sessions');

  const session = await sessionsCollection.findOne(
    { 
      email: email.toLowerCase(),
      status: 'active'
    },
    { sort: { lastMessageAt: -1 } }
  );

  if (!session) return null;

  return {
    id: session._id.toString(),
    email: session.email,
    createdAt: session.createdAt,
    lastMessageAt: session.lastMessageAt,
    messageCount: session.messageCount,
    lastMessage: session.lastMessage,
    lastSender: session.lastSender,
    status: session.status
  };
}
