import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Users, BookOpen, Star, BarChart3 } from 'lucide-react';
import type { AdminStats } from '../../types';
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingInstitutes, setPendingInstitutes] = useState<PendingItem[]>([]);
  const [pendingTutors, setPendingTutors] = useState<PendingItem[]>([]);
  const [tab, setTab] = useState<'stats' | 'institutes' | 'tutors'>('stats');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [statsRes, pendingRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/pending'),
      ]);
      setStats(statsRes.data);
      setPendingInstitutes(pendingRes.data.institutes);
      setPendingTutors(pendingRes.data.tutors);
    } catch { /* fail silently */ }
  };

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, []);

  const updateInstituteStatus = async (id: number, status: 'approved' | 'rejected') => {
    setProcessing(id);
    try {
      await api.put(`/admin/institutes/${id}/status`, { status });
      setPendingInstitutes(prev => prev.filter(i => i.id !== id));
      await fetchData();
    } catch { alert('Failed to update status'); } finally { setProcessing(null); }
  };

  const updateTutorStatus = async (id: number, status: 'approved' | 'rejected') => {
    setProcessing(id);
    try {
      await api.put(`/admin/tutors/${id}/status`, { status });
      setPendingTutors(prev => prev.filter(t => t.id !== id));
      await fetchData();
    } catch { alert('Failed to update status'); } finally { setProcessing(null); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  const totalPending = pendingInstitutes.length + pendingTutors.length;

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
          {totalPending > 0 && (
            <div className="mt-3 bg-amber-400/20 border border-amber-300/40 text-amber-200 text-sm rounded-xl px-4 py-2.5">
              ⚠️ {totalPending} registration{totalPending > 1 ? 's' : ''} awaiting your approval
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setTab('stats')} className={tabStyle('stats')}
            style={tab === 'stats' ? { background: 'linear-gradient(135deg, #2F6FED, #16407A)' } : {}}>
            <BarChart3 className="w-4 h-4" /> Overview
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

        {/* Pending Institutes */}
        {tab === 'institutes' && (
          <div className="bg-white rounded-2xl border border-brand-border overflow-hidden">
            <div className="p-5 border-b border-brand-border flex items-center justify-between">
              <h2 className="font-bold text-brand-dark">Pending Institute Registrations</h2>
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
                      <button onClick={() => updateInstituteStatus(inst.id, 'approved')} disabled={processing === inst.id}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => updateInstituteStatus(inst.id, 'rejected')} disabled={processing === inst.id}
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
              <h2 className="font-bold text-brand-dark">Pending Tutor Registrations</h2>
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
                      <button onClick={() => updateTutorStatus(tutor.id, 'approved')} disabled={processing === tutor.id}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => updateTutorStatus(tutor.id, 'rejected')} disabled={processing === tutor.id}
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
      </div>
    </div>
  );
}