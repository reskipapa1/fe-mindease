import React, { useState } from 'react';
import { X, Send, Loader2, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function FeedbackModal({ isOpen, onClose }) {
  const { user } = useAuth();
  
  const [form, setForm] = useState({
    name: user?.username || '',
    email: user?.email || '',
    type: 'Laporan Bug',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/public/feedbacks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user?.id || null,
          name: form.name,
          email: form.email,
          type: form.type,
          message: form.message
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mengirim masukan');
      }
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setForm({ ...form, message: '' });
      }, 2500);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4 py-8 overflow-y-auto">
      <div className="glass-card w-full max-w-md relative p-6 mt-auto mb-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-rose-500 transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-brand-500/10 text-brand-500">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Kirim Masukan</h2>
            <p className="text-xs text-[var(--t-secondary)]">Bantu kami menjadi lebih baik.</p>
          </div>
        </div>

        {success ? (
          <div className="py-10 text-center animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-emerald-500 mb-2">Terkirim!</h3>
            <p className="text-sm text-[var(--t-secondary)]">Terima kasih atas masukan Anda. Kami akan segera meninjaunya.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--t-secondary)' }}>Jenis Laporan</label>
              <select 
                value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                className="input-field w-full text-sm cursor-pointer"
              >
                <option value="Laporan Bug">Laporan Bug / Error</option>
                <option value="Permintaan Saluran">Permintaan Saluran Baru</option>
                <option value="Saran Fitur">Saran Fitur Baru</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--t-secondary)' }}>Pesan</label>
              <textarea required
                value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                className="input-field w-full text-sm min-h-[100px] resize-none" 
                placeholder="Ceritakan detail bug atau saran Anda di sini..." 
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSubmitting ? 'Mengirim...' : 'Kirim Sekarang'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
