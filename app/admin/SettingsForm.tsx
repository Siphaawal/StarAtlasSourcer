"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSettings, testGithubConnection } from "@/app/actions/settings";

type Settings = {
  upvoteThreshold: number;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  githubPathPrefix: string;
};

export function SettingsForm({ settings, tokenPresent }: { settings: Settings; tokenPresent: boolean }) {
  const router = useRouter();
  const [owner, setOwner] = useState(settings.githubOwner);
  const [repo, setRepo] = useState(settings.githubRepo);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    const res = await updateSettings(new FormData(e.currentTarget));
    setSaving(false);
    if (!res.ok) setError(res.error || "Save failed.");
    else {
      setSaved(true);
      router.refresh();
    }
  }

  async function onTest() {
    setTesting(true);
    setTestMsg(null);
    const res = await testGithubConnection(owner, repo);
    setTesting(false);
    setTestMsg({ ok: res.ok, text: res.message || res.error || "" });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="panel space-y-4 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#34e0ff]">Voting</h2>
        <div className="max-w-xs">
          <label className="label">Upvotes required for team review</label>
          <input
            name="upvoteThreshold"
            type="number"
            min={1}
            defaultValue={settings.upvoteThreshold}
            className="input"
          />
          <p className="mt-1 text-xs text-[#5a6c8f]">
            A submission becomes visible to the team once it hits this many community upvotes.
          </p>
        </div>
      </div>

      <div className="panel space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#34e0ff]">GitHub commit target</h2>
          <span className={`chip ${tokenPresent ? "border-[#3ce8a0]/50 text-[#3ce8a0]" : "border-[#ff5c7a]/50 text-[#ff5c7a]"}`}>
            {tokenPresent ? "Token set" : "No GITHUB_TOKEN"}
          </span>
        </div>
        {!tokenPresent && (
          <div className="rounded-lg border border-[#f5c451]/30 bg-[#f5c451]/5 p-3 text-xs text-[#f5c451]">
            Set <span className="font-mono">GITHUB_TOKEN</span> in <span className="font-mono">.env</span> (a PAT with repo
            contents:write) to enable commit-on-accept.
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Owner (user or org)</label>
            <input name="githubOwner" value={owner} onChange={(e) => setOwner(e.target.value)} className="input" placeholder="aephia-guild" />
          </div>
          <div>
            <label className="label">Repository</label>
            <input name="githubRepo" value={repo} onChange={(e) => setRepo(e.target.value)} className="input" placeholder="star-atlas-assets" />
          </div>
          <div>
            <label className="label">Branch</label>
            <input name="githubBranch" defaultValue={settings.githubBranch} className="input" placeholder="main" />
          </div>
          <div>
            <label className="label">Path prefix (folder)</label>
            <input name="githubPathPrefix" defaultValue={settings.githubPathPrefix} className="input" placeholder="assets" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onTest} disabled={testing} className="btn-ghost">
            {testing ? "Testing…" : "Test connection"}
          </button>
          {testMsg && (
            <span className={`text-xs ${testMsg.ok ? "text-[#3ce8a0]" : "text-[#ff5c7a]"}`}>{testMsg.text}</span>
          )}
        </div>
      </div>

      {error && <div className="panel border-[#ff5c7a]/40 p-3 text-sm text-[#ff5c7a]">{error}</div>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save settings"}
        </button>
        {saved && <span className="text-sm text-[#3ce8a0]">Saved ✓</span>}
      </div>
    </form>
  );
}
