import { Link } from 'react-router-dom';
import { MapPin, BookOpen, ChevronRight, PlusCircle, Check } from 'lucide-react';
import type { Institute } from '../types';
import StarRating from './StarRating';
import { getUploadUrl } from '../utils/runtime';

interface InstituteCardProps {
  institute: Institute;
  showCompare?: boolean;
  onCompare?: (id: number) => void;
  compareSelected?: boolean;
}

const PLACEHOLDER_GRADIENTS = [
  'from-brand-dark to-brand-primary',
  'from-brand-primary to-brand-accent',
  'from-brand-accent to-brand-dark',
  'from-blue-600 to-brand-primary',
];

export default function InstituteCard({ institute, showCompare, onCompare, compareSelected }: InstituteCardProps) {
  const imageUrl = institute.thumbnail ? getUploadUrl(institute.thumbnail) : null;
  const gradient = PLACEHOLDER_GRADIENTS[institute.id % PLACEHOLDER_GRADIENTS.length];

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group hover:-translate-y-1">
      {/* Thumbnail */}
      <div className={`h-44 bg-gradient-to-br ${gradient} relative overflow-hidden`}>
        {imageUrl ? (
          <img src={imageUrl} alt={institute.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
        )}
        {/* Status badge */}
        {institute.status === 'approved' && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
            <Check className="w-2.5 h-2.5" /> Verified
          </div>
        )}
        {showCompare && (
          <button
            onClick={() => onCompare && onCompare(institute.id)}
            className={`absolute top-2 right-2 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full shadow-lg transition-all ${
              compareSelected
                ? 'bg-indigo-600 text-white'
                : 'bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-indigo-50'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            {compareSelected ? 'Added' : 'Compare'}
          </button>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-brand-body text-[15px] leading-tight truncate">{institute.name}</h3>

        <div className="flex items-center gap-1.5 mt-1 text-brand-secondary text-xs">
          <MapPin className="w-3 h-3 flex-shrink-0 text-brand-secondary" />
          <span className="truncate">{institute.location}</span>
        </div>

        <div className="mt-2">
          <StarRating rating={institute.avg_rating} count={institute.review_count} />
        </div>

        {institute.courses && institute.courses.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {institute.courses.slice(0, 3).map((c: any) => (
              <span key={c.name} className="bg-brand-mist text-brand-primary text-[11px] font-semibold px-2 py-0.5 rounded-full border border-brand-border">
                {c.name}
              </span>
            ))}
            {institute.courses.length > 3 && (
              <span className="bg-slate-100 text-slate-500 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                +{institute.courses.length - 3} more
              </span>
            )}
          </div>
        )}

        <Link
          to={`/institute/${institute.id}`}
          className="mt-4 flex items-center justify-center gap-1.5 w-full text-white text-sm font-semibold py-2.5 rounded-xl transition-all shadow-sm hover:opacity-90"
          style={{background: 'linear-gradient(135deg, #2F6FED, #16407A)'}}
        >
          View Profile
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}