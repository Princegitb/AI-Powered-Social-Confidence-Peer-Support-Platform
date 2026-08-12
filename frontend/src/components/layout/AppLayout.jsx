import { Outlet } from 'react-router-dom';
import PillNav from '../ui/PillNav';
import { Sparkles } from 'lucide-react';

/**
 * AppLayout — wraps all pages with the lavender gradient background and PillNav.
 * Per DESIGN_SYSTEM.md: full-bleed soft lavender-to-lilac gradient, generous whitespace.
 */
export default function AppLayout() {
  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-bg-gradient-start/70 border-b border-border-subtle/50">
        <div className="max-w-[1400px] mx-auto px-6 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-[20px] font-bold text-text-primary tracking-tight">
              SAATHI
            </span>
          </div>

          {/* Navigation */}
          <PillNav />

          {/* Profile placeholder */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center">
              <span className="text-[13px] font-bold text-primary-dark">U</span>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-[1400px] mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
