import { useEffect, useState } from 'react';
import { Edit3, Heart, Save, Trash2 } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import memoryService from '../services/memoryService';

const categoryLabels = {
  personal_information: 'About Me',
  interests: 'My Interests',
  important_context: 'Important Conversations',
  wellness_context: 'Wellness Context',
};

export const Memories = () => {
  const [memories, setMemories] = useState([]);
  const [consent, setConsent] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState('');

  const loadMemories = async () => {
    try {
      const data = await memoryService.list();
      setMemories(data.memories || []);
      setConsent(Boolean(data.memory_consent));
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  const toggleConsent = async () => {
    try {
      const result = await memoryService.setConsent(!consent);
      setConsent(result.enabled);
      if (!result.enabled) setMemories([]);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message);
    }
  };

  const saveEdit = async (id) => {
    try {
      const updated = await memoryService.update(id, { value: editValue });
      setMemories((current) => current.map((memory) => (memory.id === id ? updated : memory)));
      setEditingId(null);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message);
    }
  };

  const removeMemory = async (id) => {
    try {
      await memoryService.remove(id);
      setMemories((current) => current.filter((memory) => memory.id !== id));
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600"><Heart size={22} /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">What Saanidhya remembers</h1>
              <p className="mt-1 text-slate-600">
                Saanidhya remembers important things you share so your conversations can feel more personal.
              </p>
            </div>
          </div>
          <label className="mt-6 flex items-center gap-3 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={consent} onChange={toggleConsent} className="h-5 w-5 accent-blue-600" />
            Allow Saanidhya to remember meaningful things I share
          </label>
          {!consent && (
            <p className="mt-2 text-sm text-slate-500">Memory is off. New conversations will not create persistent memories.</p>
          )}
        </section>

        {error && <p className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800">{error}</p>}

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {memories.map((memory) => (
            <article key={memory.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wide text-blue-600">
                {categoryLabels[memory.category] || memory.category}
              </span>
              <h2 className="mt-2 font-bold text-slate-900">{memory.key.replaceAll('_', ' ')}</h2>
              {editingId === memory.id ? (
                <div className="mt-2 flex gap-2">
                  <input value={editValue} onChange={(event) => setEditValue(event.target.value)} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <button onClick={() => saveEdit(memory.id)} className="p-2 rounded-lg bg-blue-600 text-white" aria-label="Save memory"><Save size={16} /></button>
                </div>
              ) : (
                <p className="mt-2 text-slate-600">{memory.value}</p>
              )}
              <p className="mt-3 text-xs text-slate-400">{new Date(memory.created_at).toLocaleDateString()}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setEditingId(memory.id); setEditValue(memory.value); }} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"><Edit3 size={14} /> Edit</button>
                <button onClick={() => removeMemory(memory.id)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600"><Trash2 size={14} /> Delete</button>
              </div>
            </article>
          ))}
        </div>
        {consent && memories.length === 0 && <p className="mt-8 text-center text-slate-500">No memories have been saved yet.</p>}
      </main>
    </div>
  );
};

export default Memories;
