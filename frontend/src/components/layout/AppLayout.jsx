import { Outlet } from 'react-router-dom';
import PillNav from '../ui/PillNav';
import AvatarMenu from '../ui/AvatarMenu';
import { Sparkles } from 'lucide-react';

/**
 * AppLayout — wraps all pages with the lavender gradient background, PillNav,
 * and the real AvatarMenu in the top bar.
 */
export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-bg-gradient-start/70 border-b border-border-subtle/50">
        <div className="max-w-[1400px] mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-card">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-[20px] font-bold text-text-primary tracking-tight">
              SAATHI
            </span>
          </div>

          {/* Navigation — hidden on small screens, replaced by bottom tab bar in PillNav */}
          <div className="flex-1 flex justify-center">
            <PillNav />
          </div>

          {/* Profile dropdown */}
          <div className="shrink-0">
            <AvatarMenu />
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}