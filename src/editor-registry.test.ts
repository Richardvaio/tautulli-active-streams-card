import { describe, expect, it } from "vitest";
import { appliesTo, EDITOR_SECTIONS, ALL_MODES } from "./editor-registry";
import type { Capabilities, CardConfig } from "./types";

const FULL_CAPS: Capabilities = {
  active_streams: true,
  active_stream_subscription: true,
  recently_added: true,
  home_stats: true,
  users: true,
  user_stats: true,
  libraries: true,
  history: true,
  stream_termination: true,
};

function ctxFor(overrides: Partial<CardConfig> = {}, mode: CardConfig["mode"] = "active", capabilities: Capabilities = FULL_CAPS) {
  return {
    config: { mode, click_action: "details", allow_termination: true, ...overrides } as CardConfig,
    mode,
    data: {
      entries: [],
      libraries: [],
      users: [],
      capabilities,
    },
  };
}

function fieldKeys(ctx: ReturnType<typeof ctxFor>): Set<string> {
  const keys = new Set<string>();
  const walk = (fields: typeof EDITOR_SECTIONS[number]["fields"]) => {
    for (const field of fields ?? []) {
      if (!appliesTo(field, ctx)) continue;
      if ("key" in field) keys.add(field.key);
    }
  };
  for (const section of EDITOR_SECTIONS) {
    if (!appliesTo(section.applies, ctx)) continue;
    walk(section.fields);
    for (const sub of section.subsections ?? []) {
      if (!appliesTo(sub.applies, ctx)) continue;
      walk(sub.fields);
    }
  }
  return keys;
}

describe("editor settings registry", () => {
  it("declares a section structure with unique ids", () => {
    const ids = EDITOR_SECTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("content-source");
    expect(ids).toContain("popup-appearance");
  });

  it("never gates the core source fields by mode", () => {
    const content = EDITOR_SECTIONS.find((s) => s.id === "content-source");
    const core = content?.fields?.filter((f) => "key" in f && ["entry_id", "mode", "title"].includes(f.key));
    expect(core).toHaveLength(3);
    for (const mode of ALL_MODES) {
      const keys = fieldKeys(ctxFor({}, mode));
      expect(keys.has("entry_id")).toBe(true);
      expect(keys.has("mode")).toBe(true);
    }
  });

  it("shows active-only card settings only for active streams", () => {
    const activeOnly = ["show_progress", "show_state", "show_bandwidth", "show_eta", "show_remaining", "show_audio_quality", "show_quality", "sort_by", "show_media_details"];
    const active = fieldKeys(ctxFor({}, "active"));
    for (const key of activeOnly) expect(active.has(key)).toBe(true);
    for (const mode of ["recently_added", "popular", "users", "history"] as const) {
      const keys = fieldKeys(ctxFor({}, mode));
      for (const key of activeOnly) expect(keys.has(key), `${key} leaked into ${mode}`).toBe(false);
    }
  });

  it("gates popup sections behind click_action details", () => {
    const withPopup = fieldKeys(ctxFor({ click_action: "details" }));
    const withoutPopup = fieldKeys(ctxFor({ click_action: "none" }));
    expect(withPopup.has("popup_width")).toBe(true);
    expect(withoutPopup.has("popup_width")).toBe(false);
    expect(withoutPopup.has("popup_style")).toBe(false);
  });

  it("shows cinematic art strength only for the cinematic style", () => {
    const cinematic = fieldKeys(ctxFor({ popup_style: "cinematic" }));
    const clean = fieldKeys(ctxFor({ popup_style: "clean" }));
    expect(cinematic.has("popup_cinematic_art")).toBe(true);
    expect(clean.has("popup_cinematic_art")).toBe(false);
  });

  it("shows animation duration only when an animation is selected", () => {
    const animating = fieldKeys(ctxFor({ popup_animation: "rise" }));
    const none = fieldKeys(ctxFor({ popup_animation: "none" }));
    expect(animating.has("popup_animation_duration")).toBe(true);
    expect(none.has("popup_animation_duration")).toBe(false);
  });

  it("cascades termination fields on capability, enablement, location and popup state", () => {
    const noCap = FULL_CAPS && { ...FULL_CAPS, stream_termination: false };
    expect(fieldKeys(ctxFor({}, "active", noCap)).has("allow_termination")).toBe(false);
    expect(fieldKeys(ctxFor({ allow_termination: false })).has("termination_location")).toBe(false);
    expect(fieldKeys(ctxFor({ allow_termination: true })).has("termination_location")).toBe(true);
    expect(fieldKeys(ctxFor({ allow_termination: true, termination_location: "card" })).has("termination_button_style")).toBe(false);
    expect(fieldKeys(ctxFor({ allow_termination: true, termination_location: "both" })).has("termination_button_style")).toBe(true);
    expect(fieldKeys(ctxFor({ click_action: "none", allow_termination: true, termination_location: "popup" })).has("termination_button_style")).toBe(false);
  });

  it("gates users-only and non-users popup detail fields by mode", () => {
    const users = fieldKeys(ctxFor({}, "users"));
    const media = fieldKeys(ctxFor({}, "recently_added"));
    expect(users.has("popup_show_playback_breakdown")).toBe(true);
    expect(media.has("popup_show_playback_breakdown")).toBe(false);
    expect(users.has("popup_show_genres")).toBe(false);
    expect(media.has("popup_show_genres")).toBe(true);
    expect(users.has("popup_show_artwork")).toBe(false);
    expect(media.has("popup_show_artwork")).toBe(true);
  });

  it("gates artwork sub-settings by artwork selection", () => {
    const poster = fieldKeys(ctxFor({ artwork: "poster" }));
    const backdrop = fieldKeys(ctxFor({ artwork: "backdrop" }));
    const none = fieldKeys(ctxFor({ artwork: "none" }));
    expect(poster.has("artwork_aspect")).toBe(true);
    expect(backdrop.has("artwork_aspect")).toBe(false);
    expect(backdrop.has("backdrop_opacity")).toBe(true);
    expect(poster.has("backdrop_opacity")).toBe(false);
    expect(none.has("artwork_aspect")).toBe(false);
    expect(none.has("backdrop_opacity")).toBe(false);
  });

  it("shows the summary-length selector only when the summary is enabled", () => {
    expect(fieldKeys(ctxFor({ popup_show_summary: true })).has("popup_summary_lines")).toBe(true);
    expect(fieldKeys(ctxFor({ popup_show_summary: false })).has("popup_summary_lines")).toBe(false);
  });
});
