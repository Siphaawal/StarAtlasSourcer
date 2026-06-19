/* Renders a submission's image(s) to fill a relatively-positioned square parent.
   Single image → contained; multiple → a tight grid of covers. */

type Img = { path: string; position?: number };

export function SubmissionThumbs({ images, alt = "submission" }: { images: Img[]; alt?: string }) {
  if (!images || images.length === 0) {
    return <div className="absolute inset-0 flex items-center justify-center text-[#2f4068]">no image</div>;
  }

  if (images.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={images[0].path} alt={alt} className="absolute inset-0 h-full w-full object-contain" />
    );
  }

  const cols = images.length <= 4 ? "grid-cols-2" : "grid-cols-3";
  return (
    <div className={`absolute inset-0 grid ${cols} gap-0.5`}>
      {images.map((img, i) => (
        <div key={i} className="relative bg-[#0a0e1c]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.path} alt={`${alt} ${i + 1}`} className="h-full w-full object-cover" />
          <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[9px] font-medium text-[#e7eefc]">
            {i + 1}
          </span>
        </div>
      ))}
    </div>
  );
}
