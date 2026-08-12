import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Volume2, VolumeX, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import ChatBubble from '../components/ui/ChatBubble';
import DisclaimerStrip from '../components/ui/DisclaimerStrip';
import useChatStore from '../store/chatStore';

/**
 * AI Companion ("Sara") — Matches Reference Image 2
 * Features:
 * - Sara Header bar with status indicator & [Chat] / [Voice] toggle
 * - Text-to-speech auto-play toggle ([x] Auto-play Sara) + Speech Synthesis
 * - Right Sidebar: 3D Orb card + "Start voice with Sara" button
 * - "Try a starting point" card with 5 quick prompt starters
 */

const STARTING_POINTS = [
  {
    icon: '🍊',
    title: 'Talk about my day',
    subtitle: 'Help me reflect on today',
    prompt: 'I want to talk about my day and reflect on what happened.',
  },
  {
    icon: '🔑',
    title: 'Practice speaking',
    subtitle: 'Build my confidence',
    prompt: 'I want to practice speaking more clearly and build my confidence.',
  },
  {
    icon: '💼',
    title: 'Interview practice',
    subtitle: 'Prepare with Sara',
    prompt: 'I have an interview coming up and want to practice my answers.',
  },
  {
    icon: '⚡',
    title: 'Meet someone new',
    subtitle: 'Practice an introduction',
    prompt: 'Help me practice introducing myself to someone new.',
  },
  {
    icon: '🎤',
    title: 'Public speaking',
    subtitle: 'Reflect on a topic',
    prompt: 'I want to practice delivering a short speech on a topic.',
  },
];

export default function AICompanion() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('chat'); // 'chat' | 'voice'
  const [autoPlay, setAutoPlay] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  const {
    companionMessages,
    companionLoading,
    companionSuggestions,
    sendCompanionMessage,
  } = useChatStore();

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [companionMessages, companionLoading]);

  // Speech Synthesis helper
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#_]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = 1.1; // Friendly warm pitch for Sara
      window.speechSynthesis.speak(utterance);
    }
  };

  // Auto-play TTS on new AI response
  useEffect(() => {
    if (autoPlay && companionMessages.length > 0) {
      const last = companionMessages[companionMessages.length - 1];
      if (last.role === 'assistant') {
        speakText(last.content);
      }
    }
  }, [companionMessages, autoPlay]);

  // Speech Recognition helper (Web Speech API)
  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. You can type your message!');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInput(transcript);
        sendCompanionMessage(transcript);
      }
    };

    recognition.start();
  };

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-100px)]">
      {/* ── LEFT & MAIN CHAT AREA (8 cols) ── */}
      <div className="lg:col-span-8 flex flex-col h-full bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-card border border-border-subtle">
        {/* Sara Header Bar (Image 2 match) */}
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center shadow-card">
                <span className="text-[16px] font-bold text-primary-dark">S</span>
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-h2 text-[18px]">Sara</h2>
                <span className="text-[12px] text-text-tertiary font-normal">• Your AI conversation companion</span>
              </div>
            </div>
          </div>

          {/* Mode Switcher [Chat] [Voice] */}
          <div className="flex items-center bg-surface-soft p-1 rounded-full border border-border-subtle">
            <button
              onClick={() => setMode('chat')}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                mode === 'chat' ? 'bg-white text-text-primary shadow-card' : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              💭 Chat
            </button>
            <button
              onClick={() => {
                setMode('voice');
                toggleVoiceInput();
              }}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                mode === 'voice' ? 'bg-white text-text-primary shadow-card' : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              🎤 Voice
            </button>
          </div>
        </div>

        <DisclaimerStrip variant="chat" />

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
          {companionMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary-light/50 flex items-center justify-center">
                <Sparkles size={28} className="text-primary" />
              </div>
              <h3 className="text-h2">Talk to Sara</h3>
              <p className="text-body max-w-sm text-sm">
                Sara is right here with you. Type a message or pick a starting point from the panel on the right.
              </p>
            </div>
          )}

          {companionMessages.map((msg, i) => (
            <div key={i} className="relative group">
              <ChatBubble message={msg.content} role={msg.role} />
              {msg.role === 'assistant' && (
                <button
                  onClick={() => speakText(msg.content)}
                  className="ml-10 -mt-2 mb-2 text-[11px] text-text-tertiary hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <Volume2 size={12} />
                  <span>Sara response</span>
                </button>
              )}
            </div>
          ))}

          {companionLoading && (
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center">
                <span className="text-[13px] font-bold text-primary-dark">S</span>
              </div>
              <div className="bg-white rounded-2xl px-5 py-3 shadow-card">
                <Loader2 size={18} className="text-primary animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Auto-play checkbox & Voice Button (Image 2 match) */}
        <div className="pt-3 border-t border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white rounded-2xl shadow-card border border-border-subtle px-4 py-3 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Talk to Sara..."
                className="flex-1 bg-transparent text-[14.5px] text-text-primary placeholder-text-tertiary outline-none"
              />
              <button
                onClick={toggleVoiceInput}
                className={`p-2 rounded-xl transition-colors ${
                  isListening ? 'bg-danger text-white animate-pulse' : 'text-text-tertiary hover:bg-surface-soft hover:text-primary'
                }`}
                title="Voice Input"
              >
                <Mic size={18} />
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim() || companionLoading}
              className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50 cursor-pointer shrink-0 shadow-card"
            >
              <Send size={18} />
            </motion.button>
          </div>

          {/* Footer Controls & Note */}
          <div className="flex items-center justify-between mt-3 text-[12px] text-text-tertiary px-1">
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
      </div>

      {/* ── RIGHT SIDEBAR: Sara Orb & Starting Points (4 cols) (Image 2 match) ── */}
      <div className="lg:col-span-4 space-y-6">
        {/* Sara 3D Visual Card */}
        <div className="card text-center p-6 space-y-4 relative overflow-hidden bg-gradient-to-b from-white to-surface-soft">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-primary via-accent-lilac to-primary-light flex items-center justify-center shadow-card-hover animate-pulse">
            <span className="text-4xl">🔮</span>
          </div>

          <div>
            <h3 className="text-h2">Ready when you are</h3>
            <p className="text-[12.5px] text-text-tertiary mt-1">
              Talk, type, or switch modes. Sara keeps the same thread.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleVoiceInput}
            className="w-full py-3 px-4 rounded-2xl bg-primary text-white font-medium text-[14px] flex items-center justify-center gap-2 shadow-card hover:bg-primary-dark transition-colors cursor-pointer"
          >
            <Mic size={18} />
            <span>{isListening ? 'Listening...' : 'Start voice with Sara'}</span>
          </motion.button>
        </div>

        {/* Try a Starting Point Card */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-h2">Try a starting point</h3>
              <p className="text-[12px] text-text-tertiary">One small prompt is enough</p>
            </div>
            <ArrowRight size={16} className="text-text-tertiary" />
          </div>

          <div className="space-y-2.5">
            {STARTING_POINTS.map((sp, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInput(sp.prompt);
                  sendCompanionMessage(sp.prompt);
                }}
                className="w-full text-left p-3 rounded-2xl bg-surface-soft hover:bg-primary-light/20 transition-all flex items-start gap-3 group cursor-pointer border border-border-subtle"
              >
                <span className="text-xl p-1 bg-white rounded-xl shadow-card">{sp.icon}</span>
                <div>
                  <p className="text-[13.5px] font-semibold text-text-primary group-hover:text-primary transition-colors">
                    {sp.title}
                  </p>
                  <p className="text-[11.5px] text-text-tertiary">{sp.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
