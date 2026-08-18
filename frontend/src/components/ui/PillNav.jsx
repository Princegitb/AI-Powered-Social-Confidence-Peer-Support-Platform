import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Target,
  Users,
  Heart,
  TrendingUp,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';

/**
 * PillNav — top-bar navigation matching the exact 8 pills from reference UI:
 * Dashboard | Sara | Session | Saathi | Community | Progress | Journal | Safety
 */

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/companion', label: 'Sara', icon: Sparkles },
  { to: '/practice', label: 'Session', icon: Target },
  { to: '/peer', label: 'Saathi', icon: Users },
  { to: '/community', label: 'Community', icon: Heart },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/safety', label: 'Safety', icon: ShieldCheck },
];

export default function PillNav() {
  return (
    <>
      {/* Desktop / tablet horizontal pill bar */}
      <nav className="hidden lg:flex items-center gap-1.5 bg-white/70 backdrop-blur-md p-1.5 rounded-full border border-border-subtle shadow-card">
        {NAV_ITEMS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `px-4 py-1.5 rounded-full text-[13.5px] font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-white shadow-card font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-soft'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Mobile / Tablet compact bar */}
      <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-card-lg border border-border-subtle flex items-center justify-around py-2 px-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors ${
                isActive ? 'text-primary font-semibold' : 'text-text-tertiary hover:text-primary'
              }`
            }
            aria-label={label}
          >
            <Icon size={18} />
            <span className="text-[10px]">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
