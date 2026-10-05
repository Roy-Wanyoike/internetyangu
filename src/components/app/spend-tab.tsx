"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  MessageSquareText,
  Trash2,
  Loader2,
  Info,
} from "lucide-react";
import { ErrorState } from "./error-state";
import { OfflineEmptyState, StaleDataNotice } from "@/components/pwa/offline-state";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { cacheFallbackAt } from "@/lib/pwa";
import { costPerGb, currentPeriod, formatGb, formatKes } from "@/lib/format";
import { guessDataGb, guessProvider, parseBillingSms } from "@/lib/sms-parser";
import type { BillingEntry } from "@/lib/types";

interface AddFormState {
  providerName: string;
  planName: string;
  amountKes: string;
  dataGb: string;
  periodMonth: string;
  paymentRef: string;
}

// Field-level errors per audit 001 F-03 (master checklist §15):
// what is required, what went wrong, and where — not a single summary line.
interface FieldErrors {
  providerName?: string;
  amountKes?: string;
  dataGb?: string;
  periodMonth?: string;
}

const FIELD_ORDER: Array<keyof FieldErrors> = ["providerName", "amountKes", "dataGb", "periodMonth"];
const FIELD_INPUT_ID: Record<keyof FieldErrors, string> = {
  providerName: "provider",
  amountKes: "amount",
  dataGb: "dataGb",
  periodMonth: "period",
};

function validateForm(form: AddFormState): FieldErrors {
  const errors: FieldErrors = {};
  const amountKes = Number(form.amountKes);
  const dataGb = Number(form.dataGb);
  if (!form.providerName.trim()) errors.providerName = "Provider is required.";
  else if (form.providerName.trim().length > 80) errors.providerName = "Keep the provider name under 80 characters.";
  if (!form.amountKes.trim()) errors.amountKes = "Amount is required.";
  else if (!Number.isFinite(amountKes) || amountKes <= 0) errors.amountKes = "Enter a positive amount in KES.";
  if (!form.dataGb.trim()) errors.dataGb = "Data volume is required.";
  else if (!Number.isFinite(dataGb) || dataGb <= 0) errors.dataGb = "Enter a positive number of GB.";
  if (!form.periodMonth.trim()) errors.periodMonth = "Period is required.";
  else if (!/^\d{4}-\d{2}$/.test(form.periodMonth)) errors.periodMonth = "Use the YYYY-MM format, e.g. 2026-10.";
  return errors;
}

const EMPTY_FORM: AddFormState = {
  providerName: "",
  planName: "",
  amountKes: "",
  dataGb: "",
  periodMonth: currentPeriod(),
  paymentRef: "",
};

export function SpendTab() {
  const { toast } = useToast();
  const online = useOnlineStatus();
  const [entries, setEntries] = useState<BillingEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  // Staleness bookkeeping (ISS-010 / §31) — see overview-tab.
  const [entriesAsOf, setEntriesAsOf] = useState<string | null>(null);
  const [entriesStale, setEntriesStale] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AddFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [smsOpen, setSmsOpen] = useState(false);
  const [smsText, setSmsText] = useState("");
  const [parsed, setParsed] = useState<ReturnType<typeof parseBillingSms> | null>(null);

  const load = useCallback(async () => {
    setRetrying(true);
    try {
      const res = await fetch("/api/entries", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEntries((await res.json()) as BillingEntry[]);
      setLoadError(null);
      const cachedAt = cacheFallbackAt(res);
      setEntriesStale(cachedAt !== null);
      setEntriesAsOf(cachedAt ?? new Date().toISOString());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "The billing history request failed");
      if (!online) setEntriesStale(true);
    } finally {
      setRetrying(false);
    }
  }, [online]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = (() => {
    if (!entries) return null;
    const month = currentPeriod();
    const mtd = entries.filter((e) => e.periodMonth === month);
    const spend = mtd.reduce((s, e) => s + e.amountKes, 0);
    const gb = mtd.reduce((s, e) => s + e.dataGb, 0);
    return { spend, cpg: costPerGb(spend, gb), count: mtd.length };
  })();

  const setField = (key: keyof AddFormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    // clear the field's own error as the user fixes it
    if (key in FIELD_INPUT_ID) {
      setFieldErrors((prev) => {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key as keyof FieldErrors];
        return next;
      });
    }
  };

  const submit = async () => {
    setFormError(null);
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // move focus to the first invalid field so keyboard + SR users land on the fix
      const firstInvalid = FIELD_ORDER.find((k) => errors[k]);
      if (firstInvalid) document.getElementById(FIELD_INPUT_ID[firstInvalid])?.focus();
      return;
    }
    const amountKes = Number(form.amountKes);
    const dataGb = Number(form.dataGb);

    setSaving(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerName: form.providerName.trim(),
          planName: form.planName.trim() || null,
          amountKes,
          dataGb,
          periodMonth: form.periodMonth,
          paymentRef: form.paymentRef.trim() || null,
          source: "manual",
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      toast({ title: "Bill saved", description: `${formatKes(amountKes)} · ${form.providerName.trim()}` });
      setForm(EMPTY_FORM);
      setFieldErrors({});
      setOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not save the bill.");
    } finally {
      setSaving(false);
    }
  };

  const parseSms = (text: string) => {
    const result = parseBillingSms(text);
    setParsed(result);
    if (result.ok) {
      const provider = guessProvider(result.merchant, result.raw);
      const gb = guessDataGb(result.raw);
      setForm((f) => ({
        ...f,
        providerName: provider ?? f.providerName,
        amountKes: String(result.amount ?? f.amountKes),
        paymentRef: result.reference ?? f.paymentRef,
        dataGb: gb != null ? String(gb) : f.dataGb,
      }));
    }
  };

  const remove = async (id: string) => {
    try {
      // path-param route: DELETE /api/entries/<id> (fixed in ISS-008 — the
      // earlier ?id= form 405'd because the handler lives on the [id] segment)
      const res = await fetch(`/api/entries/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEntries((prev) => prev?.filter((e) => e.id !== id) ?? null);
      toast({ title: "Entry removed" });
    } catch {
      toast({ title: "Could not remove entry", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Spend tracker</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every bill becomes a cost-per-GB data point. Parsed from SMS on your device — the raw
            message never leaves the browser.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setSmsOpen(true); setParsed(null); setSmsText(""); }} className="gap-2">
            <MessageSquareText className="h-4 w-4" aria-hidden="true" /> Paste SMS
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" aria-hidden="true" /> Add bill
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add a bill</DialogTitle>
                <DialogDescription>Log what you paid and how much data it bought.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-1">
                <div className="grid gap-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Input
                    id="provider"
                    placeholder="e.g. Safaricom Fiber"
                    value={form.providerName}
                    onChange={(e) => setField("providerName", e.target.value)}
                    aria-invalid={!!fieldErrors.providerName}
                    aria-describedby={fieldErrors.providerName ? "provider-error" : undefined}
                  />
                  {fieldErrors.providerName && (
                    <p id="provider-error" role="alert" className="text-xs text-destructive">
                      {fieldErrors.providerName}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount (KES)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="2999"
                      value={form.amountKes}
                      onChange={(e) => setField("amountKes", e.target.value)}
                      aria-invalid={!!fieldErrors.amountKes}
                      aria-describedby={fieldErrors.amountKes ? "amount-error" : undefined}
                    />
                    {fieldErrors.amountKes && (
                      <p id="amount-error" role="alert" className="text-xs text-destructive">
                        {fieldErrors.amountKes}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dataGb">Data (GB)</Label>
                    <Input
                      id="dataGb"
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="420"
                      value={form.dataGb}
                      onChange={(e) => setField("dataGb", e.target.value)}
                      aria-invalid={!!fieldErrors.dataGb}
                      aria-describedby={fieldErrors.dataGb ? "dataGb-error" : undefined}
                    />
                    {fieldErrors.dataGb && (
                      <p id="dataGb-error" role="alert" className="text-xs text-destructive">
                        {fieldErrors.dataGb}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="period">Period (YYYY-MM)</Label>
                    <Input
                      id="period"
                      placeholder={currentPeriod()}
                      value={form.periodMonth}
                      onChange={(e) => setField("periodMonth", e.target.value)}
                      aria-invalid={!!fieldErrors.periodMonth}
                      aria-describedby={fieldErrors.periodMonth ? "period-error" : undefined}
                    />
                    {fieldErrors.periodMonth && (
                      <p id="period-error" role="alert" className="text-xs text-destructive">
                        {fieldErrors.periodMonth}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="plan">Plan (optional)</Label>
                    <Input
                      id="plan"
                      placeholder="Fiber 40 Mbps"
                      value={form.planName}
                      onChange={(e) => setField("planName", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ref">Payment reference (optional)</Label>
                  <Input
                    id="ref"
                    placeholder="M-Pesa code"
                    value={form.paymentRef}
                    onChange={(e) => setField("paymentRef", e.target.value)}
                  />
                </div>
                {formError && (
                  <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {formError}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={submit} disabled={saving} className="gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  Save bill
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* SMS paste dialog */}
      <Dialog open={smsOpen} onOpenChange={setSmsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Paste a billing SMS</DialogTitle>
            <DialogDescription>
              M-Pesa / Airtel Money confirmations are parsed locally in your browser. Only the
              extracted fields are saved.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={5}
            placeholder="e.g. QGH7XY12K3 Confirmed. Ksh2,999.00 paid to SAFARICOM HOME FIBER on 5/10/2026 at 8:32 AM…"
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            aria-label="Billing SMS text"
          />
          {parsed && (
            <div
              role="status"
              className={
                parsed.ok
                  ? "rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground"
                  : "rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              }
            >
              {parsed.ok ? (
                <span>
                  Parsed <strong>{formatKes(parsed.amount ?? 0, true)}</strong>
                  {parsed.reference ? ` · ref ${parsed.reference}` : ""}
                  {parsed.merchant ? ` · ${parsed.merchant}` : ""} — fields prefilled in the form.
                </span>
              ) : (
                parsed.reason
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => parseSms(smsText)} disabled={smsText.trim().length < 8}>
              Parse
            </Button>
            <Button
              disabled={!parsed?.ok}
              onClick={() => {
                setOpen(true);
                setSmsOpen(false);
              }}
            >
              Continue to form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary chips */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Spend this month</CardDescription>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {summary ? formatKes(summary.spend) : <Skeleton className="h-6 w-24" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Blended cost / GB</CardDescription>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {summary ? (summary.cpg != null ? formatKes(summary.cpg, true) : "—") : <Skeleton className="h-6 w-20" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardDescription>Bills this month</CardDescription>
          </CardHeader>
          <CardContent className="text-xl font-semibold">
            {summary ? summary.count : <Skeleton className="h-6 w-10" />}
          </CardContent>
        </Card>
      </div>

      {/* Entries table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Billing history</CardTitle>
          <CardDescription>Newest first · deletion asks for confirmation</CardDescription>
        </CardHeader>
        <CardContent>
          {entriesStale && entries && (
            <div className="mb-3">
              <StaleDataNotice asOf={entriesAsOf} offline={!online} />
            </div>
          )}
          {loadError ? (
            online ? (
              <ErrorState
                title="Billing history unavailable"
                message={`The billing history request failed (${loadError}).`}
                onRetry={load}
                retrying={retrying}
              />
            ) : (
              <OfflineEmptyState
                title="Offline — billing history unavailable"
                onRetry={load}
                retrying={retrying}
              />
            )
          ) : !entries ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Info className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
              <p className="text-sm font-medium">No bills yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Add your first bill or paste an M-Pesa SMS — cost-per-GB tracking starts with the
                first entry.
              </p>
              <Button size="sm" className="mt-1 gap-2" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add your first bill
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                    <TableHead className="text-right">Cost / GB</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e) => {
                    const cpg = costPerGb(e.amountKes, e.dataGb);
                    return (
                      <TableRow key={e.id}>
                        <TableCell>
                          <div className="font-medium">{e.providerName}</div>
                          {e.planName && <div className="text-xs text-muted-foreground">{e.planName}</div>}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{e.periodMonth}</TableCell>
                        <TableCell className="text-right font-medium">{formatKes(e.amountKes)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatGb(e.dataGb)}</TableCell>
                        <TableCell className="text-right">{cpg != null ? formatKes(cpg, true) : "—"}</TableCell>
                        <TableCell>
                          <Badge variant={e.source === "sms" ? "default" : "outline"} className="text-[10px] uppercase">
                            {e.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {/* destructive confirmation per audit 001 F-07 / checklist §19 */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                aria-label={`Delete ${e.providerName} bill for ${e.periodMonth}`}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this bill?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {e.providerName} · {e.periodMonth} · {formatKes(e.amountKes)} — this
                                  permanently removes the entry from your local ledger and your
                                  cost-per-GB totals will recalculate.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                  onClick={() => remove(e.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
