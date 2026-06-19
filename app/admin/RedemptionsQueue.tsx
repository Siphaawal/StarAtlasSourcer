"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markRedemptionPaid, cancelRedemption } from "@/app/actions/rewards";

type Redemption = {
  id: string;
  pointsSpent: number;
  solanaAddress: string;
  createdAt: Date;
  reward: { name: string };
  user: { username: string | null; name: string | null };
};

export function RedemptionsQueue({ pending }: { pending: Redemption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [txById, setTxById] = useState<Record<string, string>>({});

  async function pay(id: string) {
    setError(null);
    setBusy(id);
    const res = await markRedemptionPaid(id, txById[id]);
    setBusy(null);
    if (!res.ok) return setError(res.error || "Failed.");
    router.refresh();
  }
  async function cancel(id: string) {
    setError(null);
    setBusy(id);
    const res = await cancelRedemption(id);
    setBusy(null);
    if (!res.ok) return setError(res.error || "Failed.");
    router.refresh();
  }

  return (
    <div className="panel space-y-3 p-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#f5c451]">Redemptions to pay out</h2>
        <p className="mt-1 text-xs text-[#8da2c7]">Send the reward to the wallet, then mark it paid (optionally record the tx). Cancelling refunds the points.</p>
      </div>
      {error && <div className="text-sm text-[#ff5c7a]">{error}</div>}
      {pending.length === 0 ? (
        <div className="rounded-lg border border-[#1f2c47] bg-[#0a0e1c] p-6 text-center text-sm text-[#8da2c7]">Nothing pending. 🎉</div>
      ) : (
        <div className="space-y-3">
          {pending.map((r) => (
            <div key={r.id} className="rounded-lg border border-[#1f2c47] bg-[#0a0e1c] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#e7eefc]">{r.reward.name}</div>
                  <div className="text-xs text-[#8da2c7]">
                    {r.user.username || r.user.name} · {r.pointsSpent} pts
                  </div>
                </div>
                <code className="break-all rounded bg-[#05070f] px-2 py-1 font-mono text-[11px] text-[#34e0ff]">{r.solanaAddress}</code>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  value={txById[r.id] || ""}
                  onChange={(e) => setTxById((m) => ({ ...m, [r.id]: e.target.value }))}
                  placeholder="tx signature (optional)"
                  className="input flex-1 text-xs"
                />
                <button onClick={() => pay(r.id)} disabled={busy === r.id} className="btn-success px-3 py-1.5 text-xs">Mark paid</button>
                <button onClick={() => cancel(r.id)} disabled={busy === r.id} className="btn-danger px-3 py-1.5 text-xs">Cancel &amp; refund</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
