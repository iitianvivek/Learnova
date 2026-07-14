import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapPin, Star, DollarSign, Clock, BookOpen, CheckCircle, XCircle, ChevronLeft } from 'lucide-react';
import type { Institute, Tutor, InstituteCourse } from '../types';
import StarRating from '../components/StarRating';
import api from '../api/axios';

export default function Compare() {
  const [searchParams] = useSearchParams();
  const ids = searchParams.get('ids') || '';
  const type = searchParams.get('type') as 'institute' | 'tutor' | null;

  const [data, setData] = useState<{ items: any[]; sharedCourseIds?: number[]; type: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ids || !type) { setError('Invalid comparison parameters'); setLoading(false); return; }
    api.get(`/search/compare?ids=${ids}&type=${type}`)
      .then(({ data: d }) => setData(d))
      .catch(err => setError(err.response?.data?.error || 'Failed to load comparison'))
      .finally(() => setLoading(false));
  }, [ids, type]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading comparison...</div>;
  if (error || !data) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
      <XCircle className="w-12 h-12 text-red-400" />
      <p>{error || 'Nothing to compare'}</p>
      <Link to="/search" className="text-blue-600 hover:underline text-sm">Back to Search</Link>
    </div>
  );

  const institutes = data.type === 'institute' ? (data.items as Institute[]) : [];
  const tutors = data.type === 'tutor' ? (data.items as Tutor[]) : [];
  const sharedCourseIds: number[] = data.sharedCourseIds || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/search" className="text-gray-500 hover:text-blue-600 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Comparing {data.type === 'institute' ? 'Institutes' : 'Tutors'}
          </h1>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
            {data.items.length} selected
          </span>
        </div>

        {/* Institute Comparison */}
        {institutes.length > 0 && (
          <div className="space-y-6">
            {/* Header cards */}
            <div className={`grid gap-4 ${institutes.length === 2 ? 'grid-cols-2' : institutes.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {institutes.map(inst => (
                <div key={inst.id} className="bg-white rounded-xl border-2 border-blue-200 p-5 text-center shadow-sm">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-8 h-8 text-blue-500" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">{inst.name}</h3>
                  <div className="flex items-center justify-center gap-1 mt-1 text-gray-500 text-xs">
                    <MapPin className="w-3 h-3" />
                    <span>{inst.location}</span>
                  </div>
                  <div className="mt-2 flex justify-center">
                    <StarRating rating={inst.avg_rating} count={inst.review_count} size="sm" />
                  </div>
                  <Link to={`/institute/${inst.id}`} className="mt-3 inline-block text-xs text-blue-600 hover:underline font-semibold">View Profile</Link>
                </div>
              ))}
            </div>

            {/* Shared Courses Section */}
            {sharedCourseIds.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Shared Courses — Side-by-Side Comparison
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-green-200">
                        <th className="text-left py-2 px-3 font-semibold text-green-700">Course</th>
                        {institutes.map(inst => (
                          <th key={inst.id} className="text-center py-2 px-3 font-semibold text-green-700">{inst.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sharedCourseIds.map(courseId => {
                        const courseRow = institutes[0].courses?.find((c: InstituteCourse) => c.course_id === courseId);
                        if (!courseRow) return null;
                        return (
                          <tr key={courseId} className="border-b border-green-100 hover:bg-green-100/50">
                            <td className="py-3 px-3 font-medium text-gray-800">{courseRow.course_name}</td>
                            {institutes.map(inst => {
                              const c = inst.courses?.find((cc: InstituteCourse) => cc.course_id === courseId);
                              return (
                                <td key={inst.id} className="py-3 px-3 text-center">
                                  {c ? (
                                    <div>
                                      <p className="font-semibold text-gray-900">{c.fee_structure}</p>
                                      {c.duration && <p className="text-xs text-gray-500">{c.duration}</p>}
                                    </div>
                                  ) : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* All courses per institute */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">All Courses Offered</h3>
              </div>
              <div className={`grid gap-0 divide-x divide-gray-100 ${institutes.length === 2 ? 'grid-cols-2' : institutes.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                {institutes.map(inst => (
                  <div key={inst.id} className="p-5">
                    <p className="font-semibold text-gray-800 text-sm mb-3">{inst.name}</p>
                    <div className="space-y-2">
                      {inst.courses && inst.courses.length > 0 ? inst.courses.map((c: InstituteCourse) => (
                        <div key={c.course_id}
                          className={`p-2.5 rounded-lg text-xs ${sharedCourseIds.includes(c.course_id) ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                          <p className="font-semibold text-gray-800">{c.course_name}</p>
                          <p className="text-gray-500">{c.fee_structure}</p>
                          {c.duration && <p className="text-gray-400">{c.duration}</p>}
                        </div>
                      )) : <p className="text-gray-400 text-xs">No courses listed</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Star Teachers */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Star Teachers</h3>
              </div>
              <div className={`grid gap-0 divide-x divide-gray-100 ${institutes.length === 2 ? 'grid-cols-2' : institutes.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                {institutes.map(inst => (
                  <div key={inst.id} className="p-5">
                    <p className="font-semibold text-gray-800 text-sm mb-3">{inst.name}</p>
                    {inst.star_teachers && inst.star_teachers.length > 0 ? (
                      <div className="space-y-2">
                        {inst.star_teachers.map((t: any) => (
                          <div key={t.id} className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600">
                              {t.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-800">{t.name}</p>
                              <p className="text-xs text-gray-500">{t.subject}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-gray-400 text-xs">None listed</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Contact Information</h3>
              </div>
              <div className={`grid gap-0 divide-x divide-gray-100 ${institutes.length === 2 ? 'grid-cols-2' : institutes.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                {institutes.map(inst => (
                  <div key={inst.id} className="p-5 space-y-1">
                    <p className="font-semibold text-gray-800 text-sm mb-2">{inst.name}</p>
                    {inst.contact_email && <p className="text-xs text-gray-600">📧 {inst.contact_email}</p>}
                    {inst.contact_phone && <p className="text-xs text-gray-600">📞 {inst.contact_phone}</p>}
                    {inst.contact_website && <p className="text-xs text-blue-600">🌐 {inst.contact_website}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tutor Comparison */}
        {tutors.length > 0 && (
          <div className="space-y-6">
            <div className={`grid gap-4 ${tutors.length === 2 ? 'grid-cols-2' : tutors.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {tutors.map(tutor => (
                <div key={tutor.id} className="bg-white rounded-xl border-2 border-orange-200 p-5 text-center shadow-sm">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold text-orange-500">
                    {tutor.name.charAt(0)}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">{tutor.name}</h3>
                  <p className="text-orange-600 text-xs font-medium mt-0.5">{tutor.subject}</p>
                  <div className="mt-2 flex justify-center">
                    <StarRating rating={tutor.avg_rating} count={tutor.review_count} size="sm" />
                  </div>
                  <Link to={`/tutor/${tutor.id}`} className="mt-3 inline-block text-xs text-blue-600 hover:underline font-semibold">View Profile</Link>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Key Metrics</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Metric</th>
                      {tutors.map(t => <th key={t.id} className="text-center py-3 px-4 font-semibold text-gray-600">{t.name}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-3 px-4 text-gray-600 flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" />Rating</td>
                      {tutors.map(t => <td key={t.id} className="py-3 px-4 text-center font-semibold">{t.avg_rating > 0 ? t.avg_rating.toFixed(1) : 'No reviews'}</td>)}
                    </tr>
                    <tr className="bg-gray-50/50">
                      <td className="py-3 px-4 text-gray-600 flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-500" />Hourly Rate</td>
                      {tutors.map(t => <td key={t.id} className="py-3 px-4 text-center font-semibold">{t.hourly_rate > 0 ? `₹${t.hourly_rate}/hr` : 'Negotiable'}</td>)}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-gray-600 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" />Experience</td>
                      {tutors.map(t => <td key={t.id} className="py-3 px-4 text-center font-semibold">{t.experience_years} yr{t.experience_years !== 1 ? 's' : ''}</td>)}
                    </tr>
                    <tr className="bg-gray-50/50">
                      <td className="py-3 px-4 text-gray-600">Availability</td>
                      {tutors.map(t => (
                        <td key={t.id} className="py-3 px-4 text-center">
                          {t.availability && t.availability.length > 0
                            ? t.availability.map((a: any) => a.day_of_week.slice(0, 3)).join(', ')
                            : 'Not set'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bios */}
            <div className={`grid gap-4 ${tutors.length === 2 ? 'grid-cols-2' : tutors.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {tutors.map(t => (
                <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <p className="font-bold text-gray-900 text-sm mb-2">{t.name}</p>
                  <p className="text-gray-600 text-xs leading-relaxed">{t.bio || 'No bio provided'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}