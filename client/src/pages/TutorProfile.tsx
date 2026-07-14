import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Clock, IndianRupee, Calendar, ChevronLeft, MessageSquare, Wifi, WifiOff } from 'lucide-react';
import type { Tutor } from '../types';
import StarRating from '../components/StarRating';
import ReviewSection from '../components/ReviewSection';
import BookmarkButton from '../components/BookmarkButton';
import EnquiryModal from '../components/EnquiryModal';
import api from '../api/axios';

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TutorProfile() {
  const { id } = useParams<{ id: string }>();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEnquiry, setShowEnquiry] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/tutors/${id}`)
      .then(({ data }) => setTutor(data))
      .catch(() => setTutor(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!tutor) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
      <User className="w-12 h-12 text-gray-300" />
      <p>Tutor not found</p>
      <Link to="/search" className="text-blue-600 hover:underline text-sm">Back to Search</Link>
    </div>
  );

  const images = tutor.images || [];
  const availability = tutor.availability || [];
  const sortedAvail = [...availability].sort((a, b) => DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week));
  const avatarUrl = images.length > 0 ? `/uploads/${images[0].file_path}` : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-12">
        <Link to="/search" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to Search
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sidebar */}
          <div className="space-y-5">
            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <div className="w-28 h-28 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center mb-4">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={tutor.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-14 h-14 text-orange-300" />
                )}
              </div>
              <h1 className="text-xl font-extrabold text-gray-900">{tutor.name}</h1>
              <p className="text-orange-600 font-semibold text-sm mt-1">{tutor.subject}</p>
              <div className="mt-3 flex justify-center">
                <StarRating rating={tutor.avg_rating} count={tutor.review_count} size="md" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-blue-50 rounded-xl p-3">
                  <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-gray-900">{tutor.experience_years}</p>
                  <p className="text-gray-400 text-xs">Years Exp.</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-gray-900">{tutor.hourly_rate > 0 ? `₹${tutor.hourly_rate}` : '—'}</p>
                  <p className="text-gray-400 text-xs">per hour</p>
                </div>
              </div>

              <div className="mt-4">
                <BookmarkButton targetId={tutor.id} targetType="tutor" />
              </div>
              <button
                onClick={() => setShowEnquiry(true)}
                className="mt-3 w-full flex items-center justify-center gap-2 text-white font-bold py-3 rounded-2xl transition-all hover:opacity-90 text-sm shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6C4FD8, #2F6FED)', boxShadow: '0 6px 24px rgba(108,79,216,0.3)' }}
              >
                <MessageSquare className="w-4 h-4" /> Send Enquiry
              </button>
            </div>

            {/* Availability */}
            {sortedAvail.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Availability
                </h3>
                <div className="space-y-2">
                  {sortedAvail.map((slot, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{slot.day_of_week}</span>
                      <span className="text-gray-500 text-xs">{slot.start_time} – {slot.end_time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery thumbnails */}
            {images.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-3">Photos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {images.map(img => (
                    <div key={img.id} className="aspect-square rounded-lg overflow-hidden">
                      <img src={`/uploads/${img.file_path}`} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Bio */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {tutor.bio || 'No bio provided yet.'}
              </p>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <ReviewSection targetId={tutor.id} targetType="tutor" />
            </div>
          </div>
        </div>
      </div>

      {showEnquiry && (
        <EnquiryModal
          targetId={tutor.id}
          targetType="tutor"
          targetName={tutor.name}
          onClose={() => setShowEnquiry(false)}
        />
      )}
    </div>
  );
}
 