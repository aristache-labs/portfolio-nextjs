/** Pure admin gate: only the configured GitHub login may sign in. */
export function isAllowedLogin(
  login: string | null | undefined,
  adminLogin: string | undefined,
): boolean {
  if (!login || !adminLogin) return false;
  return login.toLowerCase() === adminLogin.toLowerCase();
}

/**
 * True when the session belongs to the admin. A session made before the login was stored on it
 * has none, so it is not the admin's until the next sign-in.
 */
export function isAdminSession(
  session: { user?: { login?: string } } | null | undefined,
  adminLogin: string | undefined,
): boolean {
  return isAllowedLogin(session?.user?.login, adminLogin);
}
