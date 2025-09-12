import { NextRequest, NextResponse } from 'next/server';
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

    // Get database connection
    const db = await getDatabase();
    const collection = db.collection(process.env.MONGODB_COLLECTION || 'emails');

    // Check if email already exists
    const existingEmail = await collection.findOne({ email: email.toLowerCase() });
    
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Insert new email
    const result = await collection.insertOne({
      email: email.toLowerCase(),
      createdAt: new Date(),
      status: 'pending', // You can use this to track if magic link was sent
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
    });

    console.log('Email saved to database:', result.insertedId);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Email saved successfully',
        id: result.insertedId 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error saving email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

