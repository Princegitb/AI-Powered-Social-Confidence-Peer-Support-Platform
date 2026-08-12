import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2, Trash2 } from 'lucide-react';
import ChatBubble from '../components/ui/ChatBubble';
import DisclaimerStrip from '../components/ui/DisclaimerStrip';
import PillChip from '../components/ui/PillChip';
import useChatStore from '../store/chatStore';
import { useToast } from '../components/ui/Toast';

/**
 * AI Companion Chat — PRD §5.1
 * - Lavender gradient background
 * - Chat bubbles: user (purple/right), AI (white/left)
 * - Persistent DisclaimerStrip above input
 * - Suggested action chips below AI messages
 * - Clear conversation control
 */
export default function AICompanion() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const toast = useToast();

  const {
    companionMessages,
    companionLoading,
    companionSuggestions,
    crisisResponse,
    sendCompanionMessage,
    clearCompanionChat,
    dismissCrisis,
  } = useChatStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [companionMessages, companionLoading, crisisResponse]);

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
    if (!suggestion) return;
    sendCompanionMessage(suggestion);
  };

  const handleClear = () => {
    if (companionMessages.length === 0) return;
    if (confirm('Clear this conversation?')) {
      clearCompanionChat();
      toast({ type: 'success', message: 'Conversation cleared.' });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-88px)] pb-20 md:pb-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-h2">SAATHI AI Companion</h2>
            <p className="text-[13px] text-text-tertiary">Your practice partner</p>
          </div>
        </div>
        {companionMessages.length > 0 && (
          <button
            onClick={handleClear}
            aria-label="Clear conversation"
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-text-tertiary bg-white/70 rounded-full hover:bg-white hover:text-text-primary transition-colors"
          >
            <Trash2 size={14} />
            Clear
          </button>
        )}
      </motion.div>

      <DisclaimerStrip variant="banner" />

      {/* Messages */}
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
            <p className="text-body max-w-md mb-1">
              I'm here to listen, chat, and help you practice.
            </p>
            <p className="text-body max-w-md text-[13px] text-text-tertiary mb-5">
              Tell me what's on your mind, or pick a topic to get started.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
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

        <AnimatePresence>
          {crisisResponse && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card border-2 border-warning/30 bg-warning/5 mx-4 my-3"
              role="alert"
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

      {/* Input */}
      <div className="mt-auto">
        <DisclaimerStrip variant="chat" />
        <div className="flex items-end gap-3 pt-3 pb-2">
          <div className="flex-1 bg-white rounded-2xl shadow-card px-4 py-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="w-full bg-transparent text-[14.5px] text-text-primary placeholder-text-tertiary outline-none resize-none max-h-[120px]"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim() || companionLoading}
            aria-label="Send message"
            className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
