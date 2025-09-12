import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { email, message, sender, chatSessionId } = await request.json();

    // Validate required fields
    if (!email || !message || !sender) {
      return NextResponse.json(
        { error: 'Email, message, and sender are required' },
        { status: 400 }
      );
    }

    if (!['user', 'ai'].includes(sender)) {
      return NextResponse.json(
        { error: 'Sender must be either "user" or "ai"' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const messagesCollection = db.collection('chat_messages');
    const sessionsCollection = db.collection('chat_sessions');

    let sessionId = chatSessionId;

    // If no session ID provided, check for existing active session first
    if (!sessionId) {
      const existingSession = await sessionsCollection.findOne({
        email: email.toLowerCase(),
        status: 'active'
      }, { sort: { lastMessageAt: -1 } });
      
      if (existingSession) {
        sessionId = existingSession._id.toString();
      } else {
        // Create a new chat session only if no active session exists
        const newSession = await sessionsCollection.insertOne({
          email: email.toLowerCase(),
          createdAt: new Date(),
          lastMessageAt: new Date(),
          messageCount: 0,
          status: 'active'
        });
        sessionId = newSession.insertedId.toString();
      }
    }

    // Save the message
    const messageDoc = {
      sessionId,
      email: email.toLowerCase(),
      text: message,
      sender,
      timestamp: new Date(),
      createdAt: new Date()
    };

    const result = await messagesCollection.insertOne(messageDoc);

    // Update session with latest message info
    await sessionsCollection.updateOne(
      { _id: new (await import('mongodb')).ObjectId(sessionId) },
      { 
        $set: { 
          lastMessageAt: new Date(),
          lastMessage: message,
          lastSender: sender
        },
        $inc: { messageCount: 1 }
      }
    );

    console.log('Message saved:', result.insertedId, 'for session:', sessionId);

    return NextResponse.json({
      success: true,
      messageId: result.insertedId,
      sessionId,
      message: 'Message saved successfully'
    });

  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
