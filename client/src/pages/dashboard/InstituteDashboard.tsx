import { useEffect, useState } from 'react';
import { PlusCircle, Trash2, Upload, X, Star, MessageSquare } from 'lucide-react';
import type { Institute, Course, Enquiry } from '../../types';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { getUploadUrl } from '../../utils/runtime';

export default function InstituteDashboard() {
  const { user } = useAuth();
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'profile' | 'courses' | 'teachers' | 'images' | 'enquiries'>('profile');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);
  const [updatingEnquiry, setUpdatingEnquiry] = useState<number | null>(null);

  // Profile form
  const [form, setForm] = useState({ name: '', location: '', description: '', contact_email: '', contact_phone: '', contact_website: '' });

  // Add course form
  const [courseForm, setCourseForm] = useState({ course_id: '', fee_structure: '', duration: '' });

  // Star teacher form
  const [tutorIdInput, setTutorIdInput] = useState('');

  // Image upload
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchEnquiries = async () => {
    setEnquiriesLoading(true);
    try {
      const { data } = await api.get('/enquiries/received');
      setEnquiries(data);
    } catch { /* fail silently */ } finally { setEnquiriesLoading(false); }
  };

  const markEnquiry = async (id: number, status: 'read' | 'replied') => {
    setUpdatingEnquiry(id);
    try {
      await api.patch(`/enquiries/${id}/status`, { status });
      setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    } catch { alert('Failed to update'); } finally { setUpdatingEnquiry(null); }
  };

  useEffect(() => {
    if (tab === 'enquiries') fetchEnquiries();
  }, [tab]);

  const fetchInstitute = async () => {
    try {
      const { data } = await api.get('/institutes/mine/profile');
      setInstitute(data);
      setForm({
        name: data.name || '', location: data.location || '',
        description: data.description || '', contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '', contact_website: data.contact_website || '',
      });
    } catch {
      setInstitute(null);
    }
  };

  useEffect(() => {
    Promise.all([
      fetchInstitute(),
      api.get('/search/courses').then(({ data }) => setCourses(data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.put(`/institutes/${institute!.id}`, form);
      await fetchInstitute();
      setMsg('Profile updated successfully!');
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const addCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.course_id || !courseForm.fee_structure) return;
    try {
      await api.post(`/institutes/${institute!.id}/courses`, {
        course_id: parseInt(courseForm.course_id),
        fee_structure: courseForm.fee_structure,
        duration: courseForm.duration,
      });
      setCourseForm({ course_id: '', fee_structure: '', duration: '' });
      await fetchInstitute();
      setMsg('Course added!');
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Failed to add course');
    }
  };

  const removeCourse = async (courseId: number) => {
    if (!confirm('Remove this course?')) return;
    try {
      await api.delete(`/institutes/${institute!.id}/courses/${courseId}`);
      await fetchInstitute();
    } catch {
      alert('Failed to remove course');
    }
  };

  const addStarTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorIdInput) return;
    try {
      await api.post(`/institutes/${institute!.id}/star-teachers`, { tutor_id: parseInt(tutorIdInput) });
      setTutorIdInput('');
      await fetchInstitute();
      setMsg('Star teacher added!');
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Failed to add star teacher');
    }
  };

  const removeStarTeacher = async (tutorId: number) => {
    try {
      await api.delete(`/institutes/${institute!.id}/star-teachers/${tutorId}`);
      await fetchInstitute();
    } catch {
      alert('Failed to remove star teacher');
    }
  };

  const uploadImages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFiles || imageFiles.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < imageFiles.length; i++) {
      formData.append('images', imageFiles[i]);
    }
    try {
      await api.post(`/institutes/${institute!.id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageFiles(null);
      await fetchInstitute();
      setMsg('Images uploaded!');
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId: number) => {
    if (!confirm('Delete this image?')) return;
    try {
      await api.delete(`/institutes/${institute!.id}/images/${imageId}`);
      await fetchInstitute();
    } catch {
      alert('Failed to delete image');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  const status = institute?.status;
  const categories = [...new Set(courses.map(c => c.category))];
  const planName = institute?.subscription_plan_name || 'Legacy Access';
  const planFeatures = institute?.plan_features;
  const imageCount = institute?.images?.length || 0;
  const imageLimit = planFeatures?.maxImages ?? null;
  const remainingImageSlots = imageLimit === null ? null : Math.max(imageLimit - imageCount, 0);
  const reviewsEnabled = planFeatures?.reviewsEnabled ?? true;
  const starTeachersEnabled = planFeatures?.starTeachersEnabled ?? true;
  const enquiriesEnabled = planFeatures?.enquiriesEnabled ?? true;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">{institute?.name || user?.name}</h1>
              <p className="text-gray-500 text-sm mt-1">Institute Dashboard</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                  Plan: {planName}
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
                  Gallery: {imageLimit === null ? `${imageCount} / Unlimited` : `${imageCount} / ${imageLimit}`}
                </span>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${reviewsEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  Reviews: {reviewsEnabled ? 'Enabled' : 'Growth or Elite only'}
                </span>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${enquiriesEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  Enquiries: {enquiriesEnabled ? 'Enabled' : 'Growth or Elite only'}
                </span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${status === 'approved' ? 'bg-green-100 text-green-700' : status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {status === 'approved' ? '✓ Approved' : status === 'rejected' ? '✗ Rejected' : '⏳ Pending Approval'}
            </span>
          </div>
          {status === 'pending' && (
            <p className="mt-3 text-sm text-yellow-700 bg-yellow-50 rounded-lg p-3">
              Your profile is still in the legacy manual review queue. New paid provider signups are published after checkout, but older pending listings can still be approved here.
            </p>
          )}
        </div>

        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${msg.includes('fail') || msg.includes('error') || msg.includes('Error') ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {msg}
            <button onClick={() => setMsg('')} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3 h-3 inline" /></button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['profile', 'courses', 'teachers', 'images', 'enquiries'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm capitalize transition-all ${
                tab === t ? 'text-white' : 'bg-white text-brand-secondary border border-brand-border hover:border-brand-primary hover:text-brand-primary'
              }`}
              style={tab === t ? { background: 'linear-gradient(135deg, #2F6FED, #16407A)' } : {}}>
              {t === 'teachers' ? '⭐ Star Teachers' : t === 'courses' ? '📚 Courses' : t === 'images' ? '🖼️ Images' : t === 'enquiries' ? `💬 Enquiries${enquiries.filter(e => e.status === 'new').length > 0 ? ` (${enquiries.filter(e => e.status === 'new').length})` : ''}` : '📝 Profile'}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <form onSubmit={saveProfile} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">Edit Profile</h2>
            {[
              { label: 'Institute Name', key: 'name', type: 'text' },
              { label: 'Location / City', key: 'location', type: 'text' },
              { label: 'Contact Email', key: 'contact_email', type: 'email' },
              { label: 'Contact Phone', key: 'contact_phone', type: 'text' },
              { label: 'Website', key: 'contact_website', type: 'text' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
            </div>
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {/* Courses Tab */}
        {tab === 'courses' && (
          <div className="space-y-5">
            <form onSubmit={addCourse} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Add Course</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Course *</label>
                  <select value={courseForm.course_id} onChange={e => setCourseForm(f => ({ ...f, course_id: e.target.value }))} required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select a course</option>
                    {categories.map(cat => (
                      <optgroup key={cat} label={cat}>
                        {courses.filter(c => c.category === cat).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fee Structure *</label>
                  <input type="text" required value={courseForm.fee_structure} onChange={e => setCourseForm(f => ({ ...f, fee_structure: e.target.value }))}
                  placeholder="e.g. ₹5,000/month"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Duration</label>
                  <input type="text" value={courseForm.duration} onChange={e => setCourseForm(f => ({ ...f, duration: e.target.value }))}
                    placeholder="e.g. 3 months"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <button type="submit" className="mt-3 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                <PlusCircle className="w-4 h-4" /> Add Course
              </button>
            </form>

            {institute?.courses && institute.courses.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-900 text-lg mb-4">Current Courses</h2>
                <div className="space-y-2">
                  {institute.courses.map(c => (
                    <div key={c.course_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{c.course_name}</p>
                        <p className="text-gray-500 text-xs">{c.fee_structure}{c.duration ? ` · ${c.duration}` : ''}</p>
                      </div>
                      <button onClick={() => removeCourse(c.course_id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Star Teachers Tab */}
        {tab === 'teachers' && (
          <div className="space-y-5">
            {starTeachersEnabled ? (
              <form onSubmit={addStarTeacher} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-900 text-lg mb-2">Add Star Teacher</h2>
                <p className="text-gray-500 text-sm mb-4">Enter the Tutor ID of an approved tutor to add them as a star teacher.</p>
                <div className="flex gap-3">
                  <input type="number" value={tutorIdInput} onChange={e => setTutorIdInput(e.target.value)}
                    placeholder="Tutor ID (e.g. 5)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="submit" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                    <Star className="w-4 h-4" /> Add
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm text-amber-800">
                Star teacher profiles are available on Academy Growth and Academy Elite plans only.
              </div>
            )}

            {institute?.star_teachers && institute.star_teachers.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-900 text-lg mb-4">Star Teachers</h2>
                <div className="space-y-3">
                  {institute.star_teachers.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-bold text-orange-500">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                          <p className="text-gray-500 text-xs">{t.subject} · ID: {t.id}</p>
                        </div>
                      </div>
                      <button onClick={() => removeStarTeacher(t.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Images Tab */}
        {tab === 'images' && (
          <div className="space-y-5">
            <form onSubmit={uploadImages} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Upload Images</h2>
              <p className="text-sm text-gray-500 mb-4">
                {imageLimit === null
                  ? `Your current plan supports an unlimited gallery. ${imageCount} image${imageCount !== 1 ? 's' : ''} uploaded so far.`
                  : `Your current plan allows up to ${imageLimit} images. ${remainingImageSlots} slot${remainingImageSlots !== 1 ? 's' : ''} remaining.`}
              </p>
              <input type="file" accept="image/*" multiple onChange={e => setImageFiles(e.target.files)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              <button type="submit" disabled={!imageFiles || uploading}
                className="mt-3 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
                <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>

            {institute?.images && institute.images.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-900 text-lg mb-4">Current Images</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {institute.images.map(img => (
                    <div key={img.id} className="relative group aspect-video rounded-xl overflow-hidden bg-gray-100">
                      <img src={getUploadUrl(img.file_path)} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => deleteImage(img.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Enquiries Tab */}
        {tab === 'enquiries' && (
          <div className="space-y-4">
            {!enquiriesEnabled ? (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 text-sm text-amber-800">
                Student enquiries and the lead inbox are available on Academy Growth and Academy Elite plans only.
              </div>
            ) : enquiriesLoading ? (
              <div className="text-center py-12 text-brand-secondary">Loading enquiries…</div>
            ) : enquiries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-brand-border p-12 text-center">
                <MessageSquare className="w-12 h-12 text-brand-border mx-auto mb-3" />
                <p className="font-semibold text-brand-dark">No enquiries yet</p>
                <p className="text-brand-secondary text-sm mt-1">When students send you a message, it will appear here.</p>
              </div>
            ) : (
              enquiries.map(enq => (
                <div key={enq.id} className={`bg-white rounded-2xl border p-5 ${
                  enq.status === 'new' ? 'border-brand-primary ring-1 ring-brand-primary/20' : 'border-brand-border'
                }`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-brand-dark">{enq.student_name}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          enq.status === 'new' ? 'bg-brand-primary/10 text-brand-primary' :
                          enq.status === 'replied' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-brand-mist text-brand-secondary'
                        }`}>{enq.status}</span>
                      </div>
                      <p className="text-xs text-brand-secondary">{enq.student_email}{enq.student_phone ? ` · ${enq.student_phone}` : ''}</p>
                    </div>
                    <p className="text-xs text-brand-secondary">{new Date(enq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <p className="mt-3 text-sm text-brand-body leading-relaxed bg-brand-mist rounded-xl px-4 py-3">{enq.message}</p>
                  {enq.status === 'new' && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => markEnquiry(enq.id, 'read')} disabled={updatingEnquiry === enq.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-brand-border text-brand-secondary hover:bg-brand-mist transition-all disabled:opacity-50">
                        Mark as read
                      </button>
                      <button onClick={() => markEnquiry(enq.id, 'replied')} disabled={updatingEnquiry === enq.id}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #2F6FED, #16407A)' }}>
                        Mark as replied
                      </button>
                    </div>
                  )}
                  {enq.status === 'read' && (
                    <button onClick={() => markEnquiry(enq.id, 'replied')} disabled={updatingEnquiry === enq.id}
                      className="mt-3 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #2F6FED, #16407A)' }}>
                      Mark as replied
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}