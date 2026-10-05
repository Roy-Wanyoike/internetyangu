// Consent architecture (ISS-015 / Master Directive §16).
//
// A real, purpose-scoped consent model — not a generic "I agree":
//   purpose        what the gate controls
//   granted        current on/off state (default OFF for every purpose)
//   updatedAt      when the choice was last made (granted OR withdrawn)
//   version        consent-model version, so future changes can re-ask
//   source         where the choice was captured
//
// Persisted in this browser's localStorage only — local-first, no accounts.
// Every purpose defaults to OFF; absence of a stored record means "not
// granted". Consent is revocable at any time from the Privacy Center.

export const CONSENT_VERSION = 1;
export const CONSENT_STORAGE_KEY = "internetyangu.consent.v1";
export const CONSENT_SOURCE = "privacy-center";

export type ConsentPurpose = "shareMeasurement" | "diagnostics";

export const CONSENT_PURPOSES: ConsentPurpose[] = ["shareMeasurement", "diagnostics"];

export interface PurposeConsent {
  granted: boolean;
  updatedAt: string | null; // ISO timestamp of the last grant/withdraw
}

export interface ConsentState {
  version: number;
  purposes: Record<ConsentPurpose, PurposeConsent>;
}

export function defaultConsent(): ConsentState {
  return {
    version: CONSENT_VERSION,
    purposes: {
      shareMeasurement: { granted: false, updatedAt: null },
      diagnostics: { granted: false, updatedAt: null },
    },
  };
}

/** Human-readable label for each purpose — single source of truth for UI copy. */
export const CONSENT_LABELS: Record<ConsentPurpose, { title: string; description: string }> = {
  shareMeasurement: {
    title: "Share anonymous measurements",
    description:
      "Allow your connectivity measurements to count toward area and provider intelligence. Only the allowlisted anonymous fields below would ever leave this device, and only while this is on. Nothing is shared today — this choice is stored and will gate the contribution flow.",
  },
  diagnostics: {
    title: "Diagnostic and crash reports",
    description:
      "Allow technical problem reports (error type, app version, device class) to help fix bugs. No bill amounts, notes, network names or personal content. No diagnostic reports are sent today — this choice is stored and will gate that feature.",
  },
};

/** Parse and sanitise a stored consent record. Anything malformed or from a
 * newer/older model version falls back to the all-OFF defaults — never to a
 * silently-granted state. */
export function loadConsent(): ConsentState {
  const fallback = defaultConsent();
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ConsentState> | null;
    if (!parsed || parsed.version !== CONSENT_VERSION || !parsed.purposes) return fallback;
    const state = fallback;
    for (const purpose of CONSENT_PURPOSES) {
      const record = parsed.purposes[purpose];
      if (record && typeof record.granted === "boolean") {
        state.purposes[purpose] = {
          granted: record.granted,
          updatedAt:
            typeof record.updatedAt === "string" && !Number.isNaN(Date.parse(record.updatedAt))
              ? record.updatedAt
              : new Date().toISOString(),
        };
      }
    }
    return state;
  } catch {
    return fallback;
  }
}

export function saveConsent(state: ConsentState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode / storage blocked — the choice lives for this session only.
  }
}

/** Remove the stored consent record entirely (used by "Delete my data"):
 * every purpose falls back to the safe OFF default, not to a stale grant. */
export function clearStoredConsent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // ignore — nothing to clear in private mode
  }
}
