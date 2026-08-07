import { useState } from "react";
import {
  Search, ArrowRight, RefreshCw, CheckCircle2, Copy,
  Users, BookOpen, Heart, FileText, Smile, Star,
  Mail, Hash, Link2, ClipboardList, ShieldAlert,
  ChevronDown, ChevronUp, AlertTriangle, Info,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { projectId } from "../../utils/supabase/info";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6d579fee`;

// ─── helpers ──────────────────────────────────────────────────────────────────

function clip(text: string) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => clipFallback(text));
  } else {
    clipFallback(text);
  }
  toast.success("Copied to clipboard");
}

function clipFallback(text: string) {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
  document.body.appendChild(el);
  el.focus();
  el.select();
  try { document.execCommand("copy"); } catch (_) { /* silent */ }
  document.body.removeChild(el);
}

function fmt(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function DataBadge({ icon: Icon, count, label }: { icon: any; count: number; label: string }) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
      style={{ background: "var(--primary-50)", color: "var(--primary-700)", border: "1px solid var(--primary-200)" }}>
      <Icon className="w-3 h-3" />{count} {label}
    </span>
  );
}

function UidRow({ uid, label, onSelect, selected }: {
  uid: string; label?: string; onSelect?: () => void; selected?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs w-20 flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>{label}</span>}
      <code className="flex-1 text-xs px-2 py-1 rounded truncate"
        style={{ background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
        {uid}
      </code>
      <button onClick={() => clip(uid)} className="p-1.5 rounded flex-shrink-0"
        style={{ color: "var(--muted-foreground)" }} title="Copy">
        <Copy className="w-3.5 h-3.5" />
      </button>
      {onSelect && (
        <button onClick={onSelect}
          className="text-xs px-2 py-1 rounded flex-shrink-0 font-medium transition-colors"
          style={selected
            ? { background: "var(--success-500)", color: "#fff" }
            : { background: "var(--primary-100)", color: "var(--primary-700)" }}>
          {selected ? "✓ Selected" : "Use this"}
        </button>
      )}
    </div>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium"
      style={{ color: active ? "var(--success-600)" : "var(--error-600)" }}>
      <span className="w-2 h-2 rounded-full inline-block"
        style={{ background: active ? "var(--success-500)" : "var(--error-500)" }} />
      {active ? "Auth active" : "Auth deleted"}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Method = "couple" | "email" | "audit" | "uid";
type Step = 1 | 2 | 3;

export function AccountRecovery({ accessToken }: { accessToken?: string }) {
  // ── Step tracking ─────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1);
  const [method, setMethod] = useState<Method>("couple");

  // ── Discovered old user ID ────────────────────────────────────────────────
  const [oldUserId, setOldUserId] = useState("");
  const [oldUserLabel, setOldUserLabel] = useState(""); // human label for display

  // ── New user ID ───────────────────────────────────────────────────────────
  const [newUserId, setNewUserId] = useState("");

  // ── Search inputs ─────────────────────────────────────────────────────────
  const [searchEmail, setSearchEmail] = useState("");
  const [searchAuditEmail, setSearchAuditEmail] = useState("");
  const [searchPrayerId, setSearchPrayerId] = useState("");
  const [searchUid, setSearchUid] = useState("");

  // ── Search results ────────────────────────────────────────────────────────
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState("");

  // ── Migration ─────────────────────────────────────────────────────────────
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` };

  // ─── Search handlers ───────────────────────────────────────────────────────

  async function searchCouple() {
    setSearching(true); setSearched(false); setSearchError(""); setResults([]);
    try {
      const body: any = {};
      if (searchUid.trim()) body.targetUserId = searchUid.trim();
      const res = await fetch(`${BASE}/admin/scan-couple-history`, {
        method: "POST", headers, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");

      const found: any[] = [
        ...(data.couples || []).map((c: any) => ({
          userId: c.orphanedUserId,
          label: c.orphanedProfile ? `${c.orphanedProfile.name} (${c.orphanedProfile.email})` : "Unknown profile",
          source: "Couple record",
          authExists: false,
          dataCounts: c.dataCounts,
          detail: `Partner: ${c.liveProfile?.name || "unknown"} · Linked: ${fmt(c.coupleCreatedAt)}`,
        })),
        ...(data.orphanedPartnerRefs || []).map((r: any) => ({
          userId: r.orphanedUserId,
          label: `Partner of ${r.liveUser.name} (${r.liveUser.email})`,
          source: "Partner reference",
          authExists: false,
          dataCounts: {},
          detail: `Still referenced in ${r.liveUser.email}'s profile`,
        })),
      ];
      setResults(found);
      setSearched(true);
      if (found.length === 0) setSearchError("No orphaned couple records found. Try another method.");
    } catch (e: any) {
      setSearchError(e.message);
    } finally {
      setSearching(false);
    }
  }

  async function searchEmail_() {
    if (!searchEmail.trim()) return;
    setSearching(true); setSearched(false); setSearchError(""); setResults([]);
    try {
      const res = await fetch(`${BASE}/admin/find-orphaned-data`, {
        method: "POST", headers, body: JSON.stringify({ email: searchEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      const accounts: any[] = data.accounts || [];
      setResults(accounts.map((a: any) => ({
        userId: a.userId,
        label: `${a.name || "?"} — ${a.email}`,
        source: "KV profile",
        authExists: a.authExists,
        dataCounts: a.dataCounts,
        detail: `Created: ${fmt(a.createdAt)}${a.partnerName ? ` · Partner: ${a.partnerName}` : ""}`,
      })));
      setSearched(true);
      if (accounts.length === 0) setSearchError("No KV profiles found for this email.");
    } catch (e: any) {
      setSearchError(e.message);
    } finally {
      setSearching(false);
    }
  }

  async function searchAudit() {
    if (!searchAuditEmail.trim() && !searchPrayerId.trim()) return;
    setSearching(true); setSearched(false); setSearchError(""); setResults([]);
    try {
      const body: any = {};
      if (searchAuditEmail.trim()) body.email = searchAuditEmail.trim();
      if (searchPrayerId.trim()) body.prayerId = searchPrayerId.trim();
      const res = await fetch(`${BASE}/admin/find-user-id-from-audit`, {
        method: "POST", headers, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      if (!data.found) { setSearchError(data.message || "No matches in audit log."); setSearched(true); return; }
      setResults((data.results || []).map((r: any) => ({
        userId: r.userId,
        label: `${r.userName || "?"} — ${r.userEmail}`,
        source: "Audit log",
        authExists: r.authExists,
        dataCounts: r.dataCounts,
        detail: `${r.auditEventCount} log entries · Has KV profile: ${r.hasKVProfile ? "yes" : "no"}`,
      })));
      setSearched(true);
    } catch (e: any) {
      setSearchError(e.message);
    } finally {
      setSearching(false);
    }
  }

  async function useDirectUid() {
    const uid = searchUid.trim();
    if (!uid) return;
    setSearching(true); setSearchError("");
    try {
      // Fetch data counts from KV to confirm the ID has data
      const res = await fetch(`${BASE}/admin/find-orphaned-data`, {
        method: "POST", headers, body: JSON.stringify({ userId: uid }),
      });
      // Don't require success — even an empty profile is fine, user knows the ID
      let label = `User ID: ${uid}`;
      if (res.ok) {
        const data = await res.json();
        const match = (data.accounts || []).find((a: any) => a.userId === uid);
        if (match) label = `${match.name || "?"} — ${match.email}`;
      }
      selectOldUser(uid, label);
    } catch {
      // Still proceed even if lookup fails — user knows what they're doing
      selectOldUser(uid, `User ID: ${uid}`);
    } finally {
      setSearching(false);
    }
  }

  function runSearch() {
    setResults([]); setSearched(false); setSearchError("");
    if (method === "couple") searchCouple();
    else if (method === "email") searchEmail_();
    else if (method === "audit") searchAudit();
    else useDirectUid();
  }

  function selectOldUser(userId: string, label: string) {
    setOldUserId(userId);
    setOldUserLabel(label);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function runMigration() {
    if (!oldUserId || !newUserId.trim()) return;
    if (oldUserId === newUserId.trim()) {
      toast.error("FROM and TO user IDs are the same");
      return;
    }
    const confirmed = window.confirm(
      `Migrate ALL data from old account to new account?\n\n` +
      `FROM (old KV data): ${oldUserId}\n` +
      `TO   (active auth): ${newUserId.trim()}\n\n` +
      `This copies prayers, journals, moods, milestones, streaks, and more.\n` +
      `The old KV profile will be removed. No Auth account is touched.\n\n` +
      `Continue?`
    );
    if (!confirmed) return;
    setMigrating(true); setMigrationResult(null);
    try {
      const res = await fetch(`${BASE}/admin/migrate-user-data`, {
        method: "POST", headers,
        body: JSON.stringify({ fromUserId: oldUserId, toUserId: newUserId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Migration failed");
      setMigrationResult(data);
      setStep(3);
      toast.success("Migration complete!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setMigrating(false);
    }
  }

  // ─── render ────────────────────────────────────────────────────────────────

  const METHODS: { id: Method; icon: any; label: string; desc: string }[] = [
    { id: "couple", icon: Link2, label: "Couple History", desc: "Scan couple link records — most likely to survive deletion" },
    { id: "email", icon: Mail, label: "User Email", desc: "Search KV profiles by email address" },
    { id: "audit", icon: ClipboardList, label: "Audit Log", desc: "Search activity log by email or prayer ID" },
    { id: "uid", icon: Hash, label: "Known Old User ID", desc: "You already know the old user ID — enter it directly" },
  ];

  const DATA_ICONS: Record<string, any> = {
    prayers: Heart, journals: FileText, moods: Smile, milestones: Star,
    devotionalCompletions: BookOpen, questionResponses: Users,
    streaks: RefreshCw, scriptureMemory: BookOpen,
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <ShieldAlert className="w-5 h-5" style={{ color: "var(--primary-600)" }} />
          Account Recovery
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Find the old user ID, then migrate all KV data to the new active account.
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-0">
        {[
          { n: 1, label: "Find old user ID" },
          { n: 2, label: "Set new user ID" },
          { n: 3, label: "Done" },
        ].map(({ n, label }, i) => (
          <div key={n} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  background: step === n ? "var(--primary-600)" : step > n ? "var(--success-500)" : "var(--muted)",
                  color: step >= n ? "#fff" : "var(--muted-foreground)",
                }}>
                {step > n ? <CheckCircle2 className="w-4 h-4" /> : n}
              </div>
              <span className="text-sm font-medium whitespace-nowrap"
                style={{ color: step === n ? "var(--foreground)" : "var(--muted-foreground)" }}>
                {label}
              </span>
            </div>
            {i < 2 && <div className="w-8 h-px mx-2 flex-shrink-0" style={{ background: "var(--border)" }} />}
          </div>
        ))}
      </div>

      {/* ── STEP 1: Find old user ID ─────────────────────────────────────── */}
      {step === 1 && (
        <Card className="p-5 space-y-5">
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            Choose a search method:
          </p>

          {/* Method selector */}
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map(({ id, icon: Icon, label, desc }) => (
              <button key={id} onClick={() => { setMethod(id); setResults([]); setSearched(false); setSearchError(""); }}
                className="text-left rounded-lg p-3 transition-all"
                style={{
                  border: `2px solid ${method === id ? "var(--primary-500)" : "var(--border)"}`,
                  background: method === id ? "var(--primary-50)" : "var(--background)",
                }}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" style={{ color: method === id ? "var(--primary-600)" : "var(--muted-foreground)" }} />
                  <span className="text-sm font-semibold" style={{ color: method === id ? "var(--primary-700)" : "var(--foreground)" }}>
                    {label}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{desc}</p>
              </button>
            ))}
          </div>

          {/* Inputs per method */}
          <div className="space-y-3">
            {method === "couple" && (
              <div>
                <Label className="text-sm mb-1.5 block" style={{ color: "var(--foreground)" }}>
                  Filter by known user ID <span style={{ color: "var(--muted-foreground)" }}>(optional)</span>
                </Label>
                <Input value={searchUid} onChange={e => setSearchUid(e.target.value)}
                  placeholder="Leave blank to scan ALL couple records" className="font-mono text-sm" />
              </div>
            )}

            {method === "email" && (
              <div>
                <Label className="text-sm mb-1.5 block" style={{ color: "var(--foreground)" }}>User email address</Label>
                <Input type="email" value={searchEmail} onChange={e => setSearchEmail(e.target.value)}
                  placeholder="e.g. fireksf@gmail.com" />
              </div>
            )}

            {method === "audit" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm mb-1.5 block" style={{ color: "var(--foreground)" }}>Email address</Label>
                  <Input type="email" value={searchAuditEmail} onChange={e => setSearchAuditEmail(e.target.value)}
                    placeholder="e.g. fireksf@gmail.com" />
                </div>
                <div>
                  <Label className="text-sm mb-1.5 block" style={{ color: "var(--foreground)" }}>
                    Prayer ID <span style={{ color: "var(--muted-foreground)" }}>(optional)</span>
                  </Label>
                  <Input value={searchPrayerId} onChange={e => setSearchPrayerId(e.target.value)}
                    placeholder="e.g. 1781549942704-7ghvmoryx" className="font-mono text-sm" />
                </div>
              </div>
            )}

            {method === "uid" && (
              <div>
                <Label className="text-sm mb-1.5 block" style={{ color: "var(--foreground)" }}>
                  Old user ID <span style={{ color: "var(--muted-foreground)" }}>— the deleted account whose data you want to recover</span>
                </Label>
                <Input value={searchUid} onChange={e => setSearchUid(e.target.value)}
                  placeholder="UUID of the old / deleted account" className="font-mono text-sm" />
                <p className="text-xs mt-1.5" style={{ color: "var(--muted-foreground)" }}>
                  Clicking Search will jump straight to Step 2 using this ID as the data source.
                </p>
              </div>
            )}
          </div>

          <Button className="w-full" onClick={runSearch} disabled={searching}>
            {searching
              ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />{method === "uid" ? "Looking up…" : "Searching…"}</>
              : method === "uid"
                ? <><ArrowRight className="w-4 h-4 mr-2" />Use this old user ID → Step 2</>
                : <><Search className="w-4 h-4 mr-2" />Search</>}
          </Button>

          {/* Error */}
          {searchError && (
            <div className="rounded-lg p-3 flex gap-2 text-sm"
              style={{ background: "var(--error-50)", border: "1px solid var(--error-200)", color: "var(--error-700)" }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {searchError}
            </div>
          )}

          {/* Results */}
          {searched && results.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {results.length} candidate{results.length > 1 ? "s" : ""} found — select the old account:
              </p>
              {results.map((r, i) => (
                <div key={i} className="rounded-lg p-4 space-y-3"
                  style={{ border: "1px solid var(--border)", background: "var(--background)" }}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{r.label}</p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        via {r.source} · {r.detail}
                      </p>
                    </div>
                    <StatusDot active={r.authExists} />
                  </div>

                  {/* Data counts */}
                  {r.dataCounts && Object.keys(r.dataCounts).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(r.dataCounts).map(([k, v]: any) => (
                        <DataBadge key={k} icon={DATA_ICONS[k] || Star} count={v} label={k} />
                      ))}
                    </div>
                  )}

                  <UidRow uid={r.userId} label="Old ID" />

                  <Button size="sm" className="w-full" onClick={() => selectOldUser(r.userId, r.label)}
                    style={{ background: "var(--primary-600)", color: "var(--primary-foreground)" }}>
                    Use this as the old user ID →
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── STEP 2: Set new user ID & migrate ───────────────────────────── */}
      {step === 2 && (
        <Card className="p-5 space-y-5">
          {/* What we found */}
          <div className="rounded-lg p-4 space-y-2"
            style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
              Old user ID (source)
            </p>
            <p className="text-sm" style={{ color: "var(--foreground)" }}>{oldUserLabel}</p>
            <UidRow uid={oldUserId} />
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              KV data (prayers, journals, moods…) will be copied FROM this ID.
            </p>
          </div>

          {/* New user ID input */}
          <div>
            <Label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--foreground)" }}>
              New user ID — the active Supabase Auth account
            </Label>
            <Input value={newUserId} onChange={e => setNewUserId(e.target.value)}
              placeholder="UUID of the new / active account" className="font-mono text-sm" />
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              All data will be copied TO this ID. This account's Auth is kept intact.
            </p>
          </div>

          {/* Migration summary */}
          {newUserId.trim() && newUserId.trim() !== oldUserId && (
            <div className="rounded-lg p-3 space-y-2"
              style={{ background: "var(--primary-50)", border: "1px solid var(--primary-200)" }}>
              <div className="flex items-start gap-2 text-xs">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--primary-500)" }} />
                <span style={{ color: "var(--primary-700)" }}>
                  Migration copies prayers, journals, moods, milestones, devotional completions,
                  question responses, streaks and scripture memory — then removes the old KV profile.
                  <strong> No Supabase Auth account is deleted.</strong>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="rounded p-2" style={{ background: "var(--muted)" }}>
                  <p className="font-semibold mb-0.5" style={{ color: "var(--muted-foreground)" }}>FROM (old KV data)</p>
                  <code className="break-all" style={{ color: "var(--foreground)" }}>{oldUserId}</code>
                </div>
                <div className="rounded p-2" style={{ background: "var(--success-50)", border: "1px solid var(--success-200)" }}>
                  <p className="font-semibold mb-0.5" style={{ color: "var(--success-700)" }}>TO (active auth)</p>
                  <code className="break-all" style={{ color: "var(--foreground)" }}>{newUserId.trim()}</code>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              ← Back
            </Button>
            <Button className="flex-2" onClick={runMigration}
              disabled={migrating || !newUserId.trim() || newUserId.trim() === oldUserId}
              style={{ background: "var(--primary-600)", color: "var(--primary-foreground)", flex: 2 }}>
              {migrating
                ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Migrating…</>
                : <><ArrowRight className="w-4 h-4 mr-2" />Run Migration</>}
            </Button>
          </div>
        </Card>
      )}

      {/* ── STEP 3: Done ─────────────────────────────────────────────────── */}
      {step === 3 && migrationResult && (
        <Card className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8" style={{ color: "var(--success-500)" }} />
            <div>
              <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Migration complete</p>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                All data has been moved to the new account.
              </p>
            </div>
          </div>

          {/* Counts */}
          {migrationResult.migrated && (
            <div className="rounded-lg p-4" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
              <p className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>Items migrated:</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(migrationResult.migrated)
                  .filter(([k]) => k !== "oldProfileDeleted")
                  .map(([k, v]: any) => {
                    const Icon = DATA_ICONS[k] || Star;
                    return (
                      <div key={k} className="rounded p-2 text-center"
                        style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                        <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: "var(--primary-500)" }} />
                        <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{v}</p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{k}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="rounded-lg p-3 text-sm space-y-1"
            style={{ background: "var(--success-50)", border: "1px solid var(--success-200)", color: "var(--success-700)" }}>
            <p><strong>FROM</strong> (old KV data): <code className="text-xs">{oldUserId}</code></p>
            <p><strong>TO</strong> (active auth): <code className="text-xs">{newUserId}</code></p>
            <p className="mt-2">The user can now log in with their email and access all their data.</p>
          </div>

          <Button className="w-full" variant="outline" onClick={() => {
            setStep(1); setOldUserId(""); setOldUserLabel(""); setNewUserId("");
            setResults([]); setSearched(false); setMigrationResult(null);
          }}>
            Start another recovery
          </Button>
        </Card>
      )}
    </div>
  );
}
