import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import ChatBubble from '../components/ui/ChatBubble';
import DisclaimerStrip from '../components/ui/DisclaimerStrip';
import PillChip from '../components/ui/PillChip';
import useChatStore from '../store/chatStore';

/**
 * AI Companion Chat — PRD Section 5.1 + DESIGN_SYSTEM.md Section 7.2
 * - Lavender gradient background
 * - Chat bubbles: user (purple/right), AI (white/left)
 * - Persistent DisclaimerStrip above input
 * - Suggested action chips below AI messages
 */
export default function AICompanion() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    companionMessages,
    companionLoading,
    companionSuggestions,
    crisisResponse,
    sendCompanionMessage,
    dismissCrisis,
  } = useChatStore();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [companionMessages, companionLoading]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || companionLoading) return;
    setInput('');
    sendCompanionMessage(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendCompanionMessage(suggestion);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-88px)]">
      {/* Chat header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-4"
      >
        <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-h2">SAATHI AI Companion</h2>
          <p className="text-[13px] text-text-tertiary">Your practice partner</p>
        </div>
      </motion.div>

      {/* Disclaimer banner */}
      <DisclaimerStrip variant="banner" />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-5 px-1 space-y-1">
        {companionMessages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-surface-soft flex items-center justify-center mb-5">
              <Sparkles size={36} className="text-primary" />
            </div>
            <h3 className="text-h2 mb-2">Start a Conversation</h3>
            <p className="text-body max-w-md">
              I'm here to listen, chat, and help you practice. Tell me what's on your mind,
              or pick a topic below to get started.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {[
                'I have an interview coming up',
                'I want to practice small talk',
                'I feel nervous about meeting new people',
                'Help me build confidence',
              ].map((prompt) => (
                <PillChip
                  key={prompt}
                  label={prompt}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(prompt)}
                />
              ))}
            </div>
          </motion.div>
        )}

        {companionMessages.map((msg, i) => (
          <ChatBubble key={i} message={msg.content} role={msg.role} />
        ))}

        {/* Loading indicator */}
        {companionLoading && (
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

        {/* Suggestion chips */}
        <AnimatePresence>
          {companionSuggestions.length > 0 && !companionLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap gap-2 mt-2 ml-10"
            >
              {companionSuggestions.map((s, i) => (
                <PillChip
                  key={i}
                  label={s}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(s)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Crisis response modal */}
        <AnimatePresence>
          {crisisResponse && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card border-2 border-warning/30 bg-warning/5 mx-4 my-3"
            >
              <p className="text-body font-medium text-text-primary mb-3">
                {crisisResponse.message}
              </p>
              <div className="flex flex-wrap gap-2">
                {crisisResponse.options?.map((opt, i) => (
                  <PillChip
                    key={i}
                    label={opt.label}
                    variant="soft"
                    size="sm"
                    onClick={() => {
                      if (opt.url) window.open(opt.url, '_blank');
                      if (opt.action === 'continue') dismissCrisis();
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="mt-auto">
        <DisclaimerStrip variant="chat" />
        <div className="flex items-end gap-3 pt-3 pb-2">
          <div className="flex-1 bg-white rounded-2xl shadow-card px-4 py-3 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 bg-transparent text-[14.5px] text-text-primary placeholder-text-tertiary outline-none resize-none max-h-[120px]"
              style={{ fontFamily: 'inherit' }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim() || companionLoading}
            className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
