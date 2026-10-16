import { createContext, useContext } from "react";
import type { Account, Memory, Story } from "../data/stories";
import type { Family } from "../data/family";

export type SaveFailure = { message: string; retry: () => Promise<void> };

export type AccountState = {
  /** undefined while loading; null when the load failed (loadError says why). */
  account: Account | null | undefined;
  loadError: string | null;
  stories: Story[];
  activeStory: Story | null;
  /** The family tree, or null when the database has none (or the tables are absent). */
  family: Family | null;
  /**
   * The signed-in person's own story ("Myself"), made if they have none: a
   * relative who joined by code or invitation still needs somewhere for
   * what they remember (the app's ensureMyStory).
   */
  ensureMyStory: () => Promise<Story | null>;
  /** Re-reads everything from the server (after a sign-in, a relative's edit, a return to the tab). */
  reload: () => Promise<void>;
  /** The chosen storyteller, remembered on the account (profiles.active_story_id). */
  chooseStory: (storyId: string) => Promise<void>;
  /** Saves a memory into a story and updates the local copy; throws if the server refused. */
  saveMemory: (memory: Memory, storyId: string) => Promise<void>;
  removeMemory: (memoryId: string, storyId: string) => Promise<void>;
  /** A new storyteller, saved and made active. */
  addStory: (story: Story) => Promise<Story>;
  /** The last write that did not land, with a way to try it again. */
  saveFailure: SaveFailure | null;
  clearSaveFailure: () => void;
};

export const AccountContext = createContext<AccountState | null>(null);

export function useAccount(): AccountState {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount needs an AccountProvider above it");
  return ctx;
}
