import { Outlet } from 'react-router-dom';
import PillNav from '../ui/PillNav';
import AvatarMenu from '../ui/AvatarMenu';
import { Bell, Menu } from 'lucide-react';

/**
 * AppLayout — wraps all pages with the lavender gradient background, PillNav,
 * and the real AvatarMenu in the top bar.
 */
export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-bg-gradient-start/75 border-b border-border-subtle/40">
        <div className="max-w-[1400px] mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#1E1B2E] flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-[17px] font-serif">M</span>
            </div>
            <span className="text-[20px] font-bold text-text-primary tracking-tight font-serif">
              Saathi
            </span>
          </div>

          {/* Navigation — hidden on small screens, replaced by bottom tab bar in PillNav */}
          <div className="flex-1 flex justify-center">
            <PillNav />
          </div>

          {/* Profile & Action items */}
          <div className="flex items-center gap-2 shrink-0">
            <button 
              className="w-9 h-9 rounded-full bg-white/80 border border-border-subtle/50 flex items-center justify-center text-text-primary hover:bg-white hover:shadow-sm transition-all cursor-pointer"
              aria-label="Notifications"
            >
              <Bell size={16} />
            </button>
            <AvatarMenu />
            <button 
              className="w-9 h-9 rounded-full bg-white/80 border border-border-subtle/50 flex items-center justify-center text-text-primary hover:bg-white hover:shadow-sm transition-all cursor-pointer"
              aria-label="Menu"
            >
              <Menu size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}