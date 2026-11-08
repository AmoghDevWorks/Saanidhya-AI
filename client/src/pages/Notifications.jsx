import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import notificationService from '../services/notificationService';

const severityStyles = {
  urgent: 'border-rose-200 bg-rose-50',
  attention: 'border-amber-200 bg-amber-50',
  info: 'border-blue-200 bg-blue-50',
};

export const Notifications = () => {
  const [data, setData] = useState({ items: [], unread_count: 0 });
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setData(await notificationService.list());
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markAllRead = async () => {
    await notificationService.markAllRead();
    await load();
  };

  const markRead = async (id) => {
    await notificationService.markRead(id);
    await load();
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-teal-50 text-teal-700"><Bell size={22} /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
              <p className="text-sm text-slate-600">{data.unread_count} unread updates</p>
            </div>
          </div>
          <button onClick={markAllRead} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600">
            <CheckCheck size={16} /> Mark all read
          </button>
        </div>
        {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        <div className="space-y-3">
          {data.items.map((item) => (
            <article key={item.id} className={`rounded-2xl border p-4 ${severityStyles[item.severity] || severityStyles.info} ${item.read ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-slate-900">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-700">{item.message}</p>
                  <p className="mt-2 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                {!item.read && <button onClick={() => markRead(item.id)} className="text-xs font-bold text-blue-700">Mark read</button>}
              </div>
            </article>
          ))}
          {!data.items.length && <p className="text-center text-slate-500 py-12">No notifications yet.</p>}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
