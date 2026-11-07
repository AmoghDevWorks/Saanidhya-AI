import { motion } from 'framer-motion';
import { Mic, Volume2, Sparkles, Check, AlertCircle, Loader2 } from 'lucide-react';

/**
 * VoiceOrb Component
 * Expressive animated centerpiece for Saanidhya AI voice companion.
 * States: 'idle' | 'listening' | 'processing' | 'speaking' | 'completed' | 'error'
 */
export const VoiceOrb = ({ state = 'idle', size = 'lg', onOrbClick }) => {
  // Size presets
  const sizeConfig = {
    md: { orb: 'w-32 h-32', ring1: 'w-44 h-44', ring2: 'w-56 h-56', icon: 32 },
    lg: { orb: 'w-44 h-44', ring1: 'w-60 h-60', ring2: 'w-76 h-76', icon: 44 },
    xl: { orb: 'w-52 h-52', ring1: 'w-72 h-72', ring2: 'w-92 h-92', icon: 54 },
  };

  const currentSize = sizeConfig[size] || sizeConfig.lg;

  // Visual configuration per state
  const stateThemes = {
    idle: {
      gradient: 'from-blue-500 via-blue-600 to-teal-500',
      ringColor: 'border-blue-400/25',
      glow: 'shadow-blue-500/25',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      label: 'Ready to talk',
      sublabel: 'Press the microphone or tap the orb to begin',
      icon: Mic,
    },
    listening: {
      gradient: 'from-amber-500 via-rose-500 to-blue-500',
      ringColor: 'border-amber-400/40',
      glow: 'shadow-amber-500/35',
      badge: 'bg-amber-50 text-amber-800 border-amber-300',
      label: 'Listening to you...',
      sublabel: 'Speak naturally in your mother tongue',
      icon: Mic,
    },
    processing: {
      gradient: 'from-indigo-600 via-purple-600 to-blue-600',
      ringColor: 'border-indigo-400/35',
      glow: 'shadow-indigo-500/30',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      label: 'Understanding conversation (Evon AI)...',
      sublabel: 'Analyzing wellness and context',
      icon: Sparkles,
    },
    speaking: {
      gradient: 'from-teal-500 via-blue-600 to-emerald-500',
      ringColor: 'border-teal-400/40',
      glow: 'shadow-teal-500/30',
      badge: 'bg-teal-50 text-teal-800 border-teal-200',
      label: 'Saanidhya is speaking (Timbre Voice)...',
      sublabel: 'Warm voice companionship',
      icon: Volume2,
    },
    completed: {
      gradient: 'from-emerald-500 via-teal-600 to-blue-600',
      ringColor: 'border-emerald-400/35',
      glow: 'shadow-emerald-500/30',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      label: 'Check-in Completed 💙',
      sublabel: 'Wellness observations updated & family reassured',
      icon: Check,
    },
    error: {
      gradient: 'from-rose-500 via-red-600 to-amber-500',
      ringColor: 'border-rose-400/35',
      glow: 'shadow-rose-500/30',
      badge: 'bg-rose-50 text-rose-800 border-rose-200',
      label: 'Microphone unreachable',
      sublabel: 'Please check microphone permissions or type below',
      icon: AlertCircle,
    },
  };

  const theme = stateThemes[state] || stateThemes.idle;
  const StateIcon = theme.icon;

  return (
    <div className="flex flex-col items-center justify-center text-center select-none py-4">
      {/* Visual Orb Container with Concentric Responsive Rings */}
      <div
        className="relative flex items-center justify-center mb-6 cursor-pointer group"
        onClick={onOrbClick}
        role="button"
        aria-label={`Saanidhya voice assistant is currently ${theme.label}. Tap to interact.`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (onOrbClick) onOrbClick();
          }
        }}
      >
        {/* Outer Pulsing Ring 2 */}
        <motion.div
          animate={
            state === 'listening'
              ? { scale: [1, 1.28, 1], opacity: [0.2, 0.55, 0.2] }
              : state === 'speaking'
              ? { scale: [1, 1.18, 1], opacity: [0.15, 0.45, 0.15] }
              : { scale: [1, 1.05, 1], opacity: [0.1, 0.25, 0.1] }
          }
          transition={{ duration: state === 'listening' ? 1.6 : 3, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute ${currentSize.ring2} rounded-full border-2 ${theme.ringColor} pointer-events-none`}
        />

        {/* Middle Pulsing Ring 1 */}
        <motion.div
          animate={
            state === 'listening'
              ? { scale: [1, 1.18, 1], opacity: [0.35, 0.7, 0.35] }
              : state === 'speaking'
              ? { scale: [1, 1.12, 1], opacity: [0.25, 0.6, 0.25] }
              : { scale: [1, 1.03, 1], opacity: [0.2, 0.4, 0.2] }
          }
          transition={{ duration: state === 'listening' ? 1.3 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute ${currentSize.ring1} rounded-full border-2 ${theme.ringColor} pointer-events-none`}
        />

        {/* Core Glowing Orb */}
        <motion.div
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          animate={
            state === 'processing'
              ? { rotate: 360 }
              : state === 'listening'
              ? { scale: [1, 1.06, 1] }
              : state === 'speaking'
              ? { scale: [1, 1.04, 1] }
              : { scale: [1, 1.02, 1] }
          }
          transition={
            state === 'processing'
              ? { duration: 4, repeat: Infinity, ease: 'linear' }
              : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
          }
          className={`${currentSize.orb} rounded-full bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white shadow-2xl ${theme.glow} relative z-10 transition-shadow duration-300`}
        >
          {/* Inner Light Ripple */}
          <div className="absolute inset-2 rounded-full bg-white/10 backdrop-blur-xs flex items-center justify-center">
            {state === 'processing' ? (
              <Loader2 size={currentSize.icon} className="animate-spin text-white/90" />
            ) : (
              <StateIcon
                size={currentSize.icon}
                className="text-white drop-shadow-sm transition-transform group-hover:scale-110"
              />
            )}
          </div>
        </motion.div>
      </div>

      {/* State Status Pill */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border font-semibold text-xs mb-2 transition-colors duration-300 shadow-2xs">
        <span
          className={`w-2 h-2 rounded-full ${
            state === 'listening'
              ? 'bg-amber-500 animate-ping'
              : state === 'speaking'
              ? 'bg-teal-500 animate-pulse'
              : state === 'completed'
              ? 'bg-emerald-500'
              : 'bg-blue-500'
          }`}
        />
        <span className="font-bold tracking-tight text-slate-800">{theme.label}</span>
      </div>

      {/* Subtitle instructions */}
      <p className="text-sm font-medium text-slate-500 max-w-sm px-4">
        {theme.sublabel}
      </p>

      {/* Soundwave Bar Visualizer (when listening or speaking) */}
      {(state === 'listening' || state === 'speaking') && (
        <div className="flex items-center justify-center gap-1.5 h-6 mt-3">
          {[0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.7, 0.3].map((heightFactor, i) => (
            <motion.span
              key={i}
              animate={{
                scaleY: [heightFactor, 1.2, 0.3, heightFactor],
              }}
              transition={{
                duration: 0.6 + i * 0.1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className={`w-1 rounded-full ${
                state === 'listening' ? 'bg-amber-500' : 'bg-teal-500'
              }`}
              style={{ height: '22px' }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VoiceOrb;
