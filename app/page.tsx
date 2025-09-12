'use client';

import { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/send-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsLoading(false);
        setIsSent(true);
        setShowSuccess(true);
        setEmail('');
        
        setTimeout(() => {
          setIsSent(false);
          setShowSuccess(false);
        }, 5000);
      } else {
        // Handle error
        setIsLoading(false);
        alert(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting email:', error);
      setIsLoading(false);
      alert('Network error. Please check your connection and try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden font-sans" style={{
      background: 'radial-gradient(ellipse at center, #0f0f0f 0%, #000 70%)',
      color: '#fff'
    }}>
      {/* Background Glow */}
      <div className="absolute top-1/5 left-1/2 transform -translate-x-1/2 w-72 h-72 lg:w-[500px] lg:h-[500px] rounded-full z-10 animate-float" 
           style={{
             background: 'radial-gradient(circle, rgba(255, 255, 255, 0.02) 0%, transparent 70%)',
             animation: 'float 6s ease-in-out infinite'
           }}>
      </div>

      {/* Navbar */}
      <nav className="px-4 sm:px-8 py-3 sm:py-5 border-b border-white/8 bg-black/80 backdrop-blur-xl relative z-50">
        <div className="text-lg sm:text-xl font-extrabold text-white tracking-tight uppercase bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
          Symbiont AI
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-12 relative">
        <div className="max-w-[90vw] sm:max-w-[500px] text-center relative z-20">
          {/* Hero Section */}
          <div className="mb-8 sm:mb-12">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-2 sm:mb-4 bg-gradient-to-br from-white via-gray-200 to-gray-400 bg-clip-text text-transparent tracking-tight leading-tight relative">
              Symbiont MBTI AI
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full bg-gradient-radial from-white/3 to-transparent animate-pulse-slow -z-10"></div>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 mb-4 sm:mb-8 font-normal tracking-tight">
              (not a) Therapist
            </p>
            
            <div className="max-w-[85vw] sm:max-w-[400px] mx-auto mb-8 sm:mb-12">
              <p className="text-base sm:text-xl text-gray-300 font-medium tracking-tight leading-relaxed bg-gradient-to-br from-gray-300 to-gray-600 bg-clip-text text-transparent">
                Your MBTI type. Your Personal AI Therapist.
              </p>
            </div>
          </div>

          {/* Sign-in Box */}
          <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-3xl hover:-translate-y-1"
               style={{
                 boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
               }}>
            {/* Shimmer effect */}
            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/3 to-transparent transition-all duration-500 hover:left-full"></div>
            
            <div className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3 uppercase tracking-wider font-bold">
              Sign in with email
            </div>
            <div className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-5 font-normal opacity-80">
              We&apos;ll send you a magic link to sign in
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 px-3 sm:px-4 py-3 sm:py-4 bg-black/60 border border-white/10 rounded-xl text-white text-sm sm:text-base font-normal transition-all duration-300 backdrop-blur-sm focus:outline-none focus:border-white/30 focus:bg-black/80 focus:shadow-lg focus:shadow-white/5 placeholder:text-gray-500 focus:placeholder:text-gray-400"
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold cursor-pointer transition-all duration-300 relative overflow-hidden uppercase font-sans tracking-tight whitespace-nowrap ${
                  isLoading 
                    ? 'bg-gray-600 text-transparent pointer-events-none' 
                    : isSent 
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white' 
                    : 'bg-gradient-to-br from-white to-gray-100 text-black hover:-translate-y-0.5 hover:shadow-xl hover:shadow-white/20 hover:from-white hover:to-gray-200'
                }`}
              >
                {isLoading ? (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
                ) : isSent ? (
                  'Sent'
                ) : (
                  'Send'
                )}
                {!isLoading && !isSent && (
                  <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-all duration-500 hover:left-full"></div>
                )}
              </button>
            </form>
            
            {showSuccess && (
              <div className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 sm:py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs sm:text-sm text-emerald-500 text-center font-medium backdrop-blur-sm">
                ✓ Magic link sent! Check your email and click the link to access your AI therapist.
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(-20px); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.05); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .animate-float,
          .animate-pulse-slow {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
