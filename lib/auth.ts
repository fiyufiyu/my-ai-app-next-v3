import { getDatabase } from './mongodb';
import crypto from 'crypto';

// Generate a secure random token
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create a magic link token and store it in the database
export async function createMagicLink(email: string): Promise<string> {
  const db = await getDatabase();
  const tokensCollection = db.collection('magic_tokens');
  
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  
  await tokensCollection.insertOne({
    token,
    email: email.toLowerCase(),
    expiresAt,
    used: false,
    createdAt: new Date()
  });
  
  return token;
}

// Verify and consume a magic link token
export async function verifyMagicLink(token: string): Promise<string | null> {
  const db = await getDatabase();
  const tokensCollection = db.collection('magic_tokens');
  
  const tokenDoc = await tokensCollection.findOne({
    token,
    used: false,
    expiresAt: { $gt: new Date() }
  });
  
  if (!tokenDoc) {
    return null;
  }
  
  // Mark token as used
  await tokensCollection.updateOne(
    { token },
    { $set: { used: true, usedAt: new Date() } }
  );
  
  return tokenDoc.email;
}

// Create a user session
export async function createSession(email: string): Promise<string> {
  const db = await getDatabase();
  const sessionsCollection = db.collection('sessions');
  
  const sessionToken = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  await sessionsCollection.insertOne({
    sessionToken,
    email: email.toLowerCase(),
    expiresAt,
    createdAt: new Date(),
    lastAccessed: new Date()
  });
  
  return sessionToken;
}

// Verify a session token
export async function verifySession(sessionToken: string): Promise<string | null> {
  const db = await getDatabase();
  const sessionsCollection = db.collection('sessions');
  
  const session = await sessionsCollection.findOne({
    sessionToken,
    expiresAt: { $gt: new Date() }
  });
  
  if (!session) {
    return null;
  }
  
  // Update last accessed time
  await sessionsCollection.updateOne(
    { sessionToken },
    { $set: { lastAccessed: new Date() } }
  );
  
  return session.email;
}

// Clean up expired tokens and sessions
export async function cleanupExpiredTokens(): Promise<void> {
  const db = await getDatabase();
  const now = new Date();
  
  // Clean up expired magic tokens
  await db.collection('magic_tokens').deleteMany({
    $or: [
      { expiresAt: { $lt: now } },
      { used: true, usedAt: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } // Delete used tokens older than 24 hours
    ]
  });
  
  // Clean up expired sessions
  await db.collection('sessions').deleteMany({
    expiresAt: { $lt: now }
  });
}

