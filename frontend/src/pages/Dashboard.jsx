import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Target, Clock, Mic, Users, Sparkles, Brain,
  Play, ChevronRight, Trophy, MessageCircle
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import TrendChartCard from '../components/ui/TrendChartCard';
import ListRow from '../components/ui/ListRow';
import CTACard from '../components/ui/CTACard';
import PillChip from '../components/ui/PillChip';
import SkeletonCard from '../components/ui/SkeletonCard';
import EmptyState from '../components/ui/EmptyState';
import useProgressStore from '../store/progressStore';
import useUserStore from '../store/userStore';
import useChatStore from '../store/chatStore';

/**
 * Dashboard — DESIGN_SYSTEM.md Section 5. Layout grid wired to live data.
 */

const QUICK_ACCESS = [
  { label: 'AI Companion', icon: Brain, path: '/companion' },
  { label: 'Roleplay', icon: Mic, path: '/practice' },
  { label: 'Find Saathi', icon: Users, path: '/peer' },
  { label: 'Challenges', icon: Trophy, path: '/challenges' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const displayName = useUserStore((s) => s.displayName);
  const summary = useProgressStore((s) => s.summary);
  const recent = useProgressStore((s) => s.recent);
  const loading = useProgressStore((s) => s.loading);
  const fetchAll = useProgressStore((s) => s.fetchAll);
  const clearRoleplay = useChatStore((s) => s.clearRoleplay);
  const startRoleplay = useChatStore((s) => s.startRoleplay);

  useEffect(() => {
    fetchAll(true);
  }, []);

  const practiceTime = summary?.practice_minutes ?? 0;
  const trend = summary?.weekly_trend || [];
  const level = summary?.current_level || 1;
  const pct = summary?.level_progress_pct || 0;
  const score = summary?.confidence_score ?? 0;

  const handleResumeRoleplay = async (scenario) => {
    clearRoleplay();
    await startRoleplay(scenario);
    navigate(`/roleplay/${scenario}`);
  };

  // Find the most recent roleplay to drive "Continue Practice"
  const lastRoleplay = recent.find((r) => r.kind === 'roleplay_complete');
  const continueScenario = lastRoleplay?.payload?.scenario_id;
  const continueLabel = lastRoleplay?.title?.replace('Roleplay — ', '') || 'Pick a scenario';

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* ── TOP SECTION: Greeting + Hero + Stats | Trend + Score ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Greeting + Hero + floating stat cards (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Greeting header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <h1 className="text-h1">
              Hello, <span className="font-bold">{displayName || 'Friend'}</span>{' '}
              <span className="inline-block animate-float origin-bottom">👋</span>
            </h1>
            <p className="text-body mt-1.5">
              {summary && summary.sessions_count > 0
                ? 'Welcome back — ready to keep building confidence?'
                : 'Ready to start your first practice session?'}
            </p>
          </motion.div>

          {/* Hero illustration + floating stat cards */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
              className="flex justify-center py-4"
            >
              <img
                src="/hero-seedling.png"
                alt="SAATHI Confidence Seedling"
                className="w-[180px] h-[180px] md:w-[240px] md:h-[240px] object-contain drop-shadow-lg animate-float"
                loading="lazy"
              />
            </motion.div>

            <div className="hidden lg:block">
              <div className="absolute -left-2 top-8 w-[210px]">
                <StatCard
                  label="Journey Progress"
                  status={`Level ${level} of 5`}
                  value={`${pct}%`}
                  icon={Target}
                  className="!p-4"
                  onClick={() => navigate('/journey')}
                />
              </div>
              <div className="absolute -right-2 bottom-4 w-[210px]">
                <StatCard
                  label="Practice Time"
                  status={practiceTime > 0 ? 'Total' : 'Today'}
                  value={`${practiceTime} min`}
                  icon={Clock}
                  className="!p-4"
                  onClick={() => navigate('/progress')}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:hidden">
            <StatCard
              label="Journey Progress"
              status={`Level ${level} of 5`}
              value={`${pct}%`}
              icon={Target}
              onClick={() => navigate('/journey')}
            />
            <StatCard
              label="Practice Time"
              status={practiceTime > 0 ? 'Total' : 'Today'}
              value={`${practiceTime} min`}
              icon={Clock}
              onClick={() => navigate('/progress')}
            />
          </div>
        </div>

        {/* Right column: Trend + Score */}
        <div className="lg:col-span-2 space-y-5">
          {loading && !summary ? (
            <>
              <SkeletonCard height={220} />
              <SkeletonCard height={120} />
            </>
          ) : (
            <>
              <TrendChartCard
                title="Confidence Trend"
                subtitle="This week"
                data={trend}
                emptyMessage="Start a session this week and your activity will start showing here."
              />
              <StatCard
                label="Confidence Score"
                status="Practice based"
                value={`${score}%`}
                icon={Sparkles}
                color="#8B5CF6"
                onClick={() => navigate('/progress')}
              />
            </>
          )}
        </div>
      </div>

      {/* ── BOTTOM SECTION: Practice Log | Continue Practice | Quick Access ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Practice Log */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut', delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-h2">Practice Log</h3>
              <Link
                to="/progress"
                className="text-[13px] text-primary font-medium hover:text-primary-dark transition-colors flex items-center gap-1"
              >
                View All
                <ChevronRight size={14} />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                <SkeletonCard height={60} />
                <SkeletonCard height={60} />
                <SkeletonCard height={60} />
              </div>
            ) : recent.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title="No sessions yet"
                subtitle="Try the AI Companion or a roleplay — your practice log will fill up as you go."
                ctaLabel="Start a conversation"
                onCta={() => navigate('/companion')}
              />
            ) : (
              <div className="space-y-0.5">
                {recent.slice(0, 5).map((item, i) => (
                  <ListRow
                    key={i}
                    icon={_iconForKind(item.kind)}
                    iconBg={_bgForKind(item.kind)}
                    title={item.title}
                    date={item.date}
                    subtitle={item.subtitle}
                    href={item.href}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Continue Practice CTA + Quick Access */}
        <div className="lg:col-span-2 space-y-5">
          <CTACard
            eyebrow="Continue your practice"
            title={lastRoleplay ? continueLabel : 'Pick a scenario'}
            stat={lastRoleplay ? 'Pick up where you left off' : '~5 min'}
            avatarIcon={Mic}
            subtitle={lastRoleplay ? 'Resume AI roleplay' : 'AI Practice Partner'}
            onClick={() => {
              if (continueScenario) handleResumeRoleplay(continueScenario);
              else navigate('/practice');
            }}
          />

          {/* ── Personalized 7-Day Practice Plan ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut', delay: 0.22 }}
            className="card p-5 bg-gradient-to-br from-white to-surface-soft border border-border-subtle"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-label text-primary font-semibold uppercase">7-Day Practice Plan</span>
              <span className="text-[12px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">Active</span>
            </div>
            <h3 className="text-h2 text-[16.5px] font-bold text-text-primary mb-3">Daily 5-Min Missions</h3>
            
            <div className="space-y-2.5">
              {[
                { day: 'Day 1', mission: '3-min Warmup Chat with Sara', path: '/companion', done: true },
                { day: 'Day 2', mission: 'Practice Job Interview Q1', path: '/practice', done: true },
                { day: 'Day 3', mission: 'Meeting Someone New Intro', path: '/practice', done: false },
                { day: 'Day 4', mission: 'Find Your Saathi Peer Chat', path: '/peer', done: false },
                { day: 'Day 5', mission: 'APJ Kalam Inspiration Session', path: '/practice', done: false },
                { day: 'Day 6', mission: 'Public Speaking Rehearsal', path: '/practice', done: false },
                { day: 'Day 7', mission: 'Weekly Reflection & Note', path: '/journey', done: false },
              ].map((item, idx) => (
                <div
                  key={item.day}
                  onClick={() => navigate(item.path)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    item.done
                      ? 'bg-emerald-50/50 border-emerald-200/60 text-emerald-800'
                      : idx === 2
                      ? 'bg-white border-primary shadow-sm text-text-primary font-semibold'
                      : 'bg-white/60 border-border-subtle/80 text-text-secondary opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-[13px]">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${item.done ? 'bg-emerald-200 text-emerald-900' : 'bg-gray-100 text-text-tertiary'}`}>
                      {item.day}
                    </span>
                    <span>{item.mission}</span>
                  </div>
                  <span className="text-[12px] font-bold">{item.done ? '✓' : '→'}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut', delay: 0.25 }}
            className="card"
          >
            <h3 className="text-h2 mb-4">Quick Access</h3>
            <div className="space-y-2.5">
              {QUICK_ACCESS.map((item) => (
                <PillChip
                  key={item.label}
                  label={item.label}
                  icon={item.icon}
                  variant="soft"
                  onClick={() => navigate(item.path)}
                  className="w-full justify-between"
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function _iconForKind(kind) {
  return {
    companion_session: Sparkles,
    roleplay_complete: Mic,
    peer_message: Users,
    challenge_complete: Trophy,
    speech_practice: MessageCircle,
  }[kind] || Play;
}

function _bgForKind(kind) {
  return {
    companion_session: '#A78BFA',
    roleplay_complete: '#8B5CF6',
    peer_message: '#34D399',
    challenge_complete: '#FBBF24',
    speech_practice: '#6D28D9',
  }[kind] || '#C4B5FD';
}
