import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Globe, BookOpen, Star, ChevronLeft, Users, MessageSquare } from 'lucide-react';
import type { Institute } from '../types';
import StarRating from '../components/StarRating';
import ReviewSection from '../components/ReviewSection';
import BookmarkButton from '../components/BookmarkButton';
import EnquiryModal from '../components/EnquiryModal';
import api from '../api/axios';

export default function InstituteProfile() {
  const { id } = useParams<{ id: string }>();
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showEnquiry, setShowEnquiry] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/institutes/${id}`)
      .then(({ data }) => setInstitute(data))
      .catch(() => setInstitute(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!institute) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
      <BookOpen className="w-12 h-12 text-gray-300" />
      <p>Institute not found</p>
      <Link to="/search" className="text-blue-600 hover:underline text-sm">Back to Search</Link>
    </div>
  );

  const images = institute.images || [];
  const courses = institute.courses || [];
  const starTeachers = institute.star_teachers || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Link to="/search" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-4">
          <ChevronLeft className="w-4 h-4" /> Back to Search
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12">
        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="mb-6">
            <div className="rounded-2xl overflow-hidden h-72 bg-blue-100">
              <img
                src={`/uploads/${images[activeImage].file_path}`}
                alt={institute.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button key={img.id} onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImage === i ? 'border-blue-500' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                    <img src={`/uploads/${img.file_path}`} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!images.length && (
          <div className="rounded-2xl h-40 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-6">
            <BookOpen className="w-16 h-16 text-blue-300" />
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold text-gray-900">{institute.name}</h1>
              <div className="flex items-center gap-1.5 mt-2 text-gray-500">
                <MapPin className="w-4 h-4 flex-shrink-0 text-blue-500" />
                <span className="text-sm">{institute.location}</span>
              </div>
              <div className="mt-3">
                <StarRating rating={institute.avg_rating} count={institute.review_count} size="md" />
              </div>
            </div>
            <BookmarkButton targetId={institute.id} targetType="institute" />
          </div>

          {/* Enquiry button */}
          <button
            onClick={() => setShowEnquiry(true)}
            className="mt-5 w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-2xl transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.98] shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6C4FD8, #2F6FED)', boxShadow: '0 6px 24px rgba(108,79,216,0.3)' }}
          >
            <MessageSquare className="w-4 h-4" /> Send Enquiry
          </button>

          {institute.description && (
            <p className="mt-4 text-gray-600 text-sm leading-relaxed">{institute.description}</p>
          )}

          {/* Contact */}
          <div className="mt-5 flex flex-wrap gap-4 text-sm">
            {institute.contact_email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>{institute.contact_email}</span>
              </div>
            )}
            {institute.contact_phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4 text-blue-400" />
                <span>{institute.contact_phone}</span>
              </div>
            )}
            {institute.contact_website && (
              <div className="flex items-center gap-2 text-gray-600">
                <Globe className="w-4 h-4 text-blue-400" />
                <span>{institute.contact_website}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Courses */}
            {courses.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Courses Offered
                </h2>
                <div className="space-y-3">
                  {courses.map(course => (
                    <div key={course.course_id} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{course.course_name}</p>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {course.category}
                        </span>
                        {course.duration && <p className="text-xs text-gray-500 mt-1">Duration: {course.duration}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-700 text-sm">{course.fee_structure}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <ReviewSection targetId={institute.id} targetType="institute" />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Rating summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-5xl font-extrabold text-gray-900">
                {institute.avg_rating > 0 ? Number(institute.avg_rating).toFixed(1) : '—'}
              </p>
              <div className="flex justify-center mt-1">
                <StarRating rating={institute.avg_rating} size="md" />
              </div>
              <p className="text-gray-400 text-sm mt-1">{institute.review_count} review{institute.review_count !== 1 ? 's' : ''}</p>
            </div>

            {/* Star Teachers */}
            {starTeachers.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  Star Teachers
                </h3>
                <div className="space-y-3">
                  {starTeachers.map(t => (
                    <Link key={t.id} to={`/tutor/${t.id}`} className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-500 flex-shrink-0">
                        {t.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{t.name}</p>
                        <p className="text-gray-500 text-xs">{t.subject}</p>
                        <p className="text-gray-400 text-xs">{t.experience_years} yrs exp</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Link
              to={`/search?type=institute`}
              className="block text-center text-sm text-blue-600 hover:text-blue-700 font-semibold py-3 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Browse More Institutes
            </Link>
          </div>
        </div>
      </div>

      {showEnquiry && (
        <EnquiryModal
          targetId={institute.id}
          targetType="institute"
          targetName={institute.name}
          onClose={() => setShowEnquiry(false)}
        />
      )}
    </div>
  );
}