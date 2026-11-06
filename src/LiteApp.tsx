/**
 * The light door: pages a person opens from a message on any phone, with no account. They load without the
 * signed-in app (no auth, no supabase-js session, no gsap), so an old Android tablet on a slow line opens
 * /a/:token or /m/:token quickly. Any other path reached from here reloads into the full app.
 */
import { lazy, Suspense, useEffect, type ComponentType } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

/** Plain cream while a page's code arrives: no words to translate, nothing that moves. */
function CreamWait() {
  return <div aria-busy="true" style={{ minHeight: "100vh", background: "var(--page, #F3EBDD)" }} />;
}

const lazyPage = (load: () => Promise<{ default: ComponentType }>) => {
  const C = lazy(load);
  return (
    <Suspense fallback={<CreamWait />}>
      <C />
    </Suspense>
  );
};

/** A link out of the light pages (to "/", "/sign-in", "/gift/redeem/…"): load the full app at that address. */
function ToFullApp() {
  useEffect(() => {
    window.location.reload();
  }, []);
  return <CreamWait />;
}


const router = createBrowserRouter([
  { path: "/a/:token", element: lazyPage(() => import("./pages/answer/AnswerPage")) },
  // the link to one memory (T19): opens once, with its voice, for someone without the app
  { path: "/m/:token", element: lazyPage(() => import("./pages/memory-link/MemoryLinkPage")) },
  // the printed book's codes (T18): a chapter, or one memory, for whoever scanned the book
  { path: "/read", element: lazyPage(() => import("./pages/read/ReadPage")) },
  { path: "/gift", element: lazyPage(() => import("./pages/gift/Gift")) },
  { path: "/gift/thanks", element: lazyPage(() => import("./pages/gift/GiftThanks")) },
  { path: "*", element: <ToFullApp /> },
]);

export default function LiteApp() {
  return <RouterProvider router={router} />;
}
