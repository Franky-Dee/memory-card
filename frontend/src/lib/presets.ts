function svgDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function spriteAvatar(background: string, primary: string, accent: string, icon: string) {
  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="28" fill="${background}" />
      <rect x="14" y="14" width="100" height="100" rx="22" fill="rgba(255,255,255,0.05)" />
      <circle cx="64" cy="44" r="20" fill="${primary}" />
      <rect x="28" y="72" width="72" height="26" rx="13" fill="${primary}" />
      <g fill="${accent}">${icon}</g>
    </svg>
  `);
}

export const avatarPresets = [
  {
    id: "arcade-pad",
    label: "Arcade Pad",
    url: spriteAvatar(
      "#161327",
      "#8b5cf6",
      "#f8fafc",
      '<rect x="42" y="38" width="10" height="28" rx="4"/><rect x="33" y="47" width="28" height="10" rx="4"/><circle cx="81" cy="44" r="6"/><circle cx="93" cy="56" r="6"/>',
    ),
  },
  {
    id: "pixel-sword",
    label: "Pixel Sword",
    url: spriteAvatar(
      "#10213b",
      "#38bdf8",
      "#f8fafc",
      '<path d="M70 28l10 10-13 13 5 5-8 8-5-5-13 13-10-10 13-13-5-5 8-8 5 5 13-13z"/>',
    ),
  },
  {
    id: "mana-potion",
    label: "Mana Potion",
    url: spriteAvatar(
      "#1b1731",
      "#c084fc",
      "#f472b6",
      '<path d="M54 30h20v8l-4 8c14 6 20 16 20 28 0 15-11 26-26 26S38 89 38 74c0-12 6-22 20-28l-4-8v-8zm10 26c-12 0-18 8-18 17 0 10 8 18 18 18s18-8 18-18c0-9-6-17-18-17z"/>',
    ),
  },
  {
    id: "bonus-star",
    label: "Bonus Star",
    url: spriteAvatar(
      "#201225",
      "#f59e0b",
      "#fde68a",
      '<path d="M64 30l8 18 20 3-14 13 4 19-18-10-18 10 4-19-14-13 20-3 8-18z"/>',
    ),
  },
  {
    id: "ghost-byte",
    label: "Ghost Byte",
    url: spriteAvatar(
      "#141928",
      "#e2e8f0",
      "#22d3ee",
      '<path d="M64 28c-16 0-28 12-28 28v26l10-8 9 8 9-8 9 8 9-8 10 8V56c0-16-12-28-28-28zm-10 28a5 5 0 110 10 5 5 0 010-10zm20 0a5 5 0 110 10 5 5 0 010-10z"/>',
    ),
  },
  {
    id: "slime-core",
    label: "Slime Core",
    url: spriteAvatar(
      "#112018",
      "#22c55e",
      "#dcfce7",
      '<path d="M64 34c18 0 30 14 30 29 0 18-12 31-30 31S34 81 34 63c0-15 12-29 30-29zm-11 24a4 4 0 100 8 4 4 0 000-8zm22 0a4 4 0 100 8 4 4 0 000-8zm-11 16c-8 0-14 4-14 8h28c0-4-6-8-14-8z"/>',
    ),
  },
] as const;

export const bannerPresets = [
  { id: "hades-ii", label: "Hades II", url: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145350/header.jpg" },
  { id: "balatro", label: "Balatro", url: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2379780/header.jpg" },
  { id: "outer-wilds", label: "Outer Wilds", url: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/753640/header.jpg" },
  { id: "hifi-rush", label: "Hi-Fi RUSH", url: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1817230/header.jpg" },
  { id: "elden-ring", label: "ELDEN RING", url: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/header.jpg" },
  { id: "persona-3-reload", label: "Persona 3 Reload", url: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2161700/header.jpg" },
] as const;

export const landingCoverArt = [
  "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145350/library_600x900_2x.jpg",
  "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2379780/library_600x900_2x.jpg",
  "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/753640/library_600x900_2x.jpg",
  "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1817230/library_600x900_2x.jpg",
  "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/library_600x900_2x.jpg",
  "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2161700/library_600x900_2x.jpg",
] as const;
