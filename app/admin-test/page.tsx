'use client';

import { useState, useEffect } from 'react';

export default function AdminTestPage() {
  const [email, setEmail] = useState('');
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

  const testContinuousSession = async () => {
    if (!email) {
      alert('Please enter an email to test');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/test-continuous-session?email=${encodeURIComponent(email)}`);
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
        <h1 className="text-3xl font-bold mb-8">Admin Test - Continuous Session</h1>
        
        <div className="bg-gray-900 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Test User&apos;s Continuous Session</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">User Email to Test:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                placeholder="user@example.com"
              />
            </div>
          </div>
          
          <button
            onClick={testContinuousSession}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-white"
          >
            {loading ? 'Testing...' : 'Test Continuous Session'}
          </button>
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
          <h2 className="text-xl font-semibold mb-4">What This Tests:</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>User&apos;s continuous session information</li>
            <li>Total message count across all sessions</li>
            <li>Last 25 messages breakdown (user vs assistant)</li>
            <li>Message flow and conversation continuity</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
