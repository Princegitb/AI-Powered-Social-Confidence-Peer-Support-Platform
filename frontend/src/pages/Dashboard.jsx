import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Target, Brain, Clock, Mic, Users, Sparkles,
  Play, ChevronRight, Trophy
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import TrendChartCard from '../components/ui/TrendChartCard';
import ListRow from '../components/ui/ListRow';
import CTACard from '../components/ui/CTACard';
import PillChip from '../components/ui/PillChip';

/**
 * Dashboard — DESIGN_SYSTEM.md Section 5 (layout grid) + Section 6 (mapping table)
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Greeting + Hero illustration     │  Confidence Trend       │
 * │  [Stat cards overlapping hero]    │  [Confidence Score card] │
 * ├───────────────────────┬───────────┼─────────────────────────┤
 * │  Practice Log (list)  │ Continue  │  Quick Access (chips)    │
 * │                       │ Practice  │                          │
 * └───────────────────────┴───────────┴─────────────────────────┘
 */

// ── Seeded / placeholder data ────────────────────────────────

const TREND_DATA = [
  { name: 'Mon', value: 35 },
  { name: 'Tue', value: 42 },
  { name: 'Wed', value: 38 },
  { name: 'Thu', value: 55 },
  { name: 'Fri', value: 48 },
  { name: 'Sat', value: 62 },
  { name: 'Sun', value: 70 },
];

const PRACTICE_LOG = [
  {
    icon: Mic,
    iconBg: '#8B5CF6',
    title: 'Job Interview Roleplay',
    date: 'Aug 10, 2026 • 12 mins',
    subtitle: 'AI Practice',
  },
  {
    icon: Users,
    iconBg: '#A78BFA',
    title: 'Peer Chat — Social Anxiety Support',
    date: 'Aug 9, 2026 • 8 mins',
    subtitle: 'Peer Chat',
  },
  {
    icon: Brain,
    iconBg: '#C4B5FD',
    title: 'AI Companion — Confidence Building',
    date: 'Aug 8, 2026 • 15 mins',
    subtitle: 'AI Session',
  },
  {
    icon: Mic,
    iconBg: '#34D399',
    title: 'Meeting New Person Roleplay',
    date: 'Aug 7, 2026 • 10 mins',
    subtitle: 'AI Practice',
  },
];

const QUICK_ACCESS = [
  { label: 'AI Companion', icon: Brain, path: '/companion' },
  { label: 'Roleplay', icon: Mic, path: '/practice' },
  { label: 'Peer Chat', icon: Users, path: '/peer' },
  { label: 'Challenge', icon: Trophy, path: '/challenge' },
];

// ── Component ────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const userName = 'User'; // Placeholder — will come from auth later

  return (
    <div className="space-y-6">
      {/* ── TOP SECTION: Greeting + Hero + Stats | Trend + Score ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Greeting + Hero + floating stat cards (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Greeting header — per DESIGN_SYSTEM.md Section 3 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <h1 className="text-h1 text-[30px]">
              Hello, <span className="font-bold">{userName}</span> 👋
            </h1>
            <p className="text-body mt-1.5">Ready to practice today?</p>
          </motion.div>

          {/* Hero illustration + floating stat cards */}
          <div className="relative">
            {/* Hero image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
              className="flex justify-center py-4"
            >
              <img
                src="/hero-seedling.png"
                alt="SAATHI Confidence Seedling"
                className="w-[240px] h-[240px] object-contain drop-shadow-lg"
              />
            </motion.div>

            {/* Floating stat cards overlapping the hero — desktop only */}
            <div className="hidden lg:block">
              <div className="absolute -left-2 top-8 w-[200px]">
                <StatCard
                  label="Journey Progress"
                  status="Level 2 of 5"
                  value="40%"
                  icon={Target}
                  className="!p-4 !text-sm"
                />
              </div>
              <div className="absolute -right-2 bottom-4 w-[200px]">
                <StatCard
                  label="Practice Time"
                  status="Today"
                  value="42 min"
                  icon={Clock}
                  className="!p-4 !text-sm"
                />
              </div>
            </div>
          </div>

          {/* Mobile: stat cards in a row (shown below hero) */}
          <div className="grid grid-cols-2 gap-4 lg:hidden">
            <StatCard
              label="Journey Progress"
              status="Level 2 of 5"
              value="40%"
              icon={Target}
            />
            <StatCard
              label="Practice Time"
              status="Today"
              value="42 min"
              icon={Clock}
            />
          </div>
        </div>

        {/* Right column: Trend chart + Confidence Score (2 cols) */}
        <div className="lg:col-span-2 space-y-5">
          <TrendChartCard
            title="Confidence Trend"
            subtitle="This week"
            data={TREND_DATA}
          />
          <StatCard
            label="Confidence Score"
            status="Ease Level"
            value="70%"
            icon={Sparkles}
            color="#8B5CF6"
          />
        </div>
      </div>

      {/* ── BOTTOM SECTION: Practice Log | Continue Practice | Quick Access ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Practice Log — takes 2.5/5 cols */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut', delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-h2">Practice Log</h3>
              <button className="text-[13px] text-primary font-medium hover:text-primary-dark transition-colors">
                View All
              </button>
            </div>
            <div className="space-y-0.5">
              {PRACTICE_LOG.map((item, i) => (
                <ListRow
                  key={i}
                  icon={item.icon}
                  iconBg={item.iconBg}
                  title={item.title}
                  date={item.date}
                  subtitle={item.subtitle}
                  onAction={() => {}}
                  actionIcon={Play}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Continue Practice CTA + Quick Access — takes 2/5 cols */}
        <div className="lg:col-span-2 space-y-5">
          <CTACard
            eyebrow="Continue Practice"
            title="Job Interview Roleplay"
            stat="Session 3"
            avatarIcon={Mic}
            subtitle="AI Practice Partner"
            onClick={() => navigate('/practice')}
          />

          {/* Quick Access chips — DESIGN_SYSTEM.md Section 4.6 */}
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
