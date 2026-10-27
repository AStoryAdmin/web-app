/**
 * /account-deleted: where deleting the account lands (the phone's AccountDeletedScreen). Signed out, on the cream
 * page: it is done, thank you for the stories, and, when a subscription was still running, that Apple runs it and
 * it is turned off there. It needs no account and no data, so it works in either app; the way on is a full page
 * load, so nothing of the old session is carried to the front door.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Lockup } from "../components/Brand";
import { APP_STORE_STEPS } from "./accountPlan";
import "./account.css";

export default function AccountDeleted() {
  const { state } = useLocation() as { state: { billing?: boolean } | null };
  // Said when Account knew a subscription was running; on a reload (no state), said gently for anyone who had one.
  const billing = state?.billing;

  useEffect(() => {
    document.title = "Your account is deleted · A Story";
  }, []);

  return (
    <div className="acct-gone">
      <header className="acct-gone-top">
        <a href="/welcome" aria-label="A Story">
          <Lockup />
        </a>
      </header>
      <main className="acct-gone-main">
        <h1 className="acct-gone-title">
          Your account is deleted<span className="stop">.</span>
        </h1>
        <span className="acct-gone-rule" aria-hidden="true" />
        <p className="acct-gone-thanks">Thank you for the stories.</p>
        {billing ? (
          <p className="acct-gone-note">
            Your App Store subscription is still running. Cancel it in {APP_STORE_STEPS}, or it keeps renewing.
          </p>
        ) : billing === undefined ? (
          <p className="acct-gone-note">If you had a subscription, Apple runs it. Check it’s turned off in {APP_STORE_STEPS}.</p>
        ) : null}
        <p className="acct-gone-acts">
          <a href="/welcome" className="btn outline">
            Back to the front page
          </a>
        </p>
      </main>
    </div>
  );
}
