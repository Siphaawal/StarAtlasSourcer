"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { redeemReward } from "@/app/actions/rewards";

export function RedeemForm({
  rewardId,
  pointCost,
  remaining,
  userPoints,
  signedIn,
  defaultAddress,
}: {
  rewardId: string;
  pointCost: number;
  remaining: number;
  userPoints: number;
  signedIn: boolean;
  defaultAddress: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState(defaultAddress);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const soldOut = remaining <= 0;
  const tooPoor = userPoints < pointCost;

  if (done) {
    return <div className="rounded-lg border border-[#3ce8a0]/40 bg-[#3ce8a0]/5 p-2 text-center text-xs text-[#3ce8a0]">Redeemed! The admin will send it to your wallet.</div>;
  }

  if (!signedIn) {
    return (
      <Link href="/signin" className="btn-ghost w-full text-sm">
        Sign in to redeem
      </Link>
    );
  }

  if (soldOut) return <button disabled className="btn-ghost w-full text-sm opacity-60">Sold out</button>;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={tooPoor}
        title={tooPoor ? `You need ${pointCost} points` : ""}
        className="btn-gold w-full text-sm"
      >
        {tooPoor ? `Need ${pointCost} pts` : `Redeem · ${pointCost} pts`}
      </button>
    );
  }

  async function submit() {
    setError(null);
    setSubmitting(true);
    const res = await redeemReward(rewardId, address);
    setSubmitting(false);
    if (!res.ok) return setError(res.error || "Failed.");
    setDone(true);
    router.refresh();
  }

  return (
    <div className="space-y-2 rounded-lg border border-[#1f2c47] bg-[#0a0e1c] p-3">
      <label className="label">Your Solana wallet (where the reward is sent)</label>
      <input value={address} onChange={(e) => setAddress(e.target.value)} className="input" placeholder="e.g. 7Xy9…base58 address" />
      <p className="text-[11px] text-[#5a6c8f]">Spends {pointCost} points. The admin pays out manually.</p>
      {error && <div className="text-xs text-[#ff5c7a]">{error}</div>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={submitting} className="btn-gold flex-1 text-sm">
          {submitting ? "Redeeming…" : `Confirm · ${pointCost} pts`}
        </button>
        <button onClick={() => setOpen(false)} className="btn-ghost text-sm">Cancel</button>
      </div>
    </div>
  );
}
