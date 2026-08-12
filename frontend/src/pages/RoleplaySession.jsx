import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, ArrowLeft, Mic, UserPlus, X, Star } from 'lucide-react';
import ChatBubble from '../components/ui/ChatBubble';
import DisclaimerStrip from '../components/ui/DisclaimerStrip';
import PillChip from '../components/ui/PillChip';
import useChatStore from '../store/chatStore';

/**
 * RoleplaySession — DESIGN_SYSTEM.md Section 7.4
 * Same chat UI as AI Companion, plus:
 * - Persistent scenario label chip at top
 * - End-of-session feedback summary
 * - Turn counter
 */

const SCENARIO_META = {
  job_interview: { label: '💼 Job Interview', emoji: '💼' },
  meeting_new_person: { label: '👋 Meeting a New Person', emoji: '👋' },
};

export default function RoleplaySession() {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const {
    roleplayMessages,
    roleplayLoading,
    roleplayScenario,
    roleplayTurnCount,
    roleplayShouldEnd,
    roleplayFeedback,
    sendRoleplayMessage,
    endRoleplay,
    clearRoleplay,
    startRoleplay,
  } = useChatStore();

  // Start roleplay if not already started
  useEffect(() => {
    if (!roleplayScenario || roleplayScenario !== scenarioId) {
      startRoleplay(scenarioId);
    }
  }, [scenarioId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roleplayMessages, roleplayLoading, roleplayFeedback]);

  const meta = SCENARIO_META[scenarioId] || { label: 'Practice Session', emoji: '🎯' };
  const userTurns = roleplayMessages.filter(m => m.role === 'user').length;

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || roleplayLoading) return;
    setInput('');
    sendRoleplayMessage(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEndSession = () => {
    endRoleplay();
  };

  const handleBackToScenarios = () => {
    clearRoleplay();
    navigate('/practice');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-88px)]">
      {/* Header with scenario chip */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackToScenarios}
            className="w-10 h-10 rounded-2xl bg-white shadow-card flex items-center justify-center hover:bg-surface-soft transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} className="text-text-primary" />
          </motion.button>

          {/* Scenario label chip — persistent at top per DESIGN_SYSTEM.md Section 7.4 */}
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <span className="text-lg">{meta.emoji}</span>
            <span className="text-[14px] font-semibold text-primary-dark">{meta.label}</span>
            <span className="text-[12px] text-text-tertiary ml-1">— in progress</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Turn counter */}
          <span className="text-[13px] text-text-tertiary">
            Turn {userTurns}/6
          </span>

          {!roleplayShouldEnd && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEndSession}
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-danger bg-danger/10 rounded-full hover:bg-danger/20 transition-colors cursor-pointer"
            >
              End Session
            </motion.button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4 px-1 space-y-1">
        {roleplayMessages.map((msg, i) => (
          <ChatBubble key={i} message={msg.content} role={msg.role} />
        ))}

        {/* Loading */}
        {roleplayLoading && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2.5 mb-3"
          >
            <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
              <span className="text-[13px] font-bold text-primary-dark">S</span>
            </div>
            <div className="bg-white rounded-2xl px-5 py-3 shadow-card">
              <Loader2 size={18} className="text-primary animate-spin" />
            </div>
          </motion.div>
        )}

        {/* End-of-session feedback summary */}
        <AnimatePresence>
          {roleplayShouldEnd && roleplayFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="card border-2 border-primary/20 bg-surface-soft mx-2 my-4"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
                  <Star size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-h2">Session Feedback</h3>
                  <p className="text-[12px] text-text-tertiary">{meta.label} — Complete</p>
                </div>
              </div>

              <div
                className="text-body whitespace-pre-wrap leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: roleplayFeedback
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/• /g, '<br/>• ')
                }}
              />

              <div className="flex gap-3 mt-5 pt-4 border-t border-border-subtle">
                <PillChip
                  label="Try Again"
                  variant="soft"
                  onClick={() => {
                    clearRoleplay();
                    startRoleplay(scenarioId);
                  }}
                />
                <PillChip
                  label="Back to Scenarios"
                  variant="outline"
                  onClick={handleBackToScenarios}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waiting for feedback */}
        {roleplayShouldEnd && !roleplayFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-8"
          >
            <div className="flex items-center gap-3 text-text-secondary">
              <Loader2 size={20} className="text-primary animate-spin" />
              <span className="text-[14px]">Generating your feedback...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area — hidden when session is complete */}
      {!roleplayShouldEnd && (
        <div className="mt-auto">
          <DisclaimerStrip variant="chat" />
          <div className="flex items-end gap-3 pt-3 pb-2">
            <div className="flex-1 bg-white rounded-2xl shadow-card px-4 py-3 flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response..."
                rows={1}
                className="flex-1 bg-transparent text-[14.5px] text-text-primary placeholder-text-tertiary outline-none resize-none max-h-[120px]"
                style={{ fontFamily: 'inherit' }}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim() || roleplayLoading}
              className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              <Send size={18} />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
