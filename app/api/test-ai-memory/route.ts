import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Security check - verify admin session
    const sessionToken = request.cookies.get('symbiont-session')?.value;
    const adminEmail = process.env.ADMIN_EMAIL || 'your-admin@email.com';
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No session found' },
        { status: 401 }
      );
    }

    const userEmail = await verifySession(sessionToken);
    if (!userEmail || userEmail !== adminEmail) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const sessionId = searchParams.get('sessionId');

    if (!email || !sessionId) {
      return NextResponse.json(
        { error: 'Email and sessionId are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const messagesCollection = db.collection('chat_messages');

    // Get all messages for this session
    const messages = await messagesCollection
      .find({
        email: email.toLowerCase(),
        sessionId: sessionId
      })
      .sort({ timestamp: 1 })
      .toArray();

    // Get session info
    const sessionsCollection = db.collection('chat_sessions');
    const session = await sessionsCollection.findOne({
      _id: new (await import('mongodb')).ObjectId(sessionId)
    });

    return NextResponse.json({
      success: true,
      session: session,
      messageCount: messages.length,
      messages: messages.map(msg => ({
        id: msg._id,
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.timestamp,
        sessionId: msg.sessionId
      })),
      testInfo: {
        email: email,
        sessionId: sessionId,
        totalMessages: messages.length,
        lastMessage: messages[messages.length - 1]?.text || 'No messages',
        firstMessage: messages[0]?.text || 'No messages'
      }
    });

  } catch (error) {
    console.error('Test AI memory error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Security check - verify admin session
    const sessionToken = request.cookies.get('symbiont-session')?.value;
    const adminEmail = process.env.ADMIN_EMAIL || 'your-admin@email.com';
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No session found' },
        { status: 401 }
      );
    }

    const userEmail = await verifySession(sessionToken);
    if (!userEmail || userEmail !== adminEmail) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { email, sessionId, testMessage } = await request.json();

    if (!email || !sessionId || !testMessage) {
      return NextResponse.json(
        { error: 'Email, sessionId, and testMessage are required' },
        { status: 400 }
      );
    }

    // Test the AI response with memory
    const response = await fetch(`${request.nextUrl.origin}/api/chat/ai-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        email: email,
        sessionId: sessionId
      }),
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      testMessage: testMessage,
      aiResponse: result,
      testInfo: {
        email: email,
        sessionId: sessionId,
        responseStatus: response.status,
        hasMemory: result.success
      }
    });

  } catch (error) {
    console.error('Test AI memory POST error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
