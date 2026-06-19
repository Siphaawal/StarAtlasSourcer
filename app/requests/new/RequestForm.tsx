"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRequest } from "@/app/actions/requests";
import { createTemplate, deleteTemplate } from "@/app/actions/templates";

const FORMATS = ["PNG", "JPG", "WEBP", "SVG"];
const ASPECTS = ["1:1", "16:9", "4:3", "3:2", "9:16", "2:1"];

export type Spec = {
  assetType: string;
  tierMin: number;
  tierMax: number;
  aspectRatio: string;
  resolution: string;
  format: string;
  maxFileSizeMB: number;
  colorPalette: string;
  styleNotes: string;
};

export type TemplateOption = Spec & { id: string; name: string; ownerId: string };
export type RequestOption = Spec & { id: string; title: string };

const DEFAULT_SPEC: Spec = {
  assetType: "",
  tierMin: 1,
  tierMax: 5,
  aspectRatio: "1:1",
  resolution: "1024x1024",
  format: "PNG",
  maxFileSizeMB: 10,
  colorPalette: "",
  styleNotes: "",
};

function pickSpec(s: Spec): Spec {
  return {
    assetType: s.assetType,
    tierMin: s.tierMin,
    tierMax: s.tierMax,
    aspectRatio: s.aspectRatio,
    resolution: s.resolution,
    format: s.format,
    maxFileSizeMB: s.maxFileSizeMB,
    colorPalette: s.colorPalette,
    styleNotes: s.styleNotes,
  };
}

export function RequestForm({
  templates,
  requests,
  currentUserId,
  isAdmin,
}: {
  templates: TemplateOption[];
  requests: RequestOption[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [spec, setSpec] = useState<Spec>(DEFAULT_SPEC);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedRequest, setSelectedRequest] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [savingTpl, setSavingTpl] = useState(false);
  const [quickMsg, setQuickMsg] = useState<string | null>(null);

  function set<K extends keyof Spec>(key: K, value: Spec[K]) {
    setSpec((s) => ({ ...s, [key]: value }));
  }

  function applyTemplate(id: string) {
    setSelectedTemplate(id);
    setQuickMsg(null);
    const t = templates.find((x) => x.id === id);
    if (t) {
      setSpec(pickSpec(t));
      setQuickMsg(`Applied template “${t.name}”.`);
    }
  }

  function copyFromRequest(id: string) {
    setSelectedRequest(id);
    setQuickMsg(null);
    const r = requests.find((x) => x.id === id);
    if (r) {
      setSpec(pickSpec(r));
      setQuickMsg(`Copied requirements from “${r.title}”.`);
    }
  }

  async function saveTemplate() {
    setQuickMsg(null);
    if (!templateName.trim()) {
      setQuickMsg("Name the template first.");
      return;
    }
    setSavingTpl(true);
    const res = await createTemplate({ name: templateName.trim(), ...spec });
    setSavingTpl(false);
    if (!res.ok) {
      setQuickMsg(res.error || "Could not save template.");
      return;
    }
    setTemplateName("");
    setQuickMsg("Template saved.");
    router.refresh();
  }

  async function removeTemplate() {
    if (!selectedTemplate) return;
    const res = await deleteTemplate(selectedTemplate);
    if (!res.ok) {
      setQuickMsg(res.error || "Could not delete template.");
      return;
    }
    setSelectedTemplate("");
    setQuickMsg("Template deleted.");
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await createRequest(new FormData(e.currentTarget));
    if (!res.ok) {
      setError(res.error || "Failed to create request.");
      setSubmitting(false);
      return;
    }
    router.push(`/requests/${res.id}`);
    router.refresh();
  }

  const selectedTpl = templates.find((t) => t.id === selectedTemplate);
  const canDeleteSelected = selectedTpl && (isAdmin || selectedTpl.ownerId === currentUserId);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Quick fill */}
      <div className="panel space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#f5c451]">Quick fill</h2>
          <span className="text-xs text-[#5a6c8f]">Skip the repetitive clicks</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Apply a saved template</label>
            <div className="flex gap-2">
              <select value={selectedTemplate} onChange={(e) => applyTemplate(e.target.value)} className="input">
                <option value="">— Select template —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {canDeleteSelected && (
                <button type="button" onClick={removeTemplate} className="btn-danger px-3" title="Delete template">
                  ✕
                </button>
              )}
            </div>
            {templates.length === 0 && <p className="mt-1 text-xs text-[#5a6c8f]">No templates yet — save one below.</p>}
          </div>
          <div>
            <label className="label">Copy requirements from a request</label>
            <select value={selectedRequest} onChange={(e) => copyFromRequest(e.target.value)} className="input">
              <option value="">— Select request —</option>
              {requests.map((r) => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2 border-t border-[#1f2c47] pt-4">
          <div className="flex-1">
            <label className="label">Save current spec as a template</label>
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="input"
              placeholder="e.g. Square 1024 PNG — Aephia palette"
            />
          </div>
          <button type="button" onClick={saveTemplate} disabled={savingTpl} className="btn-gold">
            {savingTpl ? "Saving…" : "Save template"}
          </button>
        </div>
        {quickMsg && <p className="text-xs text-[#34e0ff]">{quickMsg}</p>}
      </div>

      <div className="panel space-y-4 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#34e0ff]">Bounty details</h2>
        <div>
          <label className="label">Title *</label>
          <input name="title" required className="input" placeholder="e.g. Warp Drive — Tiers 1-5" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea name="description" rows={3} className="input" placeholder="What you need and any context for creators." />
        </div>
        <div>
          <label className="label">Output image file name</label>
          <input name="outputFileName" className="input" placeholder="warp-drive-tier3" />
          <p className="mt-1 text-xs text-[#5a6c8f]">
            The accepted asset is committed to GitHub under this name. The file extension is added automatically — leave blank for an auto-generated name.
          </p>
        </div>
        <div>
          <label className="label">Asset type</label>
          <input name="assetType" value={spec.assetType} onChange={(e) => set("assetType", e.target.value)} className="input" placeholder="Warp Drive" />
        </div>
        <div>
          <label className="label">Platform</label>
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#e7eefc]">
              <input name="targetWeb" type="checkbox" defaultChecked className="h-4 w-4 accent-[#34e0ff]" />
              🌐 Web
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#e7eefc]">
              <input name="targetUE5" type="checkbox" className="h-4 w-4 accent-[#7b6cff]" />
              🎮 UE5 <span className="chip border-[#7b6cff]/40 text-[#a99bff]">coming soon</span>
            </label>
          </div>
          <p className="mt-1 text-[11px] text-[#5a6c8f]">Pick at least one. UE5 asset support is rolling out later.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Tier min</label>
            <input name="tierMin" type="number" min={1} value={spec.tierMin} onChange={(e) => set("tierMin", parseInt(e.target.value) || 1)} className="input" />
          </div>
          <div>
            <label className="label">Tier max</label>
            <input name="tierMax" type="number" min={1} value={spec.tierMax} onChange={(e) => set("tierMax", parseInt(e.target.value) || 1)} className="input" />
          </div>
          <div>
            <label className="label">Images required</label>
            <input name="imageCount" type="number" min={1} max={5} defaultValue={1} className="input" />
            <p className="mt-1 text-[11px] text-[#5a6c8f]">Max 5. Submitters must upload exactly this many.</p>
          </div>
        </div>
        <div className="sm:max-w-xs">
          <label className="label">Reward points (on accept)</label>
          <input name="rewardPoints" type="number" min={1} defaultValue={1} className="input" />
          <p className="mt-1 text-[11px] text-[#5a6c8f]">Points the author earns if accepted. Set higher for harder / UE5 work.</p>
        </div>
      </div>

      <div className="panel space-y-4 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#34e0ff]">Image requirements</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">Aspect ratio</label>
            <select name="aspectRatio" value={spec.aspectRatio} onChange={(e) => set("aspectRatio", e.target.value)} className="input">
              {ASPECTS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Resolution</label>
            <input name="resolution" value={spec.resolution} onChange={(e) => set("resolution", e.target.value)} className="input" placeholder="1024x1024" />
          </div>
          <div>
            <label className="label">Format</label>
            <select name="format" value={spec.format} onChange={(e) => set("format", e.target.value)} className="input">
              {FORMATS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Max file size (MB)</label>
            <input name="maxFileSizeMB" type="number" min={1} max={50} value={spec.maxFileSizeMB} onChange={(e) => set("maxFileSizeMB", parseInt(e.target.value) || 1)} className="input" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Color palette</label>
            <input name="colorPalette" value={spec.colorPalette} onChange={(e) => set("colorPalette", e.target.value)} className="input" placeholder="Deep space blues, AEP gold accents" />
          </div>
          <div>
            <label className="label">Style notes</label>
            <input name="styleNotes" value={spec.styleNotes} onChange={(e) => set("styleNotes", e.target.value)} className="input" placeholder="Clean sci-fi industrial, subtle glow" />
          </div>
        </div>
      </div>

      <div className="panel space-y-3 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#34e0ff]">Reference background</h2>
        <p className="text-xs text-[#8da2c7]">Optional. Upload the background you want creators to build on top of.</p>
        <input name="background" type="file" accept="image/*" className="input file:mr-3 file:rounded file:border-0 file:bg-[#1f2c47] file:px-3 file:py-1 file:text-[#e7eefc]" />
      </div>

      {error && <div className="panel border-[#ff5c7a]/40 p-3 text-sm text-[#ff5c7a]">{error}</div>}

      <div className="flex gap-3">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Creating…" : "Post Request"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-ghost">
          Cancel
        </button>
      </div>
    </form>
  );
}
