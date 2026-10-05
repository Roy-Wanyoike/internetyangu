// Shared API payload types (client ↔ server contract)

export interface Provider {
  id: string;
  name: string;
  country: string;
  technology: string;
  entryPriceKes: number;
  avgSpeedMbps: number;
  dataCapGb: number;
  rating: number;
  notes: string | null;
}

export interface BillingEntry {
  id: string;
  providerName: string;
  planName: string | null;
  amountKes: number;
  dataGb: number;
  periodMonth: string;
  paymentRef: string | null;
  source: string;
  createdAt: string;
}

export interface OutageEvent {
  id: string;
  providerName: string;
  startedAt: string;
  endedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Stats {
  spendMtdKes: number;
  avgCostPerGbKes: number | null;
  entriesCount: number;
  outages30d: number;
  downtimeMin30d: number;
  uptimePct30d: number | null;
  latencyP50Ms: number | null;
  latencyP95Ms: number | null;
  currentMonth: string;
}

export interface PingSampleDto {
  rttMs: number;
  ok: boolean;
  createdAt: string;
}

export interface ParsedSms {
  ok: boolean;
  reason?: string;
  amount?: number;
  currency?: string;
  reference?: string;
  merchant?: string;
  kind?: "payment" | "receipt" | "bundle";
  raw: string;
}
