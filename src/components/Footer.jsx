import React, { useState } from 'react';
import { HeartPulse, MessageSquarePlus } from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const [showFeedback, setShowFeedback] = useState(false);
  const { token } = useAuth();

  return (
    <>
      <footer className="w-full shrink-0 border-t mt-auto py-6 relative z-10"
        style={{
          background: 'var(--bg-overlay)',
          borderColor: 'var(--border)',
          backdropFilter: 'blur(10px)'
        }}>
        <div className="max-w-5xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Brand & Copyright */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-brand-500" />
              <span className="font-extrabold text-sm tracking-tight gradient-text">MindEase</span>
            </div>
            <p className="text-xs font-medium" style={{ color: 'var(--t-muted)' }}>
              &copy; {new Date().getFullYear()} MindEase. All rights reserved.
            </p>
          </div>

          {/* Contacts / Links */}
          <div className="flex items-center gap-4 text-xs font-medium" style={{ color: 'var(--t-secondary)' }}>
            {token && (
              <>
                <button onClick={() => setShowFeedback(true)} className="flex items-center gap-1.5 hover:text-brand-400 transition-colors">
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  Beri Masukan / Laporkan Bug
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </>
  );
}
