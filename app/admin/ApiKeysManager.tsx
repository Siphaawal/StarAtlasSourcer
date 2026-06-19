"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createApiKey, revokeApiKey } from "@/app/actions/apikeys";

type Key = {
  id: string;
  name: string;
  prefix: string;
  revoked: boolean;
  lastUsedAt: Date | null;
  owner: { username: string | null; name: string | null };
};

export function ApiKeysManager({ keys }: { keys: Key[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setError(null);
    setRawKey(null);
    setCreating(true);
    const res = await createApiKey(name);
    setCreating(false);
    if (!res.ok) return setError(res.error || "Failed.");
    setRawKey(res.rawKey || null);
    setName("");
    router.refresh();
  }

  async function revoke(id: string) {
    const res = await revokeApiKey(id);
    if (!res.ok) return setError(res.error || "Failed.");
    router.refresh();
  }

  return (
    <div className="panel space-y-4 p-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#34e0ff]">Agent API keys</h2>
        <p className="mt-1 text-xs text-[#8da2c7]">
          Let team agents create collab requests via <span className="font-mono">POST /api/v1/requests</span> with{" "}
          <span className="font-mono">Authorization: Bearer &lt;key&gt;</span>.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1">
          <label className="label">New key label</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Nova's request bot" />
        </div>
        <button onClick={create} disabled={creating} className="btn-primary">
          {creating ? "Generating…" : "Generate key"}
        </button>
      </div>

      {rawKey && (
        <div className="rounded-lg border border-[#3ce8a0]/40 bg-[#3ce8a0]/5 p-3">
          <div className="mb-1 text-xs font-semibold text-[#3ce8a0]">Copy this key now — it won&apos;t be shown again:</div>
          <code className="block break-all rounded bg-[#05070f] p-2 font-mono text-xs text-[#e7eefc]">{rawKey}</code>
        </div>
      )}
      {error && <div className="text-sm text-[#ff5c7a]">{error}</div>}

      {keys.length > 0 && (
        <div className="divide-y divide-[#1f2c47] rounded-lg border border-[#1f2c47]">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-[#e7eefc]">
                  {k.name} {k.revoked && <span className="ml-1 text-xs text-[#ff5c7a]">(revoked)</span>}
                </div>
                <div className="font-mono text-xs text-[#5a6c8f]">
                  {k.prefix}…··· · {k.owner.username || k.owner.name} ·{" "}
                  {k.lastUsedAt ? `used ${new Date(k.lastUsedAt).toLocaleDateString()}` : "never used"}
                </div>
              </div>
              {!k.revoked && (
                <button onClick={() => revoke(k.id)} className="btn-danger px-3 py-1.5 text-xs">
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
