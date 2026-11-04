'use client';

import { useEffect, useState } from 'react';

/**
 * "Property added." and the like, shown once on the Properties page.
 *
 * It used to come from the address (…/properties?created=1), so going back to
 * the list, reloading it or reopening an old tab showed "Property added." again
 * with nothing new added -- easy to read as a unit that saved when it didn't.
 * Now the message is handed over in this tab's session storage and removed the
 * moment it is shown.
 */

const KEY = 'gold-admin:flash';
const EVENT = 'gold-admin:flash';

/** Leaves a message for the Properties page to show once, on this page or the next. */
export function flash(message: string) {
  try {
    window.sessionStorage.setItem(KEY, message);
  } catch {
    // No storage (rare private modes): the action still happened, just without the note.
    return;
  }
  window.dispatchEvent(new Event(EVENT));
}

function takeFlash(): string | null {
  try {
    const message = window.sessionStorage.getItem(KEY);
    if (message) window.sessionStorage.removeItem(KEY);
    return message;
  } catch {
    return null;
  }
}

export function FlashBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const show = () => {
      const next = takeFlash();
      if (next) setMessage(next);
    };
    // One left by the page that sent us here (the form), or by an action on this page.
    show();
    window.addEventListener(EVENT, show);
    return () => window.removeEventListener(EVENT, show);
  }, []);

  if (!message) return null;
  return (
    <div
      role="status"
      className="mt-6 rounded-[1rem] border border-[rgba(217,179,85,0.3)] bg-[rgba(217,179,85,0.1)] px-4 py-3 text-sm text-[#D9B355]"
    >
      {message}
    </div>
  );
}
