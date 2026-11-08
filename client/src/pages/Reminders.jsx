import { useEffect, useState } from 'react';
import { Bell, Check, Pause, Plus, Trash2 } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import reminderService from '../services/reminderService';

const initialForm = {
  title: '',
  category: 'routine',
  description: '',
  reminder_time: '08:00',
  frequency: 'daily',
  start_date: new Date().toISOString().slice(0, 10),
  timezone: 'Asia/Kolkata',
};

export const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setReminders(await reminderService.list());
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateForm = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const create = async (event) => {
    event.preventDefault();
    try {
      await reminderService.create(form);
      setForm(initialForm);
      setShowForm(false);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Cancel this reminder?')) return;
    await reminderService.remove(id);
    await load();
  };

  const complete = async (id) => {
    await reminderService.complete(id);
    await load();
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-700"><Bell size={22} /></div>
            <div><h1 className="text-2xl font-bold text-slate-900">My Reminders</h1><p className="text-sm text-slate-600">Gentle reminders for routines and important moments.</p></div>
          </div>
          <button onClick={() => setShowForm((open) => !open)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white"><Plus size={17} /> Add reminder</button>
        </div>
        {error && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        {showForm && (
          <form onSubmit={create} className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
            <input name="title" value={form.title} onChange={updateForm} placeholder="Reminder title" required className="rounded-xl border border-slate-300 px-3 py-3" />
            <select name="category" value={form.category} onChange={updateForm} className="rounded-xl border border-slate-300 px-3 py-3">
              <option value="routine">Daily routine</option><option value="medication">Medication</option><option value="event">Personal event</option><option value="follow_up">Follow-up</option>
            </select>
            <input name="description" value={form.description} onChange={updateForm} placeholder="Description (optional)" className="rounded-xl border border-slate-300 px-3 py-3 sm:col-span-2" />
            <label className="text-sm font-semibold">Time<input type="time" name="reminder_time" value={form.reminder_time} onChange={updateForm} required className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-3" /></label>
            <label className="text-sm font-semibold">Frequency<select name="frequency" value={form.frequency} onChange={updateForm} className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-3"><option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
            <label className="text-sm font-semibold">Start date<input type="date" name="start_date" value={form.start_date} onChange={updateForm} required className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-3" /></label>
            <label className="text-sm font-semibold">Timezone<input name="timezone" value={form.timezone} onChange={updateForm} className="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-3" /></label>
            <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white sm:col-span-2">Save reminder</button>
          </form>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {reminders.map((reminder) => (
            <article key={reminder.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between"><div><span className="text-xs font-bold uppercase tracking-wide text-blue-600">{reminder.category}</span><h2 className="mt-1 text-lg font-bold text-slate-900">{reminder.title}</h2><p className="mt-1 text-sm text-slate-600">{reminder.description || 'No description'}</p></div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">{reminder.status}</span></div>
              <p className="mt-4 text-sm font-semibold text-slate-700">{reminder.reminder_time} · {reminder.frequency}</p>
              <div className="mt-4 flex gap-2"><button onClick={() => complete(reminder.id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"><Check size={14} /> Complete</button><button onClick={() => remove(reminder.id)} className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700"><Trash2 size={14} /> Cancel</button><span className="inline-flex items-center gap-1 px-2 text-xs text-slate-400"><Pause size={14} /> Pause via edit</span></div>
            </article>
          ))}
        </div>
        {!reminders.length && <p className="py-12 text-center text-slate-500">No reminders yet.</p>}
      </main>
    </div>
  );
};

export default Reminders;
