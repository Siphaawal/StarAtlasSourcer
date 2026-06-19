"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { submitAsset } from "@/app/actions/submissions";
import { SUBMISSION_DISCLAIMER } from "@/lib/constants";

export function SubmitForm({
  requestId,
  maxFileSizeMB,
  imageCount,
}: {
  requestId: string;
  maxFileSizeMB: number;
  imageCount: number;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const multi = imageCount > 1;
  const countMatches = files.length === imageCount;

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setOk(false);
    setError(null);
    const picked = Array.from(e.target.files ?? []);
    setFiles(picked);
    setPreviews(picked.map((f) => URL.createObjectURL(f)));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOk(false);
    if (files.length !== imageCount) {
      setError(`This request needs exactly ${imageCount} image${imageCount === 1 ? "" : "s"} — you selected ${files.length}.`);
      return;
    }
    if (!agreed) {
      setError("Please accept the submission terms before submitting.");
      return;
    }
    setSubmitting(true);
    const fd = new FormData(formRef.current!);
    fd.set("requestId", requestId);
    files.forEach((f) => fd.append("images", f));
    const res = await submitAsset(fd);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || "Submission failed.");
      return;
    }
    setOk(true);
    setFiles([]);
    setPreviews([]);
    setAgreed(false);
    formRef.current?.reset();
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="panel space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#e7eefc]">Submit your asset</h3>
        <span className={`chip ${countMatches ? "border-[#3ce8a0]/50 text-[#3ce8a0]" : "border-[#34e0ff]/40 text-[#34e0ff]"}`}>
          {files.length}/{imageCount} image{imageCount === 1 ? "" : "s"}
        </span>
      </div>
      <p className="text-xs text-[#8da2c7]">
        This request requires <span className="font-semibold text-[#e7eefc]">{imageCount}</span>{" "}
        image{imageCount === 1 ? "" : "s"}
        {multi ? " (e.g. one per tier)" : ""}. Max {maxFileSizeMB}MB each.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Title</label>
          <input name="title" className="input" placeholder={multi ? "Warp Drive concept set" : "Tier 3 concept"} />
        </div>
        <div>
          <label className="label">Image{multi ? "s" : ""} *</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple={multi}
            onChange={onPick}
            className="input file:mr-3 file:rounded file:border-0 file:bg-[#1f2c47] file:px-3 file:py-1 file:text-[#e7eefc]"
          />
          {multi && <p className="mt-1 text-[11px] text-[#5a6c8f]">Select all {imageCount} images at once.</p>}
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea name="notes" rows={2} className="input" placeholder="Prompt used, tool, anything the team should know." />
      </div>

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`preview ${i + 1}`} className="h-24 w-24 rounded-lg border border-[#1f2c47] object-cover" />
              <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[9px] text-[#e7eefc]">{i + 1}</span>
            </div>
          ))}
        </div>
      )}

      {/* ATMTA usage disclaimer */}
      <div className="rounded-lg border border-[#1f2c47] bg-[#0a0e1c] p-3">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#f5c451]">Submission terms</div>
        <p className="max-h-32 overflow-y-auto whitespace-pre-line text-[11px] leading-relaxed text-[#8da2c7]">
          {SUBMISSION_DISCLAIMER}
        </p>
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-[#e7eefc]">
          <input
            name="agree"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#34e0ff]"
          />
          <span>I have read and accept these terms, and confirm I hold the rights to this work.</span>
        </label>
      </div>

      {error && <div className="text-sm text-[#ff5c7a]">{error}</div>}
      {ok && <div className="text-sm text-[#3ce8a0]">Submitted! It&apos;s now live for the community to upvote.</div>}

      <button type="submit" disabled={submitting || !countMatches || !agreed} className="btn-primary">
        {submitting ? "Uploading…" : `Submit ${imageCount} image${imageCount === 1 ? "" : "s"} for review`}
      </button>
    </form>
  );
}
