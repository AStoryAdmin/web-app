import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/astory.css";
import "./styles/pages/archive-reading.css";
import "./styles/pages/book-account.css";
import "./styles/pages/signed-out.css";
import "./styles/pages/writer.css";
import "./styles/pages/family-people.css";
import App from "./App";
import { startMotionWatchdog } from "./lib/motionWatchdog";
import { startPageFit } from "./lib/zoom";

startPageFit();
startMotionWatchdog();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
