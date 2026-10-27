import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./authContext";

/**
 * Pages for signed-in people. While the stored session is still being read
 * it renders nothing rather than flashing the sign-in page. Signed out, the
 * front door (/) opens on Welcome, where a visitor can make an account; a
 * deep link (an email’s /archive/123) goes to sign in and comes back to
 * the same page afterwards. A /?ref=CODE link
 * from an invitation email goes straight to /join/CODE, signed in or not.
 */
export default function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  // The invitation email's button is /?ref=CODE (the phone app's link); the web answers it at /join/CODE.
  const ref = new URLSearchParams(location.search).get("ref");
  if (location.pathname === "/" && ref) return <Navigate to={`/join/${encodeURIComponent(ref.trim().toUpperCase())}`} replace />;
  if (user === undefined) return <div style={{ minHeight: "70vh" }} aria-busy="true" />;
  if (user === null) {
    if (location.pathname === "/") return <Navigate to="/welcome" replace />;
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?next=${next}`} replace />;
  }
  return <Outlet />;
}
