"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function SignInForm({ devEnabled, discordEnabled }: { devEnabled: boolean; discordEnabled: boolean }) {
  const [username, setUsername] = useState("NovaPilot");
  const [role, setRole] = useState("MEMBER");
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      {discordEnabled && (
        <button
          onClick={() => signIn("discord", { callbackUrl: "/" })}
          className="btn w-full bg-[#5865F2] text-white hover:bg-[#6b77f5]"
        >
          Continue with Discord
        </button>
      )}

      {devEnabled && (
        <div className="space-y-4">
          {discordEnabled && (
            <div className="flex items-center gap-3 text-xs text-[#5a6c8f]">
              <span className="h-px flex-1 bg-[#1f2c47]" />
              DEV LOGIN
              <span className="h-px flex-1 bg-[#1f2c47]" />
            </div>
          )}
          <div>
            <label className="label">Username</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="label">Role (dev only)</label>
            <div className="grid grid-cols-3 gap-2">
              {["MEMBER", "TEAM", "ADMIN"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    role === r
                      ? "border-[#34e0ff] bg-[#34e0ff]/10 text-[#34e0ff]"
                      : "border-[#1f2c47] text-[#8da2c7] hover:border-[#34e0ff]/40"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await signIn("dev", { username, role, callbackUrl: "/" });
            }}
            className="btn-primary w-full"
          >
            {loading ? "Signing in…" : "Dev sign-in"}
          </button>
          <p className="text-center text-[11px] text-[#5a6c8f]">
            Dev login is for local testing only. Disable with <span className="font-mono">ENABLE_DEV_LOGIN=false</span>.
          </p>
        </div>
      )}

      {!devEnabled && !discordEnabled && (
        <p className="text-center text-sm text-[#ff5c7a]">
          No sign-in method configured. Set Discord credentials or enable dev login in <span className="font-mono">.env</span>.
        </p>
      )}
    </div>
  );
}
