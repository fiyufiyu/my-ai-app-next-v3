import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('MONGODB_DB:', process.env.MONGODB_DB);
    console.log('MONGODB_COLLECTION:', process.env.MONGODB_COLLECTION);
    
    const db = await getDatabase();
    console.log('Database connected successfully');
    
    // Test a simple operation
    const collection = db.collection('test');
    const result = await collection.insertOne({ test: true, timestamp: new Date() });
    console.log('Test insert successful:', result.insertedId);
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful',
      testId: result.insertedId
    });
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json(
      { 
        error: 'MongoDB connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

