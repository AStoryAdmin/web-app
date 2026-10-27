// Whether the Auth server's answer to getUser() means the session is over.
//
// getSession() only reads the token stored on the phone; getUser() asks the
// server, which is how an account deleted from another device gets signed
// out here. But getUser() also fails with no signal, on a timeout, when the
// Auth server has a bad minute, and when it's asked too often (429), and
// signing somebody out for that (someone opening the app on a train, or a
// grandmother on patchy Wi-Fi) sends them to a password they may not
// remember. Only the server saying the token or the user is no good ends
// the session: a 401 or 403, or one of the codes below that mean the same
// thing. Kept free of lib/supabase so it can be tested.

// GoTrue's error codes for "this session can't come back".
const DEAD = new Set([
  "bad_jwt",
  "no_authorization",
  "session_not_found",
  "session_expired",
  "refresh_token_not_found",
  "refresh_token_already_used",
  "user_not_found",
  "user_banned",
]);

export function sessionIsOver(error, user) {
  if (!error) return !user;
  // The client has no usable session any more (its refresh token was
  // refused or cleared): nothing to keep, and every load would fail.
  if (error.name === "AuthSessionMissingError") return true;
  if (error.name !== "AuthApiError") return false; // network, timeout, unknown
  const status = Number(error.status);
  if (status === 401 || status === 403) return true;
  // A 400 or 404 is the server's answer for a dead refresh token or a
  // deleted user only when it says so; a 429, a 5xx and anything else is
  // the server, not the session.
  if ((status === 400 || status === 404) && DEAD.has(String(error.code || ""))) return true;
  return false;
}
