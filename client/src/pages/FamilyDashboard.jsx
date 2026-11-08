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
  Phone,
  Plus,
  ArrowRight,
  Sparkles,
  X,
  Bell,
} from 'lucide-react';

export const FamilyDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [newReminderOpen, setNewReminderOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderTime, setReminderTime] = useState('02:00 PM');
  const [reminderFrequency, setReminderFrequency] = useState('Daily');

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      try {
        const data = await familyService.getFamilyDashboard();
        if (isMounted && data) {
          setDashboardData(data);
        }
      } catch (err) {
        console.warn('Could not load family dashboard data:', err);
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
      console.warn('Error acknowledging alert:', err);
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!reminderTitle.trim()) return;

    try {
      await familyService.createReminder({
        title: reminderTitle,
        time: reminderTime,
        frequency: reminderFrequency,
      });

      // Add to local state
      setDashboardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          reminders: [
            ...prev.reminders,
            {
              id: `rem-${Date.now()}`,
              title: reminderTitle,
              time: reminderTime,
              frequency: reminderFrequency,
              status: 'Scheduled',
            },
          ],
        };
      });

      setReminderTitle('');
      setNewReminderOpen(false);
    } catch (err) {
      console.warn('Error creating reminder:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
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
              onClick={() => setNewReminderOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Reminder</span>
            </button>
            <a
              href="tel:+919845012345"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              <Phone size={15} className="text-emerald-600" />
              <span>Call Senior</span>
            </a>
          </div>
        </section>

        {/* ================= 2. CONNECTED SENIOR PROFILE ================= */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-teal-500 text-white font-display font-bold text-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
                RK
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

          {/* Caregiver Assurance */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
              <Sparkles size={20} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Peace of Mind
            </p>
            <p className="text-2xl font-display font-bold text-slate-900">No data</p>
            <p className="text-xs text-slate-500">This is not a medical assessment</p>
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

      {/* ================= MODAL: ADD REMINDER ================= */}
      {newReminderOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell size={20} className="text-teal-600" />
                Schedule Senior Care Reminder
              </h3>
              <button
                onClick={() => setNewReminderOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Reminder Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Afternoon warm water or Vitamin D"
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Time
                  </label>
                  <input
                    type="text"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Frequency
                  </label>
                  <select
                    value={reminderFrequency}
                    onChange={(e) => setReminderFrequency(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Save Reminder
                </button>
                <button
                  type="button"
                  onClick={() => setNewReminderOpen(false)}
                  className="px-5 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyDashboard;
