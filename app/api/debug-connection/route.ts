import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      return NextResponse.json({ error: 'MONGODB_URI not found' });
    }
    
    // Check if URI format looks correct (without exposing credentials)
    const uriParts = uri.split('://');
    if (uriParts.length !== 2) {
      return NextResponse.json({ error: 'Invalid URI format' });
    }
    
    const [protocol, rest] = uriParts;
    if (protocol !== 'mongodb+srv') {
      return NextResponse.json({ error: 'Protocol should be mongodb+srv' });
    }
    
    const [credentials, hostAndDb] = rest.split('@');
    if (!credentials || !hostAndDb) {
      return NextResponse.json({ error: 'Missing credentials or host' });
    }
    
    const [username, password] = credentials.split(':');
    if (!username || !password) {
      return NextResponse.json({ error: 'Missing username or password' });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Connection string format looks correct',
      hasUsername: !!username,
      hasPassword: !!password,
      hostAndDb: hostAndDb.substring(0, 50) + '...' // Show first 50 chars only
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Error parsing connection string',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

