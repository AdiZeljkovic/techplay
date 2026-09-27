// Social tabs: which calendar channels, strategy entries, copy channels and doc feed each tab.
export const SOCIAL_TABS = [
  { id: "facebook", label: "Facebook", cal: ["facebook", "stories"], channels: ["ch06-facebook-page", "ch08-facebook-reels", "ch09-facebook-stories"], copy: /^Facebook$/, doc: "06-FACEBOOK", franchise: /facebook/i },
  { id: "facebook-groups", label: "Facebook Groups", cal: ["facebook-groups"], channels: ["ch07-facebook-groups"], copy: /Facebook Groups/, doc: "06-FACEBOOK", franchise: /groups/i },
  { id: "instagram", label: "Instagram", cal: ["instagram", "stories", "reels"], channels: ["ch10-instagram-feed", "ch11-instagram-carousel", "ch12-instagram-reels", "ch13-instagram-stories", "ch14-instagram-broadcast"], copy: /Instagram|Stories/, doc: "07-INSTAGRAM", franchise: /\bIG\b|instagram|carousel/i },
  { id: "tiktok", label: "TikTok", cal: ["tiktok"], channels: ["ch15-tiktok"], copy: /TikTok|Reels \/ Shorts/, doc: "08-TIKTOK", franchise: /tiktok/i },
  { id: "youtube", label: "YouTube", cal: ["youtube", "youtube-shorts"], channels: ["ch16-youtube-longform", "ch17-youtube-shorts", "ch18-youtube-community", "ch19-youtube-livestreams"], copy: /YouTube|Reels \/ Shorts/, doc: "09-YOUTUBE", franchise: /youtube|shorts/i },
  { id: "x", label: "X", cal: ["x"], channels: ["ch20-x"], copy: /^X$/, doc: "10-X-THREADS-BLUESKY", franchise: /\bX\b/ },
  { id: "threads", label: "Threads", cal: ["threads"], channels: ["ch21-threads"], copy: /Threads/, doc: "10-X-THREADS-BLUESKY", franchise: /threads/i },
  { id: "bluesky", label: "Bluesky", cal: ["bluesky"], channels: ["ch22-bluesky"], copy: /Bluesky/, doc: "10-X-THREADS-BLUESKY", franchise: /bluesky/i },
  { id: "reddit", label: "Reddit", cal: ["reddit"], channels: ["ch23-reddit"], copy: /Reddit/, doc: "11-REDDIT", franchise: /reddit/i },
  { id: "discord", label: "Discord", cal: ["discord"], channels: ["ch24-discord"], copy: /Discord/, doc: "12-DISCORD", franchise: /discord/i },
  { id: "twitch", label: "Twitch", cal: [], channels: ["ch25-twitch"], copy: /Twitch/, doc: "04-CHANNEL-STRATEGY", franchise: /twitch/i },
  { id: "linkedin", label: "LinkedIn", cal: [], channels: ["ch26-linkedin"], copy: /LinkedIn/, doc: "04-CHANNEL-STRATEGY", franchise: /linkedin/i },
] as const;
