import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, BookmarkX, MessageSquare } from 'lucide-react';
import type { Bookmark as BookmarkType, Enquiry } from '../../types';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [tab, setTab] = useState<'bookmarks' | 'enquiries'>('bookmarks');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/bookmarks'),
      api.get('/enquiries/mine'),
    ]).then(([bRes, eRes]) => {
      setBookmarks(bRes.data);
      setEnquiries(eRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const removeBookmark = async (targetType: string, targetId: number) => {
    try {
      await api.delete(`/bookmarks/${targetType}/${targetId}`);
      setBookmarks(prev => prev.filter(b => !(b.target_id === targetId && b.target_type === targetType)));
    } catch {
      alert('Failed to remove bookmark');
    }
  };

  return (
    <div className="min-h-screen bg-brand-mist">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-2xl p-6 mb-6 text-white" style={{ background: 'linear-gradient(135deg, #0b2447, #16407A)' }}>
          <h1 className="text-2xl font-extrabold">Welcome back, {user?.name}! 👋</h1>
          <p className="text-purple-200 text-sm mt-1">Student Dashboard</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('bookmarks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${tab === 'bookmarks' ? 'text-white' : 'bg-white text-brand-secondary border border-brand-border hover:border-brand-primary hover:text-brand-primary'}`}
            style={tab === 'bookmarks' ? { background: 'linear-gradient(135deg, #2F6FED, #16407A)' } : {}}>
            <Bookmark className="w-4 h-4" />
            Saved ({bookmarks.length})
          </button>
          <button onClick={() => setTab('enquiries')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${tab === 'enquiries' ? 'text-white' : 'bg-white text-brand-secondary border border-brand-border hover:border-brand-primary hover:text-brand-primary'}`}
            style={tab === 'enquiries' ? { background: 'linear-gradient(135deg, #6C4FD8, #2F6FED)' } : {}}>
            <MessageSquare className="w-4 h-4" />
            Enquiries ({enquiries.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-brand-secondary">Loading…</div>
        ) : tab === 'bookmarks' ? (
          <div>
            {bookmarks.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-brand-border">
                <Bookmark className="w-12 h-12 text-brand-border mx-auto mb-3" />
                <p className="text-brand-dark font-semibold">No saved items yet</p>
                <p className="text-brand-secondary text-sm mt-1">Search and save institutes or tutors you're interested in.</p>
                <Link to="/search" className="mt-4 inline-block text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all" style={{ background: 'linear-gradient(135deg, #2F6FED, #16407A)' }}>
                  Browse Now
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bookmarks.map(b => (
                  <div key={b.id} className="bg-white rounded-xl border border-brand-border p-4 flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${b.target_type === 'institute' ? 'bg-brand-mist' : 'bg-violet-50'}`}>
                      {b.target_type === 'institute' ? '🏫' : '👨‍🏫'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-brand-dark truncate">{b.name}</p>
                      <p className="text-brand-secondary text-xs mt-0.5">{b.location || b.subject}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${b.target_type === 'institute' ? 'bg-brand-mist text-brand-primary' : 'bg-violet-50 text-brand-accent'}`}>
                        {b.target_type}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Link to={`/${b.target_type}/${b.target_id}`} className="text-xs text-brand-primary hover:text-brand-dark font-semibold">View</Link>
                      <button onClick={() => removeBookmark(b.target_type, b.target_id)} className="text-brand-border hover:text-red-500 transition-colors">
                        <BookmarkX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {enquiries.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-brand-border">
                <MessageSquare className="w-12 h-12 text-brand-border mx-auto mb-3" />
                <p className="text-brand-dark font-semibold">No enquiries sent yet</p>
                <p className="text-brand-secondary text-sm mt-1">Send an enquiry from any institute or tutor profile page.</p>
                <Link to="/search" className="mt-4 inline-block text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all" style={{ background: 'linear-gradient(135deg, #6C4FD8, #2F6FED)' }}>
                  Find Tutors & Institutes
                </Link>
              </div>
            ) : (
              enquiries.map(enq => (
                <div key={enq.id} className="bg-white rounded-xl border border-brand-border p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                    <div>
                      <p className="font-bold text-brand-dark">{enq.target_name || `${enq.target_type} #${enq.target_id}`}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${enq.target_type === 'institute' ? 'bg-brand-mist text-brand-primary' : 'bg-violet-50 text-brand-accent'}`}>
                        {enq.target_type}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        enq.status === 'replied' ? 'bg-emerald-100 text-emerald-700' :
                        enq.status === 'read' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>{enq.status === 'replied' ? '✓ Replied' : enq.status === 'read' ? '👁 Read' : '⏳ Pending'}</span>
                      <p className="text-xs text-brand-secondary mt-1">{new Date(enq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                  <p className="text-sm text-brand-body bg-brand-mist rounded-xl px-4 py-3 leading-relaxed">{enq.message}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}