/**
 * A Story on the web. The routes are the PRD's (docs/PRD.md §5): four places
 * and one Add button for the signed-in person, a handful of signed-out
 * pages, and two pages anyone can open from a link. A Placeholder names the
 * screens not built yet so no route is ever blank.
 */
import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AuthProvider from "./state/AuthProvider";
import AccountProvider from "./state/AccountProvider";
import RequireAuth from "./state/RequireAuth";
import Placeholder from "./pages/Placeholder";
import LoadingMark from "./components/delight/LoadingMark";
import Welcome from "./pages/auth/Welcome";
import SignIn from "./pages/auth/SignIn";
import CreateAccount from "./pages/auth/CreateAccount";
import Verify from "./pages/auth/Verify";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Start from "./pages/Start";
import Home from "./pages/Home";
import Write from "./pages/Write";
import Talk from "./pages/Talk";

const lazyPage = (load: () => Promise<{ default: React.ComponentType }>) => {
  const C = lazy(load);
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "60vh" }} aria-busy="true">
          <LoadingMark />
        </div>
      }
    >
      <C />
    </Suspense>
  );
};

const page = (name: string) => <Placeholder name={name} />;

// An invitation email links to "/?ref=CODE" (the phone app's own join link, supabase/functions/send-invite-email):
// open the join page for that code, so the link works in a browser as well as in the app.
if (typeof window !== "undefined") {
  const ref = new URLSearchParams(window.location.search).get("ref");
  if (ref && /^[A-Za-z0-9]{6}$/.test(ref) && (window.location.pathname === "/" || window.location.pathname === "/join")) {
    window.history.replaceState(null, "", `/join/${ref.toUpperCase()}`);
  }
}

const router = createBrowserRouter([
  { path: "/welcome", element: <Welcome /> },
  { path: "/sign-in", element: <SignIn /> },
  { path: "/create-account", element: <CreateAccount /> },
  { path: "/verify", element: <Verify /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ForgotPassword /> },
  { path: "/join/:code", element: lazyPage(() => import("./pages/Join")) },
  { path: "/c/:slug", element: lazyPage(() => import("./pages/Contribute")) },
  { path: "/p/:slug", element: lazyPage(() => import("./pages/Wall")) },
  { path: "/a/:token", element: lazyPage(() => import("./pages/answer/AnswerPage")) },
  { path: "/gift", element: lazyPage(() => import("./pages/gift/Gift")) },
  { path: "/gift/thanks", element: lazyPage(() => import("./pages/gift/GiftThanks")) },
  { path: "/gift/redeem/:code", element: lazyPage(() => import("./pages/gift/GiftRedeem")) },
  {
    element: <RequireAuth />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/start", element: <Start /> },
      { path: "/joined", element: lazyPage(() => import("./pages/Joined")) },
      { path: "/write", element: <Write /> },
      { path: "/talk", element: <Talk /> },
      { path: "/record", element: lazyPage(() => import("./pages/Record")) },
      { path: "/archive", element: lazyPage(() => import("./pages/Archive")) },
      { path: "/archive/:id", element: lazyPage(() => import("./pages/MemoryPage")) },
      { path: "/family", element: lazyPage(() => import("./pages/Family")) },
      { path: "/family/:personId", element: lazyPage(() => import("./pages/Person")) },
      { path: "/book", element: lazyPage(() => import("./pages/Book")) },
      { path: "/book/design", element: lazyPage(() => import("./pages/BookDesign")) },
      { path: "/plans", element: lazyPage(() => import("./pages/Plans")) },
      { path: "/account", element: lazyPage(() => import("./pages/Account")) },
    ],
  },
  { path: "*", element: page("This page isn’t here") },
]);

export default function App() {
  return (
    <AuthProvider>
      <AccountProvider>
        <RouterProvider router={router} />
      </AccountProvider>
    </AuthProvider>
  );
}
