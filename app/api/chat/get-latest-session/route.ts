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

    // Get the latest active session for the email
    const session = await sessionsCollection.findOne(
      { 
        email: email.toLowerCase(),
        status: 'active'
      },
      { sort: { lastMessageAt: -1 } }
    );

    if (!session) {
      return NextResponse.json({
        success: true,
        session: null,
        message: 'No active session found'
      });
    }

    const formattedSession = {
      id: session._id.toString(),
      email: session.email,
      createdAt: session.createdAt,
      lastMessageAt: session.lastMessageAt,
      messageCount: session.messageCount,
      lastMessage: session.lastMessage,
      lastSender: session.lastSender,
      status: session.status
    };

    return NextResponse.json({
      success: true,
      session: formattedSession
    });

  } catch (error) {
    console.error('Error fetching latest session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
