import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import BrandLogo from '../components/common/BrandLogo';
import {
  Mic,
  Calendar,
  Users,
  Brain,
  LogOut,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const DashboardPlaceholder = ({ pageTitle = 'Dashboard Overview' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Sparkles },
    { name: 'Voice Check-in', path: '/check-in', icon: Mic },
    { name: 'Wellness History', path: '/history', icon: Calendar },
    { name: 'Family Circle', path: '/family', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <BrandLogo size="md" />

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User profile / Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900">
                {user?.fullName || 'Saanidhya User'}
              </span>
              <span className="text-[11px] text-slate-500 capitalize">
                {user?.accountType || 'Senior Care'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 text-white shadow-lg shadow-blue-500/10 mb-8 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs text-white mb-3">
                <Sparkles size={14} /> Phase 2: Authentication &amp; Session Active
              </span>
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight mb-2">
                Welcome, {user?.fullName || 'Saanidhya User'}
              </h1>
              <p className="text-blue-50 text-sm sm:text-base leading-relaxed">
                You are authenticated as{' '}
                <strong className="underline">
                  {user?.accountType === 'family' ? 'Family Member / Caregiver' : 'Elderly User'}
                </strong>{' '}
                ({user?.email}). Full FastAPI JWT authentication and MongoDB session persistence are active.
              </p>
          </div>
        </div>

        {/* Feature Preview Cards */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">{pageTitle}</h2>
          <p className="text-xs text-slate-500">
            Preview of active route: <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{location.pathname}</code>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Module 1: Daily Voice Check-in */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Mic size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">
                Voice Check-in (Prisma + Timbre)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Conducts natural conversations in Kannada, Hindi, Tamil, Telugu,
                and English. Transcribes speech and responds with warm, comforting
                voice synthesis.
              </p>
            </div>
            <Link
              to="/check-in"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              Explore Check-in module <ArrowRight size={14} />
            </Link>
          </div>

          {/* Module 2: Gemini Reasoning & Memory */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <Brain size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">
                Conversational Memory (Gemini)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Maintains context from past conversations, tracks medication
                intake, detects recurring health discomforts, and updates
                wellness indicators.
              </p>
            </div>
            <Link
              to="/history"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-800"
            >
              View Memory &amp; History <ArrowRight size={14} />
            </Link>
          </div>

          {/* Module 3: Family Care Circle */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Users size={24} />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">
                Family Circle Updates
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Generates concise, reassuring daily summaries and instant alerts
                for family members and caregivers living afar.
              </p>
            </div>
            <Link
              to="/family"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800"
            >
              Check Family Summary <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPlaceholder;
