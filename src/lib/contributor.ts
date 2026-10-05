// Pseudonymous contributor key (ISS-015 / Addendum §21).
//
// A random UUID generated in this browser and kept in localStorage. It labels
// measurement rows so "Delete my data" can find every row this device
// contributed — it is never an account, phone number, email or IP address,
// and nothing in the product maps it back to a person.

const CONTRIBUTOR_KEY_STORAGE = "internetyangu.contributorKey";

function isValidKey(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** Get (or create) this device's pseudonymous contributor key. */
export function getContributorKey(): string {
  if (typeof window === "undefined") return "";
  try {
    const stored = window.localStorage.getItem(CONTRIBUTOR_KEY_STORAGE);
    if (stored && isValidKey(stored)) return stored;
  } catch {
    // fall through to generation below
  }
  const key = window.crypto.randomUUID();
  try {
    window.localStorage.setItem(CONTRIBUTOR_KEY_STORAGE, key);
  } catch {
    // Private mode: the key lives for this session only.
  }
  return key;
}

/** Replace the contributor key (used after "Delete my data"): future rows
 * can no longer be correlated with the purged ones. */
export function rotateContributorKey(): string {
  if (typeof window === "undefined") return "";
  const key = window.crypto.randomUUID();
  try {
    window.localStorage.setItem(CONTRIBUTOR_KEY_STORAGE, key);
  } catch {
    // ignore — session-only key
  }
  return key;
}
