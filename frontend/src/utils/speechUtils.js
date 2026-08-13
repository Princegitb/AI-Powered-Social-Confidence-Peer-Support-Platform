/**
 * Speech Utilities for SAATHI
 * Provides emoji stripping, text normalization, and abstract TTS synthesis
 * with robust Indian voice selection (hi-IN / en-IN) and Sarvam AI / ElevenLabs support.
 */

const ELEVENLABS_API_KEY = import.meta.env?.VITE_ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_ID = import.meta.env?.VITE_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

// Cached browser voices
let cachedVoices = [];

function loadVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

/**
 * Returns the best available Indian voice (hi-IN / en-IN) from the browser.
 */
export function getIndianVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();

  // Search priority: hi-IN -> en-IN -> named Indian voices
  const hiVoice = voices.find((v) => v.lang === 'hi-IN' || v.lang === 'hi_IN');
  if (hiVoice) return hiVoice;

  const enInVoice = voices.find((v) => v.lang === 'en-IN' || v.lang === 'en_IN');
  if (enInVoice) return enInVoice;

  const namedVoice = voices.find((v) => {
    const name = v.name.toLowerCase();
    return (
      name.includes('hindi') ||
      name.includes('india') ||
      name.includes('swara') ||
      name.includes('kalpana') ||
      name.includes('hemant') ||
      name.includes('heera') ||
      name.includes('neerja')
    );
  });

  return namedVoice || null;
}

/**
 * Strips unicode emojis, pictographs, symbols, and markdown formatting
 * BEFORE sending text to speech synthesis.
 * The original text with emoji remains intact in the on-screen chat bubble UI.
 */
export function stripEmojiForSpeech(text) {
  if (!text) return '';

  return text
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ''
    )
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[*#_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Abstracted TTS synthesis function.
 * 1. Passes input through stripEmojiForSpeech(text)
 * 2. If ELEVENLABS_API_KEY is configured, uses ElevenLabs Multilingual v2.
 * 3. Otherwise, uses browser Web Speech API explicitly set to hi-IN / en-IN Indian voice accent.
 */
export async function synthesizeSpeech(text, onEndCallback) {
  const cleanSpeechText = stripEmojiForSpeech(text);
  if (!cleanSpeechText) {
    if (onEndCallback) onEndCallback();
    return;
  }

  // 1. ElevenLabs Multilingual v2 Cloud Synthesis (If API key provided)
  if (ELEVENLABS_API_KEY) {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: cleanSpeechText,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.75,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        if (onEndCallback) {
          audio.onended = onEndCallback;
          audio.onerror = onEndCallback;
        }
        await audio.play();
        return;
      }
    } catch (err) {
      console.warn('Cloud TTS failed, falling back to browser Web Speech API:', err);
    }
  }

  // 2. Browser Web Speech API with explicit Indian voice & hi-IN locale setting
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = 0.95; // Slightly slower, calm cadence for clear speech
    utterance.pitch = 1.0;
    utterance.lang = 'hi-IN'; // Explicitly enforce Indian locale

    const indianVoice = getIndianVoice();
    if (indianVoice) {
      utterance.voice = indianVoice;
      utterance.lang = indianVoice.lang;
    }

    if (onEndCallback) {
      utterance.onend = onEndCallback;
      utterance.onerror = onEndCallback;
    }

    window.speechSynthesis.speak(utterance);
  } else if (onEndCallback) {
    onEndCallback();
  }
}
