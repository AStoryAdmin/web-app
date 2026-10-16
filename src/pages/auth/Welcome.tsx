import { Link, Navigate } from "react-router-dom";
import AuthFrame from "./AuthFrame";
import { ButtonLink } from "../../components/ui";
import { useAuth } from "../../state/authContext";

/** The front door for somebody with no session: one headline, two buttons. */
export default function Welcome() {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return (
    <AuthFrame photo="/photos/27-1200.webp">
      <div className="form">
        <h1>Welcome to A Story</h1>
        <p className="sub">Where a family keeps what its people say.</p>
        <div style={{ display: "grid", gap: "var(--s-3)" }}>
          <ButtonLink to="/create-account" block>
            Get started
          </ButtonLink>
          <ButtonLink to="/sign-in" variant="outline" block>
            I already have an account
          </ButtonLink>
        </div>
        <p className="legal">
          Someone gave you a code? <Link to="/create-account?code=">Use it here</Link>.
        </p>
      </div>
    </AuthFrame>
  );
}
