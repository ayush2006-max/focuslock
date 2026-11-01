export interface PresetGroup {
  id: string;
  label: string;
  domains: string[];
}

/** Optional starter packs. Nothing is blocked unless the user selects it. */
export const PRESET_GROUPS: PresetGroup[] = [
  {
    id: 'social',
    label: 'Social Media',
    domains: ['instagram.com', 'facebook.com', 'x.com', 'twitter.com', 'reddit.com', 'tiktok.com', 'linkedin.com'],
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    domains: ['youtube.com', 'netflix.com', 'twitch.tv', 'spotify.com', 'hulu.com'],
  },
  {
    id: 'news',
    label: 'News',
    domains: ['cnn.com', 'bbc.com', 'nytimes.com', 'theguardian.com', 'aljazeera.com'],
  },
  {
    id: 'gaming',
    label: 'Gaming',
    domains: ['roblox.com', 'store.steampowered.com', 'epicgames.com', 'chess.com'],
  },
];

export const TYPING_SENTENCES = [
  'Discipline creates freedom.',
  'Depth over distraction.',
  'One session at a time.',
  'Focus is a superpower.',
  'Do the hard thing now.',
  'Attention is your most valuable asset.',
];
