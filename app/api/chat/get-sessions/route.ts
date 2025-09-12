import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const sessionsCollection = db.collection('chat_sessions');

    // Get all chat sessions for the email, sorted by most recent
    const sessions = await sessionsCollection
      .find({ email: email.toLowerCase() })
      .sort({ lastMessageAt: -1 })
      .toArray();

    // Format sessions for frontend
    const formattedSessions = sessions.map(session => ({
      id: session._id.toString(),
      email: session.email,
      createdAt: session.createdAt,
      lastMessageAt: session.lastMessageAt,
      messageCount: session.messageCount,
      lastMessage: session.lastMessage,
      lastSender: session.lastSender,
      status: session.status
    }));

    return NextResponse.json({
      success: true,
      sessions: formattedSessions,
      count: formattedSessions.length
    });

  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
