import { useEffect, useState } from 'react';
import { BarChart3, BookOpen, CheckCircle, FileClock, IndianRupee, Pencil, QrCode, Save, Search, Trash2, Users, XCircle } from 'lucide-react';
import type { AdminManagedInstituteProfile, AdminManagedTutorProfile, AdminManagedUser, AdminProviderDraft, AdminStats } from '../../types';
import api from '../../api/axios';

interface PendingItem {
  id: number;
  name: string;
  location?: string;
  subject?: string;
  email: string;
  created_at: string;
  status: string;
}

interface ProviderPaymentItem {
  draftId: string;
  role: 'institute' | 'tutor';
  name: string;
  email: string;
  location?: string;
  subject?: string;
  planCode?: string | null;
  planName?: string | null;
  durationMonths?: number | null;
  amount?: number | null;
  appliedCouponCode?: string | null;
  paymentReference?: string;
  createdAt: string;
  submittedAt: string;
}

type AdminTab = 'stats' | 'people' | 'drafts' | 'institutes' | 'tutors' | 'payments';

type UserRoleFilter = 'all' | 'student' | 'tutor' | 'institute' | 'admin';

type EditFormState = Record<string, string>;

function formatPrice(value?: number | null) {
  if (!value && value !== 0) return 'Not set';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function isInstituteProfile(profile: AdminManagedUser['profile']): profile is AdminManagedInstituteProfile {
  return Boolean(profile && 'location' in profile);
}

function isTutorProfile(profile: AdminManagedUser['profile']): profile is AdminManagedTutorProfile {
  return Boolean(profile && 'subject' in profile);
}

function buildEditForm(user: AdminManagedUser): EditFormState {
  const form: EditFormState = {
    name: user.name,
    email: user.email,
  };

  if (isInstituteProfile(user.profile)) {
    form.location = user.profile.location || '';
    form.description = user.profile.description || '';
    form.contact_email = user.profile.contact_email || '';
    form.contact_phone = user.profile.contact_phone || '';
    form.contact_website = user.profile.contact_website || '';
    form.status = user.profile.status;
  }

  if (isTutorProfile(user.profile)) {
    form.subject = user.profile.subject || '';
    form.experience_years = String(user.profile.experience_years ?? 0);
    form.hourly_rate = String(user.profile.hourly_rate ?? 0);
    form.bio = user.profile.bio || '';
    form.mode = user.profile.mode || 'both';
    form.status = user.profile.status;
  }

  return form;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingInstitutes, setPendingInstitutes] = useState<PendingItem[]>([]);
  const [pendingTutors, setPendingTutors] = useState<PendingItem[]>([]);
  const [providerPayments, setProviderPayments] = useState<ProviderPaymentItem[]>([]);
  const [managedUsers, setManagedUsers] = useState<AdminManagedUser[]>([]);
  const [providerDrafts, setProviderDrafts] = useState<AdminProviderDraft[]>([]);
  const [tab, setTab] = useState<AdminTab>('stats');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<UserRoleFilter>('all');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({});

  const fetchData = async () => {
    try {
      const [statsRes, pendingRes, usersRes, draftsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/pending'),
        api.get('/admin/users', { params: { limit: 1000 } }),
        api.get('/admin/provider-drafts'),
      ]);
      setStats(statsRes.data);
      setPendingInstitutes(pendingRes.data.institutes);
      setPendingTutors(pendingRes.data.tutors);
      setProviderPayments(pendingRes.data.providerPayments || []);
      setManagedUsers(usersRes.data.users || []);
      setProviderDrafts(draftsRes.data.drafts || []);
    } catch { /* fail silently */ }
  };

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, []);

  const updateInstituteStatus = async (id: number, status: 'approved' | 'rejected') => {
    setProcessing(`institute:${id}`);
    try {
      await api.put(`/admin/institutes/${id}/status`, { status });
      setPendingInstitutes(prev => prev.filter(i => i.id !== id));
      await fetchData();
    } catch { alert('Failed to update status'); } finally { setProcessing(null); }
  };

  const updateTutorStatus = async (id: number, status: 'approved' | 'rejected') => {
    setProcessing(`tutor:${id}`);
    try {
      await api.put(`/admin/tutors/${id}/status`, { status });
      setPendingTutors(prev => prev.filter(t => t.id !== id));
      await fetchData();
    } catch { alert('Failed to update status'); } finally { setProcessing(null); }
  };

  const updateProviderPaymentStatus = async (draftId: string, action: 'approve' | 'reject') => {
    setProcessing(`payment:${draftId}:${action}`);
    try {
      await api.post(`/admin/provider-payments/${draftId}/${action}`);
      setProviderPayments(prev => prev.filter(item => item.draftId !== draftId));
      await fetchData();
    } catch {
      alert(`Failed to ${action} provider payment`);
    } finally {
      setProcessing(null);
    }
  };

  const startEditing = (user: AdminManagedUser) => {
    setEditingUserId(user.id);
    setEditForm(buildEditForm(user));
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setEditForm({});
  };

  const saveUser = async (user: AdminManagedUser) => {
    setProcessing(`user-save:${user.id}`);
    try {
      await api.put(`/admin/users/${user.id}`, editForm);
      cancelEditing();
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save user changes');
    } finally {
      setProcessing(null);
    }
  };

  const deleteUser = async (user: AdminManagedUser) => {
    if (!window.confirm(`Delete ${user.name} (${user.email})? This will remove linked profile data too.`)) {
      return;
    }

    setProcessing(`user-delete:${user.id}`);
    try {
      await api.delete(`/admin/users/${user.id}`);
      if (editingUserId === user.id) {
        cancelEditing();
      }
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete user');
    } finally {
      setProcessing(null);
    }
  };

  const deleteDraft = async (draft: AdminProviderDraft) => {
    if (!window.confirm(`Delete registration draft for ${draft.name} (${draft.email})?`)) {
      return;
    }

    setProcessing(`draft-delete:${draft.draftId}`);
    try {
      await api.delete(`/admin/provider-drafts/${draft.draftId}`);
      await fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete registration draft');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  const totalLegacyPending = pendingInstitutes.length + pendingTutors.length;
  const totalProviderPayments = providerPayments.length;
  const filteredUsers = managedUsers.filter((user) => {
    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
    const term = userSearch.trim().toLowerCase();
    const matchesSearch = !term || user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
    return matchesRole && matchesSearch;
  });

  const tabStyle = (t: string) =>
    `flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
      tab === t ? 'text-white' : 'bg-white text-brand-secondary border border-brand-border hover:border-brand-primary hover:text-brand-primary'
    }`;

  return (
    <div className="min-h-screen bg-brand-mist">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="rounded-2xl p-6 mb-6 text-white" style={{ background: 'linear-gradient(135deg, #0b2447, #16407A)' }}>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">🛡️ Admin Dashboard</h1>
          <p className="text-purple-200 text-sm mt-1">Learnova platform management</p>
          {totalLegacyPending > 0 && (
            <div className="mt-3 bg-amber-400/20 border border-amber-300/40 text-amber-200 text-sm rounded-xl px-4 py-2.5">
              ⚠️ {totalLegacyPending} legacy registration{totalLegacyPending > 1 ? 's' : ''} still in the manual approval queue
            </div>
          )}
          {totalProviderPayments > 0 && (
            <div className="mt-3 bg-emerald-400/20 border border-emerald-300/40 text-emerald-100 text-sm rounded-xl px-4 py-2.5">
              ₹ {totalProviderPayments} provider payment submission{totalProviderPayments > 1 ? 's are' : ' is'} waiting for approval before profile creation
            </div>
          )}
          {providerDrafts.length > 0 && (
            <div className="mt-3 bg-sky-400/20 border border-sky-300/40 text-sky-100 text-sm rounded-xl px-4 py-2.5">
              {providerDrafts.length} provider registration draft{providerDrafts.length > 1 ? 's are' : ' is'} saved before activation
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setTab('stats')} className={tabStyle('stats')}
            style={tab === 'stats' ? { background: 'linear-gradient(135deg, #2F6FED, #16407A)' } : {}}>
            <BarChart3 className="w-4 h-4" /> Overview
          </button>
          <button onClick={() => setTab('people')} className={tabStyle('people')}
            style={tab === 'people' ? { background: 'linear-gradient(135deg, #2F6FED, #16407A)' } : {}}>
            <Users className="w-4 h-4" /> People
          </button>
          <button onClick={() => setTab('drafts')} className={tabStyle('drafts')}
            style={tab === 'drafts' ? { background: 'linear-gradient(135deg, #2F6FED, #16407A)' } : {}}>
            <FileClock className="w-4 h-4" /> Registration Drafts {providerDrafts.length > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{providerDrafts.length}</span>}
          </button>
          <button onClick={() => setTab('institutes')} className={tabStyle('institutes')}
            style={tab === 'institutes' ? { background: 'linear-gradient(135deg, #2F6FED, #16407A)' } : {}}>
            <BookOpen className="w-4 h-4" />
            Institutes {pendingInstitutes.length > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingInstitutes.length}</span>}
          </button>
          <button onClick={() => setTab('tutors')} className={tabStyle('tutors')}
            style={tab === 'tutors' ? { background: 'linear-gradient(135deg, #2F6FED, #16407A)' } : {}}>
            <Users className="w-4 h-4" />
            Tutors {pendingTutors.length > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingTutors.length}</span>}
          </button>
          <button onClick={() => setTab('payments')} className={tabStyle('payments')}
            style={tab === 'payments' ? { background: 'linear-gradient(135deg, #2F6FED, #16407A)' } : {}}>
            <QrCode className="w-4 h-4" />
            Provider Payments {providerPayments.length > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{providerPayments.length}</span>}
          </button>
        </div>

        {/* Stats Tab */}
        {tab === 'stats' && stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Users',     value: stats.total_users,          icon: '👥', grad: 'from-brand-primary to-brand-dark' },
              { label: 'Students',        value: stats.total_students,        icon: '🎓', grad: 'from-emerald-500 to-teal-600' },
              { label: 'Institutes',      value: `${stats.approved_institutes}/${stats.total_institutes}`, icon: '🏫', sub: 'approved', grad: 'from-violet-500 to-brand-accent' },
              { label: 'Tutors',          value: `${stats.approved_tutors}/${stats.total_tutors}`,         icon: '👨‍🏫', sub: 'approved', grad: 'from-amber-500 to-orange-500' },
              { label: 'Reviews',         value: stats.total_reviews,         icon: '⭐', grad: 'from-pink-500 to-rose-500' },
              { label: 'Bookmarks',       value: stats.total_bookmarks,       icon: '🔖', grad: 'from-cyan-500 to-sky-600' },
              { label: 'Pending Inst.',   value: stats.pending_institutes,    icon: '⏳', grad: 'from-amber-400 to-yellow-500' },
              { label: 'Pending Tutors',  value: stats.pending_tutors,        icon: '⏳', grad: 'from-amber-400 to-yellow-500' },
              { label: 'QR Payments',     value: stats.pending_provider_payments, icon: '💳', grad: 'from-emerald-500 to-teal-600' },
              { label: 'Draft Signups',   value: providerDrafts.length,       icon: '📝', grad: 'from-sky-500 to-cyan-600' },
            ].map(({ label, value, icon, sub, grad }) => (
              <div key={label} className="bg-white rounded-2xl border border-brand-border p-5 text-center hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 bg-gradient-to-br ${grad} rounded-xl flex items-center justify-center text-2xl shadow-md mx-auto mb-3`}>{icon}</div>
                <p className="text-2xl font-extrabold text-brand-dark">{value}</p>
                <p className="text-brand-secondary text-xs mt-1 font-medium">{label}</p>
                {sub && <p className="text-brand-secondary text-xs opacity-60">{sub}</p>}
              </div>
            ))}
          </div>
        )}

        {tab === 'people' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-brand-border p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-bold text-brand-dark">All Registered Accounts</h2>
                  <p className="text-sm text-brand-secondary mt-1">See students, tutors, institutes, and admin accounts without opening the database.</p>
                </div>
                <div className="text-sm text-brand-secondary">Showing {filteredUsers.length} of {managedUsers.length}</div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                <label className="relative block">
                  <Search className="w-4 h-4 text-brand-secondary absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    value={userSearch}
                    onChange={(event) => setUserSearch(event.target.value)}
                    placeholder="Search by name or email"
                    className="w-full rounded-2xl border border-brand-border pl-11 pr-4 py-3 text-sm text-brand-body outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                  />
                </label>
                <select
                  value={userRoleFilter}
                  onChange={(event) => setUserRoleFilter(event.target.value as UserRoleFilter)}
                  className="rounded-2xl border border-brand-border px-4 py-3 text-sm text-brand-body outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                >
                  <option value="all">All roles</option>
                  <option value="student">Students</option>
                  <option value="tutor">Tutors</option>
                  <option value="institute">Institutes</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-brand-border overflow-hidden">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-brand-secondary">
                  <Users className="w-10 h-10 mx-auto mb-2 text-brand-primary" />
                  <p className="font-semibold">No users match this filter.</p>
                </div>
              ) : (
                <div className="divide-y divide-brand-border">
                  {filteredUsers.map((user) => {
                    const isEditing = editingUserId === user.id;
                    const instituteProfile = isInstituteProfile(user.profile) ? user.profile : null;
                    const tutorProfile = isTutorProfile(user.profile) ? user.profile : null;

                    return (
                      <div key={user.id} className="p-5">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="max-w-3xl">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-brand-dark text-lg">{user.name}</p>
                              <span className="rounded-full bg-brand-mist px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-primary">
                                {user.role}
                              </span>
                              {user.subscription && (
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                                  {user.subscription.planCode}
                                </span>
                              )}
                            </div>
                            <p className="text-brand-secondary text-sm mt-1">{user.email}</p>
                            <p className="text-brand-secondary text-xs mt-1">Registered: {formatDate(user.created_at)}</p>

                            {instituteProfile && (
                              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-xl bg-brand-mist px-3 py-2">
                                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-secondary">Status</p>
                                  <p className="mt-1 text-sm font-semibold text-brand-dark">{instituteProfile.status}</p>
                                </div>
                                <div className="rounded-xl bg-brand-mist px-3 py-2">
                                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-secondary">Location</p>
                                  <p className="mt-1 text-sm font-semibold text-brand-dark">{instituteProfile.location || 'Not set'}</p>
                                </div>
                                <div className="rounded-xl bg-brand-mist px-3 py-2">
                                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-secondary">Contact email</p>
                                  <p className="mt-1 text-sm font-semibold text-brand-dark break-all">{instituteProfile.contact_email || 'Not set'}</p>
                                </div>
                                <div className="rounded-xl bg-brand-mist px-3 py-2">
                                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-secondary">Phone</p>
                                  <p className="mt-1 text-sm font-semibold text-brand-dark">{instituteProfile.contact_phone || 'Not set'}</p>
                                </div>
                              </div>
                            )}

                            {tutorProfile && (
                              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-xl bg-brand-mist px-3 py-2">
                                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-secondary">Status</p>
                                  <p className="mt-1 text-sm font-semibold text-brand-dark">{tutorProfile.status}</p>
                                </div>
                                <div className="rounded-xl bg-brand-mist px-3 py-2">
                                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-secondary">Subject</p>
                                  <p className="mt-1 text-sm font-semibold text-brand-dark">{tutorProfile.subject || 'Not set'}</p>
                                </div>
                                <div className="rounded-xl bg-brand-mist px-3 py-2">
                                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-secondary">Experience</p>
                                  <p className="mt-1 text-sm font-semibold text-brand-dark">{tutorProfile.experience_years} years</p>
                                </div>
                                <div className="rounded-xl bg-brand-mist px-3 py-2">
                                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-secondary">Rate</p>
                                  <p className="mt-1 text-sm font-semibold text-brand-dark">{formatPrice(tutorProfile.hourly_rate)}</p>
                                </div>
                              </div>
                            )}

                            {user.subscription && (
                              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                Active subscription: <span className="font-bold">{user.subscription.planCode}</span> for {user.subscription.durationMonths} month{user.subscription.durationMonths > 1 ? 's' : ''} at {formatPrice(user.subscription.amount)}.
                              </div>
                            )}

                            {instituteProfile?.description && (
                              <p className="mt-4 text-sm text-brand-secondary leading-relaxed">{instituteProfile.description}</p>
                            )}

                            {tutorProfile?.bio && (
                              <p className="mt-4 text-sm text-brand-secondary leading-relaxed">{tutorProfile.bio}</p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => isEditing ? cancelEditing() : startEditing(user)}
                              className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-dark text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                            >
                              <Pencil className="w-4 h-4" /> {isEditing ? 'Close' : 'Edit'}
                            </button>
                            <button
                              onClick={() => deleteUser(user)}
                              disabled={processing === `user-delete:${user.id}`}
                              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </div>

                        {isEditing && (
                          <div className="mt-5 rounded-2xl border border-brand-border bg-brand-mist p-5">
                            <div className="grid gap-4 md:grid-cols-2">
                              <label className="text-sm font-medium text-brand-dark">
                                Name
                                <input
                                  value={editForm.name || ''}
                                  onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                                  className="mt-2 w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                                />
                              </label>
                              <label className="text-sm font-medium text-brand-dark">
                                Email
                                <input
                                  value={editForm.email || ''}
                                  onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                                  className="mt-2 w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                                />
                              </label>
                            </div>

                            {instituteProfile && (
                              <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <label className="text-sm font-medium text-brand-dark">
                                  Location
                                  <input
                                    value={editForm.location || ''}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, location: event.target.value }))}
                                    className="mt-2 w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                                  />
                                </label>
                                <label className="text-sm font-medium text-brand-dark">
                                  Status
                                  <select
                                    value={editForm.status || 'pending'}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value }))}
                                    className="mt-2 w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                  </select>
                                </label>
                                <label className="text-sm font-medium text-brand-dark md:col-span-2">
                                  Description
                                  <textarea
                                    value={editForm.description || ''}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
                                    rows={4}
                                    className="mt-2 w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                                  />
                                </label>
                                <label className="text-sm font-medium text-brand-dark">
                                  Contact email
                                  <input
                                    value={editForm.contact_email || ''}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, contact_email: event.target.value }))}
                                    className="mt-2 w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                                  />
                                </label>
                                <label className="text-sm font-medium text-brand-dark">
                                  Contact phone
                                  <input
                                    value={editForm.contact_phone || ''}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, contact_phone: event.target.value }))}
                                    className="mt-2 w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                                  />
                                </label>
                                <label className="text-sm font-medium text-brand-dark md:col-span-2">
                                  Contact website
                                  <input
                                    value={editForm.contact_website || ''}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, contact_website: event.target.value }))}
                                    className="mt-2 w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                                  />
                                </label>
                              </div>
                            )}

                            {tutorProfile && (
                              <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <label className="text-sm font-medium text-brand-dark">
                                  Subject
                                  <input
                                    value={editForm.subject || ''}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, subject: event.target.value }))}
                                    className="mt-2 w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                                  />
                                </label>
                                <label className="text-sm font-medium text-brand-dark">
                                  Status
                                  <select
                                    value={editForm.status || 'pending'}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value }))}
                                    className="mt-2 w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                  </select>
                                </label>
                                <label className="text-sm font-medium text-brand-dark">
                                  Experience years
                                  <input
                                    value={editForm.experience_years || '0'}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, experience_years: event.target.value }))}
                                    className="mt-2 w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                                  />
                                </label>
                                <label className="text-sm font-medium text-brand-dark">
                                  Hourly rate
                                  <input
                                    value={editForm.hourly_rate || '0'}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, hourly_rate: event.target.value }))}
                                    className="mt-2 w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                                  />
                                </label>
                                <label className="text-sm font-medium text-brand-dark md:col-span-2">
                                  Bio
                                  <textarea
                                    value={editForm.bio || ''}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, bio: event.target.value }))}
                                    rows={4}
                                    className="mt-2 w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                                  />
                                </label>
                                <label className="text-sm font-medium text-brand-dark md:col-span-2">
                                  Teaching mode
                                  <select
                                    value={editForm.mode || 'both'}
                                    onChange={(event) => setEditForm((prev) => ({ ...prev, mode: event.target.value }))}
                                    className="mt-2 w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                                  >
                                    <option value="online">Online</option>
                                    <option value="offline">Offline</option>
                                    <option value="both">Both</option>
                                  </select>
                                </label>
                              </div>
                            )}

                            <div className="mt-5 flex gap-3">
                              <button
                                onClick={() => saveUser(user)}
                                disabled={processing === `user-save:${user.id}`}
                                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
                              >
                                <Save className="w-4 h-4" /> Save changes
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="flex items-center gap-1.5 bg-white border border-brand-border text-brand-secondary font-semibold px-4 py-2 rounded-xl text-sm transition-colors hover:border-brand-primary hover:text-brand-primary"
                              >
                                <XCircle className="w-4 h-4" /> Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'drafts' && (
          <div className="bg-white rounded-2xl border border-brand-border overflow-hidden">
            <div className="p-5 border-b border-brand-border flex items-center justify-between">
              <div>
                <h2 className="font-bold text-brand-dark">Provider Registration Drafts</h2>
                <p className="text-sm text-brand-secondary mt-1">These are tutor and institute signups that started registration but are not activated yet.</p>
              </div>
              <span className="text-xs text-brand-secondary">{providerDrafts.length} open</span>
            </div>
            {providerDrafts.length === 0 ? (
              <div className="text-center py-12 text-brand-secondary">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                <p className="font-semibold">No open registration drafts.</p>
              </div>
            ) : (
              <div className="divide-y divide-brand-border">
                {providerDrafts.map((draft) => (
                  <div key={draft.draftId} className="p-5 flex items-start justify-between gap-4 flex-wrap">
                    <div className="max-w-3xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-brand-dark">{draft.name}</p>
                        <span className="rounded-full bg-brand-mist px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-primary">
                          {draft.role}
                        </span>
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-700">
                          {draft.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-brand-secondary text-sm mt-1">{draft.email}</p>
                      <p className="text-brand-secondary text-sm mt-1">{draft.location || draft.subject || 'Registration details saved'}</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl bg-brand-mist px-3 py-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-secondary">Plan</p>
                          <p className="mt-1 text-sm font-semibold text-brand-dark">{draft.selectedPlanName || 'Not selected'}</p>
                        </div>
                        <div className="rounded-xl bg-brand-mist px-3 py-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-secondary">Amount</p>
                          <p className="mt-1 text-sm font-semibold text-brand-dark">{draft.selectedAmount !== null && draft.selectedAmount !== undefined ? formatPrice(draft.selectedAmount) : 'Not set'}</p>
                        </div>
                        <div className="rounded-xl bg-brand-mist px-3 py-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-secondary">Checkout</p>
                          <p className="mt-1 text-sm font-semibold text-brand-dark">{draft.checkoutStatus || 'Not started'}</p>
                        </div>
                        <div className="rounded-xl bg-brand-mist px-3 py-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-secondary">Reference</p>
                          <p className="mt-1 text-sm font-semibold text-brand-dark break-all">{draft.paymentReference || 'Not submitted'}</p>
                        </div>
                      </div>
                      <p className="text-brand-secondary text-xs mt-3">Created: {formatDateTime(draft.createdAt)}</p>
                      <p className="text-brand-secondary text-xs">Updated: {formatDateTime(draft.updatedAt)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => deleteDraft(draft)}
                        disabled={processing === `draft-delete:${draft.draftId}`}
                        className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" /> Delete draft
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Institutes */}
        {tab === 'institutes' && (
          <div className="bg-white rounded-2xl border border-brand-border overflow-hidden">
            <div className="p-5 border-b border-brand-border flex items-center justify-between">
              <h2 className="font-bold text-brand-dark">Legacy Institute Approval Queue</h2>
              <span className="text-xs text-brand-secondary">{pendingInstitutes.length} pending</span>
            </div>
            {pendingInstitutes.length === 0 ? (
              <div className="text-center py-12 text-brand-secondary">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                <p className="font-semibold">All caught up! No pending institutes.</p>
              </div>
            ) : (
              <div className="divide-y divide-brand-border">
                {pendingInstitutes.map(inst => (
                  <div key={inst.id} className="p-5 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-bold text-brand-dark">{inst.name}</p>
                      <p className="text-brand-secondary text-sm">{inst.location}</p>
                      <p className="text-brand-secondary text-xs mt-0.5">{inst.email}</p>
                      <p className="text-brand-secondary text-xs">Registered: {new Date(inst.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateInstituteStatus(inst.id, 'approved')} disabled={processing === `institute:${inst.id}`}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => updateInstituteStatus(inst.id, 'rejected')} disabled={processing === `institute:${inst.id}`}
                        className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Tutors */}
        {tab === 'tutors' && (
          <div className="bg-white rounded-2xl border border-brand-border overflow-hidden">
            <div className="p-5 border-b border-brand-border flex items-center justify-between">
              <h2 className="font-bold text-brand-dark">Legacy Tutor Approval Queue</h2>
              <span className="text-xs text-brand-secondary">{pendingTutors.length} pending</span>
            </div>
            {pendingTutors.length === 0 ? (
              <div className="text-center py-12 text-brand-secondary">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                <p className="font-semibold">All caught up! No pending tutors.</p>
              </div>
            ) : (
              <div className="divide-y divide-brand-border">
                {pendingTutors.map(tutor => (
                  <div key={tutor.id} className="p-5 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-bold text-brand-dark">{tutor.name}</p>
                      <p className="text-brand-primary text-sm font-semibold">{tutor.subject}</p>
                      <p className="text-brand-secondary text-xs mt-0.5">{tutor.email}</p>
                      <p className="text-brand-secondary text-xs">Registered: {new Date(tutor.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateTutorStatus(tutor.id, 'approved')} disabled={processing === `tutor:${tutor.id}`}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => updateTutorStatus(tutor.id, 'rejected')} disabled={processing === `tutor:${tutor.id}`}
                        className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'payments' && (
          <div className="bg-white rounded-2xl border border-brand-border overflow-hidden">
            <div className="p-5 border-b border-brand-border flex items-center justify-between">
              <h2 className="font-bold text-brand-dark">QR Payment Approval Queue</h2>
              <span className="text-xs text-brand-secondary">{providerPayments.length} waiting</span>
            </div>
            {providerPayments.length === 0 ? (
              <div className="text-center py-12 text-brand-secondary">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                <p className="font-semibold">No pending QR payment submissions.</p>
              </div>
            ) : (
              <div className="divide-y divide-brand-border">
                {providerPayments.map(item => (
                  <div key={item.draftId} className="p-5 flex items-start justify-between gap-4 flex-wrap">
                    <div className="max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-brand-dark">{item.name}</p>
                        <span className="rounded-full bg-brand-mist px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-primary">
                          {item.role === 'institute' ? 'Academy' : 'Tutor'}
                        </span>
                        {item.appliedCouponCode && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                            {item.appliedCouponCode}
                          </span>
                        )}
                      </div>
                      <p className="text-brand-secondary text-sm mt-1">{item.email}</p>
                      <p className="text-brand-secondary text-sm mt-1">{item.location || item.subject || 'Provider details saved during registration'}</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl bg-brand-mist px-3 py-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-secondary">Plan</p>
                          <p className="mt-1 text-sm font-semibold text-brand-dark">{item.planName || 'Unknown plan'}</p>
                        </div>
                        <div className="rounded-xl bg-brand-mist px-3 py-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-secondary">Amount</p>
                          <p className="mt-1 text-sm font-semibold text-brand-dark flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" />{formatPrice(item.amount)}</p>
                        </div>
                        <div className="rounded-xl bg-brand-mist px-3 py-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-secondary">Duration</p>
                          <p className="mt-1 text-sm font-semibold text-brand-dark">{item.durationMonths} month{item.durationMonths && item.durationMonths > 1 ? 's' : ''}</p>
                        </div>
                        <div className="rounded-xl bg-brand-mist px-3 py-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-secondary">Reference</p>
                          <p className="mt-1 text-sm font-semibold text-brand-dark break-all">{item.paymentReference || 'Not submitted'}</p>
                        </div>
                      </div>
                      <p className="text-brand-secondary text-xs mt-3">Submitted: {new Date(item.submittedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateProviderPaymentStatus(item.draftId, 'approve')} disabled={processing === `payment:${item.draftId}:approve` || processing === `payment:${item.draftId}:reject`}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                        <CheckCircle className="w-4 h-4" /> Approve & Create Profile
                      </button>
                      <button onClick={() => updateProviderPaymentStatus(item.draftId, 'reject')} disabled={processing === `payment:${item.draftId}:approve` || processing === `payment:${item.draftId}:reject`}
                        className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                        <XCircle className="w-4 h-4" /> Reset Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
