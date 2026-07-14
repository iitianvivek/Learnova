import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

export default function StarRating({ rating, count, size = 'sm', interactive = false, onRate }: StarRatingProps) {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' };
  const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizes[size]} ${star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer hover:text-amber-400 transition-colors' : ''}`}
          onClick={() => interactive && onRate && onRate(star)}
        />
      ))}
      {rating > 0 && (
        <span className={`${textSizes[size]} font-semibold text-gray-700 ml-0.5`}>
          {Number(rating).toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className={`${textSizes[size]} text-gray-400`}>({count})</span>
      )}
    </div>
  );
}