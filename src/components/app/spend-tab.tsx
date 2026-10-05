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
  const [entries, setEntries] = useState<BillingEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AddFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
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
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "The billing history request failed");
    } finally {
      setRetrying(false);
    }
  }, []);

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

  const submit = async () => {
    setFormError(null);
    const amountKes = Number(form.amountKes);
    const dataGb = Number(form.dataGb);
    if (!form.providerName.trim()) return setFormError("Provider is required.");
    if (!Number.isFinite(amountKes) || amountKes <= 0) return setFormError("Amount must be a positive number.");
    if (!Number.isFinite(dataGb) || dataGb <= 0) return setFormError("Data (GB) must be a positive number.");
    if (!/^\d{4}-\d{2}$/.test(form.periodMonth)) return setFormError("Period must match YYYY-MM.");

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
      const res = await fetch(`/api/entries?id=${encodeURIComponent(id)}`, { method: "DELETE" });
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
                    onChange={(e) => setForm({ ...form, providerName: e.target.value })}
                  />
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
                      onChange={(e) => setForm({ ...form, amountKes: e.target.value })}
                    />
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
                      onChange={(e) => setForm({ ...form, dataGb: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="period">Period (YYYY-MM)</Label>
                    <Input
                      id="period"
                      placeholder={currentPeriod()}
                      value={form.periodMonth}
                      onChange={(e) => setForm({ ...form, periodMonth: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="plan">Plan (optional)</Label>
                    <Input
                      id="plan"
                      placeholder="Fiber 40 Mbps"
                      value={form.planName}
                      onChange={(e) => setForm({ ...form, planName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ref">Payment reference (optional)</Label>
                  <Input
                    id="ref"
                    placeholder="M-Pesa code"
                    value={form.paymentRef}
                    onChange={(e) => setForm({ ...form, paymentRef: e.target.value })}
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
          <CardDescription>Newest first · tap the trash icon to remove an entry</CardDescription>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <ErrorState
              title="Billing history unavailable"
              message={`The billing history request failed (${loadError}).`}
              onRetry={load}
              retrying={retrying}
            />
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(e.id)}
                            aria-label={`Delete ${e.providerName} bill for ${e.periodMonth}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
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
