import { Link } from 'react-router-dom';
import { User, Clock, DollarSign, ChevronRight, PlusCircle } from 'lucide-react';
import type { Tutor } from '../types';
import StarRating from './StarRating';
import { getUploadUrl } from '../utils/runtime';

interface TutorCardProps {
  tutor: Tutor;
  showCompare?: boolean;
  onCompare?: (id: number) => void;
  compareSelected?: boolean;
}

const SUBJECT_GRADIENTS: Record<string, string> = {
  Mathematics: 'from-violet-400 to-purple-600',
  Physics: 'from-blue-400 to-indigo-600',
  Chemistry: 'from-emerald-400 to-teal-600',
  Biology: 'from-green-400 to-emerald-600',
  English: 'from-pink-400 to-rose-600',
  Computer: 'from-cyan-400 to-blue-500',
};

const getGradient = (subject: string) => {
  for (const [key, val] of Object.entries(SUBJECT_GRADIENTS)) {
    if (subject.includes(key)) return val;
  }
  return 'from-amber-400 to-orange-500';
};

export default function TutorCard({ tutor, showCompare, onCompare, compareSelected }: TutorCardProps) {
  const avatarUrl = tutor.avatar ? getUploadUrl(tutor.avatar) : null;
  const gradient = getGradient(tutor.subject);

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group hover:-translate-y-1">
      <div className={`h-44 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={tutor.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/30">
              <User className="w-10 h-10 text-white" />
            </div>
          </div>
        )}
        {showCompare && (
          <button
            onClick={() => onCompare && onCompare(tutor.id)}
            className={`absolute top-2 right-2 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full shadow-lg transition-all ${
              compareSelected ? 'bg-indigo-600 text-white' : 'bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-indigo-50'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            {compareSelected ? 'Added' : 'Compare'}
          </button>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-brand-body text-[15px] leading-tight truncate">{tutor.name}</h3>
        <p className="text-brand-primary font-semibold text-xs mt-0.5">{tutor.subject}</p>

        <div className="mt-2">
          <StarRating rating={tutor.avg_rating} count={tutor.review_count} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-brand-secondary bg-brand-mist rounded-lg px-2.5 py-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-secondary" />
            <span className="font-semibold">{tutor.experience_years} yr{tutor.experience_years !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-brand-secondary bg-brand-mist rounded-lg px-2.5 py-1.5">
            <DollarSign className="w-3.5 h-3.5 text-brand-secondary" />
            <span className="font-semibold truncate">{tutor.hourly_rate > 0 ? `₹${tutor.hourly_rate}/hr` : 'Neg.'}</span>
          </div>
        </div>
        {tutor.mode && tutor.mode !== 'both' && (
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
              tutor.mode === 'online' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-brand-primary'
            }`}>
              {tutor.mode === 'online' ? '🌐 Online' : '📍 Offline'}
            </span>
          </div>
        )}
        {tutor.mode === 'both' && (
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-brand-accent">
              🌐 Online + 📍 Offline
            </span>
          </div>
        )}

        {tutor.bio && (
          <p className="mt-2.5 text-slate-500 text-xs leading-relaxed line-clamp-2">{tutor.bio}</p>
        )}

        <Link
          to={`/tutor/${tutor.id}`}
          className="mt-4 flex items-center justify-center gap-1.5 w-full text-white text-sm font-semibold py-2.5 rounded-xl transition-all shadow-sm hover:opacity-90"
          style={{background: 'linear-gradient(135deg, #6C4FD8, #2F6FED)'}}
        >
          View Profile
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}