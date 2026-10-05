// On-device billing SMS parser (Tier-1 "Track" capability).
// Parses common Kenyan money/billing SMS patterns WITHOUT ever leaving the
// browser — privacy-first: raw text is never sent to any server.
// Supported (indicative, versioned registry planned):
//   - M-Pesa payment confirmations ("...Confirmed. Ksh2,999 paid to SAFARICOM HOME...")
//   - M-Pesa bundle purchases / receipts
//   - Airtel Money payments ("You have paid KES 1,999 to ...")
//   - Generic "KES/KSh amount" fallback

import type { ParsedSms } from "./types";

const AMOUNT_RE = /(?:ksh|kes|tzs|ugx|rwf)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;
// M-Pesa / Airtel Money transaction codes: 8-12 uppercase alphanumerics
const REF_RE = /\b([A-Z0-9]{8,12})\b/;
const PAID_TO_RE = /(?:paid to|sent to|to)\s+([A-Z0-9][A-Z0-9 .&'-]{1,40}?)(?:\s+on\s+|\s+today|\s*$|\.)/i;
const BUNDLE_RE = /(bundle|data pack|internet pack|monthly (?:internet|fiber|wifi))/i;

function parseAmount(raw: string): number | null {
  const m = raw.match(AMOUNT_RE);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function classify(raw: string): ParsedSms["kind"] {
  if (BUNDLE_RE.test(raw)) return "bundle";
  if (/confirmed|paid to|sent to/i.test(raw)) return "payment";
  return "receipt";
}

export function parseBillingSms(text: string): ParsedSms {
  const raw = text.trim();
  if (raw.length < 8) {
    return { ok: false, reason: "Message too short to contain a transaction.", raw };
  }

  const moneyProvider = /m-?pesa/i.test(raw)
    ? "M-Pesa"
    : /airtel money/i.test(raw)
      ? "Airtel Money"
      : /t-?pesa/i.test(raw)
        ? "T-Pesa"
        : /mtn momo|momo pay/i.test(raw)
          ? "MTN MoMo"
          : null;

  const amount = parseAmount(raw);
  if (amount == null) {
    return {
      ok: false,
      reason: "No amount found. Paste a payment/bundle SMS that mentions KES, KSh, TZS, UGX or RWF.",
      raw,
    };
  }

  const refMatch = raw.match(REF_RE);
  const merchantMatch = raw.match(PAID_TO_RE);

  return {
    ok: true,
    amount,
    currency: /ksh|kes/i.test(raw) ? "KES" : /tzs/i.test(raw) ? "TZS" : /ugx/i.test(raw) ? "UGX" : /rwf/i.test(raw) ? "RWF" : "KES",
    reference: refMatch ? refMatch[1] : undefined,
    merchant: merchantMatch ? merchantMatch[1].trim() : undefined,
    kind: classify(raw),
    raw,
    ...(moneyProvider ? { reason: `Detected ${moneyProvider} message` } : {}),
  };
}

// Best-effort guess of the ISP name from merchant text, mapped against the
// seeded provider directory so the form can pre-select.
const PROVIDER_HINTS: Array<[RegExp, string]> = [
  [/safaricom|home fiber|fiber to/i, "Safaricom Fiber"],
  [/faiba/i, "Faiba 5G Home"],
  [/zuku/i, "Zuku Fiber"],
  [/airtel/i, "Airtel Fixed Internet"],
  [/poa[\s-]?internet/i, "Poa Internet"],
  [/mawingu/i, "Mawingu Networks"],
  [/starlink|space ?x/i, "Starlink Kenya"],
  [/vodacom/i, "Vodacom Home Fiber"],
  [/wakanet|mtn/i, "MTN WakaNet"],
];

export function guessProvider(merchant?: string, raw = ""): string | null {
  const haystack = `${merchant ?? ""} ${raw}`;
  for (const [re, name] of PROVIDER_HINTS) {
    if (re.test(haystack)) return name;
  }
  return null;
}

// Guess data volume from bundle-style messages ("25GB", "300 GB", "1.5TB")
export function guessDataGb(raw: string): number | null {
  const m = raw.match(/([0-9]+(?:\.[0-9]+)?)\s*(gb|tb)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  return /tb/i.test(m[2]) ? n * 1024 : n;
}
