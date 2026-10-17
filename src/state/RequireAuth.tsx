import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./authContext";

/**
 * Pages for signed-in people. While the stored session is still being read
 * it renders nothing rather than flashing the sign-in page; signed out, it
 * sends them to sign in and brings them back afterwards. A /?ref=CODE link
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
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?next=${next}`} replace />;
  }
  return <Outlet />;
}
