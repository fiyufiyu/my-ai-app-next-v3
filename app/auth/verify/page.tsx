'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('No token provided');
      return;
    }

    // Verify the magic link
    fetch('/api/verify-magic-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Magic link verification response:', data);
      if (data.success) {
        setStatus('success');
        setMessage('Authentication successful! Redirecting to chat...');
        setTimeout(() => {
          console.log('Attempting to redirect to /chat');
          router.push('/chat');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Authentication failed');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      setStatus('error');
      setMessage('An error occurred during authentication');
    });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans" style={{
      background: 'radial-gradient(ellipse at center, #0f0f0f 0%, #000 70%)',
      color: '#e0e0e0'
    }}>
      <div className="max-w-md w-full mx-auto p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            <h1 className="text-2xl font-bold mb-4">Verifying your magic link...</h1>
            <p className="text-gray-400">Please wait while we authenticate you.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-green-400">Success!</h1>
            <p className="text-gray-300">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-red-400">Authentication Failed</h1>
            <p className="text-gray-300 mb-6">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Back to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center font-sans" style={{
        background: 'radial-gradient(ellipse at center, #0f0f0f 0%, #000 70%)',
        color: '#e0e0e0'
      }}>
        <div className="w-16 h-16 mx-auto mb-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
