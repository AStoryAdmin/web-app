// Whether the Auth server's answer to getUser() means the session is over.
//
// getSession() only reads the token stored on the phone; getUser() asks the
// server, which is how an account deleted from another device gets signed
// out here. But getUser() also fails with no signal, on a timeout, or when
// the Auth server has a bad minute, and signing somebody out for that
// (someone opening the app on a train, or a grandmother on patchy Wi-Fi)
// sends them to a password they may not remember. Only a 4xx from the
// server itself (the user is gone, the refresh token is dead) ends the
// session. Kept free of lib/supabase so it can be tested.
export function sessionIsOver(error, user) {
  if (!error) return !user;
  // The client has no usable session any more (its refresh token was
  // refused or cleared): nothing to keep, and every load would fail.
  if (error.name === "AuthSessionMissingError") return true;
  if (error.name !== "AuthApiError") return false; // network, timeout, unknown
  const status = Number(error.status);
  return status >= 400 && status < 500;
}
