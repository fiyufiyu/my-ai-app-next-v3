import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    const tokensCollection = db.collection('magic_tokens');
    
    // Get recent tokens
    const recentTokens = await tokensCollection.find({
      createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 minutes
    }).sort({ createdAt: -1 }).limit(5).toArray();
    
    return NextResponse.json({
      success: true,
      recentTokens: recentTokens.map(token => ({
        token: token.token.substring(0, 10) + '...',
        email: token.email,
        expiresAt: token.expiresAt,
        used: token.used,
        createdAt: token.createdAt,
        isExpired: token.expiresAt < new Date()
      }))
    });
    
  } catch (error) {
    console.error('Debug magic link error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
