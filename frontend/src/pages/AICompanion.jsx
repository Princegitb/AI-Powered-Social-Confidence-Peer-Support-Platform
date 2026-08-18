import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Mic, Volume2, VolumeX, Sparkles, Loader2, ArrowRight, PhoneOff, Radio } from 'lucide-react';
import ChatBubble from '../components/ui/ChatBubble';
import DisclaimerStrip from '../components/ui/DisclaimerStrip';
import SaraAvatar from '../components/ui/SaraAvatar';
import PrePostSurveyModal from '../components/ui/PrePostSurveyModal';
import useChatStore from '../store/chatStore';
import { synthesizeSpeech } from '../utils/speechUtils';

/**
 * AI Companion ("Sara") — Indian Hinglish Persona & Voice
 * Features:
 * - Auto-play TTS is OFF by default (user chooses when to hear voice)
 * - Abstracted TTS via synthesizeSpeech (ElevenLabs Multilingual v2 with hi-IN Indian fallback)
 * - Emoji-stripping step (stripEmojiForSpeech) applied ONLY to speech synthesis
 * - Voice-mode requests pass is_voice_mode flag to eliminate LLM emojis entirely
 * - Continuous 2-Way Voice Call Mode: Hands-free listening -> Auto send -> Auto TTS -> Resume listening!
 */

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

  // Only auto-play TTS if user explicitly checked autoPlay!
  useEffect(() => {
    if (autoPlay && !isVoiceCallActive && companionMessages.length > 0) {
      const last = companionMessages[companionMessages.length - 1];
      if (last.role === 'assistant') {
        synthesizeSpeech(last.content);
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
          sendCompanionMessage(currentText, { isVoiceMode: true }).then(() => {
            const msgs = useChatStore.getState().companionMessages;
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
              setVoiceCallStatus('Sara is speaking...');
              synthesizeSpeech(lastMsg.content, () => {
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
    <div className="max-w-4xl mx-auto w-full flex flex-col min-h-[calc(100vh-100px)] relative pb-10">
      
      {/* Continuous 2-Way Voice Call Overlay */}
      <AnimatePresence>
        {isVoiceCallActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-40 bg-gradient-to-b from-primary-dark/95 via-primary/95 to-bg-gradient-start/95 backdrop-blur-xl flex flex-col items-center justify-between p-8 text-white rounded-3xl"
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
      <div className="flex items-center justify-between pb-4 border-b border-[#E9E5F3] mb-4">
        <div className="flex items-center gap-3">
          <SaraAvatar size="sm" emotion={companionLoading ? 'thinking' : 'happy'} />
          <div>
            <h2 className="font-bold text-[18px] text-text-primary leading-tight font-serif">Sara</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-success inline-block animate-pulse" />
              <span className="text-[12px] text-text-tertiary font-normal">Your AI conversation companion</span>
            </div>
          </div>
        </div>

        <div className="flex items-center bg-surface-soft p-1 rounded-full border border-border-subtle">
          <button
            onClick={() => {
              if (isVoiceCallActive) stopVoiceCall();
              setMode('chat');
            }}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all flex items-center gap-1.5 ${
              mode === 'chat' ? 'bg-white text-text-primary shadow-sm font-semibold' : 'text-text-tertiary hover:text-text-primary'
            }`}
          >
            <span>💬</span> Chat
          </button>
          <button
            onClick={startVoiceCall}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all flex items-center gap-1.5 ${
              mode === 'voice' ? 'bg-white text-text-primary shadow-sm font-semibold' : 'text-text-tertiary hover:text-text-primary'
            }`}
          >
            <Mic size={13} /> Voice
          </button>
        </div>
      </div>

      {/* Centered Safety Info disclaimer */}
      <DisclaimerStrip variant="chat" />

      {/* Messages area (Constrained height scrollable card) */}
      <div className="flex-1 overflow-y-auto py-4 px-1 space-y-5 h-[480px]">
        {companionMessages.length === 0 && (
          <div className="space-y-6">
            <ChatBubble 
              message="Hey, I'm Sara. I'm here with you. How are you feeling today?" 
              role="assistant" 
              onSpeak={() => synthesizeSpeech("Hey, I'm Sara. I'm here with you. How are you feeling today?")}
            />
            
            {/* Inline Starting Points when chat is empty */}
            <div className="pt-4 max-w-2xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary mb-3 block">
                Choose a starting point
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {STARTING_POINTS.slice(0, 3).map((sp, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(sp.prompt);
                      sendCompanionMessage(sp.prompt);
                    }}
                    className="text-left p-4.5 rounded-2xl bg-white hover:bg-primary-light/10 transition-all flex flex-col gap-2 group cursor-pointer border border-border-subtle/50 shadow-sm"
                  >
                    <span className="text-xl p-1.5 bg-[#F7F5FC] rounded-xl self-start">{sp.icon}</span>
                    <div>
                      <p className="text-[13.5px] font-bold text-[#1D163B] group-hover:text-primary transition-colors">
                        {sp.title}
                      </p>
                      <p className="text-[11px] text-[#8E89A3] mt-0.5">{sp.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {companionMessages.map((msg, i) => (
          <ChatBubble 
            key={i} 
            message={msg.content} 
            role={msg.role} 
            onSpeak={() => synthesizeSpeech(msg.content)} 
          />
        ))}

        {companionLoading && (
          <div className="flex items-center gap-2.5 mb-3">
            <SaraAvatar size="sm" emotion="thinking" />
            <div className="bg-white rounded-2xl px-5 py-3 shadow-sm border border-border-subtle">
              <Loader2 size={18} className="text-primary animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Input Bar */}
      <div className="pt-4 border-t border-[#E9E5F3] shrink-0">
        <div className="bg-white rounded-full p-2 pl-5 shadow-card border border-border-subtle hover:border-primary/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Talk to Sara..."
            className="flex-1 bg-transparent text-[14.5px] text-text-primary placeholder-text-tertiary outline-none border-none py-1"
          />
          <button
            onClick={startVoiceCall}
            className="p-2 rounded-full text-text-tertiary hover:bg-surface-soft hover:text-primary transition-colors cursor-pointer shrink-0"
            title="Start Voice Call"
          >
            <Mic size={19} />
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim() || companionLoading}
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
    </div>
  );
}
