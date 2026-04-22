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

function abstractBanner(seed: string, primary: string, secondary: string, tertiary: string) {
  const wave = seed
    .split("")
    .map((character, index) => `${index === 0 ? "M" : "L"}${index * 70},${90 + ((character.charCodeAt(0) % 7) - 3) * 12}`)
    .join(" ");

  return svgDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 180" preserveAspectRatio="none">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="100%" stop-color="#090811" />
        </linearGradient>
        <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="${secondary}" stop-opacity="0.95" />
          <stop offset="100%" stop-color="${tertiary}" stop-opacity="0.65" />
        </linearGradient>
      </defs>
      <rect width="420" height="180" rx="28" fill="url(#bg)" />
      <circle cx="340" cy="42" r="86" fill="${secondary}" fill-opacity="0.18" />
      <circle cx="92" cy="154" r="120" fill="${tertiary}" fill-opacity="0.22" />
      <path d="M-20 122 C54 72 118 168 194 120 S336 38 442 104" stroke="url(#glow)" stroke-width="24" fill="none" stroke-linecap="round" />
      <path d="${wave}" stroke="rgba(255,255,255,0.35)" stroke-width="10" fill="none" stroke-linecap="round" />
      <rect x="24" y="24" width="112" height="16" rx="8" fill="rgba(255,255,255,0.08)" />
      <rect x="24" y="52" width="164" height="12" rx="6" fill="rgba(255,255,255,0.08)" />
    </svg>
  `);
}

const bannerPalette = [
  ["#8b5cf6", "#22d3ee", "#f472b6"],
  ["#312e81", "#38bdf8", "#a855f7"],
  ["#0f172a", "#f59e0b", "#fb7185"],
  ["#111827", "#34d399", "#60a5fa"],
  ["#1f1147", "#c084fc", "#fb7185"],
  ["#101828", "#f97316", "#22d3ee"],
] as const;

function paletteForSeed(seed: string) {
  const total = seed.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return bannerPalette[total % bannerPalette.length];
}

export function getDisplayBanner(source: string | null | undefined, accentColor = "#8b5cf6", seed = "memory-card") {
  if (source?.startsWith("data:image")) {
    return source;
  }
  const [, secondary, tertiary] = paletteForSeed(seed);
  return abstractBanner(seed, accentColor || "#8b5cf6", secondary, tertiary);
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
  { id: "aurora", label: "Aurora Drift", url: abstractBanner("aurora", "#8b5cf6", "#22d3ee", "#f472b6") },
  { id: "pulse", label: "Pulse Field", url: abstractBanner("pulse", "#312e81", "#38bdf8", "#a855f7") },
  { id: "ember", label: "Ember Ribbon", url: abstractBanner("ember", "#111827", "#f97316", "#fb7185") },
  { id: "verdant", label: "Verdant Echo", url: abstractBanner("verdant", "#0f172a", "#34d399", "#60a5fa") },
  { id: "synth", label: "Synth Bloom", url: abstractBanner("synth", "#1f1147", "#c084fc", "#fb7185") },
  { id: "signal", label: "Signal Mirage", url: abstractBanner("signal", "#101828", "#f59e0b", "#22d3ee") },
] as const;

export const landingCoverArt = [
  "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145350/library_600x900_2x.jpg",
  "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2379780/library_600x900_2x.jpg",
  "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/753640/library_600x900_2x.jpg",
  "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1817230/library_600x900_2x.jpg",
  "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/library_600x900_2x.jpg",
  "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2161700/library_600x900_2x.jpg",
] as const;
