// Special NFT skins drive their visual accents; no ownership or combat rules change.
export function evoAppearance(chroma?: string | null, rarity?: string | null) {
  const skin = chroma?.toLowerCase(), tier = rarity?.toLowerCase();
  if (skin === "super" || skin === "epic" || tier === "epic")
    return { tier: "epic", borderFilter: "sepia(1) saturate(3) hue-rotate(5deg)", glow: "radial-gradient(ellipse at center, rgba(245,190,60,0.18) 0%, rgba(245,190,60,0.07) 45%, transparent 72%)" } as const;
  if (skin === "chroma" || tier === "chroma")
    return { tier: "chroma", borderFilter: "sepia(1) saturate(3) hue-rotate(210deg)", glow: "radial-gradient(ellipse at center, rgba(174,100,255,0.18) 0%, rgba(174,100,255,0.07) 45%, transparent 72%)" } as const;
  return { tier: "common", borderFilter: "none", glow: "none" } as const;
}
