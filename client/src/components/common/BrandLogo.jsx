import { Heart } from 'lucide-react';

/**
 * BrandLogo Component
 * Represents Saanidhya AI with a warm, caring visual identity:
 * a heart with a subtle voice wave pulse, paired with clean typography.
 */
export const BrandLogo = ({ size = 'md', showTagline = false, className = '' }) => {
  const sizeMap = {
    sm: {
      icon: 'w-7 h-7',
      innerIcon: 16,
      title: 'text-lg',
      tagline: 'text-xs',
      badge: 'text-[10px] px-1.5 py-0.5',
    },
    md: {
      icon: 'w-10 h-10',
      innerIcon: 22,
      title: 'text-2xl',
      tagline: 'text-xs',
      badge: 'text-xs px-2 py-0.5',
    },
    lg: {
      icon: 'w-14 h-14',
      innerIcon: 30,
      title: 'text-3xl',
      tagline: 'text-sm',
      badge: 'text-xs px-2.5 py-1',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Logo Emblem: Warm Blue & Gentle Voice/Heart Shape */}
      <div
        className={`${currentSize.icon} rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 relative flex-shrink-0 transition-transform duration-300 hover:scale-105`}
      >
        <Heart size={currentSize.innerIcon} className="fill-white/20 stroke-white stroke-[2.2]" />
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-400"></span>
        </span>
      </div>

      {/* Brand Name & Identity */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={`font-display font-bold tracking-tight text-slate-900 ${currentSize.title}`}>
            Saanidhya
          </span>
          <span
            className={`font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 rounded-full font-mono ${currentSize.badge}`}
          >
            AI
          </span>
        </div>
        {showTagline && (
          <span className={`text-slate-500 font-medium ${currentSize.tagline}`}>
            Voice Companion for Elderly Care
          </span>
        )}
      </div>
    </div>
  );
};

export default BrandLogo;
