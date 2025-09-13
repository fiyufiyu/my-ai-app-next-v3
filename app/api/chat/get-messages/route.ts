import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const messagesCollection = db.collection('chat_messages');

    const query: Record<string, unknown> = { email: email.toLowerCase() };
    
    // Filter by sessionId if provided, otherwise get all messages for the user
    if (sessionId) {
      query.sessionId = sessionId;
      console.log(`Loading messages for session ${sessionId} for ${email}, limit: ${limit}`);
    } else {
      console.log(`Loading ALL conversation history for ${email}, limit: ${limit}`);
    }

    // Get messages sorted by timestamp, with limit
    const messages = await messagesCollection
      .find(query)
      .sort({ timestamp: 1 }) // Oldest first for proper conversation flow
      .limit(limit)
      .toArray();

    console.log(`Found ${messages.length} messages for ${email}`);

    // Transform messages to match frontend format
    const formattedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      text: msg.text,
      sender: msg.sender,
      timestamp: msg.timestamp,
      sessionId: msg.sessionId
    }));

    // Get session info if sessionId is provided
    let sessionInfo = null;
    if (sessionId) {
      const sessionsCollection = db.collection('chat_sessions');
      const session = await sessionsCollection.findOne({ 
        _id: new (await import('mongodb')).ObjectId(sessionId) 
      });
      
      if (session) {
        sessionInfo = {
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
    }

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      count: formattedMessages.length,
      sessionInfo
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
