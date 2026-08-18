import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, Star, Target, Mic, ArrowUp, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatBubble from '../components/ui/ChatBubble';
import DisclaimerStrip from '../components/ui/DisclaimerStrip';
import PillChip from '../components/ui/PillChip';
import SaraAvatar from '../components/ui/SaraAvatar';
import useChatStore from '../store/chatStore';
import useProgressStore from '../store/progressStore';
import { synthesizeSpeech } from '../utils/speechUtils';

const SCENARIO_META = {
  job_interview: {
    label: 'Job Interview Practice Room',
    emoji: '💼',
    persona: 'Interviewer Persona',
    hint: 'Focus on clear answers. Pauses are completely fine!',
    quickChips: [
      "Hi! I'm eager to learn and contribute to your team.",
      "My biggest strength is problem solving under pressure.",
      "I handled a tough project by breaking it into small goals.",
    ],
  },
  meeting_new_person: {
    label: 'Meeting Someone New',
    emoji: '👋',
    persona: 'Friendly Stranger Persona',
    hint: 'Keep it casual & natural in Hinglish or English.',
    quickChips: [
      "Hii bhai! Mai pehli baar aaya hu yaha, aap batao?",
      "Mujhe music aur tech pasand hai, aap kya karte ho?",
      "Really nice meeting you! What brings you here today?",
    ],
  },
  public_speaking: {
    label: 'Public Speaking Room',
    emoji: '🎙️',
    persona: 'Speech Coach Persona',
    hint: 'Practice your 1-minute intro clearly.',
    quickChips: [
      "Today I want to share a 1-minute talk on building confidence.",
      "Let me start with a short story about overcoming fear.",
    ],
  },
  professor: {
    label: 'Talking to a Professor',
    emoji: '📚',
    persona: 'Approachable Professor Persona',
    hint: 'Ask your academic question politely.',
    quickChips: [
      "Hello Sir, I had a quick question regarding the project deadline.",
      "Could you please guide me on how to prepare for the final assessment?",
    ],
  },
  phone_call: {
    label: 'Phone Call Practice Room',
    emoji: '☎️',
    persona: 'Receptionist Persona',
    hint: 'Find your steady phone voice.',
    quickChips: [
      "Hello, I am calling to confirm my appointment for tomorrow.",
      "Could you please transfer my call to the support desk?",
    ],
  },
  ordering_food: {
    label: 'Ordering Food Practice',
    emoji: '🍜',
    persona: 'Café Cashier Persona',
    hint: 'Practice ordering your food comfortably.',
    quickChips: [
      "Hi! I would like to order one cold coffee and a sandwich please.",
      "Could I get that to-go? Thank you!",
    ],
  },
};

export default function RoleplaySession() {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [autoPlay, setAutoPlay] = useState(false);
  const messagesEndRef = useRef(null);

  const {
    roleplayMessages,
    roleplayLoading,
    roleplayScenario,
    roleplayShouldEnd,
    roleplayFeedback,
    sendRoleplayMessage,
    endRoleplay,
    clearRoleplay,
    startRoleplay,
  } = useChatStore();
  const invalidateProgress = useProgressStore((s) => s.invalidate);

  useEffect(() => {
    if (!roleplayScenario || roleplayScenario !== scenarioId) {
      startRoleplay(scenarioId);
    }
  }, [scenarioId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roleplayMessages, roleplayLoading, roleplayFeedback]);

  // Handle auto-play voice
  useEffect(() => {
    if (autoPlay && roleplayMessages.length > 0) {
      const last = roleplayMessages[roleplayMessages.length - 1];
      if (last.role === 'assistant') {
        synthesizeSpeech(last.content);
      }
    }
  }, [roleplayMessages, autoPlay]);

  const meta = SCENARIO_META[scenarioId] || {
    label: 'Practice Session Room',
    emoji: '🎯',
    persona: 'Practice Partner',
    hint: 'Take your time and practice at your own pace.',
    quickChips: ["Hii! Ready to start practice."],
  };

  const userTurns = roleplayMessages.filter((m) => m.role === 'user').length;

  const handleSend = (textToSend) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || roleplayLoading) return;
    setInput('');
    sendRoleplayMessage(messageContent);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEndSession = async () => {
    endRoleplay();
    setTimeout(() => invalidateProgress(), 3500);
  };

  const handleTryAgain = async () => {
    clearRoleplay();
    await startRoleplay(scenarioId);
  };

  const handleBackToScenarios = () => {
    clearRoleplay();
    navigate('/practice');
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] pb-10">
      {/* Guided Roleplay Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-bold tracking-wider text-primary uppercase">GUIDED ROLEPLAY</span>
          <h1 className="text-[40px] font-bold text-text-primary font-serif leading-tight">
            {meta.label.replace(" Practice Room", "").replace(" Practice", "").replace(" Room", "")}
          </h1>
          <p className="text-[14.5px] text-text-secondary">
            Stay curious, take your time, and let the conversation unfold.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-border-subtle shadow-sm text-[13.5px] font-semibold text-text-secondary">
            00:00
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-border-subtle text-[12.5px] font-semibold text-text-secondary">
            <Target size={14} className="text-primary" />
            <span>Turn {userTurns}/6</span>
          </div>

          {!roleplayShouldEnd && (
            <button
              onClick={handleEndSession}
              className="flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-medium text-danger bg-danger/10 rounded-full hover:bg-danger/20 transition-colors cursor-pointer"
            >
              End Room Session
            </button>
          )}

          <button
            onClick={handleBackToScenarios}
            aria-label="Back to scenarios"
            className="px-3.5 py-2 text-[13px] rounded-full bg-surface-soft text-text-secondary hover:text-text-primary hover:bg-primary-light/20 transition-colors flex items-center gap-1 font-medium cursor-pointer"
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </div>

      {/* Main Conversation Container Card */}
      <div className="flex-1 bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-card border border-border-subtle relative overflow-hidden flex flex-col min-h-[400px]">
        {/* Messages Log */}
        <div className="flex-1 overflow-y-auto py-2 space-y-4">
          {roleplayMessages.map((msg, i) => (
            <ChatBubble 
              key={i} 
              message={msg.content} 
              role={msg.role} 
              onSpeak={() => synthesizeSpeech(msg.content)} 
            />
          ))}

          {roleplayLoading && (
            <div className="flex items-center gap-2.5 mb-3">
              <SaraAvatar size="sm" emotion="thinking" />
              <div className="bg-[#F7F5FC]/50 rounded-2xl px-5 py-3 shadow-sm border border-border-subtle/50">
                <Loader2 size={18} className="text-primary animate-spin" />
              </div>
            </div>
          )}

          <AnimatePresence>
            {roleplayShouldEnd && roleplayFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="card border-2 border-primary/20 bg-surface-soft mx-2 my-4 p-6"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-card">
                    <Star size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-h2 text-[18px]">Practice Feedback Summary</h3>
                    <p className="text-[12px] text-text-tertiary">
                      {meta.label} — Completed
                    </p>
                  </div>
                </div>

                <div className="markdown-body text-body leading-relaxed text-[14px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {roleplayFeedback}
                  </ReactMarkdown>
                </div>

                <div className="flex gap-3 mt-5 pt-4 border-t border-border-subtle">
                  <PillChip
                    label="Try Again"
                    variant="soft"
                    onClick={handleTryAgain}
                  />
                  <PillChip
                    label="Back to Practice Rooms"
                    variant="outline"
                    onClick={handleBackToScenarios}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {roleplayShouldEnd && !roleplayFeedback && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3 text-text-secondary">
                <Loader2 size={20} className="text-primary animate-spin" />
                <span className="text-[14px]">Generating practice room feedback...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Response Chips & Input */}
        {!roleplayShouldEnd && (
          <div className="mt-4 pt-3 border-t border-border-subtle space-y-3">
            {/* Practice Room Quick Response Chips */}
            {meta.quickChips && meta.quickChips.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 px-1">
                <span className="text-[11px] text-text-tertiary shrink-0 font-medium">Quick Ideas:</span>
                {meta.quickChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(chip)}
                    className="px-3.5 py-1.5 rounded-full text-[12px] bg-white hover:bg-primary-light/35 border border-border-subtle text-text-secondary hover:text-primary transition-all shrink-0 cursor-pointer shadow-sm"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            <DisclaimerStrip variant="chat" />
            
            <div className="bg-white rounded-full p-2 pl-5 shadow-card border border-border-subtle hover:border-primary/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Talk to Sara..."
                className="flex-1 bg-transparent text-[14.5px] text-text-primary placeholder-text-tertiary outline-none border-none py-1"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSend()}
                disabled={!input.trim() || roleplayLoading}
                aria-label="Send response"
                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-all disabled:opacity-40 cursor-pointer shrink-0 shadow-sm"
              >
                <ArrowUp size={16} />
              </motion.button>
            </div>

            <div className="flex items-center justify-between mt-3 text-[12px] text-text-tertiary px-2">
              <span>Text and voice stay in one conversation</span>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-text-primary">
                <input
                  type="checkbox"
                  checked={autoPlay}
                  onChange={(e) => setAutoPlay(e.target.checked)}
                  className="accent-primary rounded"
                />
                <span>Auto-play Sara</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
