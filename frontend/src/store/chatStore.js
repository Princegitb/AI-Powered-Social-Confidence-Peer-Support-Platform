import { create } from 'zustand';

/**
 * Chat store for AI Companion and Roleplay sessions.
 * Manages conversation history, loading state, and suggestions.
 */

const API_BASE = '/api';

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

  sendCompanionMessage: async (content) => {
    const { companionMessages } = get();

    // Add user message immediately
    const userMsg = { role: 'user', content };
    const updatedMessages = [...companionMessages, userMsg];
    set({
      companionMessages: updatedMessages,
      companionLoading: true,
      companionSuggestions: [],
    });

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();

      // Handle crisis response
      if (data.safety?.crisis) {
        set({
          crisisResponse: data.safety.crisis_response || null,
        });
      }

      // Add AI response
      const aiMsg = { role: 'assistant', content: data.reply };
      set({
        companionMessages: [...updatedMessages, aiMsg],
        companionLoading: false,
        companionSuggestions: data.suggestions || [],
        lastSafetyResult: data.safety,
      });
    } catch (error) {
      console.error('Chat error:', error);
      // Fallback response on network error
      const fallbackMsg = {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Let's try again in a moment! 💛",
      };
      set({
        companionMessages: [...updatedMessages, fallbackMsg],
        companionLoading: false,
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

  // ── Roleplay actions ──────────────────────────────────────────

  startRoleplay: async (scenario) => {
    set({
      roleplayScenario: scenario,
      roleplayMessages: [],
      roleplayLoading: true,
      roleplayTurnCount: 0,
      roleplayShouldEnd: false,
      roleplayFeedback: null,
    });

    try {
      const res = await fetch(`${API_BASE}/roleplay/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });

      const data = await res.json();
      const aiMsg = { role: 'assistant', content: data.reply };

      set({
        roleplayMessages: [aiMsg],
        roleplayLoading: false,
        roleplayTurnCount: data.turn_count,
      });
    } catch (error) {
      console.error('Roleplay start error:', error);
      set({ roleplayLoading: false });
    }
  },

  sendRoleplayMessage: async (content) => {
    const { roleplayMessages, roleplayScenario } = get();

    const userMsg = { role: 'user', content };
    const updatedMessages = [...roleplayMessages, userMsg];
    set({
      roleplayMessages: updatedMessages,
      roleplayLoading: true,
    });

    try {
      const res = await fetch(`${API_BASE}/roleplay/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: roleplayScenario,
          messages: updatedMessages,
        }),
      });

      const data = await res.json();
      const aiMsg = { role: 'assistant', content: data.reply };

      set({
        roleplayMessages: [...updatedMessages, aiMsg],
        roleplayLoading: false,
        roleplayTurnCount: data.turn_count,
        roleplayShouldEnd: data.should_end,
        lastSafetyResult: data.safety,
      });

      // If the roleplay should end, auto-fetch feedback
      if (data.should_end) {
        get().fetchRoleplayFeedback();
      }
    } catch (error) {
      console.error('Roleplay message error:', error);
      set({ roleplayLoading: false });
    }
  },

  fetchRoleplayFeedback: async () => {
    const { roleplayMessages, roleplayScenario } = get();

    try {
      const res = await fetch(`${API_BASE}/roleplay/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: roleplayScenario,
          messages: roleplayMessages,
        }),
      });

      const data = await res.json();
      set({ roleplayFeedback: data.feedback });
    } catch (error) {
      console.error('Feedback error:', error);
      set({
        roleplayFeedback:
          '**Nice work!** 🎉 Keep practicing to build more confidence!',
      });
    }
  },

  endRoleplay: () => {
    const { roleplayMessages, roleplayScenario } = get();
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

  dismissCrisis: () => {
    set({ crisisResponse: null });
  },
}));

export default useChatStore;
