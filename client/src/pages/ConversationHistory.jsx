import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import checkinService from '../services/checkinService';
import {
  Clock,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Search,
  Volume2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const ConversationHistory = () => {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      try {
        const data = await checkinService.getHistory();
        if (isMounted && data) {
          setHistory(data);
        }
      } catch (err) {
        console.warn('Could not load history:', err);
      }
    };
    loadHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredHistory = history.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.summary?.toLowerCase().includes(term) ||
      item.mood?.toLowerCase().includes(term) ||
      item.physicalComfort?.toLowerCase().includes(term) ||
      item.medicationDetails?.toLowerCase().includes(term) ||
      item.messages?.some((message) => message.text?.toLowerCase().includes(term))
    );
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                to="/dashboard"
                className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1"
              >
                <ArrowLeft size={14} /> Back
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 flex items-center gap-2.5">
              <Clock size={26} className="text-blue-600" />
              Conversation History &amp; Reflections
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Chronological log of voice check-ins, medication confirmations, and wellness indicators.
            </p>
          </div>

          {/* Search filter */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4">
          {filteredHistory.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
              <p className="text-slate-500 text-sm">
                No past check-in conversations found matching your search.
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => {
              const isExpanded = expandedId === item.id;
              const dateStr = new Date(item.timestamp).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4 transition-all"
                >
                  {/* Top Bar: Date & Status Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <Calendar size={15} className="text-slate-400" />
                        {dateStr}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full capitalize font-medium">
                        {item.sessionType.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        {item.medicationConfirmed ? 'Medication Taken' : 'Pending'}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                        Mood: {item.mood}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-2">
                    <p className="text-sm text-slate-700 leading-relaxed italic">
                      &ldquo;{item.summary}&rdquo;
                    </p>

                    {item.physicalComfort && (
                      <p className="text-xs text-slate-500">
                        <strong>Observed Comfort:</strong> {item.physicalComfort}
                      </p>
                    )}

                    {item.followUps && item.followUps.length > 0 && (
                      <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                        <Volume2 size={14} className="text-blue-600 flex-shrink-0" />
                        <span>
                          <strong>Follow-up:</strong> {item.followUps.join('; ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Expand Conversation Button */}
                  {(item.messages?.length > 0 || item.dialogue?.length > 0) && (
                    <div className="pt-2">
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide Conversation' : 'View Full Conversation'}</span>
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                          {(item.messages || item.dialogue || []).map((turn, tIdx) => (
                            <div key={tIdx} className="flex gap-2.5">
                              <span className="font-bold uppercase tracking-wider text-slate-400 w-20 flex-shrink-0">
                                {turn.speaker === 'saanidhya' ? 'Saanidhya:' : 'User:'}
                              </span>
                              <span className="text-slate-700 leading-relaxed">
                                {turn.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default ConversationHistory;
