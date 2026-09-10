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
    expect(config.carousel_buttons).toBe(true);
    expect(config.eta_time_format).toBe("automatic");
    expect(config.playback_state_filter).toBe("all");
    expect(config.stream_decision_filter).toBe("all");
    expect(compactConfig(config)).not.toHaveProperty("eta_time_format");
    expect(compactConfig(config)).not.toHaveProperty("playback_state_filter");
    expect(compactConfig(config)).not.toHaveProperty("stream_decision_filter");
  });

  it("clamps values sent to bounded backend endpoints", () => {
    expect(normalizeConfig({ max_items: 999, time_range: -1 }).max_items).toBe(50);
    expect(normalizeConfig({ max_items: 0, time_range: -1 }).time_range).toBe(1);
    expect(normalizeConfig({ columns: 9 }).columns).toBe(4);
  });

  it("defaults, validates and round-trips showcase transitions", () => {
    expect(normalizeConfig({}).showcase_transition).toBe("fade");
    expect(normalizeConfig({}).showcase_direction).toBe("left");
    expect(normalizeConfig({}).showcase_transition_duration).toBe(400);
    expect(normalizeConfig({ showcase_transition: "invalid" } as never).showcase_transition).toBe("fade");
    expect(normalizeConfig({ showcase_direction: "invalid" } as never).showcase_direction).toBe("left");
    expect(normalizeConfig({ showcase_transition_duration: 1 }).showcase_transition_duration).toBe(100);
    expect(normalizeConfig({ showcase_transition_duration: 9999 }).showcase_transition_duration).toBe(1500);

    for (const transition of ["fade", "slide", "horizontal"] as const) {
      const configured = normalizeConfig({
        layout: "showcase",
        showcase_transition: transition,
        showcase_direction: "right",
        showcase_transition_duration: 725,
      });
      expect(configured.showcase_transition).toBe(transition);
      expect(configured.showcase_direction).toBe("right");
      expect(configured.showcase_transition_duration).toBe(725);
      expect(normalizeConfig(compactConfig(configured))).toEqual(configured);
    }
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

  it("drops the retired demo-stream setting from existing cards", () => {
    const config = normalizeConfig({ demo_when_empty: true } as never);
    expect(config).not.toHaveProperty("demo_when_empty");
    expect(compactConfig(config)).not.toHaveProperty("demo_when_empty");
  });

  it("normalizes invalid YAML choices instead of leaving blank editor controls", () => {
    const config = normalizeConfig({
      mode: "broken",
      layout: "diagonal",
      artwork: "maybe",
      style_preset: "unknown",
      click_action: "launch",
      popup_width: "huge",
      popup_episode_layout: "separate",
      eta_time_format: "military",
      playback_state_filter: "stopped",
      stream_decision_filter: "relay",
      sort_by: "finish_time",
      metric: "hours",
      columns: "many",
    } as never);
    expect(config).toMatchObject({
      mode: "active",
      layout: "grid",
      artwork: "poster",
      style_preset: "classic",
      click_action: "none",
      popup_width: "standard",
      popup_episode_layout: "automatic",
      eta_time_format: "automatic",
      playback_state_filter: "all",
      stream_decision_filter: "all",
      sort_by: "server",
      metric: "plays",
      columns: "auto",
    });
  });

  it("drops retired marquee settings and validates movement direction", () => {
    const migrated = normalizeConfig({ autoscroll_animation: "smooth", autoscroll_direction: "bounce" } as never);
    expect(migrated.autoscroll_direction).toBe("ltr");
    expect(migrated).not.toHaveProperty("autoscroll_animation");
    expect(compactConfig(migrated)).not.toHaveProperty("autoscroll_animation");
    expect(normalizeConfig({ autoscroll_direction: "rtl" }).autoscroll_direction).toBe("rtl");
  });

  it("preserves the existing movie subtitle layout unless a source is selected", () => {
    const automatic = normalizeConfig({});
    expect(automatic.movie_subtitle).toBe("automatic");
    expect(compactConfig(automatic)).not.toHaveProperty("movie_subtitle");

    const configured = normalizeConfig({ movie_subtitle: "studio" } as never);
    expect(configured.movie_subtitle).toBe("studio");
    expect(compactConfig(configured)).toHaveProperty("movie_subtitle", "studio");
    expect(normalizeConfig(compactConfig(configured))).toEqual(configured);
  });

  it("round-trips advanced card and popup settings without losing values", () => {
    const configured = normalizeConfig({
      entry_id: "entry-1",
      mode: "active",
      media_type: "music",
      playback_state_filter: "paused",
      stream_decision_filter: "transcode",
      sort_by: "remaining",
      sort_direction: "descending",
      layout: "carousel",
      density: "detailed",
      artwork: "backdrop",
      artwork_aspect: "backdrop",
      artwork_fit: "contain",
      artwork_position: "right",
      artwork_placement: "background",
      style_preset: "modern",
      container_style: "surface",
      playing_color: "#123456",
      paused_color: "#2468ac",
      buffering_color: "#bada55",
      click_action: "details",
      popup_style: "cinematic",
      popup_width: "wide",
      popup_content_style: "panel",
      popup_summary_lines: 5,
      popup_episode_layout: "custom",
      popup_episode_title: "show",
      popup_episode_subtitle: "number_and_title",
      popup_episode_number_style: "padded",
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
      eta_time_format: "24",
      episode_layout: "custom",
      episode_title: "show",
      episode_subtitle: "number_and_title",
      episode_number_style: "padded",
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
    expect(config.popup_detail_order).toHaveLength(22);
    expect(new Set(config.popup_detail_order).size).toBe(22);
    expect(config.popup_detail_order).toEqual(expect.arrayContaining(["media_type", "duration", "library", "rank", "plays", "played"]));

    const saved = compactConfig(config);
    expect(saved.popup_detail_order?.slice(0, 2)).toEqual(["bandwidth", "user"]);
    expect(normalizeConfig(saved).popup_detail_order).toEqual(config.popup_detail_order);
  });

  it("sanitizes and round-trips Plex user popup group order", () => {
    const config = normalizeConfig({
      popup_user_detail_order: ["habits", "playback", "habits", "invalid"] as never,
    });
    expect(config.popup_user_detail_order).toEqual(["habits", "playback", "favourites", "recent_activity"]);
    expect(normalizeConfig(compactConfig(config)).popup_user_detail_order).toEqual(config.popup_user_detail_order);
  });

  it("migrates the former shared popup user setting into the summary setting", () => {
    const config = normalizeConfig({ popup_show_user: false });
    expect(config.popup_show_user).toBe(false);
    expect(config.popup_summary_show_user).toBe(false);
    expect(normalizeConfig({ popup_summary_show_user: true, popup_show_user: false }).popup_summary_show_user).toBe(true);
    const independent = normalizeConfig({ popup_summary_show_user: true, popup_show_user: false });
    expect(normalizeConfig(compactConfig(independent))).toEqual(independent);
  });

  it("applies popup animation and background defaults", () => {
    const config = normalizeConfig({});
    expect(config.popup_animation).toBe("scale");
    expect(config.popup_animation_duration).toBe(220);
    expect(config.popup_backdrop_dim).toBe(58);
    expect(config.popup_backdrop_blur).toBe(0);
    expect(config.popup_cinematic_art).toBe(45);
    expect(config.popup_background).toBeUndefined();
  });

  it("clamps popup animation and background values to their supported ranges", () => {
    const config = normalizeConfig({
      popup_animation: "rise",
      popup_animation_duration: 99999,
      popup_backdrop_dim: 200,
      popup_backdrop_blur: -5,
      popup_cinematic_art: 0,
    });
    expect(config.popup_animation).toBe("rise");
    expect(config.popup_animation_duration).toBe(1500);
    expect(config.popup_backdrop_dim).toBe(95);
    expect(config.popup_backdrop_blur).toBe(0);
    expect(config.popup_cinematic_art).toBe(0);
  });

  it("round-trips custom popup appearance settings through compactConfig", () => {
    const config = normalizeConfig({
      popup_animation: "rise",
      popup_animation_duration: 600,
      popup_backdrop_dim: 0,
      popup_backdrop_blur: 8,
      popup_cinematic_art: 30,
      popup_background: "rgba(10, 14, 26, 0.9)",
    });
    const saved = compactConfig(config);
    expect(saved.popup_animation).toBe("rise");
    expect(saved.popup_animation_duration).toBe(600);
    expect(saved.popup_backdrop_dim).toBe(0);
    expect(saved.popup_backdrop_blur).toBe(8);
    expect(saved.popup_cinematic_art).toBe(30);
    expect(saved.popup_background).toBe("rgba(10, 14, 26, 0.9)");
    expect(normalizeConfig(saved)).toEqual(config);
  });

  it("omits default popup appearance settings from the saved config", () => {
    const saved = compactConfig(normalizeConfig({}));
    expect(saved.popup_animation).toBeUndefined();
    expect(saved.popup_animation_duration).toBeUndefined();
    expect(saved.popup_backdrop_dim).toBeUndefined();
    expect(saved.popup_backdrop_blur).toBeUndefined();
    expect(saved.popup_cinematic_art).toBeUndefined();
  });
});
