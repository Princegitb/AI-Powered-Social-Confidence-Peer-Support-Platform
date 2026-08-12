import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

/**
 * User store — display alias + preferences + onboarding flag.
 * Rehydrates from localStorage so the app remembers the user across reloads.
 *
 * For the hackathon MVP we don't do real auth — we just generate a stable
 * user_id on first launch and persist it. Real auth is a future-scope item.
 */

const useUserStore = create(
  persist(
    (set, get) => ({
      userId: null,
      displayName: '',
      preferences: {
        preferred_format: 'text',
        session_length: 'short',
        goal_tags: [],
      },
      onboarded: false,

      ensureUserId: () => {
        let { userId } = get();
        if (!userId) {
          userId = nanoid();
          set({ userId });
        }
        return userId;
      },

      setDisplayName: async (name) => {
        const userId = get().ensureUserId();
        const trimmed = (name || '').trim().slice(0, 32) || 'Friend';
        set({ displayName: trimmed });
        try {
          await fetch('/api/user/identify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, display_name: trimmed }),
          });
        } catch (e) {
          // Non-fatal — store keeps the local value.
          console.warn('Failed to sync display name:', e);
        }
      },

      setPreferences: async (prefs) => {
        const userId = get().ensureUserId();
        const merged = { ...get().preferences, ...prefs };
        set({ preferences: merged });
        try {
          await fetch('/api/user/preferences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, preferences: merged }),
          });
        } catch (e) {
          console.warn('Failed to sync preferences:', e);
        }
      },

      finishOnboarding: () => set({ onboarded: true }),

      reset: () => {
        set({
          userId: null,
          displayName: '',
          preferences: {
            preferred_format: 'text',
            session_length: 'short',
            goal_tags: [],
          },
          onboarded: false,
        });
      },
    }),
    {
      name: 'saathi-user',
      partialize: (s) => ({
        userId: s.userId,
        displayName: s.displayName,
        preferences: s.preferences,
        onboarded: s.onboarded,
      }),
    },
  ),
);

export default useUserStore;