import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import type { Review } from '../types';
import { useAuth } from '../context/AuthContext';
import StarRating from './StarRating';
import api from '../api/axios';

interface ReviewSectionProps {
  targetId: number;
  targetType: 'institute' | 'tutor';
}

export default function ReviewSection({ targetId, targetType }: ReviewSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/reviews/${targetType}/${targetId}`);
      setReviews(data);
    } catch {
      // fail silently
    }
  };

  useEffect(() => { fetchReviews(); }, [targetId, targetType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a rating'); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/reviews', { target_id: targetId, target_type: targetType, rating, comment });
      setRating(0);
      setComment('');
      await fetchReviews();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this review?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch {
      alert('Failed to delete review');
    }
  };

  const alreadyReviewed = reviews.some(r => r.reviewer_id === user?.id);

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        Reviews ({reviews.length})
      </h3>

      {/* Write a review */}
      {isAuthenticated && user?.role === 'student' && !alreadyReviewed && (
        <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
          <h4 className="font-semibold text-gray-800 mb-3">Write a Review</h4>
          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-1">Your Rating</p>
            <StarRating rating={rating} size="lg" interactive onRate={setRating} />
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share your experience (optional)..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <p className="text-gray-400 text-sm py-4 text-center">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{review.reviewer_name}</p>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs">
                    {new Date(review.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {(user?.id === review.reviewer_id || user?.role === 'admin') && (
                    <button onClick={() => handleDelete(review.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {review.comment && <p className="mt-2 text-gray-600 text-sm leading-relaxed">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}