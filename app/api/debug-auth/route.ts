import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      return NextResponse.json({ error: 'MONGODB_URI not found' });
    }
    
    // Parse the URI to extract components (without exposing the password)
    const url = new URL(uri);
    const username = url.username;
    const host = url.hostname;
    const database = url.pathname.substring(1) || 'default';
    
    return NextResponse.json({
      success: true,
      message: 'Connection details (password hidden)',
      username: username,
      host: host,
      database: database,
      hasPassword: !!url.password,
      uriLength: uri.length
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Error parsing connection string',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

