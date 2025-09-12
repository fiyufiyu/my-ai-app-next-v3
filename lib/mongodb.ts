import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;

// Simple connection function - create a new client each time
export async function getDatabase(): Promise<Db> {
  const client = new MongoClient(uri);
  await client.connect();
  return client.db(process.env.MONGODB_DB || 'emails_recorded');
}

// Alternative: get client directly
export async function getClient(): Promise<MongoClient> {
  const client = new MongoClient(uri);
  await client.connect();
  return client;
}
