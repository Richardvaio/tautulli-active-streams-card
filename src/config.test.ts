import { describe, expect, it } from "vitest";
import { compactConfig, modeTitle, normalizeConfig } from "./config";

describe("card configuration", () => {
  it("applies safe responsive defaults", () => {
    const config = normalizeConfig({});
    expect(config.mode).toBe("active");
    expect(config.columns).toBe("auto");
    expect(config.allow_termination).toBe(false);
    expect(config.max_items).toBe(50);
    expect(config.show_header).toBe(false);
    expect(config.show_count).toBe(false);
  });

  it("clamps values sent to bounded backend endpoints", () => {
    expect(normalizeConfig({ max_items: 999, time_range: -1 }).max_items).toBe(50);
    expect(normalizeConfig({ max_items: 0, time_range: -1 }).time_range).toBe(1);
    expect(normalizeConfig({ columns: 9 }).columns).toBe(4);
  });

  it("uses a custom title without losing mode defaults", () => {
    const config = normalizeConfig({ mode: "recently_added", title: "New on Plex" });
    expect(modeTitle(config)).toBe("New on Plex");
    expect(modeTitle(normalizeConfig({ mode: "popular" }))).toBe("Popular on Plex");
  });

  it("saves only values that differ from production defaults", () => {
    const config = normalizeConfig({ entry_id: "entry-1", show_header: true });
    expect(compactConfig(config)).toEqual({
      type: "custom:tautulli-media-card",
      config_version: 1,
      entry_id: "entry-1",
      show_header: true,
    });
  });

  it("migrates early prototype field names", () => {
    const config = normalizeConfig({
      view: "recently_added",
      preset: "modern",
      show_title: true,
      show_badge: true,
    } as never);
    expect(config).toMatchObject({
      mode: "recently_added",
      style_preset: "modern",
      show_header: true,
      show_count: true,
      config_version: 1,
    });
  });

  it("round-trips advanced card and popup settings without losing values", () => {
    const configured = normalizeConfig({
      entry_id: "entry-1",
      mode: "active",
      media_type: "music",
      layout: "carousel",
      density: "detailed",
      artwork: "backdrop",
      artwork_aspect: "backdrop",
      artwork_fit: "contain",
      artwork_position: "right",
      artwork_placement: "background",
      style_preset: "modern",
      container_style: "surface",
      click_action: "details",
      popup_style: "cinematic",
      popup_width: "wide",
      popup_content_style: "panel",
      popup_summary_lines: 5,
      allow_termination: true,
      termination_location: "both",
      termination_popup_placement: "top",
      termination_button_style: "icon",
      popup_show_device: false,
      popup_show_audio_quality: false,
      popup_show_audience_rating: false,
      popup_show_studio: false,
      show_header: true,
      show_count: true,
      show_remaining: false,
    });

    expect(normalizeConfig(compactConfig(configured))).toEqual(configured);
  });

  it("migrates disabled grouped popup fields to their individual controls", () => {
    const config = normalizeConfig({
      popup_show_timing: false,
      popup_show_client: false,
      popup_show_quality: false,
      popup_show_media_details: false,
      popup_show_ratings: false,
    });
    expect(config).toMatchObject({
      popup_show_eta: false,
      popup_show_pause_duration: false,
      popup_show_player: false,
      popup_show_device: false,
      popup_show_playback_decision: false,
      popup_show_video_quality: false,
      popup_show_audio_quality: false,
      popup_show_episode: false,
      popup_show_media_type: false,
      popup_show_year: false,
      popup_show_duration: false,
      popup_show_library: false,
      popup_show_content_rating: false,
      popup_show_rating: false,
      popup_show_audience_rating: false,
      popup_show_genres: false,
      popup_show_studio: false,
    });
  });

  it("sanitizes and round-trips a custom stream-detail order", () => {
    const config = normalizeConfig({
      popup_detail_order: ["bandwidth", "user", "bandwidth", "invalid"] as never,
    });
    expect(config.popup_detail_order?.slice(0, 2)).toEqual(["bandwidth", "user"]);
    expect(config.popup_detail_order).toHaveLength(16);
    expect(new Set(config.popup_detail_order).size).toBe(16);

    const saved = compactConfig(config);
    expect(saved.popup_detail_order?.slice(0, 2)).toEqual(["bandwidth", "user"]);
    expect(normalizeConfig(saved).popup_detail_order).toEqual(config.popup_detail_order);
  });

  it("migrates the former shared popup user setting into the summary setting", () => {
    const config = normalizeConfig({ popup_show_user: false });
    expect(config.popup_show_user).toBe(false);
    expect(config.popup_summary_show_user).toBe(false);
    expect(normalizeConfig({ popup_summary_show_user: true, popup_show_user: false }).popup_summary_show_user).toBe(true);
    const independent = normalizeConfig({ popup_summary_show_user: true, popup_show_user: false });
    expect(normalizeConfig(compactConfig(independent))).toEqual(independent);
  });
});
