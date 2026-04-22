export type FeedEntry = {
  id: string;
  actor: string;
  handle: string;
  action: string;
  game: string;
  score?: number;
  hours?: number;
  reactions: number;
  comments: number;
};

export type LibraryCard = {
  id: string;
  title: string;
  status: string;
  platform: string;
  hours: number;
  playthroughs: number;
  progress: number;
  note: string;
};

export type DiscoverCard = {
  id: string;
  name: string;
  handle: string;
  shareableId: string;
  tagline: string;
  followers: string;
};

export const reviewCategories = [
  "Gameplay",
  "Story",
  "Visual Design",
  "Art Direction",
  "Audio",
  "Performance",
  "World Design",
  "Replayability",
  "Innovation",
  "Emotional Impact",
];

export const feedEntries: FeedEntry[] = [
  {
    id: "f1",
    actor: "Franc",
    handle: "@francbyte",
    action: "posted a 91/100 review for",
    game: "Metaphor: ReFantazio",
    score: 91,
    reactions: 48,
    comments: 12,
  },
  {
    id: "f2",
    actor: "Kei Morgan",
    handle: "@keim",
    action: "started playing",
    game: "Hades II",
    reactions: 29,
    comments: 6,
  },
  {
    id: "f3",
    actor: "Mika Reed",
    handle: "@mikareed",
    action: "finished a replay of",
    game: "Alan Wake II",
    hours: 31,
    reactions: 34,
    comments: 9,
  },
];

export const discoverCards: DiscoverCard[] = [
  {
    id: "d1",
    name: "Kei Morgan",
    handle: "@keim",
    shareableId: "MC-89LQ",
    tagline: "Chasing stylish combat systems and perfect parries.",
    followers: "482 followers",
  },
  {
    id: "d2",
    name: "Mika Reed",
    handle: "@mikareed",
    shareableId: "MC-A2DM",
    tagline: "Narrative-first horror and weird indies.",
    followers: "361 followers",
  },
];

export const libraryCards: LibraryCard[] = [
  {
    id: "l1",
    title: "Metaphor: ReFantazio",
    status: "Playing",
    platform: "PC",
    hours: 42,
    playthroughs: 1,
    progress: 78,
    note: "Currently outlining the final review.",
  },
  {
    id: "l2",
    title: "Alan Wake II",
    status: "Replaying",
    platform: "PS5",
    hours: 31,
    playthroughs: 2,
    progress: 100,
    note: "Clean-up run for story notes and screenshots.",
  },
  {
    id: "l3",
    title: "Hades II",
    status: "Want to Play",
    platform: "PC",
    hours: 0,
    playthroughs: 0,
    progress: 0,
    note: "Queued for the next review sprint.",
  },
];

export const featuredLists = [
  {
    title: "Top 10 narrative swings",
    description: "Games that took a big creative shot and landed.",
  },
  {
    title: "Current backlog pressure",
    description: "The games most likely to steal the next weekend.",
  },
];

