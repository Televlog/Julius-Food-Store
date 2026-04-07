'use client';
import { useState } from 'react';
import { FiStar } from 'react-icons/fi';

export function StarDisplay({ rating = 0, count, size = 16 }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex text-yellow-400">
        {[1, 2, 3, 4, 5].map((s) => (
          <FiStar key={s} size={size} fill={s <= Math.round(rating) ? 'currentColor' : 'none'} />
        ))}
      </div>
      <span className="text-sm font-medium text-gray-700">{rating?.toFixed(1)}</span>
      {count !== undefined && <span className="text-sm text-gray-500">({count} reviews)</span>}
    </div>
  );
}

export function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          className="text-yellow-400 transition-transform hover:scale-110"
        >
          <FiStar size={28} fill={s <= (hover || value) ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}
