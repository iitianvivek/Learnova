import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

type Role = 'student' | 'institute' | 'tutor';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'role' | 'form'>('role');
  const [role, setRole] = useState<Role>('student');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    location: '', description: '', contact_email: '', contact_phone: '', contact_website: '',
    subject: '', experience_years: '', hourly_rate: '', bio: '', mode: 'both',
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form, role };
      const { data } = await api.post('/auth/register', payload);
      login(data.token, data.user);
      switch (data.user.role) {
        case 'institute': navigate('/dashboard/institute'); break;
        case 'tutor': navigate('/dashboard/tutor'); break;
        default: navigate('/dashboard/student');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'student' as Role, label: 'Student', emoji: '🎓', desc: 'Search and compare institutes & tutors' },
    { id: 'institute' as Role, label: 'Institute', emoji: '🏫', desc: 'Register your educational institute' },
    { id: 'tutor' as Role, label: 'Tutor', emoji: '👨‍🏫', desc: 'Offer your tutoring services' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-blue-600 font-bold text-2xl">
            <GraduationCap className="w-8 h-8" />
            Learnova
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-4">Create an account</h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 'role' ? 'Choose your role to get started' : `Registering as ${role}`}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {step === 'role' ? (
            <div className="space-y-3">
              {roles.map(r => (
                <button
                  key={r.id}
                  onClick={() => { setRole(r.id); setStep('form'); }}
                  className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                >
                  <span className="text-3xl">{r.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{r.label}</p>
                    <p className="text-sm text-gray-500">{r.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                </button>
              ))}
              <div className="mt-4 text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">Sign in</Link>
              </div>
            </div>
          ) : (
            <>
              <button onClick={() => setStep('role')} className="text-sm text-gray-500 hover:text-blue-600 mb-4 flex items-center gap-1">
                ← Back to role selection
              </button>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              {role === 'institute' && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs rounded-lg px-4 py-3 mb-4">
                  ⏳ Institute registrations require admin approval before your profile goes live.
                </div>
              )}
              {role === 'tutor' && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs rounded-lg px-4 py-3 mb-4">
                  ⏳ Tutor registrations require admin approval before your profile goes live.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Common fields */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {role === 'institute' ? 'Institute Name' : 'Full Name'} *
                  </label>
                  <input type="text" required value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder={role === 'institute' ? 'e.g. Excellence Academy' : 'e.g. Ahmed Khan'}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                  <input type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password * (min 6 characters)</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={e => set('password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm pr-10" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Institute-specific fields */}
                {role === 'institute' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location / City *</label>
                      <input type="text" required value={form.location} onChange={e => set('location', e.target.value)}
                        placeholder="e.g. New Delhi"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Phone</label>
                      <input type="text" value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)}
                        placeholder="e.g. +92 300 1234567"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                      <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)}
                        placeholder="Briefly describe your institute..."
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
                    </div>
                  </>
                )}

                {/* Tutor-specific fields */}
                {role === 'tutor' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Primary Subject *</label>
                      <input type="text" required value={form.subject} onChange={e => set('subject', e.target.value)}
                        placeholder="e.g. Mathematics"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Experience (years)</label>
                        <input type="number" min="0" value={form.experience_years} onChange={e => set('experience_years', e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hourly Rate (₹)</label>
                        <input type="number" min="0" value={form.hourly_rate} onChange={e => set('hourly_rate', e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bio</label>
                      <textarea rows={3} value={form.bio} onChange={e => set('bio', e.target.value)}
                        placeholder="Describe your teaching experience and approach..."
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Teaching Mode</label>
                      <div className="flex bg-brand-mist rounded-xl p-1 gap-0.5">
                        {(['online', 'offline', 'both'] as const).map(opt => (
                          <button key={opt} type="button" onClick={() => set('mode', opt)}
                            className={`flex-1 text-xs font-bold py-2.5 rounded-lg capitalize transition-all ${
                              form.mode === opt ? 'bg-white text-brand-accent shadow-sm' : 'text-brand-secondary hover:text-brand-dark hover:bg-brand-dark/10'
                            }`}>
                            {opt === 'online' ? '🌐 Online' : opt === 'offline' ? '📍 Offline' : 'Both'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-2"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <div className="mt-4 text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">Sign in</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}