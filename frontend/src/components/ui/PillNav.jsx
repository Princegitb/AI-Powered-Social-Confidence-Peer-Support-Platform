import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Target,
  TrendingUp,
  Sprout,
} from 'lucide-react';

/**
 * PillNav — top-bar navigation. On small screens it falls back to a bottom
 * tab bar (rendered via the same component for simplicity).
 */

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/companion', label: 'Companion', icon: Sparkles },
  { to: '/practice', label: 'Practice', icon: Target },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/journey', label: 'Journey', icon: Sprout },
];

export default function PillNav() {
  return (
    <>
      {/* Desktop / tablet horizontal pills */}
      <nav className="hidden md:flex items-center gap-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-white shadow-card'
                  : 'bg-white/60 text-text-secondary hover:bg-white hover:text-text-primary hover:shadow-card'
              }`
            }
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-card-lg border border-border-subtle flex items-center justify-around py-2.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-text-tertiary hover:text-primary'
              }`
            }
            aria-label={label}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
