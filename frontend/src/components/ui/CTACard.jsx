import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/**
 * CTACard — DESIGN_SYSTEM.md Section 4.5
 * Featured card: bold eyebrow label, large stat/countdown, avatar + context, CTA arrow.
 * Used for: "Continue Practice" / "Next Suggested Roleplay".
 *
 * Props:
 *   eyebrow    — small label text (e.g. "Continue Practice")
 *   title      — main text (e.g. "Job Interview Roleplay")
 *   stat       — bold stat or countdown (e.g. "15:00 remaining")
 *   avatarIcon — Lucide icon for the avatar circle
 *   subtitle   — text below avatar (e.g. "AI Practice Partner")
 *   onClick    — CTA click handler
 *   className  — additional classes
 */
export default function CTACard({
  eyebrow,
  title,
  stat,
  avatarIcon: AvatarIcon,
  subtitle,
  onClick,
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay: 0.15 }}
      className={`card relative overflow-hidden cursor-pointer group ${className}`}
      onClick={onClick}
    >
      {/* Purple accent gradient bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent-lilac" />

      {/* Eyebrow */}
      <p className="text-label text-primary mb-3">{eyebrow}</p>

      {/* Title */}
      <h3 className="text-h2 mb-2">{title}</h3>

      {/* Stat */}
      {stat && (
        <p className="text-stat text-primary mb-4">{stat}</p>
      )}

      {/* Bottom row: avatar + subtitle + CTA arrow */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border-subtle">
        <div className="flex items-center gap-3">
          {AvatarIcon && (
            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
              <AvatarIcon size={18} className="text-primary-dark" />
            </div>
          )}
          {subtitle && (
            <span className="text-body text-[13px]">{subtitle}</span>
          )}
        </div>
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center group-hover:bg-primary-dark transition-colors">
          <ArrowRight size={16} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
}
