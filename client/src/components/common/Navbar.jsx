import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import BrandLogo from './BrandLogo';
import {
  Mic,
  Home,
  Clock,
  LogOut,
  Menu,
  X,
  Users,
  Brain,
  Bell,
  CalendarClock,
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isElderly = user?.accountType === 'elderly';

  const seniorNavLinks = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'Talk to Saanidhya', path: '/check-in', icon: Mic, highlight: true },
    { name: 'My Conversations', path: '/history', icon: Clock },
    { name: 'My Memories', path: '/memories', icon: Brain },
    { name: 'Reminders', path: '/reminders', icon: CalendarClock },
    { name: 'Family Connections', path: '/family/relationships', icon: Users },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const familyNavLinks = [
    { name: 'Overview', path: '/family', icon: Users },
    { name: 'Check-in History', path: '/history', icon: Clock },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Relationships', path: '/family/relationships', icon: Users },
    { name: 'Reminders', path: '/reminders', icon: CalendarClock },
  ];

  const links = isElderly ? seniorNavLinks : familyNavLinks;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to={isElderly ? '/dashboard' : '/family'} className="cursor-pointer">
          <BrandLogo size="md" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;

            if (link.highlight) {
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-sm font-bold shadow-xs transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white ring-2 ring-blue-500/30 shadow-md shadow-blue-500/20'
                      : 'bg-blue-50 hover:bg-blue-100/80 text-blue-700 border border-blue-200/70'
                  }`}
                >
                  <Icon size={18} className="animate-pulse" />
                  <span>{link.name}</span>
                </Link>
              );
            }

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={17} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side: Role badge, User, Logout */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex flex-col text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-sm font-bold text-slate-900 leading-none">
                {user?.fullName || 'User'}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isElderly
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-teal-50 text-teal-800 border-teal-200'
                }`}
              >
                {isElderly ? 'Senior Care' : 'Caregiver'}
              </span>
            </div>
            <span className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">
              {user?.email}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <p className="font-bold text-slate-900 text-sm">{user?.fullName}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isElderly
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-teal-50 text-teal-800 border-teal-200'
              }`}
            >
              {isElderly ? 'Senior User' : 'Caregiver'}
            </span>
          </div>

          <div className="space-y-1">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={20} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
