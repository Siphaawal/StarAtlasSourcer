"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Img = { path: string; position?: number };

/**
 * Renders a submission's image(s) to fill a relatively-positioned square parent
 * (same layout as SubmissionThumbs) but clickable — opens a full-size lightbox
 * with keyboard + arrow navigation for multi-image submissions.
 */
export function SubmissionLightbox({ images, alt = "submission" }: { images: Img[]; alt?: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setIndex(null), []);
  const prev = useCallback(() => setIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length)), [images.length]);
  const next = useCallback(() => setIndex((i) => (i === null ? i : (i + 1) % images.length)), [images.length]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, close, prev, next]);

  if (!images || images.length === 0) {
    return <div className="absolute inset-0 flex items-center justify-center text-[#2f4068]">no image</div>;
  }

  const single = images.length === 1;
  const cols = images.length <= 4 ? "grid-cols-2" : "grid-cols-3";

  const thumbs = single ? (
    <button onClick={() => setIndex(0)} className="absolute inset-0 cursor-zoom-in" aria-label="Enlarge image">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[0].path} alt={alt} className="h-full w-full object-contain" />
    </button>
  ) : (
    <div className={`absolute inset-0 grid ${cols} gap-0.5`}>
      {images.map((img, i) => (
        <button key={i} onClick={() => setIndex(i)} className="relative cursor-zoom-in bg-[#0a0e1c]" aria-label={`Enlarge image ${i + 1}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.path} alt={`${alt} ${i + 1}`} className="h-full w-full object-cover" />
          <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[9px] font-medium text-[#e7eefc]">{i + 1}</span>
        </button>
      ))}
    </div>
  );

  const overlay =
    index !== null && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            onClick={close}
          >
            <button onClick={close} className="absolute right-4 top-4 text-2xl text-[#8da2c7] hover:text-white" aria-label="Close">
              ✕
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-[#1f2c47] bg-[#0a0e1c]/80 px-4 py-3 text-xl text-[#e7eefc] hover:border-[#34e0ff]/50"
                  aria-label="Previous"
                >
                  ‹
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-[#1f2c47] bg-[#0a0e1c]/80 px-4 py-3 text-xl text-[#e7eefc] hover:border-[#34e0ff]/50"
                  aria-label="Next"
                >
                  ›
                </button>
              </>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[index].path}
              alt={`${alt} ${index + 1}`}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            />

            {images.length > 1 && (
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-[#1f2c47] bg-[#0a0e1c]/80 px-3 py-1 text-sm text-[#e7eefc]">
                {index + 1} / {images.length}
              </span>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {thumbs}
      {overlay}
    </>
  );
}
