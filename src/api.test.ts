import { describe, expect, it, vi } from "vitest";
import { getCardData } from "./api";
import { normalizeConfig } from "./config";
import type { HomeAssistant } from "./types";

function hassMock() {
  const callWS = vi.fn().mockResolvedValue({ schema_version: 1, items: [] });
  return {
    callWS,
    connection: { subscribeMessage: vi.fn() },
  } as unknown as HomeAssistant & { callWS: ReturnType<typeof vi.fn> };
}

describe("card API client", () => {
  it("maps recent editor filters to the versioned command", async () => {
    const hass = hassMock();
    await getCardData(hass, normalizeConfig({
      entry_id: "entry-1",
      mode: "recently_added",
      media_type: "movie",
      section_id: "2",
      max_items: 8,
    }));
    expect(hass.callWS).toHaveBeenCalledWith({
      type: "tautulli_active_streams/get_recently_added",
      entry_id: "entry-1",
      limit: 8,
      media_type: "movie",
      section_id: "2",
    });
  });

  it("maps popular ranking controls without browser credentials", async () => {
    const hass = hassMock();
    await getCardData(hass, normalizeConfig({
      entry_id: "entry-1",
      mode: "popular",
      stat_id: "top_tv",
      metric: "duration",
      time_range: 90,
    }));
    const request = hass.callWS.mock.calls[0]?.[0];
    expect(request).toMatchObject({
      type: "tautulli_active_streams/get_home_stats",
      stat_id: "top_tv",
      metric: "duration",
      time_range: 90,
    });
    expect(JSON.stringify(request)).not.toMatch(/token|apikey|password/i);
  });
});
