import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface BookmarkButtonProps {
  targetId: number;
  targetType: 'institute' | 'tutor';
}

export default function BookmarkButton({ targetId, targetType }: BookmarkButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const canBookmark = isAuthenticated && user?.role === 'student';

  useEffect(() => {
    if (!canBookmark) return;
    api.get(`/bookmarks/check/${targetType}/${targetId}`)
      .then(({ data }) => setBookmarked(data.bookmarked))
      .catch(() => {});
  }, [targetId, targetType, canBookmark]);

  const toggle = async () => {
    if (!canBookmark) {
      setShowPrompt(true);
      return;
    }

    setLoading(true);
    try {
      if (bookmarked) {
        await api.delete(`/bookmarks/${targetType}/${targetId}`);
        setBookmarked(false);
      } else {
        await api.post('/bookmarks', { target_id: targetId, target_type: targetType });
        setBookmarked(true);
      }
    } catch {
      alert('Failed to update bookmark');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={toggle}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold text-sm transition-all ${bookmarked ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'}`}
      >
        {bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        {bookmarked ? 'Saved' : 'Save'}
      </button>

      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(16,27,45,0.55)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center relative">
            <button
              type="button"
              onClick={() => setShowPrompt(false)}
              className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full text-brand-secondary hover:bg-brand-mist transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center bg-brand-primary/10 text-brand-primary mb-4">
              <Bookmark className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-extrabold text-brand-dark mb-2">
              {isAuthenticated ? 'Student account required' : 'Login to save bookmarks'}
            </h3>
            <p className="text-sm text-brand-secondary leading-relaxed mb-6">
              {isAuthenticated
                ? 'Bookmarks are available only for student accounts. Please use a student login to save institutes and tutors.'
                : 'You need a student account to save institutes and tutors to your bookmarks.'}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPrompt(false)}
                className="flex-1 border border-brand-border text-brand-secondary font-semibold py-2.5 rounded-xl hover:bg-brand-mist transition-all"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => navigate('/login', {
                  state: {
                    from: `${location.pathname}${location.search}${location.hash}`,
                    message: 'Log in as a student to save bookmarks.',
                  },
                })}
                className="flex-1 text-white font-bold py-2.5 rounded-xl transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #2F6FED, #16407A)' }}
              >
                {isAuthenticated ? 'Switch Login' : 'Login'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}