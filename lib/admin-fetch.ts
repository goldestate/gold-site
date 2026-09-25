/**
 * Every admin write goes through this, so a failure always comes back as a message
 * staff can read instead of a form that silently closes or a button stuck on
 * "Saving...". It never throws: a dropped connection on a North Coast compound is
 * an ordinary result, not an exception.
 *
 * On a 401 the caller must NOT router.refresh(): the refresh is a page request,
 * middleware redirects it to the login page, and whatever staff typed is lost.
 */
export type AdminResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

export const SESSION_EXPIRED =
  'Your login has expired. Log in again in a new tab, then come back here and try again.';

export async function adminFetch<T = unknown>(
  url: string,
  init: { method?: string; body?: unknown } = {}
): Promise<AdminResult<T>> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: init.method ?? 'GET',
      headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body)
    });
  } catch {
    return { ok: false, status: 0, error: 'No connection. Check the signal and try again.' };
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Some responses have no body; the status is still the answer.
  }

  if (res.ok) return { ok: true, data: data as T };
  if (res.status === 401) return { ok: false, status: 401, error: SESSION_EXPIRED };
  const message =
    data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string'
      ? (data as { error: string }).error
      : 'Something went wrong. Try again.';
  return { ok: false, status: res.status, error: message };
}
