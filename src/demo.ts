import type { ActiveStream } from "./types";

const DEMO_POSTER = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1a1a2e"/>
      <stop offset="1" stop-color="#0f0f1a"/>
    </linearGradient>
    <linearGradient id="web" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#b11313"/>
      <stop offset="1" stop-color="#7a0c0c"/>
    </linearGradient>
  </defs>
  <rect width="400" height="600" fill="url(#bg)"/>
  <g stroke="url(#web)" stroke-width="6" fill="none" opacity="0.85">
    <circle cx="200" cy="250" r="40"/>
    <circle cx="200" cy="250" r="80"/>
    <circle cx="200" cy="250" r="120"/>
    <circle cx="200" cy="250" r="160"/>
    <circle cx="200" cy="250" r="200"/>
    <line x1="200" y1="50" x2="200" y2="450"/>
    <line x1="0" y1="250" x2="400" y2="250"/>
    <line x1="60" y1="110" x2="340" y2="390"/>
    <line x1="340" y1="110" x2="60" y2="390"/>
  </g>
  <text x="200" y="500" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#e5a00d" text-anchor="middle">SPIDER-MAN</text>
  <text x="200" y="530" font-family="Arial, sans-serif" font-size="18" fill="#9aa0a6" text-anchor="middle">2002 · Demo stream</text>
</svg>`);

const DEMO_BACKDROP = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#141426"/>
      <stop offset="1" stop-color="#2b0d0d"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <g stroke="#b11313" stroke-width="4" fill="none" opacity="0.35">
    <circle cx="640" cy="360" r="90"/>
    <circle cx="640" cy="360" r="180"/>
    <circle cx="640" cy="360" r="270"/>
    <circle cx="640" cy="360" r="360"/>
    <line x1="640" y1="0" x2="640" y2="720"/>
    <line x1="280" y1="360" x2="1000" y2="360"/>
  </g>
</svg>`);

/**
 * Demo stream shown when the card is empty. Displays the card's full
 * capabilities without any server dependency (built-in SVG artwork).
 */
export function buildDemoStream(): ActiveStream {
  const durationMs = 7_200_000; // 2h
  const progressPercent = 36;
  const remainingMs = Math.round(durationMs * (1 - progressPercent / 100));
  return {
    id: "demo-stream",
    state: "playing",
    user: { id: "demo", user_id: "demo", display_name: "Tautulli" },
    media: {
      id: "demo-media",
      rating_key: "demo",
      type: "movie",
      title: "Spider-Man",
      full_title: "Spider-Man (2002)",
      year: 2002,
      duration_seconds: 7200,
      summary: "A shy teenager is bitten by a genetically modified spider and uses his new spider-like abilities to fight injustice as a masked superhero.",
      content_rating: "PG-13",
      rating: 9,
      audience_rating: 8.9,
      genres: ["Action", "Adventure", "Science Fiction"],
      studio: "Marvel Enterprises",
      hierarchy: {},
      library: { id: "demo", name: "Movies" },
      images: { poster_url: DEMO_POSTER, backdrop_url: DEMO_BACKDROP },
    },
    playback: {
      progress_percent: progressPercent,
      duration_ms: durationMs,
      remaining_ms: remainingMs,
      paused_seconds: 0,
      // No upstream eta: the card computes a locale-formatted finish time
      // from remaining_ms, matching how a genuinely refreshing stream reads.
    },
    client: { product: "Plex Web", player: "Chrome", device: "Windows" },
    quality: {
      decision: "transcode",
      bandwidth_kbps: 21300,
      video_resolution: "1080",
      audio_codec: "eac3",
      audio_channel_layout: "5.1",
      audio_bitrate_kbps: 640,
    },
    images: { poster_url: DEMO_POSTER, backdrop_url: DEMO_BACKDROP },
  };
}
