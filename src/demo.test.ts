import { describe, expect, it } from "vitest";
import { buildDemoStream } from "./demo";

describe("demo stream", () => {
  it("builds a complete playable-looking stream", () => {
    const demo = buildDemoStream();
    expect(demo.state).toBe("playing");
    expect(demo.media.title).toBe("Spider-Man");
    expect(demo.media.year).toBe(2002);
    expect(demo.user?.display_name).toBe("Tautulli");
    expect(demo.media.summary).toBeTruthy();
    expect(demo.media.genres?.length).toBeGreaterThan(0);
    expect(demo.playback.progress_percent).toBeGreaterThan(0);
    expect(demo.playback.progress_percent).toBeLessThan(100);
    expect(demo.playback.remaining_ms).toBeGreaterThan(0);
    expect(demo.quality?.bandwidth_kbps).toBeGreaterThan(0);
  });

  it("uses self-contained artwork (no server dependency)", () => {
    const demo = buildDemoStream();
    expect(demo.images?.poster_url).toMatch(/^data:image\//);
    expect(demo.images?.backdrop_url).toMatch(/^data:image\//);
    expect(demo.media.images?.poster_url).toMatch(/^data:image\//);
  });

  it("keeps remaining time consistent with progress", () => {
    const demo = buildDemoStream();
    const pct = demo.playback.progress_percent / 100;
    const expected = Math.round(demo.playback.duration_ms * (1 - pct));
    expect(demo.playback.remaining_ms).toBe(expected);
  });
});
