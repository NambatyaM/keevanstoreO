"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/app/admin/nav";

type EmailStatus = {
  smtp_configured: boolean;
  cron_configured: boolean;
  queue_counts: {
    pending: number;
    sent: number;
    failed: number;
  };
};

export default function AdminEmailsPage() {
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(() => {
    fetch("/api/admin/email-status")
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch((err) => { console.error("Failed to load email status:", err); setError("Failed to load email status."); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleProcess = async () => {
    setProcessing(true);
    setProcessResult(null);
    try {
      const r = await fetch("/api/emails/process", { method: "POST" });
      const d = await r.json();
      setProcessResult(d.ok ? `Processed: ${d.processed} sent, ${d.failed} failed` : `Error: ${d.error}`);
      fetchStatus();
    } catch {
      setProcessResult("Request failed");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell title="Email System" subtitle="Monitor transactional email queue and configuration." nav={adminNav}>
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">Loading...</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Email System" subtitle="Monitor transactional email queue and configuration." nav={adminNav}>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">SMTP</h2>
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-block h-3 w-3 rounded-full ${status?.smtp_configured ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm font-semibold">{status?.smtp_configured ? "Configured" : "Not configured"}</span>
          </div>
          {!status?.smtp_configured && (
            <p className="mt-2 text-xs text-neutral-500">Set SMTP_HOST, SMTP_USER, and SMTP_PASS in environment variables.</p>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Cron (Automated Processing)</h2>
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-block h-3 w-3 rounded-full ${status?.cron_configured ? "bg-green-500" : "bg-yellow-500"}`} />
            <span className="text-sm font-semibold">{status?.cron_configured ? "Configured" : "Not configured"}</span>
          </div>
          {status?.cron_configured && (
            <p className="mt-2 text-xs text-neutral-500">Runs every 1 minute via Vercel Cron Jobs.</p>
          )}
          {!status?.cron_configured && (
            <p className="mt-2 text-xs text-neutral-500">Set CRON_SECRET in environment variables and deploy to enable automated processing.</p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-5 text-center">
          <p className="text-3xl font-black text-amber-600">{status?.queue_counts.pending ?? 0}</p>
          <p className="mt-1 text-sm font-semibold text-neutral-500">Pending</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5 text-center">
          <p className="text-3xl font-black text-green-600">{status?.queue_counts.sent ?? 0}</p>
          <p className="mt-1 text-sm font-semibold text-neutral-500">Sent</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5 text-center">
          <p className="text-3xl font-black text-red-600">{status?.queue_counts.failed ?? 0}</p>
          <p className="mt-1 text-sm font-semibold text-neutral-500">Failed</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Manual Processing</h2>
        <p className="mt-1 text-xs text-neutral-500">Trigger email processing immediately for any pending queue items.</p>
        <button
          onClick={handleProcess}
          disabled={processing}
          className="mt-3 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {processing ? "Processing..." : "Process Pending Emails"}
        </button>
        {processResult && (
          <p className="mt-2 text-sm font-semibold text-neutral-700">{processResult}</p>
        )}
      </div>
    </DashboardShell>
  );
}
