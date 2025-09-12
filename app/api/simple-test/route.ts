import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      return NextResponse.json({ error: 'MONGODB_URI not found' });
    }
    
    console.log('Attempting direct connection with:', uri.substring(0, 50) + '...');
    
    // Create a fresh client for this test
    const client = new MongoClient(uri);
    
    // Try to connect
    await client.connect();
    console.log('Connected successfully!');
    
    // Test a simple operation
    const db = client.db('emails_recorded');
    const collection = db.collection('emails_recorded');
    
    // Try to insert a test document
    const result = await collection.insertOne({
      test: true,
      timestamp: new Date(),
      message: 'Connection test successful'
    });
    
    console.log('Test insert successful:', result.insertedId);
    
    // Close the connection
    await client.close();
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection and insert successful!',
      testId: result.insertedId
    });
    
  } catch (error) {
    console.error('Simple test error:', error);
    return NextResponse.json(
      { 
        error: 'Connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : 'Unknown'
      },
      { status: 500 }
    );
  }
}

