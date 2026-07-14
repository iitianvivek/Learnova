import React, { useState } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface Props {
  targetId: number;
  targetType: 'institute' | 'tutor';
  targetName: string;
  onClose: () => void;
}

export default function EnquiryModal({ targetId, targetType, targetName, onClose }: Props) {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated || user?.role !== 'student') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(16,27,45,0.55)', backdropFilter: 'blur(4px)' }}>
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
          <MessageSquare className="w-12 h-12 text-brand-primary mx-auto mb-4" />
          <h3 className="text-xl font-extrabold text-brand-dark mb-2">Login to send an enquiry</h3>
          <p className="text-brand-secondary text-sm mb-6">You need a student account to contact institutes or tutors.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 border border-brand-border text-brand-secondary font-semibold py-2.5 rounded-xl hover:bg-brand-mist transition-all">Cancel</button>
            <button onClick={() => navigate('/login')} className="flex-1 text-white font-bold py-2.5 rounded-xl transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #2F6FED, #16407A)' }}>Login</button>
          </div>
        </div>
      </div>
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) { setError('Please write a message'); return; }
    setSending(true); setError('');
    try {
      await api.post('/enquiries', {
        target_id: targetId,
        target_type: targetType,
        message: message.trim(),
        student_phone: phone.trim(),
      });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send enquiry. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(16,27,45,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-border">
          <div>
            <h3 className="text-lg font-extrabold text-brand-dark">Send Enquiry</h3>
            <p className="text-sm text-brand-secondary mt-0.5">To: <span className="font-semibold text-brand-primary">{targetName}</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-mist text-brand-secondary transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="text-xl font-extrabold text-brand-dark mb-2">Enquiry Sent!</h4>
            <p className="text-brand-secondary text-sm mb-6">Your message has been sent to <strong>{targetName}</strong>. They will get back to you shortly.</p>
            <button onClick={onClose} className="w-full text-white font-bold py-3 rounded-xl transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #2F6FED, #16407A)' }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-brand-secondary uppercase tracking-wider block mb-1.5">Your message *</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={`Hi, I'm interested in ${targetType === 'institute' ? 'enrolling at your institute' : 'taking lessons with you'}. Could you please share more details about fees and schedule?`}
                rows={4}
                className="w-full border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-body outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none placeholder-brand-secondary transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-brand-secondary uppercase tracking-wider block mb-1.5">Phone number (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-body outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
              />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 border border-brand-border text-brand-secondary font-semibold py-3 rounded-xl hover:bg-brand-mist transition-all">
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #6C4FD8, #2F6FED)' }}
              >
                {sending ? 'Sending…' : <><Send className="w-4 h-4" /> Send Enquiry</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}