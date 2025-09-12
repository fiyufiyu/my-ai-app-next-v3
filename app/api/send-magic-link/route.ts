import { NextRequest, NextResponse } from 'next/server';
import { createMagicLink, cleanupExpiredTokens } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Record email in MongoDB (if not already exists)
    const db = await getDatabase();
    const emailsCollection = db.collection(process.env.MONGODB_COLLECTION || 'emails');
    
    // Check if email already exists
    const existingEmail = await emailsCollection.findOne({ email: email.toLowerCase() });
    
    if (!existingEmail) {
      // Insert new email record
      await emailsCollection.insertOne({
        email: email.toLowerCase(),
        createdAt: new Date(),
        status: 'magic_link_sent',
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        source: 'magic_link_request'
      });
      console.log('Email recorded in database:', email);
    } else {
      // Update existing email record
      await emailsCollection.updateOne(
        { email: email.toLowerCase() },
        { 
          $set: { 
            lastMagicLinkSent: new Date(),
            status: 'magic_link_sent',
            source: 'magic_link_request'
          }
        }
      );
      console.log('Email record updated in database:', email);
    }

    // Create magic link token
    const token = await createMagicLink(email);
    const magicLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/auth/verify?token=${token}`;
    
    // Send email using Resend
    try {
      await sendMagicLinkEmail(email, magicLink);
      console.log('Magic link email sent successfully to:', email);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email. Please try again.' },
        { status: 500 }
      );
    }
    
    // Clean up expired tokens
    await cleanupExpiredTokens();

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email! Check your inbox and click the link to access your AI therapist.'
    });

  } catch (error) {
    console.error('Error creating magic link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
