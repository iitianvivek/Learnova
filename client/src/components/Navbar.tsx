import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap, Search, LayoutDashboard, LogOut, LogIn, UserPlus,
  ShieldCheck, BookmarkCheck, SlidersHorizontal, ChevronDown, Grid3X3,
} from 'lucide-react';

const CATEGORIES = [
  { label: 'Mathematics',       emoji: '📐', q: 'Mathematics' },
  { label: 'Physics',           emoji: '⚛️',  q: 'Physics' },
  { label: 'Chemistry',         emoji: '🧪', q: 'Chemistry' },
  { label: 'Biology',           emoji: '🌱', q: 'Biology' },
  { label: 'Computer Science',  emoji: '💻', q: 'Computer Science' },
  { label: 'English',           emoji: '📖', q: 'English' },
  { label: 'JEE & NEET Prep',   emoji: '🔬', q: 'JEE NEET' },
  { label: 'Board Exam Prep',   emoji: '📝', q: 'Board Exam' },
  { label: 'IELTS Prep',        emoji: '🌐', q: 'IELTS' },
  { label: 'Art & Music',       emoji: '🎨', q: 'Art Music' },
];

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'admin':     return '/admin';
      case 'institute': return '/dashboard/institute';
      case 'tutor':     return '/dashboard/tutor';
      default:          return '/dashboard/student';
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'bg-white/92 backdrop-blur-2xl border-brand-border shadow-sm'
          : 'bg-white/80 backdrop-blur-xl border-brand-border'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[76px]">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
              style={{ background: 'linear-gradient(135deg, #2F6FED, #6C4FD8, #16407A)' }}
            >
              <GraduationCap className="w-[20px] h-[20px] text-white" />
            </div>
            <span className="font-extrabold text-[1.2rem] gradient-text tracking-tight leading-none">Learnova</span>
          </Link>

          {/* ── Centre nav ── */}
          <div className="hidden md:flex items-center gap-0.5">

            {/* Search */}
            <Link
              to="/search"
              className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all ${
                isActive('/search')
                  ? 'text-brand-primary bg-brand-mist'
                  : 'text-brand-secondary hover:text-brand-primary hover:bg-brand-mist'
              }`}
            >
              <Search className="w-[15px] h-[15px]" />
              Search
            </Link>

            {/* Categories dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setCatOpen(true)}
              onMouseLeave={() => setCatOpen(false)}
            >
              <button
                className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all select-none ${
                  catOpen
                    ? 'text-brand-primary bg-brand-mist'
                    : 'text-brand-secondary hover:text-brand-primary hover:bg-brand-mist'
                }`}
              >
                <Grid3X3 className="w-[15px] h-[15px]" />
                Categories
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown panel */}
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 ${
                  catOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1'
                }`}
                style={{ width: '420px', zIndex: 100 }}
              >
                <div className="bg-white rounded-2xl shadow-2xl border border-brand-border p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-1">Browse by subject</p>
                  <div className="grid grid-cols-2 gap-1">
                    {CATEGORIES.map(cat => (
                      <Link
                        key={cat.q}
                        to={`/search?q=${encodeURIComponent(cat.q)}`}
                        onClick={() => setCatOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-brand-mist hover:text-brand-primary text-brand-body transition-all group/item"
                      >
                        <span className="text-lg leading-none">{cat.emoji}</span>
                        <span className="text-sm font-medium group-hover/item:font-semibold transition-all">{cat.label}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <Link
                      to="/search"
                      onClick={() => setCatOpen(false)}
                      className="flex items-center justify-center gap-1.5 text-sm text-brand-primary hover:text-brand-dark font-semibold py-1.5"
                    >
                      <Search className="w-3.5 h-3.5" /> View all institutes & tutors
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Compare */}
            <Link
              to="/compare"
              className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all ${
                isActive('/compare')
                  ? 'text-brand-primary bg-brand-mist'
                  : 'text-brand-secondary hover:text-brand-primary hover:bg-brand-mist'
              }`}
            >
              <SlidersHorizontal className="w-[15px] h-[15px]" />
              Compare
            </Link>
          </div>

          {/* ── Auth ── */}
          <div className="flex items-center gap-2 shrink-0">
            {isAuthenticated && user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:text-brand-primary transition-colors px-3 py-2 rounded-xl hover:bg-brand-mist"
                >
                  {user.role === 'admin'
                    ? <ShieldCheck className="w-4 h-4" />
                    : user.role === 'student'
                      ? <BookmarkCheck className="w-4 h-4" />
                      : <LayoutDashboard className="w-4 h-4" />}
                  <span className="hidden sm:inline max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors px-3 py-2 rounded-xl hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:text-brand-primary transition-colors px-3 py-2"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #2F6FED, #6C4FD8)' }}
                >
                  <UserPlus className="w-4 h-4" />
                  Register
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}