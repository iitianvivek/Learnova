import { useEffect, useState } from 'react';
import { Upload, X, Plus, Trash2, MessageSquare } from 'lucide-react';
import type { Tutor, Availability, Enquiry } from '../../types';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { getUploadUrl } from '../../utils/runtime';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TutorDashboard() {
  const { user } = useAuth();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'profile' | 'availability' | 'images' | 'enquiries'>('profile');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);
  const [updatingEnquiry, setUpdatingEnquiry] = useState<number | null>(null);

  const [form, setForm] = useState({ name: '', subject: '', experience_years: '', hourly_rate: '', bio: '', mode: 'both' });
  const [slots, setSlots] = useState<Availability[]>([]);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchTutor = async () => {
    try {
      const { data } = await api.get('/tutors/mine/profile');
      setTutor(data);
      setForm({
        name: data.name || '', subject: data.subject || '',
        experience_years: String(data.experience_years || ''),
        hourly_rate: String(data.hourly_rate || ''), bio: data.bio || '',
        mode: data.mode || 'both',
      });
      setSlots(data.availability || []);
    } catch {
      setTutor(null);
    }
  };

  useEffect(() => { fetchTutor().finally(() => setLoading(false)); }, []);

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
    if (tab === 'enquiries' && (tutor?.plan_features?.enquiriesEnabled ?? true)) fetchEnquiries();
  }, [tab, tutor?.plan_features?.enquiriesEnabled]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      await api.put(`/tutors/${tutor!.id}`, {
        ...form,
        experience_years: parseInt(form.experience_years),
        hourly_rate: parseFloat(form.hourly_rate),
      });
      await fetchTutor();
      setMsg('Profile updated!');
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Update failed');
    } finally { setSaving(false); }
  };

  const saveAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      await api.post(`/tutors/${tutor!.id}/availability`, { slots });
      setMsg('Availability saved!');
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const addSlot = () => setSlots(s => [...s, { day_of_week: 'Monday', start_time: '09:00', end_time: '17:00' }]);
  const removeSlot = (i: number) => setSlots(s => s.filter((_, idx) => idx !== i));
  const updateSlot = (i: number, key: keyof Availability, val: string) =>
    setSlots(s => s.map((slot, idx) => idx === i ? { ...slot, [key]: val } : slot));

  const uploadImages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFiles || imageFiles.length === 0) return;
    setUploading(true);
    const fd = new FormData();
    for (let i = 0; i < imageFiles.length; i++) fd.append('images', imageFiles[i]);
    try {
      await api.post(`/tutors/${tutor!.id}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImageFiles(null);
      await fetchTutor();
      setMsg('Images uploaded!');
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Upload failed');
    } finally { setUploading(false); }
  };

  const deleteImage = async (imageId: number) => {
    if (!confirm('Delete this image?')) return;
    try {
      await api.delete(`/tutors/${tutor!.id}/images/${imageId}`);
      await fetchTutor();
    } catch { alert('Failed to delete image'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  const status = tutor?.status;
  const planName = tutor?.subscription_plan_name || 'Legacy Access';
  const planFeatures = tutor?.plan_features;
  const imageCount = tutor?.images?.length || 0;
  const imageLimit = planFeatures?.maxImages ?? null;
  const remainingImageSlots = imageLimit === null ? null : Math.max(imageLimit - imageCount, 0);
  const reviewsEnabled = planFeatures?.reviewsEnabled ?? true;
  const enquiriesEnabled = planFeatures?.enquiriesEnabled ?? true;
  const publicSearchEnabled = planFeatures?.publicSearchEnabled ?? true;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">{tutor?.name || user?.name}</h1>
              <p className="text-gray-500 text-sm mt-1">Tutor Dashboard · ID: {tutor?.id}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 border border-violet-200">
                  Plan: {planName}
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
                  Gallery: {imageLimit === null ? `${imageCount} / Unlimited` : `${imageCount} / ${imageLimit}`}
                </span>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${reviewsEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  Reviews: {reviewsEnabled ? 'Enabled' : 'Pro or Elite only'}
                </span>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${enquiriesEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  Enquiries: {enquiriesEnabled ? 'Enabled' : 'Pro or Elite only'}
                </span>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${publicSearchEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  Search Listing: {publicSearchEnabled ? 'Visible' : 'Upgrade required'}
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
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${msg.includes('fail') || msg.includes('Error') ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            {msg}
            <button onClick={() => setMsg('')} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3 h-3 inline" /></button>
          </div>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {(['profile', 'availability', 'images', 'enquiries'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm capitalize transition-all ${
                tab === t ? 'text-white' : 'bg-white text-brand-secondary border border-brand-border hover:border-brand-primary hover:text-brand-primary'
              }`}
              style={tab === t ? { background: 'linear-gradient(135deg, #6C4FD8, #2F6FED)' } : {}}>
              {t === 'availability' ? '📅 Availability' : t === 'images' ? '🖼️ Images' : t === 'enquiries' ? `💬 Enquiries${enquiries.filter(e => e.status === 'new').length > 0 ? ` (${enquiries.filter(e => e.status === 'new').length})` : ''}` : '📝 Profile'}
            </button>
          ))}
        </div>

        {/* Profile */}
        {tab === 'profile' && (
          <form onSubmit={saveProfile} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">Edit Profile</h2>
            {[
              { label: 'Full Name', key: 'name', type: 'text' },
              { label: 'Primary Subject', key: 'subject', type: 'text' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                <input type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Experience (years)</label>
                <input type="number" min="0" value={form.experience_years} onChange={e => setForm(f => ({ ...f, experience_years: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hourly Rate (₹)</label>
                <input type="number" min="0" value={form.hourly_rate} onChange={e => setForm(f => ({ ...f, hourly_rate: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bio</label>
              <textarea rows={4} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm resize-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Teaching Mode</label>
              <div className="flex bg-brand-mist rounded-xl p-1 gap-0.5 max-w-xs">
                {(['online', 'offline', 'both'] as const).map(opt => (
                  <button key={opt} type="button" onClick={() => setForm(f => ({ ...f, mode: opt }))}
                    className={`flex-1 text-xs font-bold py-2.5 rounded-lg capitalize transition-all ${
                      form.mode === opt ? 'bg-white text-brand-accent shadow-sm' : 'text-brand-secondary hover:text-brand-dark hover:bg-brand-dark/10'
                    }`}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {/* Availability */}
        {tab === 'availability' && (
          <form onSubmit={saveAvailability} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-lg">Availability Slots</h2>
              <button type="button" onClick={addSlot}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-semibold">
                <Plus className="w-4 h-4" /> Add Slot
              </button>
            </div>

            {slots.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-6">No slots added yet. Click "Add Slot" to set your availability.</p>
            )}

            <div className="space-y-3">
              {slots.map((slot, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <select value={slot.day_of_week} onChange={e => updateSlot(i, 'day_of_week', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input type="time" value={slot.start_time} onChange={e => updateSlot(i, 'start_time', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-gray-400 text-sm">to</span>
                  <input type="time" value={slot.end_time} onChange={e => updateSlot(i, 'end_time', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={() => removeSlot(i)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button type="submit" disabled={saving}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Availability'}
            </button>
          </form>
        )}

        {/* Images */}
        {tab === 'images' && (
          <div className="space-y-5">
            <form onSubmit={uploadImages} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Upload Images</h2>
              <p className="text-sm text-gray-500 mb-4">
                {imageLimit === null
                  ? `Your current plan supports an unlimited gallery. ${imageCount} image${imageCount !== 1 ? 's' : ''} uploaded so far.`
                  : imageLimit === 0
                    ? 'Image galleries are available on Tutor Pro and Tutor Elite plans only.'
                    : `Your current plan allows up to ${imageLimit} images. ${remainingImageSlots} slot${remainingImageSlots !== 1 ? 's' : ''} remaining.`}
              </p>
              <input type="file" accept="image/*" multiple onChange={e => setImageFiles(e.target.files)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              <button type="submit" disabled={!imageFiles || uploading}
                className="mt-3 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
                <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>

            {tutor?.images && tutor.images.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-900 text-lg mb-4">Current Images</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {tutor.images.map(img => (
                    <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
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
                Student enquiries are available on Tutor Pro and Tutor Elite plans only.
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
                  enq.status === 'new' ? 'border-brand-accent ring-1 ring-brand-accent/20' : 'border-brand-border'
                }`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-brand-dark">{enq.student_name}</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          enq.status === 'new' ? 'bg-brand-accent/10 text-brand-accent' :
                          enq.status === 'replied' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-brand-mist text-brand-secondary'
                        }`}>{enq.status}</span>
                      </div>
                      <p className="text-xs text-brand-secondary">{enq.student_email}{enq.student_phone ? ` · ${enq.student_phone}` : ''}</p>
                    </div>
                    <p className="text-xs text-brand-secondary">{new Date(enq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <p className="mt-3 text-sm text-brand-body leading-relaxed bg-brand-mist rounded-xl px-4 py-3">{enq.message}</p>
                  {enq.status !== 'replied' && (
                    <div className="flex gap-2 mt-3">
                      {enq.status === 'new' && (
                        <button onClick={() => markEnquiry(enq.id, 'read')} disabled={updatingEnquiry === enq.id}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-brand-border text-brand-secondary hover:bg-brand-mist transition-all disabled:opacity-50">
                          Mark as read
                        </button>
                      )}
                      <button onClick={() => markEnquiry(enq.id, 'replied')} disabled={updatingEnquiry === enq.id}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-all disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #6C4FD8, #2F6FED)' }}>
                        Mark as replied
                      </button>
                    </div>
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