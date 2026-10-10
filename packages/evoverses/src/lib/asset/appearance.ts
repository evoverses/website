// Special NFT skins drive their visual accents; no ownership or combat rules change.
export function evoAppearance(chroma?: string | null, rarity?: string | null) {
  const skin = chroma?.toLowerCase(), tier = rarity?.toLowerCase();
  if (skin === "super" || skin === "epic" || tier === "epic")
    return { tier: "epic", borderFilter: "sepia(1) saturate(3) hue-rotate(5deg)", artShadow: "drop-shadow(0 0 10px rgba(245,176,38,0.48)) drop-shadow(0 0 24px rgba(245,176,38,0.24))", glow: "radial-gradient(ellipse at center, rgba(255,222,126,0.48) 0%, rgba(245,176,38,0.28) 36%, rgba(245,176,38,0.10) 60%, transparent 78%), radial-gradient(ellipse at 50% 85%, rgba(255,191,45,0.36) 0%, transparent 62%)" } as const;
  if (skin === "chroma" || tier === "chroma")
    return { tier: "chroma", borderFilter: "sepia(1) saturate(3) hue-rotate(210deg)", artShadow: "drop-shadow(0 0 10px rgba(166,72,255,0.48)) drop-shadow(0 0 24px rgba(166,72,255,0.24))", glow: "radial-gradient(ellipse at center, rgba(213,167,255,0.48) 0%, rgba(166,72,255,0.28) 36%, rgba(166,72,255,0.10) 60%, transparent 78%), radial-gradient(ellipse at 50% 85%, rgba(184,83,255,0.36) 0%, transparent 62%)" } as const;
  return { tier: "common", borderFilter: "none", artShadow: "none", glow: "none" } as const;
}
