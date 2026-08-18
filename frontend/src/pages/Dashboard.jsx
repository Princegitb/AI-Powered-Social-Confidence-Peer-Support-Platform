import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Target, Clock, MessageSquare, ArrowUpRight,
  Sparkles, Check
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import useProgressStore from '../store/progressStore';
import useUserStore from '../store/userStore';
import useChatStore from '../store/chatStore';
import { useToast } from '../components/ui/Toast';

/**
 * Dashboard — Redesigned according to new UI spec.
 */

const MOODS = [
  { emoji: '😊', label: 'Great' },
  { emoji: '😐', label: 'Good' },
  { emoji: '😑', label: 'Okay' },
  { emoji: '🙁', label: 'Low' },
  { emoji: '😫', label: 'Stressed' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const displayName = useUserStore((s) => s.displayName);
  const summary = useProgressStore((s) => s.summary);
  const loading = useProgressStore((s) => s.loading);
  const fetchAll = useProgressStore((s) => s.fetchAll);
  const clearRoleplay = useChatStore((s) => s.clearRoleplay);
  const startRoleplay = useChatStore((s) => s.startRoleplay);

  const [selectedMood, setSelectedMood] = useState(null);

  useEffect(() => {
    fetchAll(true);
  }, []);

  const practiceTime = summary?.practice_minutes ?? 0;
  const trend = summary?.weekly_trend || [];
  const pct = summary?.level_progress_pct || 0;
  const sessions = summary?.sessions_count || 0;

  const handleResumeRoleplay = async (scenario) => {
    clearRoleplay();
    await startRoleplay(scenario);
    navigate(`/roleplay/${scenario}`);
  };

  const handleMoodSelect = (moodLabel) => {
    setSelectedMood(moodLabel);
    toast({
      type: 'success',
      message: `Mood logged as "${moodLabel}". Take it easy today!`,
    });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ── TOP SECTION: Greeting + Hero Banner ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
        {/* Left: Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="md:col-span-3 space-y-1.5"
        >
          <span className="text-[10px] font-bold tracking-wider text-primary uppercase">
            YOUR COMMUNICATION SPACE
          </span>
          <h1 className="text-[40px] font-bold text-text-primary font-serif leading-tight">
            Hello, {displayName || 'Sara'} 👋
          </h1>
          <h1 className="text-[40px] font-bold text-text-primary font-serif leading-tight mt-[-6px]">
            How are you feeling today?
          </h1>
          <p className="text-[14.5px] text-text-secondary mt-2.5 max-w-lg">
            A quiet place to talk, practice, and build confidence at your own pace.
          </p>
        </motion.div>

        {/* Right: Graphic Banner Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
          className="md:col-span-2 relative bg-[#8B5CF6] rounded-3xl p-6 overflow-hidden flex flex-col justify-between text-white shadow-sm min-h-[185px] w-full"
        >
          {/* Radial/Sphere Background */}
          <div 
            className="absolute -right-16 -bottom-16 w-52 h-52 rounded-full opacity-65 blur-[1px] pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #C4B5FD 0%, #8B5CF6 45%, #6D28D9 80%, #4C1D95 100%)',
              boxShadow: 'inset -6px -6px 15px rgba(0,0,0,0.35), inset 6px 6px 15px rgba(255,255,255,0.45)',
            }}
          />
          
          <div className="relative z-10 space-y-2 mt-auto">
            <h2 className="text-[26px] font-serif font-bold leading-tight">
              Small steps <br /> become progress
            </h2>
            <p className="text-[12.5px] text-white/80">
              Sara is here whenever you are ready
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── MIDDLE SECTION: Row of 3 Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut', delay: 0.15 }}
          className="card flex items-center justify-between p-6 bg-white border border-border-subtle"
        >
          <div>
            <span className="text-[12.5px] text-text-tertiary font-semibold uppercase tracking-wider block">
              Practice progress
            </span>
            <span className="text-[28px] font-bold text-text-primary block mt-1">
              {pct}%
            </span>
            <span className="text-[13px] text-text-secondary block mt-1">
              Keep going, gently
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Target size={18} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut', delay: 0.2 }}
          className="card flex items-center justify-between p-6 bg-white border border-border-subtle"
        >
          <div>
            <span className="text-[12.5px] text-text-tertiary font-semibold uppercase tracking-wider block">
              Sessions complete
            </span>
            <span className="text-[28px] font-bold text-text-primary block mt-1">
              {sessions}
            </span>
            <span className="text-[13px] text-text-secondary block mt-1">
              Real practice, not pressure
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <MessageSquare size={18} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut', delay: 0.25 }}
          className="card flex items-center justify-between p-6 bg-white border border-border-subtle"
        >
          <div>
            <span className="text-[12.5px] text-text-tertiary font-semibold uppercase tracking-wider block">
              Practice time
            </span>
            <span className="text-[28px] font-bold text-text-primary block mt-1">
              {practiceTime} min
            </span>
            <span className="text-[13px] text-text-secondary block mt-1">
              This journey is yours
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Clock size={18} />
          </div>
        </motion.div>
      </div>

      {/* ── BOTTOM SECTION: Left Grid (Moods + Chart) | Right Grid (Scenarios) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Grid: Mood selection and Weekly activity */}
        <div className="lg:col-span-3 space-y-6">
          {/* Mood Check-in Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut', delay: 0.2 }}
            className="card border border-border-subtle"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-h2 text-[18px]">How are you feeling today?</h3>
                <p className="text-[12px] text-text-tertiary mt-0.5">A check-in, not a label.</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <Check size={13} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {MOODS.map((m) => (
                <button
                  key={m.label}
                  onClick={() => handleMoodSelect(m.label)}
                  className={`px-4.5 py-2.5 rounded-full text-[13px] font-medium border transition-all flex items-center gap-1.5 cursor-pointer hover:bg-primary/5 hover:border-primary/30 ${
                    selectedMood === m.label
                      ? 'bg-primary/10 border-primary text-primary shadow-sm'
                      : 'bg-white border-border-subtle text-text-secondary'
                  }`}
                >
                  <span className="text-[15px]">{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Weekly activity Chart Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut', delay: 0.22 }}
            className="card border border-border-subtle"
          >
            <div className="mb-4">
              <h3 className="text-h2 text-[18px]">Weekly activity</h3>
              <p className="text-[12px] text-text-tertiary mt-0.5">Your practice rhythm</p>
            </div>

            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                    domain={[0, (dataMax) => Math.max(5, Math.ceil(dataMax * 1.1))]}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(139, 92, 246, 0.15)',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#8B5CF6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Right Grid: Start with Sara */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut', delay: 0.25 }}
            className="card border border-border-subtle h-full flex flex-col justify-between"
          >
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-h2 text-[18px]">Start with Sara</h3>
                  <p className="text-[12px] text-text-tertiary mt-0.5">Choose a gentle first step</p>
                </div>
                <ArrowUpRight size={18} className="text-text-tertiary" />
              </div>

              <div className="space-y-3 mt-5">
                {[
                  { label: 'Job Interview', emoji: '💼', id: 'job_interview' },
                  { label: 'Meet Someone New', emoji: '👋', id: 'meeting_new_person' },
                  { label: 'Public Speaking', emoji: '🎤', id: 'public_speaking' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'job_interview') handleResumeRoleplay(item.id);
                      else navigate(`/roleplay/${item.id}`);
                    }}
                    className="w-full p-4.5 rounded-2xl bg-white border border-border-subtle hover:border-primary/40 hover:bg-primary-light/5 hover:shadow-sm transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[17px]">{item.emoji}</span>
                      <span className="text-[14px] font-semibold text-text-primary group-hover:text-primary transition-colors">
                        {item.label}
                      </span>
                    </div>
                    <ArrowUpRight size={16} className="text-text-tertiary group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
