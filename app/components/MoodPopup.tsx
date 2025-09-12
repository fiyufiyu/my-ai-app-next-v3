'use client';

import { useState } from 'react';

interface MoodPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (emotion: string, explanation: string) => void;
}

const moodOptions = [
  { emoji: '😞', label: 'Very low / sad / drained', value: 'very low' },
  { emoji: '😕', label: 'Low / off / unmotivated', value: 'low' },
  { emoji: '😐', label: 'Neutral / okay / steady', value: 'neutral' },
  { emoji: '🙂', label: 'Good / positive / engaged', value: 'good' },
  { emoji: '😄', label: 'Excellent / energized / joyful', value: 'excellent' },
];

export default function MoodPopup({ isOpen, onClose, onSubmit }: MoodPopupProps) {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood || !explanation.trim()) return;

    setIsSubmitting(true);
    try {
      console.log('Submitting mood:', selectedMood, explanation.trim());
      await onSubmit(selectedMood, explanation.trim());
      console.log('Mood submitted successfully');
      // Reset form after successful submission
      setSelectedMood('');
      setExplanation('');
    } catch (error) {
      console.error('Error submitting mood:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">How are you feeling today?</h2>
          <p className="text-gray-400 text-sm">Let me know your current mood to better understand you</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mood Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select your current mood:
            </label>
            <div className="flex justify-between items-center">
              {moodOptions.map((mood, index) => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setSelectedMood(mood.value)}
                  className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${
                    selectedMood === mood.value
                      ? 'bg-white/20 border-2 border-white/40 scale-105'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                  style={{ 
                    transform: selectedMood === mood.value ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span className="text-2xl mb-1">{mood.emoji}</span>
                  <span className="text-xs text-gray-300 text-center leading-tight">
                    {mood.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Explanation Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Tell me why you're feeling this way:
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Share what's on your mind..."
              className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white text-sm resize-none transition-all duration-300 backdrop-blur-sm focus:outline-none focus:border-white/30 focus:bg-black/80 focus:shadow-lg focus:shadow-white/5 placeholder:text-gray-500 focus:placeholder:text-gray-400"
              rows={3}
              maxLength={500}
              required
            />
            <div className="text-xs text-gray-500 text-right">
              {explanation.length}/500
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm font-medium transition-all duration-300 hover:bg-white/20 hover:border-white/30"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={!selectedMood || !explanation.trim() || isSubmitting}
              className="flex-1 px-4 py-3 bg-white border border-white rounded-xl text-black text-sm font-semibold transition-all duration-300 hover:bg-gray-100 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
