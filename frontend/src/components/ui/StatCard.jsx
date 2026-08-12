import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

/**
 * StatCard — DESIGN_SYSTEM.md Section 4.2
 * White rounded card with icon, label, status line, and large bold stat value.
 * Purple-tinted shadow. Can float overlapping the hero illustration.
 *
 * Props:
 *   label    — e.g. "Goal Progress"
 *   status   — e.g. "Status: Standard"
 *   value    — e.g. "65%"
 *   icon     — Lucide icon component (optional)
 *   color    — accent color for the value (optional, defaults to text-primary)
 *   className — additional classes
 */
export default function StatCard({
  label,
  status,
  value,
  icon: Icon,
  color,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`card ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-h2">{label}</h3>
          {status && (
            <p className="text-label mt-1">{status}</p>
          )}
        </div>
        <button className="p-1.5 rounded-xl hover:bg-surface-soft transition-colors">
          {Icon ? (
            <Icon size={18} className="text-text-tertiary" />
          ) : (
            <Settings size={18} className="text-text-tertiary" />
          )}
        </button>
      </div>
      <p
        className="text-stat mt-2"
        style={color ? { color } : undefined}
      >
        {value}
      </p>
    </motion.div>
  );
}
