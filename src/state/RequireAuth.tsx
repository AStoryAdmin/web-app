import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./authContext";

/**
 * Pages for signed-in people. While the stored session is still being read
 * it renders nothing rather than flashing the sign-in page; signed out, it
 * sends them to sign in and brings them back afterwards.
 */
export default function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (user === undefined) return <div style={{ minHeight: "70vh" }} aria-busy="true" />;
  if (user === null) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?next=${next}`} replace />;
  }
  return <Outlet />;
}
