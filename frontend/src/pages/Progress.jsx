import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Target, Clock, Brain, MessageCircle, Trophy, Check } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import SkeletonCard from '../components/ui/SkeletonCard';
import EmptyState from '../components/ui/EmptyState';
import useProgressStore from '../store/progressStore';
import useUserStore from '../store/userStore';

/**
 * Progress Dashboard — Redesigned according to new UI spec.
 */

const TIMELINE_STEPS = [
  { label: 'First Step', desc: 'Completed', status: 'completed' },
  { label: 'Conversation', desc: 'Completed', status: 'completed' },
  { label: 'Practice', desc: 'Active', status: 'active' },
  { label: 'Peer', desc: 'Next', status: 'upcoming' },
  { label: 'Growth', desc: 'Next', status: 'upcoming' },
];

export default function Progress() {
  const navigate = useNavigate();
  const summary = useProgressStore((s) => s.summary);
  const loading = useProgressStore((s) => s.loading);
  const fetchAll = useProgressStore((s) => s.fetchAll);
  const displayName = useUserStore((s) => s.displayName);

  useEffect(() => {
    fetchAll(true);
  }, []);

  const stats = summary || {};

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-1.5"
      >
        <span className="text-[10px] font-bold tracking-wider text-primary uppercase">
          YOUR STATS
        </span>
        <h1 className="text-[40px] font-bold text-text-primary font-serif leading-tight">
          Progress that feels like growth.
        </h1>
        <p className="text-[14.5px] text-text-secondary max-w-xl">
          {displayName
            ? `Here's how your practice is going, ${displayName}. Every session builds confidence.`
            : "Every session builds confidence. Here's how yours is going."}
        </p>
      </motion.div>

      {/* Progress Timeline Connector Path */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
        className="card border border-border-subtle/70 bg-[#F7F5FC]/30 p-6 md:p-8"
      >
        <div className="relative flex flex-col md:flex-row justify-between gap-6 md:gap-4 items-center max-w-3xl mx-auto py-2">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-[20px] left-8 right-8 h-0.5 bg-border-subtle z-0" />
          <div 
            className="hidden md:block absolute top-[20px] left-8 h-0.5 bg-primary z-0 transition-all duration-500"
            style={{ width: '45%' }}
          />
          
          {TIMELINE_STEPS.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isActive = step.status === 'active';
            return (
              <div key={idx} className="flex flex-col items-center text-center relative z-10 w-24">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-success border-success text-white shadow-sm shadow-success/25' 
                      : isActive 
                      ? 'bg-white border-primary text-primary shadow-sm ring-4 ring-primary/10' 
                      : 'bg-white border-border-subtle text-text-tertiary'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={16} strokeWidth={3} />
                  ) : (
                    <span className="text-[13px] font-bold">{idx + 1}</span>
                  )}
                </div>
                <span className={`text-[13px] font-semibold mt-3 ${isActive ? 'text-primary font-bold' : 'text-text-primary'}`}>
                  {step.label}
                </span>
                <span className="text-[11px] text-text-tertiary mt-0.5">
                  {step.desc}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading || !summary ? (
          <>
            <SkeletonCard height={120} />
            <SkeletonCard height={120} />
            <SkeletonCard height={120} />
            <SkeletonCard height={120} />
          </>
        ) : (
          <>
            <div className="card p-6 bg-white border border-border-subtle flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[12.5px] text-text-tertiary font-semibold uppercase tracking-wider block">
                  Practice Sessions
                </span>
                <span className="text-[28px] font-bold text-text-primary block mt-1">
                  {stats.sessions_count || 0}
                </span>
                <span className="text-[13px] text-text-secondary block mt-1">
                  Total practice runs
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <MessageCircle size={18} />
              </div>
            </div>

            <div className="card p-6 bg-white border border-border-subtle flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[12.5px] text-text-tertiary font-semibold uppercase tracking-wider block">
                  Minutes Practised
                </span>
                <span className="text-[28px] font-bold text-text-primary block mt-1">
                  {stats.practice_minutes || 0} min
                </span>
                <span className="text-[13px] text-text-secondary block mt-1">
                  Estimated time
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Clock size={18} />
              </div>
            </div>

            <div className="card p-6 bg-white border border-border-subtle flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[12.5px] text-text-tertiary font-semibold uppercase tracking-wider block">
                  Scenarios Completed
                </span>
                <span className="text-[28px] font-bold text-text-primary block mt-1">
                  {stats.roleplay_completed || 0}
                </span>
                <span className="text-[13px] text-text-secondary block mt-1">
                  AI Roleplay sessions
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Target size={18} />
              </div>
            </div>

            <div className="card p-6 bg-white border border-border-subtle flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[12.5px] text-text-tertiary font-semibold uppercase tracking-wider block">
                  Confidence Score
                </span>
                <span className="text-[28px] font-bold text-text-primary block mt-1">
                  {stats.confidence_score || 0}%
                </span>
                <span className="text-[13px] text-text-secondary block mt-1">
                  Practice based rating
                </span>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Trophy size={18} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Empty state for new users */}
      {!loading && summary && summary.sessions_count === 0 && (
        <div className="card">
          <EmptyState
            icon={Brain}
            title="Your story starts here"
            subtitle="Have a conversation with your AI Companion or try a roleplay to see your stats grow."
            ctaLabel="Talk to AI Companion"
            onCta={() => navigate('/companion')}
          />
        </div>
      )}

      {/* Quick links */}
      {!loading && summary && summary.sessions_count > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => navigate('/companion')}
            className="card text-left p-6 hover:shadow-md transition-shadow group border border-border-subtle bg-white cursor-pointer"
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center text-primary-dark">
                <MessageCircle size={18} />
              </div>
              <h3 className="text-h2 text-[16px] group-hover:text-primary transition-colors">AI Companion</h3>
            </div>
            <p className="text-body text-[13px]">Keep your daily conversation streak going.</p>
          </button>

          <button
            onClick={() => navigate('/practice')}
            className="card text-left p-6 hover:shadow-md transition-shadow group border border-border-subtle bg-white cursor-pointer"
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center text-primary-dark">
                <Target size={18} />
              </div>
              <h3 className="text-h2 text-[16px] group-hover:text-primary transition-colors">Roleplay</h3>
            </div>
            <p className="text-body text-[13px]">Practice another scenario to grow your confidence.</p>
          </button>

          <button
            onClick={() => navigate('/challenges')}
            className="card text-left p-6 hover:shadow-md transition-shadow group border border-border-subtle bg-white cursor-pointer"
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center text-primary-dark">
                <Trophy size={18} />
              </div>
              <h3 className="text-h2 text-[16px] group-hover:text-primary transition-colors">Challenges</h3>
            </div>
            <p className="text-body text-[13px]">Try a real-world communication challenge today.</p>
          </button>
        </div>
      )}
    </div>
  );
}