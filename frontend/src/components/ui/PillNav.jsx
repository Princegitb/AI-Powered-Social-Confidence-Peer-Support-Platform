import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageCircle, Users, BarChart3 } from 'lucide-react';

/**
 * PillNav — DESIGN_SYSTEM.md Section 4.1
 * Horizontal row of pill-shaped nav buttons.
 * Active: filled purple bg, white text/icon.
 * Inactive: white/transparent bg, gray text.
 */

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/practice', label: 'Practice', icon: MessageCircle },
  { to: '/companion', label: 'AI Companion', icon: MessageCircle },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
];

export default function PillNav() {
  return (
    <nav className="flex items-center gap-2">
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
          <span className="hidden md:inline">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
