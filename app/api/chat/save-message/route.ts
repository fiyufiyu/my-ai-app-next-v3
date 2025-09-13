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

    // If no session ID provided, find or create the user's persistent session
    if (!sessionId) {
      // Look for ANY existing session for this email (not just active ones)
      const existingSession = await sessionsCollection.findOne({
        email: email.toLowerCase()
      }, { sort: { createdAt: 1 } }); // Get the oldest session (first one created)
      
      if (existingSession) {
        // Use the existing session and ensure it's active
        sessionId = existingSession._id.toString();
        await sessionsCollection.updateOne(
          { _id: existingSession._id },
          { $set: { status: 'active' } }
        );
      } else {
        // Create a new persistent session only if none exists
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

    // Check if we need to cleanup old messages for this session (keep only the most recent 100 per session)
    const sessionMessageCount = await messagesCollection.countDocuments({
      sessionId: sessionId
    });

    if (sessionMessageCount > 100) {
      console.log(`Session ${sessionId} has ${sessionMessageCount} messages, triggering cleanup...`);
      
      // Delete oldest messages to keep only the most recent 100 for this session
      const messagesToDelete = sessionMessageCount - 100;
      const oldestMessages = await messagesCollection
        .find({
          sessionId: sessionId
        })
        .sort({ timestamp: 1 }) // Oldest first
        .limit(messagesToDelete)
        .toArray();

      if (oldestMessages.length > 0) {
        const messageIds = oldestMessages.map(msg => msg._id);
        const deleteResult = await messagesCollection.deleteMany({
          _id: { $in: messageIds }
        });
        console.log(`Cleaned up ${deleteResult.deletedCount} old messages for session ${sessionId}`);
      }
    }

    console.log('Message saved:', result.insertedId, 'for session:', sessionId, 'email:', email.toLowerCase(), 'sender:', sender);

    return NextResponse.json({
      success: true,
      messageId: result.insertedId.toString(),
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
