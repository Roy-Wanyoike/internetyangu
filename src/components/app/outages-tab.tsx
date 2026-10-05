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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Download, Loader2, Plus, ShieldCheck } from "lucide-react";
import { durationMin, relativeTime } from "@/lib/format";
import type { OutageEvent, Provider } from "@/lib/types";

function localIso(d: Date): string {
  // datetime-local wants "YYYY-MM-DDTHH:mm" in local time
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function OutagesTab() {
  const { toast } = useToast();
  const [outages, setOutages] = useState<OutageEvent[] | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [providerName, setProviderName] = useState<string>("");
  const [startedAt, setStartedAt] = useState<string>(localIso(new Date()));
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/outages", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setOutages((await res.json()) as OutageEvent[]);
    } catch {
      setOutages([]);
    }
  }, []);

  useEffect(() => {
    void load();
    fetch("/api/providers")
      .then((r) => r.json())
      .then((ps: Provider[]) => setProviders(ps))
      .catch(() => setProviders([]));
  }, [load]);

  const submit = async () => {
    setFormError(null);
    if (!providerName) return setFormError("Select the affected provider.");
    const started = new Date(startedAt);
    if (Number.isNaN(started.getTime())) return setFormError("Enter a valid start time.");
    if (started.getTime() > Date.now()) return setFormError("Start time cannot be in the future.");

    setSaving(true);
    try {
      const res = await fetch("/api/outages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerName,
          startedAt: started.toISOString(),
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      toast({ title: "Outage logged", description: `${providerName} · evidence clock started` });
      setProviderName("");
      setNotes("");
      setStartedAt(localIso(new Date()));
      setOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not log the outage.");
    } finally {
      setSaving(false);
    }
  };

  const closeOutage = async (id: string) => {
    try {
      const res = await fetch("/api/outages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
      toast({ title: "Outage closed", description: "Duration recorded in your evidence log." });
    } catch {
      toast({ title: "Could not close outage", variant: "destructive" });
    }
  };

  const exportEvidence = (o: OutageEvent) => {
    const evidence = {
      exportedAt: new Date().toISOString(),
      kind: "internetyangu-outage-evidence",
      version: 1,
      outage: {
        provider: o.providerName,
        startedAt: o.startedAt,
        endedAt: o.endedAt,
        durationMinutes: durationMin(o.startedAt, o.endedAt),
        notes: o.notes,
      },
      disclaimer:
        "Measured client-side by InternetYangu from the user's device. Timestamps are local device time. Supporting latency samples are retained locally in the user's own database.",
    };
    const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `outage-evidence-${o.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Evidence pack exported", description: "Attach it to a CA or operator complaint." });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Outage log</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Timestamped evidence for complaints, refunds and switching decisions — stored on your
            device, exportable as JSON.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" /> Report outage
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Report an outage</DialogTitle>
              <DialogDescription>
                Log it now, close it when you&apos;re back online. Duration is computed for you.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-1">
              <div className="grid gap-2">
                <Label htmlFor="outage-provider">Provider</Label>
                <Select value={providerName} onValueChange={setProviderName}>
                  <SelectTrigger id="outage-provider" aria-label="Select provider">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="outage-start">Started at</Label>
                <Input
                  id="outage-start"
                  type="datetime-local"
                  value={startedAt}
                  max={localIso(new Date())}
                  onChange={(e) => setStartedAt(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="outage-notes">Notes (optional)</Label>
                <Textarea
                  id="outage-notes"
                  rows={3}
                  placeholder="e.g. No sync on ONT; neighbours on same estate affected too."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                Log outage
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
            Evidence log
          </CardTitle>
          <CardDescription>Newest first · open outages are highlighted</CardDescription>
        </CardHeader>
        <CardContent>
          {!outages ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : outages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <ShieldCheck className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
              <p className="text-sm font-medium">No outages logged</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                When your connection drops, report it here. Over time this log becomes the evidence
                file that supports your complaint — or your switch to a better provider.
              </p>
              <Button size="sm" variant="outline" className="mt-1" onClick={() => setOpen(true)}>
                Report the first outage
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {outages.map((o) => {
                const dur = durationMin(o.startedAt, o.endedAt);
                return (
                  <li
                    key={o.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-card p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{o.providerName}</p>
                        {o.endedAt ? (
                          <Badge variant="outline">{dur != null ? `${dur} min` : "closed"}</Badge>
                        ) : (
                          <Badge variant="destructive">ongoing</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Started {relativeTime(o.startedAt)} ·{" "}
                        {new Date(o.startedAt).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        {o.endedAt
                          ? ` · ended ${new Date(o.endedAt).toLocaleString([], {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}`
                          : ""}
                      </p>
                      {o.notes && <p className="mt-2 text-sm text-muted-foreground">{o.notes}</p>}
                    </div>
                    <div className="flex gap-2">
                      {!o.endedAt && (
                        <Button variant="outline" size="sm" onClick={() => closeOutage(o.id)}>
                          Mark resolved
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => exportEvidence(o)}
                        aria-label={`Export evidence for ${o.providerName} outage`}
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        Evidence
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
