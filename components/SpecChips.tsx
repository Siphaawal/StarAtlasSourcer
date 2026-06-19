type Req = {
  assetType: string;
  tierMin: number;
  tierMax: number;
  aspectRatio: string;
  resolution: string;
  format: string;
  maxFileSizeMB: number;
  imageCount: number;
};

export function SpecChips({ request }: { request: Req }) {
  const tier = request.tierMin === request.tierMax ? `Tier ${request.tierMin}` : `Tier ${request.tierMin}–${request.tierMax}`;
  const chips = [
    request.assetType && `🛠 ${request.assetType}`,
    `⬡ ${tier}`,
    request.imageCount > 1 && `🎞 ${request.imageCount} images`,
    `▭ ${request.aspectRatio}`,
    `⊞ ${request.resolution}`,
    `🖼 ${request.format}`,
    `≤ ${request.maxFileSizeMB}MB`,
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <span key={c} className="chip">
          {c}
        </span>
      ))}
    </div>
  );
}
