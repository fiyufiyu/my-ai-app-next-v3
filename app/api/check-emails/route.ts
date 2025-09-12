import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    const emailsCollection = db.collection(process.env.MONGODB_COLLECTION || 'emails');
    
    // Get all recorded emails
    const emails = await emailsCollection.find({}).sort({ createdAt: -1 }).toArray();
    
    return NextResponse.json({
      success: true,
      count: emails.length,
      emails: emails.map(email => ({
        email: email.email,
        createdAt: email.createdAt,
        status: email.status,
        source: email.source,
        lastMagicLinkSent: email.lastMagicLinkSent
      }))
    });
    
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch emails',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
