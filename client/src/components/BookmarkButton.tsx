import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface BookmarkButtonProps {
  targetId: number;
  targetType: 'institute' | 'tutor';
}

export default function BookmarkButton({ targetId, targetType }: BookmarkButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'student') return;
    api.get(`/bookmarks/check/${targetType}/${targetId}`)
      .then(({ data }) => setBookmarked(data.bookmarked))
      .catch(() => {});
  }, [targetId, targetType, isAuthenticated, user]);

  if (!isAuthenticated || user?.role !== 'student') return null;

  const toggle = async () => {
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
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold text-sm transition-all ${bookmarked ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600'}`}
    >
      {bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
      {bookmarked ? 'Saved' : 'Save'}
    </button>
  );
}