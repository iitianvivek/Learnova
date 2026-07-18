import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, BookOpen, Users, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { from?: string; message?: string } | null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      if (data.user.role === 'student' && routeState?.from) {
        navigate(routeState.from);
        return;
      }
      switch (data.user.role) {
        case 'admin': navigate('/admin'); break;
        case 'institute': navigate('/dashboard/institute'); break;
        case 'tutor': navigate('/dashboard/tutor'); break;
        default: navigate('/dashboard/student');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden" style={{background: 'linear-gradient(135deg, #0b2447 0%, #16407A 50%, #1a5296 100%)'}}>
        <div className="absolute top-0 left-0 w-[450px] h-[450px] rounded-full opacity-30 animate-float pointer-events-none" style={{background: 'radial-gradient(circle, #6C4FD8, transparent 70%)', filter: 'blur(60px)'}} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-25 animate-float-slow pointer-events-none" style={{background: 'radial-gradient(circle, #2F6FED, transparent 70%)', filter: 'blur(60px)'}} />
        <div className="absolute top-1/3 right-10 w-64 h-64 rounded-full opacity-15 pointer-events-none" style={{background: 'radial-gradient(circle, #EAF2FA, transparent 70%)', filter: 'blur(50px)'}} />
        <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />

        <div className="relative z-10 text-white text-center max-w-sm">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/20" style={{background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)'}}>
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text" style={{backgroundImage: 'linear-gradient(90deg, #fff, #c4b5fd, #fff)'}}>Learnova</span>
          </div>

          <h2 className="text-3xl font-extrabold mb-4 leading-tight">
            Your education journey
            <span className="block text-transparent bg-clip-text" style={{backgroundImage: 'linear-gradient(90deg, #fbbf24, #f472b6)'}}> starts here</span>
          </h2>
          <p className="text-indigo-200 text-sm leading-relaxed mb-10">
            Discover top institutes and expert tutors. Compare, review, and find the perfect match for your learning goals.
          </p>

          <div className="flex flex-col gap-3 text-left">
            {[
              { icon: <BookOpen className="w-4 h-4" />, text: 'Browse verified institutes & tutors' },
              { icon: <Users className="w-4 h-4" />, text: 'Compare side by side' },
              { icon: <Star className="w-4 h-4 fill-amber-400 text-amber-400" />, text: 'Read authentic student reviews' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/80 border border-white/10" style={{background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)'}}>
                <span className="text-indigo-300">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-[18px] h-[18px] text-white" />
            </div>
            <span className="text-xl font-extrabold gradient-text">Learnova</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to your account to continue</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
            {routeState?.message && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-xl px-4 py-3 mb-5">
                {routeState.message}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm text-brand-body placeholder-brand-secondary transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent text-sm text-brand-body pr-11 transition-shadow"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                style={{background: 'linear-gradient(135deg, #2F6FED, #16407A)', boxShadow: '0 4px 16px rgba(47,111,237,0.3)'}}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Signing in...
                  </span>
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-primary hover:text-brand-dark font-semibold">
                Register here
              </Link>
            </div>

          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            <Link to="/" className="hover:text-indigo-600 transition-colors">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}