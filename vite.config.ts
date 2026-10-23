/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5180, strictPort: true },
  preview: { port: 5181, strictPort: true },
  // The elder opens her link on whatever she has: Safari on iOS 15 (iPad 5th gen and up) and Chrome 80+ on Android 9+.
  build: { target: ["es2020", "chrome80", "safari14", "firefox78"], cssTarget: ["chrome80", "safari14"] },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
