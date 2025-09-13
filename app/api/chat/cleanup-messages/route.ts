import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { email, sessionId, maxMessages = 100 } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const messagesCollection = db.collection('chat_messages');

    // Build query - if sessionId provided, clean up that session, otherwise clean up all sessions for user
    const query: Record<string, unknown> = { email: email.toLowerCase() };
    if (sessionId) {
      query.sessionId = sessionId;
    }

    // Count messages for this user/session
    const totalMessages = await messagesCollection.countDocuments(query);

    console.log(`User ${email}${sessionId ? ` session ${sessionId}` : ''} has ${totalMessages} messages, max allowed: ${maxMessages}`);

    if (totalMessages <= maxMessages) {
      return NextResponse.json({
        success: true,
        message: 'No cleanup needed',
        totalMessages,
        maxMessages
      });
    }

    // Calculate how many messages to delete
    const messagesToDelete = totalMessages - maxMessages;
    
    // Get the oldest messages to delete
    const oldestMessages = await messagesCollection
      .find(query)
      .sort({ timestamp: 1 }) // Oldest first
      .limit(messagesToDelete)
      .toArray();

    if (oldestMessages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No messages to delete',
        totalMessages,
        maxMessages
      });
    }

    // Delete the oldest messages
    const messageIds = oldestMessages.map(msg => msg._id);
    const deleteResult = await messagesCollection.deleteMany({
      _id: { $in: messageIds }
    });

    console.log(`Cleaned up ${deleteResult.deletedCount} old messages for ${email}${sessionId ? ` session ${sessionId}` : ''}`);

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deleteResult.deletedCount} old messages`,
      deletedCount: deleteResult.deletedCount,
      totalMessages: totalMessages - deleteResult.deletedCount,
      maxMessages
    });

  } catch (error) {
    console.error('Error cleaning up messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
