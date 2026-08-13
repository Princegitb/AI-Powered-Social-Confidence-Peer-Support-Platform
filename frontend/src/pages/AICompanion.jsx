import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Volume2, VolumeX, Sparkles, Loader2, ArrowRight, PhoneOff, Radio } from 'lucide-react';
import ChatBubble from '../components/ui/ChatBubble';
import DisclaimerStrip from '../components/ui/DisclaimerStrip';
import useChatStore from '../store/chatStore';

/**
 * AI Companion ("Sara") — Indian Hinglish Persona & Voice
 * Features:
 * - Auto-play TTS is OFF by default (user chooses when to hear voice)
 * - Indian voice synthesis selection (hi-IN / en-IN) for natural Indian tone
 * - Continuous 2-Way Voice Call Mode: Hands-free listening -> Auto send -> Auto TTS -> Resume listening!
 * - Right Sidebar: 3D Orb visual card + "Start voice with Sara" button
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
  const [autoPlay, setAutoPlay] = useState(false); // DEFAULT OFF per user request!
  const [isListening, setIsListening] = useState(false);
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [voiceCallStatus, setVoiceCallStatus] = useState('Listening...');
  const [liveTranscript, setLiveTranscript] = useState('');

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const {
    companionMessages,
    companionLoading,
    sendCompanionMessage,
  } = useChatStore();

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [companionMessages, companionLoading]);

  // Speech Synthesis helper with Indian Voice Preference (hi-IN / en-IN)
  const speakText = (text, onEndCallback) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*#_]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = 1.1; // Friendly warm pitch

      // Select Indian Voice if available in browser
      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(
        (v) =>
          v.lang === 'hi-IN' ||
          v.lang === 'en-IN' ||
          v.name.includes('India') ||
          v.name.includes('Hindi')
      );
      if (indianVoice) {
        utterance.voice = indianVoice;
      }

      if (onEndCallback) {
        utterance.onend = onEndCallback;
        utterance.onerror = onEndCallback;
      }

      window.speechSynthesis.speak(utterance);
    } else if (onEndCallback) {
      onEndCallback();
    }
  };

  // Only auto-play TTS if user explicitly checked autoPlay!
  useEffect(() => {
    if (autoPlay && !isVoiceCallActive && companionMessages.length > 0) {
      const last = companionMessages[companionMessages.length - 1];
      if (last.role === 'assistant') {
        speakText(last.content);
      }
    }
  }, [companionMessages, autoPlay, isVoiceCallActive]);

  // ── CONTINUOUS 2-WAY VOICE CALL HANDLER ──
  const startVoiceCall = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice calls require speech recognition. Please try in Chrome or Edge!');
      return;
    }

    setIsVoiceCallActive(true);
    setMode('voice');
    setVoiceCallStatus('Sara is listening...');
    setLiveTranscript('');

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN'; // Default to Indian English / Hindi recognition

    let silenceTimer = null;
    let finalSpeech = '';

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceCallStatus('Sara is listening...');
    };

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalSpeech += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const currentText = (finalSpeech + interim).trim();
      setLiveTranscript(currentText);

      if (silenceTimer) clearTimeout(silenceTimer);

      if (currentText.length > 2) {
        silenceTimer = setTimeout(() => {
          try {
            recognition.stop();
          } catch (e) {}

          setVoiceCallStatus('Sara is thinking...');
          sendCompanionMessage(currentText).then(() => {
            const msgs = useChatStore.getState().companionMessages;
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              setVoiceCallStatus('Sara is speaking...');
              speakText(lastMsg.content, () => {
                setLiveTranscript('');
                finalSpeech = '';
                setVoiceCallStatus('Sara is listening...');
                try {
                  recognition.start();
                } catch (e) {}
              });
            }
          });
        }, 1800);
      }
    };

    recognition.onerror = () => {
      setVoiceCallStatus('Sara is listening...');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {}
  };

  const stopVoiceCall = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsVoiceCallActive(false);
    setIsListening(false);
    setMode('chat');
    setLiveTranscript('');
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
      <div className="lg:col-span-8 flex flex-col h-full bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-card border border-border-subtle relative overflow-hidden">
        
        {/* Continuous 2-Way Voice Call Overlay */}
        <AnimatePresence>
          {isVoiceCallActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-40 bg-gradient-to-b from-primary-dark/95 via-primary/95 to-bg-gradient-start/95 backdrop-blur-xl flex flex-col items-center justify-between p-8 text-white"
            >
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-[13px] font-medium">
                <Radio size={14} className="text-success animate-pulse" />
                <span>Live Voice Call with Sara (Indian Hinglish Voice)</span>
              </div>

              <div className="text-center space-y-6 my-auto">
                <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-75" />
                  <div className="w-28 h-28 rounded-full bg-white text-primary flex items-center justify-center shadow-card-lg text-4xl">
                    🔮
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-[26px] font-bold font-serif">{voiceCallStatus}</h2>
                  <p className="text-[14px] text-white/80 max-w-md mx-auto min-h-[40px]">
                    {liveTranscript ? `"${liveTranscript}"` : 'Bina kisi darr ke baat karo bro — Sara is listening...'}
                  </p>
                </div>
              </div>

              <button
                onClick={stopVoiceCall}
                className="py-3.5 px-8 rounded-full bg-danger text-white font-semibold text-[14.5px] flex items-center gap-2 shadow-card hover:bg-danger/90 transition-all cursor-pointer"
              >
                <PhoneOff size={18} />
                <span>End Voice Call</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sara Header Bar */}
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
                <span className="text-[12px] text-text-tertiary font-normal">• Your AI conversation companion (Hinglish/Hindi)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center bg-surface-soft p-1 rounded-full border border-border-subtle">
            <button
              onClick={() => {
                if (isVoiceCallActive) stopVoiceCall();
                setMode('chat');
              }}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                mode === 'chat' ? 'bg-white text-text-primary shadow-card' : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              💭 Chat
            </button>
            <button
              onClick={startVoiceCall}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                mode === 'voice' ? 'bg-white text-text-primary shadow-card' : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              🎤 Voice Call
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
                Sara is right here with you bro. Type a message in English or Hinglish!
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
                  <span>Listen to Sara (Suno)</span>
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

        {/* Input Bar */}
        <div className="pt-3 border-t border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white rounded-2xl shadow-card border border-border-subtle px-4 py-3 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Talk to Sara (Hinglish ya English me bolo)..."
                className="flex-1 bg-transparent text-[14.5px] text-text-primary placeholder-text-tertiary outline-none"
              />
              <button
                onClick={startVoiceCall}
                className="p-2 rounded-xl text-text-tertiary hover:bg-surface-soft hover:text-primary transition-colors"
                title="Start Voice Call"
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

          <div className="flex items-center justify-between mt-3 text-[12px] text-text-tertiary px-1">
            <span>Text and voice stay in one conversation</span>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-text-primary">
              <input
                type="checkbox"
                checked={autoPlay}
                onChange={(e) => setAutoPlay(e.target.checked)}
                className="accent-primary rounded"
              />
              <span>Auto-play Sara Voice</span>
            </label>
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDEBAR: Sara Orb & Starting Points ── */}
      <div className="lg:col-span-4 space-y-6">
        <div className="card text-center p-6 space-y-4 relative overflow-hidden bg-gradient-to-b from-white to-surface-soft">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-primary via-accent-lilac to-primary-light flex items-center justify-center shadow-card-hover animate-pulse">
            <span className="text-4xl">🔮</span>
          </div>

          <div>
            <h3 className="text-h2">Ready when you are</h3>
            <p className="text-[12.5px] text-text-tertiary mt-1">
              Talk in Hinglish or English. Sara is your Indian practice partner.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startVoiceCall}
            className="w-full py-3 px-4 rounded-2xl bg-primary text-white font-medium text-[14px] flex items-center justify-center gap-2 shadow-card hover:bg-primary-dark transition-colors cursor-pointer"
          >
            <Mic size={18} />
            <span>Start voice call with Sara</span>
          </motion.button>
        </div>

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
