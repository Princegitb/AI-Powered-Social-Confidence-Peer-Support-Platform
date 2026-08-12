import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, ArrowLeft, Star } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatBubble from '../components/ui/ChatBubble';
import DisclaimerStrip from '../components/ui/DisclaimerStrip';
import PillChip from '../components/ui/PillChip';
import useChatStore from '../store/chatStore';
import useProgressStore from '../store/progressStore';

const SCENARIO_META = {
  job_interview: { label: 'Job Interview', emoji: '💼' },
  meeting_new_person: { label: 'Meeting a New Person', emoji: '👋' },
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

  const meta = SCENARIO_META[scenarioId] || { label: 'Practice Session', emoji: '🎯' };
  const userTurns = roleplayMessages.filter((m) => m.role === 'user').length;

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

  const handleEndSession = async () => {
    endRoleplay();
    // Refresh the dashboard's recent activity after a beat (feedback generation runs async)
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
    <div className="flex flex-col h-[calc(100vh-88px)] pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToScenarios}
            aria-label="Back to scenarios"
            className="w-10 h-10 rounded-2xl bg-white shadow-card flex items-center justify-center hover:bg-surface-soft transition-colors"
          >
            <ArrowLeft size={18} className="text-text-primary" />
          </button>

          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
            <span className="text-lg">{meta.emoji}</span>
            <span className="text-[14px] font-semibold text-primary-dark">{meta.label}</span>
            {!roleplayShouldEnd && (
              <span className="text-[12px] text-text-tertiary ml-1">— in progress</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[13px] text-text-tertiary" aria-live="polite">
            Turn {userTurns}/6
          </span>

          {!roleplayShouldEnd && (
            <button
              onClick={handleEndSession}
              aria-label="End roleplay session early"
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-danger bg-danger/10 rounded-full hover:bg-danger/20 transition-colors"
            >
              End Session
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 px-1 space-y-1">
        {roleplayMessages.map((msg, i) => (
          <ChatBubble key={i} message={msg.content} role={msg.role} />
        ))}

        {roleplayLoading && (
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
              <span className="text-[13px] font-bold text-primary-dark">S</span>
            </div>
            <div className="bg-white rounded-2xl px-5 py-3 shadow-card">
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
              className="card border-2 border-primary/20 bg-surface-soft mx-2 my-4"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
                  <Star size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-h2">Session Feedback</h3>
                  <p className="text-[12px] text-text-tertiary">
                    {meta.label} — Complete
                  </p>
                </div>
              </div>

              <div className="markdown-body text-body leading-relaxed">
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
                  label="Back to Scenarios"
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
              <span className="text-[14px]">Generating your feedback...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!roleplayShouldEnd && (
        <div className="mt-auto">
          <DisclaimerStrip variant="chat" />
          <div className="flex items-end gap-3 pt-3 pb-2">
            <div className="flex-1 bg-white rounded-2xl shadow-card px-4 py-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response..."
                rows={1}
                className="w-full bg-transparent text-[14.5px] text-text-primary placeholder-text-tertiary outline-none resize-none max-h-[120px]"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim() || roleplayLoading}
              aria-label="Send message"
              className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send size={18} />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
