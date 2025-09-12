import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLink, createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Verify the magic link token
    const email = await verifyMagicLink(token);
    
    if (!email) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Create a session
    const sessionToken = await createSession(email);

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      email
    });

    // Set session cookie
    response.cookies.set('symbiont-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Error verifying magic link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

