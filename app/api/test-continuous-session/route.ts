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

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const messagesCollection = db.collection('chat_messages');
    const sessionsCollection = db.collection('chat_sessions');

    // Get user's session info
    const session = await sessionsCollection.findOne({
      email: email.toLowerCase(),
      status: 'active'
    }, { sort: { lastMessageAt: -1 } });

    // Get last 25 messages from user's entire conversation
    const recentMessages = await messagesCollection
      .find({
        email: email.toLowerCase()
      })
      .sort({ timestamp: -1 })
      .limit(25)
      .toArray();

    // Get total message count
    const totalMessages = await messagesCollection.countDocuments({
      email: email.toLowerCase()
    });

    return NextResponse.json({
      success: true,
      user: email,
      session: session ? {
        id: session._id.toString(),
        createdAt: session.createdAt,
        lastMessageAt: session.lastMessageAt,
        messageCount: session.messageCount,
        status: session.status
      } : null,
      conversationStats: {
        totalMessages: totalMessages,
        last25Messages: recentMessages.length,
        messageBreakdown: {
          user: recentMessages.filter(m => m.sender === 'user').length,
          assistant: recentMessages.filter(m => m.sender === 'ai').length
        }
      },
      lastFewMessages: recentMessages.slice(0, 5).map(msg => ({
        text: msg.text.substring(0, 100) + (msg.text.length > 100 ? '...' : ''),
        sender: msg.sender,
        timestamp: msg.timestamp
      }))
    });

  } catch (error) {
    console.error('Test continuous session error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
