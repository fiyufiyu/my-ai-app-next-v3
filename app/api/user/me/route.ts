import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookies
    const sessionToken = request.cookies.get('symbiont-session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    // Verify the session and get email
    const email = await verifySession(sessionToken);
    
    if (!email) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      email,
      message: 'User authenticated successfully'
    });

  } catch (error) {
    console.error('Error getting user info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
