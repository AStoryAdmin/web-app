/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** The AI server (the phone app's EXPO_PUBLIC_API_URL). */
  readonly VITE_API_URL?: string;
  readonly VITE_SITE_URL?: string;
  /** Where memory links point (defaults to the phone's site, https://astoryapp.com). */
  readonly VITE_MEMORY_LINK_URL?: string;
}
