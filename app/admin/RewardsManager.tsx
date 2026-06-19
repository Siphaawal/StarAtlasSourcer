"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createReward, setRewardActive, deleteReward } from "@/app/actions/rewards";

type Reward = {
  id: string;
  name: string;
  description: string;
  imagePath: string | null;
  pointCost: number;
  quantity: number;
  active: boolean;
  claimed: number;
  remaining: number;
};

export function RewardsManager({ rewards }: { rewards: Reward[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = e.currentTarget;
    const res = await createReward(new FormData(form));
    setSubmitting(false);
    if (!res.ok) return setError(res.error || "Failed.");
    form.reset();
    router.refresh();
  }

  async function toggle(id: string, active: boolean) {
    await setRewardActive(id, active);
    router.refresh();
  }
  async function remove(id: string) {
    const res = await deleteReward(id);
    if (!res.ok) setError(res.error || "Failed.");
    router.refresh();
  }

  return (
    <div className="panel space-y-5 p-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#f5c451]">Rewards</h2>
        <p className="mt-1 text-xs text-[#8da2c7]">Create rewards members can redeem with points. Availability counts down as people cash in.</p>
      </div>

      <form onSubmit={onCreate} className="grid gap-3 rounded-lg border border-[#1f2c47] bg-[#0a0e1c] p-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Reward name *</label>
          <input name="name" required className="input" placeholder="e.g. Pearce X4 Fighter (in-game)" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description</label>
          <textarea name="description" rows={2} className="input" placeholder="What the winner receives." />
        </div>
        <div>
          <label className="label">Point cost</label>
          <input name="pointCost" type="number" min={1} defaultValue={10} className="input" />
        </div>
        <div>
          <label className="label">Quantity available</label>
          <input name="quantity" type="number" min={1} defaultValue={1} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Image</label>
          <input name="image" type="file" accept="image/*" className="input file:mr-3 file:rounded file:border-0 file:bg-[#1f2c47] file:px-3 file:py-1 file:text-[#e7eefc]" />
        </div>
        {error && <div className="sm:col-span-2 text-sm text-[#ff5c7a]">{error}</div>}
        <div className="sm:col-span-2">
          <button type="submit" disabled={submitting} className="btn-gold">{submitting ? "Creating…" : "Add reward"}</button>
        </div>
      </form>

      {rewards.length > 0 && (
        <div className="divide-y divide-[#1f2c47] rounded-lg border border-[#1f2c47]">
          {rewards.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3">
              <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded border border-[#1f2c47] bg-[#0a0e1c]">
                {r.imagePath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.imagePath} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[#2f4068]">🚀</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-[#e7eefc]">{r.name}</div>
                <div className="text-xs text-[#5a6c8f]">{r.pointCost} pts · {r.remaining}/{r.quantity} left · {r.claimed} claimed</div>
              </div>
              <button onClick={() => toggle(r.id, !r.active)} className="btn-ghost px-3 py-1.5 text-xs">
                {r.active ? "Active" : "Hidden"}
              </button>
              <button onClick={() => remove(r.id)} className="btn-danger px-3 py-1.5 text-xs">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
