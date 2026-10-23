/* eslint-disable react-refresh/only-export-components -- a test entry point, never hot-reloaded */
/**
 * The gift pages mounted on their own, for e2e/gift.spec.ts: the same
 * components App.tsx routes (/gift, /gift/thanks, /gift/redeem/:code), on a
 * memory router whose first entry is ?at=… . A link that leaves the gift
 * pages lands on a stub that names where it went.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router-dom";
import "../../../styles/astory.css";
import AuthProvider from "../../../state/AuthProvider";
import Gift from "../Gift";
import GiftThanks from "../GiftThanks";
import GiftRedeem from "../GiftRedeem";

function Elsewhere() {
  const l = useLocation();
  return <p data-testid="elsewhere">{l.pathname + l.search}</p>;
}

const at = new URLSearchParams(window.location.search).get("at") || "/gift";
const router = createMemoryRouter(
  [
    { path: "/gift", element: <Gift /> },
    { path: "/gift/thanks", element: <GiftThanks /> },
    { path: "/gift/redeem/:code", element: <GiftRedeem /> },
    { path: "*", element: <Elsewhere /> },
  ],
  { initialEntries: [at] },
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
