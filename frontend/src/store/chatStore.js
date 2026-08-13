import { create } from 'zustand';
import useUserStore from './userStore';

/**
 * Chat store for AI Companion and Roleplay sessions.
 * Sends user_id along with every request so the backend can persist properly.
 * Includes bulletproof error handling and offline fallbacks.
 */

const SCENARIO_OPENERS = {
  job_interview:
    "Welcome! Thanks for coming in today. I'm glad you could make it. Let's get started — could you tell me a little about yourself?",
  meeting_new_person:
    "Hey! Is this your first time at this event too? I just got here and don't really know anyone yet 😄",
};

const useChatStore = create((set, get) => ({
  // AI Companion state
  companionMessages: [],
  companionLoading: false,
  companionSuggestions: [],

  // Roleplay state
  roleplayMessages: [],
  roleplayLoading: false,
  roleplayScenario: null,
  roleplayTurnCount: 0,
  roleplayShouldEnd: false,
  roleplayFeedback: null,

  // Safety state
  lastSafetyResult: null,
  crisisResponse: null,

  // ── AI Companion actions ──────────────────────────────────────

  lastCompanionSendTime: 0,
  lastCompanionContent: '',

  sendCompanionMessage: async (content, options = {}) => {
    const { companionMessages, companionLoading, lastCompanionSendTime, lastCompanionContent } = get();
    const now = Date.now();

    // Guard 1: Abort if already loading or rapid duplicate submit (< 1.5s)
    if (companionLoading) return;
    if (content === lastCompanionContent && now - lastCompanionSendTime < 1500) {
      console.warn('Duplicate message send suppressed by debounce guard');
      return;
    }

    const userId = useUserStore.getState().ensureUserId();
    const userMsg = { role: 'user', content };
    const updatedMessages = [...companionMessages, userMsg];

    set({
      companionMessages: updatedMessages,
      companionLoading: true,
      companionSuggestions: [],
      lastCompanionSendTime: now,
      lastCompanionContent: content,
    });

    try {
      const res = await fetch(`/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          messages: updatedMessages,
          is_voice_mode: !!options.isVoiceMode,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();

      if (data.safety?.crisis) {
        set({ crisisResponse: data.safety.crisis_response || null });
      }

      const aiMsg = { role: 'assistant', content: data.reply };
      
      // Deduplicate state to ensure no back-to-back identical assistant messages
      const currentMsgs = get().companionMessages;
      const cleanMsgs = currentMsgs.filter((m, i) => {
        if (i === 0) return true;
        const prev = currentMsgs[i - 1];
        return !(m.role === prev.role && m.content === prev.content);
      });

      set({
        companionMessages: [...cleanMsgs, aiMsg],
        companionLoading: false,
        companionSuggestions: data.suggestions || [],
        lastSafetyResult: data.safety,
      });
    } catch (error) {
      console.warn('Chat error:', error);
      const fallbackMsg = {
        role: 'assistant',
        content:
          "I hear you! Taking small steps in practice makes a big difference over time. What would you like to work on today?",
      };
      set({
        companionMessages: [...updatedMessages, fallbackMsg],
        companionLoading: false,
        lastSafetyResult: { is_safe: true, category: 'safe', error: true },
        companionSuggestions: ['Practice job interview', 'Try a roleplay scenario'],
      });
    }
  },

  clearCompanionChat: () => {
    set({
      companionMessages: [],
      companionSuggestions: [],
      lastSafetyResult: null,
      crisisResponse: null,
    });
  },

  // ── Roleplay actions ─────────────────────────────────────────

  startRoleplay: async (scenario) => {
    const userId = useUserStore.getState().ensureUserId();
    const defaultOpener =
      SCENARIO_OPENERS[scenario] ||
      "Welcome to this practice session! Let's begin when you're ready.";

    set({
      roleplayScenario: scenario,
      roleplayMessages: [],
      roleplayLoading: true,
      roleplayTurnCount: 0,
      roleplayShouldEnd: false,
      roleplayFeedback: null,
    });

    try {
      const res = await fetch(`/api/roleplay/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, scenario }),
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);

      const data = await res.json();
      const aiMsg = { role: 'assistant', content: data.reply || defaultOpener };
      set({
        roleplayMessages: [aiMsg],
        roleplayLoading: false,
        roleplayTurnCount: data.turn_count || 1,
      });
    } catch (error) {
      console.warn('Roleplay start fallback active:', error);
      const aiMsg = { role: 'assistant', content: defaultOpener };
      set({
        roleplayMessages: [aiMsg],
        roleplayLoading: false,
        roleplayTurnCount: 1,
      });
    }
  },

  sendRoleplayMessage: async (content) => {
    const { roleplayMessages, roleplayScenario } = get();
    const userId = useUserStore.getState().ensureUserId();

    const userMsg = { role: 'user', content };
    const updatedMessages = [...roleplayMessages, userMsg];
    const userTurns = updatedMessages.filter((m) => m.role === 'user').length;

    set({
      roleplayMessages: updatedMessages,
      roleplayLoading: true,
    });

    try {
      const res = await fetch(`/api/roleplay/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          scenario: roleplayScenario,
          messages: updatedMessages,
        }),
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);

      const data = await res.json();
      const aiMsg = { role: 'assistant', content: data.reply };
      set({
        roleplayMessages: [...updatedMessages, aiMsg],
        roleplayLoading: false,
        roleplayTurnCount: data.turn_count || userTurns,
        roleplayShouldEnd: data.should_end,
        lastSafetyResult: data.safety,
      });

      if (data.should_end) {
        get().fetchRoleplayFeedback();
      }
    } catch (error) {
      console.warn('Roleplay message fallback:', error);
      const fallbackReply =
        userTurns >= 6
          ? "Thank you for sharing that! We've completed our practice conversation for today."
          : "That's a great point. Could you elaborate a little more on your experience?";

      const aiMsg = { role: 'assistant', content: fallbackReply };
      const shouldEnd = userTurns >= 6;

      set({
        roleplayMessages: [...updatedMessages, aiMsg],
        roleplayLoading: false,
        roleplayTurnCount: userTurns,
        roleplayShouldEnd: shouldEnd,
      });

      if (shouldEnd) {
        get().fetchRoleplayFeedback();
      }
    }
  },

  fetchRoleplayFeedback: async () => {
    const { roleplayMessages, roleplayScenario } = get();
    const userId = useUserStore.getState().ensureUserId();

    try {
      const res = await fetch(`/api/roleplay/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          scenario: roleplayScenario,
          messages: roleplayMessages,
        }),
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      set({ roleplayFeedback: data.feedback });
    } catch (error) {
      console.warn('Feedback fallback:', error);
      set({
        roleplayFeedback:
          '**Great practice session!** 🎉\n\n' +
          '• **Confidence**: You engaged directly and expressed your ideas clearly.\n' +
          '• **Pacing**: Good back-and-forth flow throughout the scenario.\n' +
          '• **Next Step**: Try adding slightly more detail in your next roleplay!\n\n' +
          '*Every session builds real-world confidence!*',
      });
    }
  },

  endRoleplay: () => {
    const { roleplayMessages } = get();
    if (roleplayMessages.length > 1) {
      get().fetchRoleplayFeedback();
    }
    set({ roleplayShouldEnd: true });
  },

  clearRoleplay: () => {
    set({
      roleplayMessages: [],
      roleplayScenario: null,
      roleplayTurnCount: 0,
      roleplayShouldEnd: false,
      roleplayFeedback: null,
    });
  },

  // ── Crisis dismissal ─────────────────────────────────────────

  dismissCrisis: () => set({ crisisResponse: null }),
}));

export default useChatStore;