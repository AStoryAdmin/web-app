import { StrictMode, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import "./styles/astory.css";
import { startPageFit } from "./lib/zoom";

startPageFit();

// The elder's answer link and the gift pages load without the signed-in app (src/LiteApp.tsx); everything else
// loads the full app. Kept inline (not imported from LiteApp) so the choice costs no extra request.
const lite = /^\/(a\/[^/]+\/?|gift\/?|gift\/thanks\/?)$/.test(window.location.pathname);
const load: Promise<{ default: ComponentType }> = lite ? import("./LiteApp") : import("./FullApp");
const root = createRoot(document.getElementById("root")!);

load.then(({ default: Root }) =>
  root.render(
    <StrictMode>
      <Root />
    </StrictMode>,
  ),
);
