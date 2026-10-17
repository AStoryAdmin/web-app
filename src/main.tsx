import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/astory.css";
import App from "./App";
import { startMotionWatchdog } from "./lib/motionWatchdog";

startMotionWatchdog();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
