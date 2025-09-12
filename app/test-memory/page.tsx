'use client';

import { useState, useEffect } from 'react';

export default function TestMemoryPage() {
  const [email, setEmail] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [testMessage, setTestMessage] = useState('What did we talk about earlier?');
  const [results, setResults] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is authorized (admin)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user/me');
        const result = await response.json();
        
        if (result.success) {
          // Check if this is the admin email
          const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'your-admin@email.com';
          setIsAuthorized(result.email === adminEmail);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
      setCheckingAuth(false);
    };

    checkAuth();
  }, []);

  const testMemory = async () => {
    if (!email || !sessionId) {
      alert('Please enter email and session ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/test-ai-memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          sessionId,
          testMessage
        }),
      });

      const result = await response.json();
      setResults(result);
    } catch (error) {
      console.error('Test error:', error);
      setResults({ error: 'Test failed' });
    }
    setLoading(false);
  };

  const getSessionInfo = async () => {
    if (!email || !sessionId) {
      alert('Please enter email and session ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/test-ai-memory?email=${encodeURIComponent(email)}&sessionId=${encodeURIComponent(sessionId)}`);
      const result = await response.json();
      setResults(result);
    } catch (error) {
      console.error('Test error:', error);
      setResults({ error: 'Test failed' });
    }
    setLoading(false);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">This page is restricted to administrators only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AI Memory Test</h1>
        
        <div className="bg-gray-900 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                placeholder="user@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Session ID:</label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                placeholder="Session ID from MongoDB"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Test Message:</label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                placeholder="What did we talk about earlier?"
              />
            </div>
          </div>
          
          <div className="flex gap-4 mt-6">
            <button
              onClick={getSessionInfo}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-white"
            >
              {loading ? 'Loading...' : 'Get Session Info'}
            </button>
            
            <button
              onClick={testMemory}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-white"
            >
              {loading ? 'Testing...' : 'Test AI Memory'}
            </button>
          </div>
        </div>

        {results && (
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <pre className="bg-gray-800 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">How to Test:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Go to your chat page and have a conversation with the AI</li>
            <li>Copy your email and session ID from the browser&apos;s developer tools (Network tab)</li>
            <li>Or use the &quot;Get Session Info&quot; button to see your session details</li>
            <li>Enter a test message like &quot;What did we talk about earlier?&quot;</li>
            <li>Click &quot;Test AI Memory&quot; to see if the AI remembers previous conversations</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
