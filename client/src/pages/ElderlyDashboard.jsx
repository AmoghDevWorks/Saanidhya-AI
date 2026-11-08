import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Navbar from '../components/common/Navbar';
import VoiceOrb from '../components/voice/VoiceOrb';
import checkinService from '../services/checkinService';
import reminderService from '../services/reminderService';
import {
  Mic,
  Calendar,
  Clock,
  Heart,
  Pill,
  Smile,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Users,
} from 'lucide-react';

export const ElderlyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summaryData, setSummaryData] = useState({
    hasCheckedInToday: false,
    mood: null,
    medicationStatus: null,
    wellnessNotes: null,
    followUp: null,
    recentCheckins: [],
  });
  const [reminders, setReminders] = useState([]);
  const [dashboardError, setDashboardError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    let isMounted = true;
    const fetchSummary = async () => {
      try {
        const [data, reminderData] = await Promise.all([
          checkinService.getTodaySummary(),
          reminderService.list(),
        ]);
        if (isMounted && data) {
          setSummaryData(data);
          setReminders(reminderData || []);
        }
      } catch (err) {
        if (isMounted) setDashboardError(err.response?.data?.detail || err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchSummary();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {dashboardError && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {dashboardError}
          </p>
        )}
        {isLoading && <p className="text-sm text-slate-500">Loading your dashboard...</p>}
        {/* ================= 1. WELCOME SECTION ================= */}
        <section className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={13} /> {formattedDate}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                &bull; Daily wellness companion
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-slate-900 tracking-tight">
              {getGreeting()}, {user?.fullName || 'there'}! 💙
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-medium">
              It&apos;s lovely to have you here today. How are you feeling?
            </p>
          </div>

          {/* Today's check-in status pill */}
          <div className="flex-shrink-0">
            {summaryData.hasCheckedInToday ? (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-2xl shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Daily Wellness
                  </p>
                  <p className="text-sm font-bold text-emerald-950">
                    Today&apos;s Check-in Completed
                  </p>
                </div>
              </div>
            ) : (
              <Link
                to="/check-in"
                className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-900 px-5 py-3 rounded-2xl hover:bg-blue-100/70 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Mic size={22} className="animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    Ready to Talk
                  </p>
                  <p className="text-sm font-bold text-blue-950 flex items-center gap-1">
                    Morning Check-in Pending <ArrowRight size={14} />
                  </p>
                </div>
              </Link>
            )}
          </div>
        </section>

        {/* ================= 2. MAIN VOICE COMPANION CENTERPIECE ================= */}
        <section className="bg-gradient-to-b from-white via-white to-blue-50/40 rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-md shadow-slate-900/5 text-center relative overflow-hidden">
          {/* Subtle decorative glow in background */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-100/40 blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center">
            {/* Expressive Voice Orb */}
            <VoiceOrb
              state={summaryData.hasCheckedInToday ? 'completed' : 'idle'}
              size="xl"
              onOrbClick={() => navigate('/check-in')}
            />

            <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 mt-2 mb-2">
              {summaryData.hasCheckedInToday
                ? 'Thank you for speaking with Saanidhya today!'
                : 'Saanidhya is ready to listen and talk with you.'}
            </h2>

            <p className="text-slate-600 text-base max-w-md mb-8 leading-relaxed">
              {summaryData.hasCheckedInToday
                ? 'Your morning wellness notes and medicine confirmation have been recorded and shared with your family.'
                : 'Speak in Kannada, Hindi, Tamil, Telugu, or English. Saanidhya checks your meals, medicines, and listens like a caring companion.'}
            </p>

            {/* Prominent Action Button */}
            <Link
              to="/check-in"
              className="inline-flex items-center gap-3.5 py-4 px-9 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-lg shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-200 cursor-pointer group"
            >
              <Mic size={24} className="group-hover:scale-110 transition-transform" />
              <span>{summaryData.hasCheckedInToday ? 'Talk to Saanidhya Again' : 'Talk to Saanidhya'}</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Regional languages supported */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 font-medium">
              <span className="text-slate-400">Supported:</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">ಕನ್ನಡ</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">हिन्दी</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">தமிழ்</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">తెలుగు</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200">English</span>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Your reminders</h2>
              <p className="text-sm text-slate-500">Reminders created by you or an approved family member.</p>
            </div>
            <Link to="/reminders" className="text-sm font-bold text-blue-600">Manage reminders</Link>
          </div>
          {reminders.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No reminders scheduled yet.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {reminders.slice(0, 6).map((reminder) => (
                <div key={reminder.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">{reminder.title}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {reminder.reminder_time} · {reminder.frequency}
                  </p>
                  {reminder.description && <p className="mt-1 text-xs text-slate-500">{reminder.description}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ================= 3. DAILY WELLNESS SUMMARY ================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Heart size={20} className="text-rose-500" />
              Daily Wellness Highlights
            </h2>
            <span className="text-xs text-slate-400">Powered by Gemini AI</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Mood Card */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <Smile size={22} />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Today&apos;s Mood
                </p>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {summaryData.mood || 'Not recorded'}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {summaryData.wellnessNotes || 'No wellness observation recorded yet.'}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                {summaryData.hasCheckedInToday ? "Status: Based on today's check-in" : 'No check-in recorded today'}
              </div>
            </div>

            {/* Medicine Confirmation Card */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                  <Pill size={22} />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Medication Check
                </p>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {summaryData.medicationStatus?.includes('Confirmed') ? 'Confirmed Taken' : 'Not recorded'}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {summaryData.medicationStatus}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-teal-700 font-medium">
                {summaryData.medicationStatus || 'No medication information recorded.'}
              </div>
            </div>

            {/* Recent Notes Card */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Sparkles size={22} />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Wellness Observation
                </p>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {summaryData.followUp || 'No follow-up recorded'}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {summaryData.wellnessNotes}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 italic">
                *Supportive wellness note, not a medical diagnosis.
              </div>
            </div>
          </div>
        </section>

        {/* ================= 4. PREVIOUS CONVERSATIONS & FOLLOW-UPS ================= */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock size={19} className="text-blue-600" />
                Previous Check-in Reflections
              </h2>
              <p className="text-xs text-slate-500">
                Saanidhya remembers your previous conversations to follow up with care
              </p>
            </div>
            <Link
              to="/history"
              className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              View all conversations <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* ================= 5. QUICK ACTIONS ================= */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              to="/check-in"
              className="p-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex flex-col items-center justify-center text-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer group"
            >
              <Mic size={24} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold">Talk to Saanidhya</span>
            </Link>

            <Link
              to="/history"
              className="p-5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 rounded-2xl flex flex-col items-center justify-center text-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Clock size={24} className="text-blue-600" />
              <span className="text-sm font-bold">My Conversations</span>
            </Link>

            <button
              onClick={() => navigate('/reminders')}
              className="p-5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 rounded-2xl flex flex-col items-center justify-center text-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Pill size={24} className="text-teal-600" />
              <span className="text-sm font-bold">
                {reminders.length ? `View Reminders (${reminders.length})` : 'View Reminders'}
              </span>
            </button>

            <button
              onClick={() => navigate('/family/relationships')}
              className="p-5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 rounded-2xl flex flex-col items-center justify-center text-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Users size={24} className="text-emerald-600" />
              <span className="text-sm font-bold">Family Connections</span>
            </button>
          </div>
        </section>
      </main>

    </div>
  );
};

export default ElderlyDashboard;
