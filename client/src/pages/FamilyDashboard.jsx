import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Navbar from '../components/common/Navbar';
import familyService from '../services/familyService';
import {
  Heart,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Pill,
  Calendar,
  CheckCircle2,
  Info,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const FamilyDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardError, setDashboardError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    title: '',
    category: 'routine',
    description: '',
    reminder_time: '08:00',
    frequency: 'daily',
    start_date: new Date().toISOString().slice(0, 10),
    timezone: 'Asia/Kolkata',
  });

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      try {
        const data = await familyService.getFamilyDashboard();
        if (isMounted && data) {
          setDashboardData(data);
        }
      } catch (err) {
        if (isMounted) setDashboardError(err.response?.data?.detail || err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await familyService.acknowledgeAlert(alertId);
      setDashboardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          alerts: prev.alerts.map((a) =>
            a.id === alertId ? { ...a, isAcknowledged: true } : a
          ),
        };
      });
    } catch (err) {
      setDashboardError(err.response?.data?.detail || err.message);
    }
  };

  const handleCreateReminder = async (event) => {
    event.preventDefault();
    try {
      await familyService.createReminder(reminderForm);
      setReminderForm((current) => ({ ...current, title: '', description: '' }));
      setShowReminderForm(false);
      const data = await familyService.getFamilyDashboard();
      setDashboardData(data);
    } catch (err) {
      setDashboardError(err.response?.data?.detail || err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {dashboardError && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{dashboardError}</p>}
        {isLoading && <p className="text-sm text-slate-500">Loading family dashboard...</p>}
        {/* ================= 1. WELCOME SECTION ================= */}
        <section className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={13} /> Family Care Circle
              </span>
              <span className="text-xs font-semibold text-slate-500">
                &bull; Connected senior
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.fullName || 'Caregiver'}
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Here is the latest daily wellness summary and conversation insights for your loved one.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowReminderForm((open) => !open)}
              className="rounded-2xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white"
            >
              {showReminderForm ? 'Close reminder form' : 'Add reminder for senior'}
            </button>
            <Link to="/reminders" className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors">
              View reminders
            </Link>
          </div>
        </section>

        {showReminderForm && (
          <form onSubmit={handleCreateReminder} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
            <input required placeholder="Reminder title" value={reminderForm.title} onChange={(event) => setReminderForm({ ...reminderForm, title: event.target.value })} className="rounded-xl border border-slate-300 px-3 py-3" />
            <select value={reminderForm.category} onChange={(event) => setReminderForm({ ...reminderForm, category: event.target.value })} className="rounded-xl border border-slate-300 px-3 py-3">
              <option value="routine">Routine</option>
              <option value="medication">Medication</option>
              <option value="event">Event</option>
              <option value="follow_up">Follow-up</option>
            </select>
            <input placeholder="Description (optional)" value={reminderForm.description} onChange={(event) => setReminderForm({ ...reminderForm, description: event.target.value })} className="rounded-xl border border-slate-300 px-3 py-3 sm:col-span-2" />
            <input type="time" required value={reminderForm.reminder_time} onChange={(event) => setReminderForm({ ...reminderForm, reminder_time: event.target.value })} className="rounded-xl border border-slate-300 px-3 py-3" />
            <select value={reminderForm.frequency} onChange={(event) => setReminderForm({ ...reminderForm, frequency: event.target.value })} className="rounded-xl border border-slate-300 px-3 py-3">
              <option value="once">Once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <input type="date" required value={reminderForm.start_date} onChange={(event) => setReminderForm({ ...reminderForm, start_date: event.target.value })} className="rounded-xl border border-slate-300 px-3 py-3" />
            <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white">Save for senior</button>
          </form>
        )}

        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Shared senior reminders</h2>
              <p className="text-sm text-slate-500">The same reminders scheduled for the linked senior.</p>
            </div>
            <Link to="/reminders" className="text-sm font-bold text-teal-700">Open reminders</Link>
          </div>
          {dashboardData?.reminders?.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {dashboardData.reminders.map((reminder) => (
                <div key={reminder.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">{reminder.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{reminder.time} · {reminder.frequency}</p>
                  <p className="mt-1 text-xs text-slate-500 capitalize">{reminder.status}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No shared reminders yet.
            </p>
          )}
        </section>

        {/* ================= 2. CONNECTED SENIOR PROFILE ================= */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-teal-500 text-white font-display font-bold text-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
                {(dashboardData?.seniorProfile?.name || '?').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">
                    {dashboardData?.seniorProfile?.name || 'No linked senior'}
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {dashboardData?.seniorProfile?.relationship || 'Relationship unavailable'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Languages: {dashboardData?.seniorProfile?.preferredLanguage || 'Not provided'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Last Morning Check-in
                </p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {dashboardData?.seniorProfile?.lastCheckinTime || 'No check-ins yet'}
                </p>
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 size={15} className="text-emerald-600" />
                {dashboardData?.seniorProfile?.todayStatus || 'No data'}
              </span>
            </div>
          </div>
        </section>

        {/* ================= 3. WELLNESS OVERVIEW & COMPLIANCE ================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Adherence Rate */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
              <Calendar size={20} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Check-in Frequency
            </p>
            <p className="text-2xl font-display font-bold text-slate-900">{dashboardData?.wellnessOverview?.adherenceRate || 'No data'}</p>
            <p className="text-xs text-slate-500">Based on linked senior check-ins</p>
          </div>

          {/* Observed Mood */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
              <Heart size={20} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recent Mood
            </p>
            <p className="text-2xl font-display font-bold text-slate-900">{dashboardData?.wellnessOverview?.currentMood || 'No data'}</p>
            <p className="text-xs text-slate-500">Latest recorded check-in mood</p>
          </div>

          {/* Medication Compliance */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-1">
              <Pill size={20} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Medication Status
            </p>
            <p className="text-2xl font-display font-bold text-slate-900">{dashboardData?.wellnessOverview?.medicationCompliance || 'No data'}</p>
            <p className="text-xs text-emerald-700 font-semibold">Recorded medication information</p>
          </div>

          {/* Latest observation */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
              <Sparkles size={20} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Latest Observation
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {dashboardData?.wellnessOverview?.keyObservation || 'No observation recorded'}
            </p>
            <p className="text-xs text-slate-500">Supportive information, not a medical assessment</p>
          </div>
        </section>

        {/* ================= 4. IMPORTANT ALERTS (WITH DISCLAIMER) ================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" />
              Caregiver Notifications &amp; Alerts
            </h2>
            <span className="text-xs text-slate-500 font-medium">Real-time alerts</span>
          </div>

          <div className="space-y-3">
            {dashboardData?.alerts?.map((alert) => (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                  alert.severity === 'attention'
                    ? alert.isAcknowledged
                      ? 'bg-white border-slate-200 opacity-75'
                      : 'bg-amber-50/80 border-amber-300 shadow-xs'
                    : 'bg-blue-50/70 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`mt-0.5 p-2 rounded-xl flex-shrink-0 ${
                      alert.severity === 'attention'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {alert.severity === 'attention' ? (
                      <AlertTriangle size={18} />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">
                        {alert.title}
                      </h3>
                      {alert.isAcknowledged && (
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          Acknowledged
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {alert.message}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {alert.timestamp}
                    </span>
                  </div>
                </div>

                {!alert.isAcknowledged && (
                  <button
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    className="self-end sm:self-center px-3.5 py-1.5 rounded-xl border border-slate-300 hover:border-slate-400 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer flex-shrink-0"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Medical disclaimer note */}
          <div className="p-3 rounded-xl bg-slate-100/80 text-[11px] text-slate-500 flex items-center gap-2">
            <Info size={14} className="text-slate-400 flex-shrink-0" />
            <span>
              <strong>Note:</strong> Alerts are supportive observations extracted by Saanidhya AI from conversational speech to keep families informed. They do not constitute formal medical diagnoses.
            </span>
          </div>
        </section>

        {/* ================= 5. RECENT CHECK-INS TIMELINE ================= */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock size={19} className="text-blue-600" />
                Recent Check-in Conversations
              </h2>
              <p className="text-xs text-slate-500">
                Daily voice interaction transcripts and extracted wellness summaries
              </p>
            </div>
            <Link
              to="/history"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              Full History <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-4">
            {dashboardData?.recentCheckins?.length ? dashboardData.recentCheckins.map((checkin) => (
              <div key={checkin.id} className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                    {new Date(checkin.timestamp).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {checkin.medicationConfirmed === true ? 'Medication Confirmed' : 'Medication not recorded'}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic">&ldquo;{checkin.summary}&rdquo;</p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">Mood: {checkin.mood}</span>
                  {checkin.physicalComfort && <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">{checkin.physicalComfort}</span>}
                </div>
              </div>
            )) : <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">No check-ins recorded yet.</p>}
          </div>
        </section>
      </main>

    </div>
  );
};

export default FamilyDashboard;
