import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ScenarioCard from '../components/ui/ScenarioCard';
import DisclaimerStrip from '../components/ui/DisclaimerStrip';
import useChatStore from '../store/chatStore';

/**
 * RoleplaySelector — DESIGN_SYSTEM.md Section 7.3
 * Grid of scenario cards.
 */

const SCENARIOS = [
  {
    id: 'job_interview',
    emoji: '💼',
    title: 'Job Interview',
    description: 'Practice answering common interview questions with a friendly AI interviewer.',
    active: true,
  },
  {
    id: 'meeting_new_person',
    emoji: '👋',
    title: 'Meeting a New Person',
    description: 'Practice introducing yourself and making conversation at a college event.',
    active: true,
  },
  {
    id: 'ordering_food',
    emoji: '🍽️',
    title: 'Ordering Food',
    description: 'Practice ordering at a restaurant or café with confidence.',
    active: false,
  },
  {
    id: 'professor',
    emoji: '🎓',
    title: 'Talking to a Professor',
    description: 'Practice asking questions or seeking help from a professor.',
    active: false,
  },
  {
    id: 'public_speaking',
    emoji: '🎤',
    title: 'Public Speaking',
    description: 'Practice delivering a short speech or presentation.',
    active: false,
  },
  {
    id: 'phone_call',
    emoji: '📞',
    title: 'Phone Call',
    description: 'Practice making a phone call — appointments, inquiries, follow-ups.',
    active: false,
  },
];

export default function RoleplaySelector() {
  const navigate = useNavigate();
  const { startRoleplay } = useChatStore();

  const handleStart = async (scenarioId) => {
    await startRoleplay(scenarioId);
    navigate(`/roleplay/${scenarioId}`);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-h1">AI Roleplay Simulator</h1>
        <p className="text-body mt-1.5 max-w-xl">
          Pick a real-life scenario to practice. The AI will play the other person —
          just respond naturally and get feedback at the end.
        </p>
      </motion.div>

      <DisclaimerStrip variant="banner" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {SCENARIOS.map((scenario, i) => (
          <motion.div
            key={scenario.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05 }}
          >
            <ScenarioCard
              emoji={scenario.emoji}
              title={scenario.title}
              description={scenario.description}
              disabled={!scenario.active}
              onStart={() => handleStart(scenario.id)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
