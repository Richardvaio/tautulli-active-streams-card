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
    const core = content?.fields?.filter((f) => "key" in f && ["entry_id", "mode"].includes(f.key));
    expect(core).toHaveLength(2);
    for (const mode of ALL_MODES) {
      const keys = fieldKeys(ctxFor({}, mode));
      expect(keys.has("entry_id")).toBe(true);
      expect(keys.has("mode")).toBe(true);
    }
  });

  it("places the custom title directly behind the setting that enables it", () => {
    expect(fieldKeys(ctxFor({ show_header: false })).has("title")).toBe(false);
    expect(fieldKeys(ctxFor({ show_header: true })).has("title")).toBe(true);
    const general = EDITOR_SECTIONS.find((section) => section.id === "general");
    expect(general?.fields?.filter((field) => "key" in field).map((field) => "key" in field ? field.key : "").slice(0, 2)).toEqual(["show_header", "title"]);
  });

  it("shows library filtering only for requests that send a library", () => {
    expect(fieldKeys(ctxFor({}, "recently_added")).has("section_id")).toBe(true);
    expect(fieldKeys(ctxFor({}, "popular")).has("section_id")).toBe(true);
    expect(fieldKeys(ctxFor({}, "users")).has("section_id")).toBe(false);
    expect(fieldKeys(ctxFor({}, "history")).has("section_id")).toBe(false);
  });

  it("shows active-only card settings only for active streams", () => {
    const activeOnly = [
      "playback_state_filter",
      "stream_decision_filter",
      "show_progress",
      "show_state",
      "show_bandwidth",
      "show_eta",
      "eta_time_format",
      "show_remaining",
      "show_audio_quality",
      "show_quality",
      "sort_by",
      "show_media_details",
    ];
    const active = fieldKeys(ctxFor({}, "active"));
    for (const key of activeOnly) expect(active.has(key)).toBe(true);
    for (const mode of ["recently_added", "popular", "users", "history"] as const) {
      const keys = fieldKeys(ctxFor({}, mode));
      for (const key of activeOnly) expect(keys.has(key), `${key} leaked into ${mode}`).toBe(false);
    }
    expect(active.has("demo_when_empty")).toBe(false);
  });

  it("shows all showcase controls only for the showcase layout", () => {
    const showcase = fieldKeys(ctxFor({ layout: "showcase" }));
    const horizontallySlidingShowcase = fieldKeys(ctxFor({ layout: "showcase", showcase_transition: "horizontal" }));
    const showcaseWithoutAnimations = fieldKeys(ctxFor({ layout: "showcase", animations: false }));
    const horizontal = fieldKeys(ctxFor({ layout: "horizontal" }));
    const carousel = fieldKeys(ctxFor({ layout: "carousel" }));
    const marquee = fieldKeys(ctxFor({ layout: "marquee" }));
    const grid = fieldKeys(ctxFor({ layout: "grid" }));
    expect(showcase.has("showcase_advance")).toBe(true);
    expect(showcase.has("showcase_transition")).toBe(true);
    expect(showcase.has("showcase_direction")).toBe(false);
    expect(horizontallySlidingShowcase.has("showcase_direction")).toBe(true);
    expect(showcase.has("showcase_transition_duration")).toBe(true);
    expect(showcaseWithoutAnimations.has("showcase_transition_duration")).toBe(false);
    expect(horizontal.has("scroll_gap")).toBe(true);
    expect(horizontal.has("scroll_peek")).toBe(true);
    expect(horizontal.has("carousel_buttons")).toBe(true);
    expect(carousel.has("scroll_gap")).toBe(true);
    expect(carousel.has("scroll_peek")).toBe(false);
    expect(carousel.has("carousel_buttons")).toBe(true);
    expect(marquee.has("scroll_gap")).toBe(true);
    expect(marquee.has("scroll_peek")).toBe(false);
    expect(marquee.has("carousel_buttons")).toBe(false);
    expect(horizontal.has("showcase_transition")).toBe(false);
    expect(grid.has("showcase_advance")).toBe(false);
    expect(grid.has("showcase_transition")).toBe(false);
    expect(grid.has("showcase_transition_duration")).toBe(false);

    const section = EDITOR_SECTIONS.find((candidate) => candidate.id === "card-appearance");
    const field = section?.fields?.find((candidate) => "key" in candidate && candidate.key === "showcase_transition");
    const options = field && "options" in field
      ? typeof field.options === "function" ? field.options(ctxFor({ layout: "showcase" })) : field.options
      : [];
    expect(options.map((option) => option.value)).toEqual(["fade", "slide", "horizontal"]);
    const layout = section?.fields?.find((candidate) => "key" in candidate && candidate.key === "layout");
    const layoutOptions = layout && "options" in layout
      ? typeof layout.options === "function" ? layout.options(ctxFor()) : layout.options
      : [];
    expect(layoutOptions.map((option) => option.value)).toContain("horizontal");
  });

  it("shows TV episode text controls only for views that can contain episodes", () => {
    const activeVideo = fieldKeys(ctxFor({ media_type: "video" }, "active"));
    const activeMusic = fieldKeys(ctxFor({ media_type: "music" }, "active"));
    const recentTv = fieldKeys(ctxFor({ media_type: "show" }, "recently_added"));
    const recentMovies = fieldKeys(ctxFor({ media_type: "movie" }, "recently_added"));
    const history = fieldKeys(ctxFor({}, "history"));
    const popular = fieldKeys(ctxFor({}, "popular"));

    expect(activeVideo.has("episode_layout")).toBe(true);
    expect(activeMusic.has("episode_layout")).toBe(false);
    expect(recentTv.has("episode_layout")).toBe(true);
    expect(recentMovies.has("episode_layout")).toBe(false);
    expect(history.has("episode_layout")).toBe(true);
    expect(popular.has("episode_layout")).toBe(false);
  });

  it("shows movie subtitle controls only where movie cards can use them", () => {
    const activeVideo = fieldKeys(ctxFor({ media_type: "video", show_media_details: true }, "active"));
    const activeDetailsHidden = fieldKeys(ctxFor({ media_type: "video", show_media_details: false }, "active"));
    const activeMusic = fieldKeys(ctxFor({ media_type: "music" }, "active"));
    const recentMovies = fieldKeys(ctxFor({ media_type: "movie" }, "recently_added"));
    const recentTv = fieldKeys(ctxFor({ media_type: "show" }, "recently_added"));
    const popularMovies = fieldKeys(ctxFor({ stat_id: "popular_movies" }, "popular"));
    const popularTv = fieldKeys(ctxFor({ stat_id: "popular_tv" }, "popular"));
    const history = fieldKeys(ctxFor({}, "history"));
    const users = fieldKeys(ctxFor({}, "users"));

    expect(activeVideo.has("movie_subtitle")).toBe(true);
    expect(activeDetailsHidden.has("movie_subtitle")).toBe(false);
    expect(activeMusic.has("movie_subtitle")).toBe(false);
    expect(recentMovies.has("movie_subtitle")).toBe(true);
    expect(recentTv.has("movie_subtitle")).toBe(false);
    expect(popularMovies.has("movie_subtitle")).toBe(true);
    expect(popularTv.has("movie_subtitle")).toBe(false);
    expect(history.has("movie_subtitle")).toBe(true);
    expect(users.has("movie_subtitle")).toBe(false);
  });

  it("explains that disabling card grouping cannot split a Tautulli season item", () => {
    const content = EDITOR_SECTIONS.find((section) => section.id === "content-source");
    const grouping = content?.fields?.find((field) => "key" in field && field.key === "recent_grouping");
    const options = grouping && "options" in grouping && Array.isArray(grouping.options) ? grouping.options : [];
    expect(options.find((option) => option.value === "none")?.label).toBe("Use Tautulli items as returned");

    const hint = content?.fields?.find((field) => field.kind === "hint" && field.modes?.includes("recently_added"));
    expect(hint && "text" in hint ? hint.text : "").toContain("cannot split that season into individual episodes");
  });

  it("reveals custom episode fields and numbering only when they affect output", () => {
    const preset = fieldKeys(ctxFor({ episode_layout: "show_first" }, "active"));
    const customNumbered = fieldKeys(ctxFor({
      episode_layout: "custom",
      episode_subtitle: "number_and_title",
    }, "active"));
    const customWithoutNumber = fieldKeys(ctxFor({
      episode_layout: "custom",
      episode_subtitle: "episode_title",
    }, "active"));

    expect(preset.has("episode_title")).toBe(false);
    expect(preset.has("episode_number_style")).toBe(true);
    expect(customNumbered.has("episode_title")).toBe(true);
    expect(customNumbered.has("episode_subtitle")).toBe(true);
    expect(customNumbered.has("episode_number_style")).toBe(true);
    expect(customWithoutNumber.has("episode_number_style")).toBe(false);
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
    const withoutArtwork = fieldKeys(ctxFor({ popup_style: "cinematic", popup_show_artwork: false }));
    const user = fieldKeys(ctxFor({ popup_style: "cinematic" }, "users"));
    expect(cinematic.has("popup_cinematic_art")).toBe(true);
    expect(clean.has("popup_cinematic_art")).toBe(false);
    expect(withoutArtwork.has("popup_cinematic_art")).toBe(false);
    expect(user.has("popup_cinematic_art")).toBe(false);
  });

  it("offers independent popup episode text only where episodes can appear", () => {
    const automatic = fieldKeys(ctxFor({ popup_episode_layout: "automatic", media_type: "video" }, "active"));
    const custom = fieldKeys(ctxFor({
      popup_episode_layout: "custom",
      popup_episode_subtitle: "number_and_title",
      media_type: "video",
    }, "active"));
    const music = fieldKeys(ctxFor({ popup_episode_layout: "custom", media_type: "music" }, "active"));
    expect(automatic.has("popup_episode_layout")).toBe(true);
    expect(automatic.has("popup_episode_title")).toBe(false);
    expect(custom.has("popup_episode_title")).toBe(true);
    expect(custom.has("popup_episode_subtitle")).toBe(true);
    expect(custom.has("popup_episode_number_style")).toBe(true);
    expect(music.has("popup_episode_layout")).toBe(false);
  });

  it("shows animation duration only when an animation is selected", () => {
    const animating = fieldKeys(ctxFor({ popup_animation: "rise" }));
    const none = fieldKeys(ctxFor({ popup_animation: "none" }));
    const globallyDisabled = fieldKeys(ctxFor({ popup_animation: "rise", animations: false }));
    expect(animating.has("popup_animation_duration")).toBe(true);
    expect(none.has("popup_animation_duration")).toBe(false);
    expect(globallyDisabled.has("popup_animation_duration")).toBe(false);
    expect(globallyDisabled.has("popup_close_animation_duration")).toBe(false);
  });

  it("hides playback settings when their parent display is disabled", () => {
    const noProgress = fieldKeys(ctxFor({ show_progress: false }));
    const noState = fieldKeys(ctxFor({ show_state: false }));
    const noEta = fieldKeys(ctxFor({ show_eta: false }));
    const video = fieldKeys(ctxFor({ media_type: "video" }));
    expect(noProgress.has("show_progress_percent")).toBe(false);
    expect(noProgress.has("show_remaining")).toBe(false);
    expect(noState.has("show_pause_duration")).toBe(false);
    expect(noState.has("show_track_number")).toBe(false);
    expect(noEta.has("eta_time_format")).toBe(false);
    expect(video.has("show_track_number")).toBe(false);
  });

  it("offers card-only stream filters, timing and sort choices", () => {
    const content = EDITOR_SECTIONS.find((section) => section.id === "content-source");
    const optionsFor = (key: keyof CardConfig) => {
      const field = content?.fields?.find((candidate) => "key" in candidate && candidate.key === key);
      return field && "options" in field && Array.isArray(field.options)
        ? field.options.map((option) => option.value)
        : [];
    };

    expect(optionsFor("playback_state_filter")).toEqual(["all", "playing", "paused", "buffering"]);
    expect(optionsFor("stream_decision_filter")).toEqual(["all", "direct_play", "direct_stream", "transcode"]);
    expect(optionsFor("sort_by")).toEqual(expect.arrayContaining(["remaining", "bandwidth"]));
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
    expect(users.has("popup_show_playback_breakdown")).toBe(false);
    expect(media.has("popup_show_playback_breakdown")).toBe(false);
    expect(users.has("popup_show_genres")).toBe(false);
    expect(media.has("popup_show_genres")).toBe(false);
    expect(users.has("popup_show_artwork")).toBe(false);
    expect(media.has("popup_show_artwork")).toBe(true);
    expect(users.has("artwork")).toBe(false);
    expect(users.has("show_summary")).toBe(false);
    for (const key of [
      "user_card_show_last_active",
      "user_card_show_plays",
      "user_card_show_watch_time",
      "user_card_show_completion",
      "user_card_show_media_breakdown",
      "user_card_show_playback_breakdown",
      "user_card_show_favourites",
      "user_card_show_habits",
    ]) expect(users.has(key), `${key} missing from users`).toBe(true);
    const popupDetails = EDITOR_SECTIONS.find((section) => section.id === "popup-details");
    expect(popupDetails?.fields?.some((field) => field.kind === "block" && field.block === "userDetailOrder" && appliesTo(field, ctxFor({}, "users")))).toBe(true);
    expect(popupDetails?.fields?.some((field) => field.kind === "block" && field.block === "userDetailOrder" && appliesTo(field, ctxFor({}, "recently_added")))).toBe(false);
  });

  it("uses the ordered detail list as the only active-stream popup field controls", () => {
    const popupDetails = EDITOR_SECTIONS.find((section) => section.id === "popup-details");
    const activeFields = popupDetails?.fields?.filter((field) => appliesTo(field, ctxFor({}, "active"))) ?? [];
    const recentFields = popupDetails?.fields?.filter((field) => appliesTo(field, ctxFor({}, "recently_added"))) ?? [];
    const mediaKeys = [
      "popup_show_media_type",
      "popup_show_year",
      "popup_show_duration",
      "popup_show_library",
      "popup_show_content_rating",
      "popup_show_rating",
      "popup_show_audience_rating",
      "popup_show_genres",
      "popup_show_studio",
    ];

    expect(activeFields.some((field) => field.kind === "block" && field.block === "streamDetailOrder")).toBe(true);
    expect(recentFields.some((field) => field.kind === "block" && field.block === "streamDetailOrder")).toBe(true);
    for (const key of mediaKeys) {
      expect(activeFields.some((field) => "key" in field && field.key === key), `${key} duplicated outside the ordered list`).toBe(false);
      expect(recentFields.some((field) => "key" in field && field.key === key), `${key} duplicated outside the ordered list`).toBe(false);
    }
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

  it("hides media-only artwork and summaries for non-media rankings", () => {
    for (const stat_id of ["top_users", "top_libraries", "top_platforms"]) {
      const keys = fieldKeys(ctxFor({ stat_id }, "popular"));
      expect(keys.has("artwork"), `${stat_id} artwork`).toBe(false);
      expect(keys.has("show_summary"), `${stat_id} summary`).toBe(false);
      expect(keys.has("popup_show_artwork"), `${stat_id} popup artwork`).toBe(false);
    }
    for (const stat_id of ["popular_movies", "last_watched", "most_concurrent"]) {
      const keys = fieldKeys(ctxFor({ stat_id }, "popular"));
      expect(keys.has("artwork"), `${stat_id} artwork`).toBe(true);
      expect(keys.has("popup_show_artwork"), `${stat_id} popup artwork`).toBe(true);
    }
  });

  it("shows the summary-length selector only when the summary is enabled", () => {
    expect(fieldKeys(ctxFor({ popup_show_summary: true })).has("popup_summary_lines")).toBe(true);
    expect(fieldKeys(ctxFor({ popup_show_summary: false })).has("popup_summary_lines")).toBe(false);
  });
});
