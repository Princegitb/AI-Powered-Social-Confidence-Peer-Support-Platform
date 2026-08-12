import { motion } from 'framer-motion';
import { Download } from 'lucide-react';

/**
 * ListRow — DESIGN_SYSTEM.md Section 4.4
 * Left: small circular icon/avatar + title (bold) + date (muted, below).
 * Right: secondary label + circular action icon button.
 *
 * Props:
 *   icon      — Lucide icon component
 *   iconBg    — background color for icon circle (default: primary-light)
 *   title     — e.g. "Job Interview Roleplay"
 *   date      — e.g. "Aug 10, 2026"
 *   subtitle  — right-side secondary label (e.g. "AI Practice")
 *   onAction  — callback for action button click
 *   actionIcon — Lucide icon for action button (default: Download)
 */
export default function ListRow({
  icon: Icon,
  iconBg,
  title,
  date,
  subtitle,
  onAction,
  actionIcon: ActionIcon = Download,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex items-center justify-between py-3.5 px-2 border-b border-border-subtle last:border-b-0 hover:bg-surface-soft/50 rounded-xl transition-colors cursor-pointer"
    >
      {/* Left: icon + text */}
      <div className="flex items-center gap-3.5">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg || '#C4B5FD' }}
        >
          {Icon && <Icon size={18} className="text-white" />}
        </div>
        <div>
          <p className="font-semibold text-[14.5px] text-text-primary">{title}</p>
          <p className="text-[12px] text-text-tertiary mt-0.5">{date}</p>
        </div>
      </div>

      {/* Right: label + action */}
      <div className="flex items-center gap-3">
        {subtitle && (
          <span className="text-[13px] text-text-secondary hidden sm:block">{subtitle}</span>
        )}
        {onAction && (
          <button
            onClick={onAction}
            className="w-9 h-9 rounded-full bg-surface-soft flex items-center justify-center hover:bg-primary-light/30 transition-colors"
          >
            <ActionIcon size={16} className="text-primary" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
