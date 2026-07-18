import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-brand-mist flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #2F6FED, #6C4FD8, #16407A)' }}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl gradient-text">Learnova</span>
        </div>

        {/* 404 */}
        <div className="text-[7rem] font-extrabold leading-none text-brand-border select-none mb-2">404</div>
        <h1 className="text-2xl font-extrabold text-brand-dark mb-3">Page not found</h1>
        <p className="text-brand-secondary mb-8 leading-relaxed">
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-brand-border text-brand-secondary font-semibold hover:border-brand-primary hover:text-brand-primary hover:bg-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-white font-bold transition-all hover:opacity-90 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #2F6FED, #16407A)' }}
          >
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link
            to="/search"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-white font-bold transition-all hover:opacity-90 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6C4FD8, #2F6FED)' }}
          >
            <Search className="w-4 h-4" /> Search
          </Link>
        </div>
      </div>
    </div>
  );
}