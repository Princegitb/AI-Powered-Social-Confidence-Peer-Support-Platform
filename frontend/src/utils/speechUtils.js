/**
 * Speech Utilities for SAATHI
 * Provides emoji stripping, text normalization, and abstract TTS synthesis.
 */

// API Key placeholder — user can add their real key in .env as VITE_ELEVENLABS_API_KEY or VITE_SARVAM_API_KEY
const ELEVENLABS_API_KEY = import.meta.env?.VITE_ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_ID = import.meta.env?.VITE_ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Default natural voice ID

/**
 * Strips all unicode emoji/pictographs, symbols, and markdown formatting
 * from a string ONLY before sending it to Text-to-Speech synthesis.
 * The original text with emoji remains intact in the on-screen chat bubble UI.
 */
export function stripEmojiForSpeech(text) {
  if (!text) return '';

  return text
    // Remove standard Unicode Emoji & Symbols
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ''
    )
    // Remove extended pictographs via unicode property escape if supported
    .replace(/\p{Extended_Pictographic}/gu, '')
    // Remove markdown formatting symbols (*, #, _, ~)
    .replace(/[*#_~`]/g, '')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Abstracted TTS synthesis function.
 * 1. Passes input through stripEmojiForSpeech(text)
 * 2. If ELEVENLABS_API_KEY is configured, uses ElevenLabs Multilingual v2 for natural Hinglish audio stream.
 * 3. Otherwise, falls back to browser Web Speech API tuned with hi-IN / en-IN Indian voice preference.
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
            model_id: 'eleven_multilingual_v2', // Ideal for Hinglish code-switching
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
      console.warn('ElevenLabs TTS failed, falling back to Web Speech API:', err);
    }
  }

  // 2. Browser Web Speech API Fallback (Tuned for hi-IN / en-IN Indian Voices)
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.1;

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
}
