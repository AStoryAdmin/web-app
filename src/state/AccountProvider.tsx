/**
 * The signed-in person's stories, loaded once per sign-in and kept current.
 *
 * Writes go to the server first and the local copy second, so what the
 * screen shows as saved is saved. A write that fails stays visible as
 * `saveFailure`, with a retry, until it lands or the person gives up: a
 * memory that did not reach the server must never look saved (the app's
 * rule, and this product holds recordings that exist nowhere else).
 *
 * Reloads on return to the tab, as the app does on return to the
 * foreground, so a relative's additions appear without a refresh.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./authContext";
import { AccountContext, type SaveFailure } from "./accountContext";
import { loadAccount, type Account, type Memory, type Story } from "../data/stories";
import { deleteMemory, saveMemory as saveMemoryRemote, saveStory, setActiveStory } from "../data/memories";

const RELOAD_AFTER_HIDDEN_MS = 60 * 1000;

export default function AccountProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveFailure, setSaveFailure] = useState<SaveFailure | null>(null);
  const hiddenAt = useRef<number | null>(null);

  const reload = useCallback(async () => {
    if (!userId) return;
    try {
      const loaded = await loadAccount(userId);
      setAccount(loaded);
      setLoadError(null);
    } catch (err) {
      const message = (err as Error)?.message || "Couldn't reach your stories.";
      console.warn("account: load:", message);
      setLoadError(message);
      setAccount((prev) => prev ?? null);
    }
  }, [userId]);

  // Load on sign-in; forget on sign-out.
  useEffect(() => {
    if (!userId) {
      queueMicrotask(() => {
        setAccount(undefined);
        setLoadError(null);
        setSaveFailure(null);
      });
      return;
    }
    queueMicrotask(() => {
      void reload();
    });
  }, [userId, reload]);

  // Back to the tab after a while away: a relative may have added something.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt.current = Date.now();
      } else if (hiddenAt.current && Date.now() - hiddenAt.current > RELOAD_AFTER_HIDDEN_MS) {
        hiddenAt.current = null;
        reload();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [reload]);

  const patchStory = useCallback((storyId: string, fn: (s: Story) => Story) => {
    setAccount((prev) =>
      prev ? { ...prev, stories: prev.stories.map((s) => (s.id === storyId ? fn(s) : s)) } : prev,
    );
  }, []);

  const attempt = useCallback(async function attemptRun(message: string, run: () => Promise<void>): Promise<void> {
    try {
      await run();
      setSaveFailure(null);
    } catch (err) {
      const why = (err as Error)?.message || "";
      console.warn("account: save:", why);
      const retry = () => attemptRun(message, run);
      setSaveFailure({ message: why ? `${message} (${why})` : message, retry });
      throw err;
    }
  }, []);

  const saveMemory = useCallback(
    async (memory: Memory, storyId: string) => {
      await attempt("This memory hasn't been saved yet.", () => saveMemoryRemote(memory, storyId));
      patchStory(storyId, (s) => {
        const exists = s.memories.some((m) => m.id === memory.id);
        return {
          ...s,
          memories: exists ? s.memories.map((m) => (m.id === memory.id ? memory : m)) : [...s.memories, memory],
          lastMemoryDate: new Date().toISOString().slice(0, 10),
        };
      });
    },
    [attempt, patchStory],
  );

  const removeMemory = useCallback(
    async (memoryId: string, storyId: string) => {
      await attempt("That memory wasn't removed.", () => deleteMemory(memoryId));
      patchStory(storyId, (s) => ({ ...s, memories: s.memories.filter((m) => m.id !== memoryId) }));
    },
    [attempt, patchStory],
  );

  const chooseStory = useCallback(
    async (storyId: string) => {
      if (!userId) return;
      await attempt("Couldn't remember which story you chose.", () => setActiveStory(userId, storyId, true));
      setAccount((prev) => (prev ? { ...prev, activeStoryId: storyId, onboardingComplete: true } : prev));
    },
    [attempt, userId],
  );

  const addStory = useCallback(
    async (story: Story) => {
      if (!userId) throw new Error("Not signed in");
      const owned = { ...story, ownerId: story.ownerId || userId };
      await attempt("That story wasn't saved.", async () => {
        await saveStory(owned, userId, { isNew: true });
        await setActiveStory(userId, owned.id, true);
      });
      setAccount((prev) =>
        prev
          ? { ...prev, stories: [...prev.stories, owned], activeStoryId: owned.id, onboardingComplete: true }
          : { onboardingComplete: true, activeStoryId: owned.id, stories: [owned] },
      );
      return owned;
    },
    [attempt, userId],
  );

  const stories = useMemo(() => account?.stories ?? [], [account]);
  const activeStory = useMemo(() => {
    if (!account) return null;
    return stories.find((s) => s.id === account.activeStoryId) ?? stories[0] ?? null;
  }, [account, stories]);

  const value = useMemo(
    () => ({
      account,
      loadError,
      stories,
      activeStory,
      reload,
      chooseStory,
      saveMemory,
      removeMemory,
      addStory,
      saveFailure,
      clearSaveFailure: () => setSaveFailure(null),
    }),
    [account, loadError, stories, activeStory, reload, chooseStory, saveMemory, removeMemory, addStory, saveFailure],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}
