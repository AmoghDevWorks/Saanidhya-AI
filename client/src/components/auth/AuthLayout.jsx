import { motion } from 'framer-motion';
import { BrandLogo } from '../common/BrandLogo';
import {
  Mic,
  Brain,
  Volume2,
  Sparkles,
  Info,
  CheckCircle,
  AlertCircle,
  Languages,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

/**
 * AuthLayout
 * A calm, high-contrast, responsive split layout.
 * Desktop: 50% form / 50% warm visual storytelling.
 * Mobile: Clean single-column layout prioritizing form readability and accessibility.
 */
export const AuthLayout = ({
  children,
  headline = 'A little care, every day.',
  subheading = 'Your AI-powered multilingual voice companion for wellness, companionship, and family peace of mind.',
}) => {
  const { authNotice, clearNotice } = useAuth();

  const regionalLanguages = [
    { name: 'ಕನ್ನಡ', label: 'Kannada' },
    { name: 'हिन्दी', label: 'Hindi' },
    { name: 'தமிழ்', label: 'Tamil' },
    { name: 'తెలుగు', label: 'Telugu' },
    { name: 'English', label: 'English' },
  ];

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] text-slate-800 flex flex-col lg:flex-row">
      {/* ================= LEFT / FORM CONTAINER ================= */}
      <div className="w-full lg:w-[50%] xl:w-[48%] flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-[#FAF8F5]">
        <div className="max-w-md w-full mx-auto">
          {/* Header & Logo */}
          <header className="mb-8 flex items-center justify-between">
            <BrandLogo size="md" showTagline={false} />
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Voice Engine Ready
            </span>
          </header>

          {/* Page Greeting */}
          <div className="mb-7">
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight mb-2.5"
            >
              {headline}
            </motion.h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {subheading}
            </p>
          </div>

          {/* Pending Backend / Notification Banner */}
          {authNotice && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-2xl border text-left transition-all ${
                authNotice.type === 'pending'
                  ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                  : authNotice.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  {authNotice.type === 'pending' && (
                    <Info size={19} className="text-blue-600" />
                  )}
                  {authNotice.type === 'error' && (
                    <AlertCircle size={19} className="text-rose-600" />
                  )}
                  {authNotice.type === 'success' && (
                    <CheckCircle size={19} className="text-emerald-600" />
                  )}
                </div>
                <div className="flex-1 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{authNotice.title}</p>
                    <button
                      onClick={clearNotice}
                      className="text-xs text-slate-400 hover:text-slate-700 font-bold px-1.5 py-0.5 rounded cursor-pointer"
                      aria-label="Dismiss notice"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed opacity-90">
                    {authNotice.message}
                  </p>
                  {authNotice.details && (
                    <p className="mt-2 text-[11px] font-mono bg-white/70 px-2 py-1 rounded border border-blue-100 text-blue-800">
                      {authNotice.details}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Form Content */}
          <main className="w-full">{children}</main>

          {/* Footer note */}
          <footer className="mt-10 pt-6 border-t border-slate-200/70 text-center text-xs text-slate-500">
            <p>
              Designed for high accessibility &bull; 256-bit encrypted data
              privacy
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Saanidhya AI &bull; Gnani AI Great Indian AI Internship Challenge
            </p>
          </footer>
        </div>
      </div>

      {/* ================= RIGHT / STORY & PURPOSE CONTAINER ================= */}
      <div className="hidden lg:flex w-full lg:w-[50%] xl:w-[52%] bg-gradient-to-br from-[#F5EFE6] via-[#EEF4FF] to-[#E8F3F1] border-l border-slate-200/70 p-10 xl:p-16 flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative background organic shape */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-200/40 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-teal-200/30 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-xs">
            <Sparkles size={15} className="text-blue-600" />
            <span className="text-xs font-semibold text-slate-700">
              Gnani AI Speech &amp; Reasoning Ecosystem
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white/60 px-3 py-1 rounded-full">
            <Languages size={14} className="text-slate-500" />
            <span>5 Indian Languages</span>
          </div>
        </div>

        {/* Main Centerpiece: Human Story & Interactive Visual Concept */}
        <div className="relative z-10 my-auto py-8 max-w-lg">
          {/* Daily Dialogue Card */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl shadow-slate-900/5 border border-white/80 mb-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-teal-500 flex items-center justify-center text-white shadow-xs">
                  <Mic size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Daily Morning Check-in
                  </h2>
                  <p className="text-xs text-slate-500">
                    Today at 09:15 AM &bull; Kannada &amp; English
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                Completed
              </span>
            </div>

            {/* Conversation excerpt snippet */}
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-slate-800">
                <p className="font-semibold text-blue-900 mb-0.5 flex items-center gap-1.5">
                  <Volume2 size={13} className="text-blue-600" /> Saanidhya
                  Voice (Timbre TTS)
                </p>
                <p className="italic">
                  &ldquo;ನಮಸ್ಕಾರ ಅಜ್ಜಾ, ಇವತ್ತು ಮುಂಜಾನೆ ಹೇಗಿದ್ದೀರಿ? ನಿಮ್ಮ ಬಿಪಿ ಮಾತ್ರೆ
                  ತಗೊಂಡಿರಾ?&rdquo;
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  (Namaskara grandfather, how are you feeling this morning? Did
                  you take your BP tablet?)
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-100/90 text-slate-800 ml-4">
                <p className="font-semibold text-slate-900 mb-0.5">
                  Senior Response (Prisma STT)
                </p>
                <p className="italic">
                  &ldquo;ಹೌದಮ್ಮಾ, ಉಪಹಾರದ ನಂತರ ಮಾತ್ರೆ ತಗೊಂಡೆ. ಇವತ್ತು ಸ್ವಲ್ಪ ಕಾಲು ನೋವಿದೆ.&rdquo;
                </p>
              </div>

              {/* Reasoning extraction badge */}
              <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-900 flex items-center gap-2 text-[11px]">
                <Brain size={15} className="text-teal-700 flex-shrink-0" />
                <span>
                  <strong>Gemini Reasoning:</strong> Medication confirmed taken
                  &bull; Mild knee discomfort logged &bull; Family alert updated
                </span>
              </div>
            </div>
          </div>

          {/* Real Family Reassurance Quote */}
          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-xs border border-white/60 shadow-xs">
            <p className="text-slate-700 text-sm italic leading-relaxed">
              &ldquo;Being 400 km away from my aging mother, knowing Saanidhya calls
              her in her native tongue, checks on her meals and medicines, and
              updates me immediately is pure peace of mind.&rdquo;
            </p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">
                — Sridhar K., Family Caregiver
              </span>
              <span className="text-slate-500">Bengaluru, India</span>
            </div>
          </div>
        </div>

        {/* Bottom Regional Languages Bar */}
        <div className="relative z-10 pt-4 border-t border-slate-300/40">
          <p className="text-xs font-semibold text-slate-600 mb-2.5">
            Voice conversations naturally tailored to Indian families:
          </p>
          <div className="flex flex-wrap gap-2">
            {regionalLanguages.map((lang) => (
              <span
                key={lang.label}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/90 border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs hover:border-blue-300 transition-colors"
              >
                <span className="font-semibold text-slate-900">{lang.name}</span>
                <span className="text-slate-400 text-[10px]">({lang.label})</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
