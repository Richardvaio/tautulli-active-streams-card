import type { CardConfig, PopupDetailField } from "./types";

export const CURRENT_CONFIG_VERSION = 1;

export const DEFAULT_POPUP_DETAIL_ORDER: PopupDetailField[] = [
  "user",
  "player",
  "device",
  "eta",
  "pause_duration",
  "playback_decision",
  "video_quality",
  "audio_quality",
  "bandwidth",
  "episode",
  "year",
  "content_rating",
  "rating",
  "audience_rating",
  "genres",
  "studio",
];

export const DEFAULT_CONFIG: CardConfig = {
  type: "custom:tautulli-media-card",
  config_version: CURRENT_CONFIG_VERSION,
  mode: "active",
  media_type: "all",
  recent_grouping: "none",
  max_items: 50,
  columns: "auto",
  layout: "grid",
  sort_by: "server",
  sort_direction: "ascending",
  density: "compact",
  artwork: "poster",
  artwork_fit: "cover",
  artwork_aspect: "auto",
  artwork_position: "center",
  artwork_placement: "left",
  backdrop_opacity: 35,
  style_preset: "classic",
  container_style: "auto",
  show_header: false,
  show_count: false,
  show_user: true,
  show_device: true,
  show_quality: true,
  show_progress: true,
  show_progress_percent: true,
  show_state: true,
  show_pause_duration: true,
  show_track_number: true,
  show_eta: true,
  show_remaining: true,
  show_bandwidth: true,
  show_media_details: true,
  show_audio_quality: true,
  show_summary: false,
  show_empty: false,
  scroll_gap: 8,
  scroll_peek: 36,
  autoscroll_speed: 60,
  autoscroll_direction: "ltr",
  autoscroll_animation: "smooth",
  showcase_advance: 6,
  showcase_transition: "fade",
  demo_when_empty: true,
  animations: true,
  allow_termination: false,
  termination_location: "popup",
  click_action: "none",
  popup_style: "clean",
  popup_cinematic_art: 45,
  popup_content_style: "open",
  popup_detail_order: DEFAULT_POPUP_DETAIL_ORDER,
  popup_width: "standard",
  popup_animation: "scale",
  popup_animation_duration: 220,
  popup_close_animation_duration: 200,
  popup_backdrop_dim: 58,
  popup_backdrop_blur: 0,
  termination_popup_placement: "footer",
  termination_button_style: "label",
  popup_show_artwork: true,
  popup_show_summary: true,
  popup_summary_show_user: true,
  popup_summary_lines: 3,
  popup_show_technical: true,
  popup_show_user: true,
  popup_show_progress: true,
  popup_show_timing: true,
  popup_show_client: true,
  popup_show_quality: true,
  popup_show_eta: true,
  popup_show_pause_duration: true,
  popup_show_player: true,
  popup_show_device: true,
  popup_show_playback_decision: true,
  popup_show_video_quality: true,
  popup_show_audio_quality: true,
  popup_show_bandwidth: true,
  popup_show_media_details: true,
  popup_show_ratings: true,
  popup_show_episode: true,
  popup_show_media_type: true,
  popup_show_year: true,
  popup_show_duration: true,
  popup_show_library: true,
  popup_show_content_rating: true,
  popup_show_rating: true,
  popup_show_audience_rating: true,
  popup_show_genres: true,
  popup_show_studio: true,
  popup_show_playback_breakdown: true,
  popup_show_favourites: true,
  popup_show_habits: true,
  popup_show_recent_activity: true,
  stat_id: "popular_movies",
  time_range: 30,
  metric: "plays",
};

export function normalizeConfig(config: Partial<CardConfig>): CardConfig {
  if (!config || typeof config !== "object") {
    throw new Error("Invalid Tautulli Media Card configuration");
  }
  const migrated = migrateConfig(config as Partial<CardConfig> & Record<string, unknown>);
  const merged = { ...DEFAULT_CONFIG, ...migrated, config_version: CURRENT_CONFIG_VERSION } as CardConfig;
  if (migrated.max_items === undefined && merged.mode !== "active") merged.max_items = 12;
  else merged.max_items = Math.min(50, Math.max(1, Number(merged.max_items) || 50));
  merged.time_range = Math.min(3650, Math.max(1, Number(merged.time_range) || 30));
  const summaryLines = Number(merged.popup_summary_lines);
  merged.popup_summary_lines = ([0, 2, 3, 5].includes(summaryLines) ? summaryLines : 3) as CardConfig["popup_summary_lines"];
  const requestedDetailOrder = Array.isArray(merged.popup_detail_order) ? merged.popup_detail_order : [];
  const validDetailOrder = requestedDetailOrder.filter(
    (field, index): field is PopupDetailField => DEFAULT_POPUP_DETAIL_ORDER.includes(field as PopupDetailField)
      && requestedDetailOrder.indexOf(field) === index,
  );
  merged.popup_detail_order = [
    ...validDetailOrder,
    ...DEFAULT_POPUP_DETAIL_ORDER.filter((field) => !validDetailOrder.includes(field)),
  ];
  if (typeof merged.columns === "number") {
    merged.columns = Math.min(4, Math.max(1, merged.columns));
  }
  for (const [key, min, max] of [
    ["border_radius", 0, 32],
    ["item_gap", 0, 32],
    ["artwork_width", 48, 240],
    ["artwork_inset", 0, 24],
    ["title_size", 11, 32],
    ["progress_height", 2, 24],
    ["backdrop_opacity", 0, 100],
    ["popup_animation_duration", 0, 1500],
    ["scroll_gap", 0, 48],
    ["scroll_peek", 0, 200],
    ["autoscroll_speed", 5, 200],
    ["showcase_advance", 2, 60],
    ["popup_close_animation_duration", 0, 1000],
    ["popup_cinematic_art", 0, 100],
    ["popup_backdrop_dim", 0, 95],
    ["popup_backdrop_blur", 0, 24],
  ] as const) {
    const value = merged[key];
    if (value !== undefined) merged[key] = Math.min(max, Math.max(min, Number(value) || min));
  }
  return merged;
}

function migrateConfig(config: Partial<CardConfig> & Record<string, unknown>): Partial<CardConfig> {
  const migrated = { ...config } as Partial<CardConfig> & Record<string, unknown>;
  if (typeof migrated.view === "string" && ["active", "recently_added", "popular", "users", "history"].includes(migrated.view) && !migrated.mode) {
    migrated.mode = migrated.view as CardConfig["mode"];
  }
  if (typeof migrated.preset === "string" && ["classic", "modern", "minimal"].includes(migrated.preset) && !migrated.style_preset) {
    migrated.style_preset = migrated.preset as CardConfig["style_preset"];
  }
  if (typeof migrated.show_title === "boolean" && migrated.show_header === undefined) migrated.show_header = migrated.show_title;
  if (typeof migrated.show_badge === "boolean" && migrated.show_count === undefined) migrated.show_count = migrated.show_badge;
  if (migrated.popup_summary_show_user === undefined && typeof migrated.popup_show_user === "boolean") {
    migrated.popup_summary_show_user = migrated.popup_show_user;
  }
  if (migrated.popup_show_technical === false) {
    for (const key of ["popup_show_client", "popup_show_quality", "popup_show_bandwidth"] as const) {
      if (migrated[key] === undefined) migrated[key] = false;
    }
  }
  const legacyPopupGroups = [
    ["popup_show_timing", ["popup_show_eta", "popup_show_pause_duration"]],
    ["popup_show_client", ["popup_show_player", "popup_show_device"]],
    ["popup_show_quality", ["popup_show_playback_decision", "popup_show_video_quality", "popup_show_audio_quality"]],
    ["popup_show_media_details", ["popup_show_episode", "popup_show_media_type", "popup_show_year", "popup_show_duration", "popup_show_library", "popup_show_content_rating"]],
    ["popup_show_ratings", ["popup_show_rating", "popup_show_audience_rating", "popup_show_genres", "popup_show_studio"]],
  ] as const;
  for (const [legacyKey, specificKeys] of legacyPopupGroups) {
    if (migrated[legacyKey] === false) {
      for (const specificKey of specificKeys) if (migrated[specificKey] === undefined) migrated[specificKey] = false;
    }
  }
  for (const legacyKey of ["view", "preset", "show_title", "show_badge"]) delete migrated[legacyKey];
  return migrated;
}

export function compactConfig(config: CardConfig): Partial<CardConfig> & Pick<CardConfig, "type"> {
  const compact: Record<string, unknown> = {
    type: config.type,
    config_version: CURRENT_CONFIG_VERSION,
  };
  for (const [key, value] of Object.entries(config)) {
    if (["type", "config_version"].includes(key) || value === undefined) continue;
    const defaultValue = DEFAULT_CONFIG[key as keyof CardConfig];
    if (Array.isArray(value) && Array.isArray(defaultValue)) {
      if (JSON.stringify(value) !== JSON.stringify(defaultValue)) compact[key] = value;
    } else if (value !== defaultValue) compact[key] = value;
  }
  if (config.popup_summary_show_user !== config.popup_show_user && compact.popup_summary_show_user === undefined) {
    compact.popup_summary_show_user = config.popup_summary_show_user;
  }
  return compact as Partial<CardConfig> & Pick<CardConfig, "type">;
}

export const STYLE_PRESETS = {
  classic: {
    card_background: "rgba(3, 18, 32, 0.82)",
    item_background: "rgba(0, 0, 0, 0.42)",
    border_color: "rgba(70, 130, 180, 0.48)",
    item_shadow: "3px 3px 5px rgba(0, 0, 0, 0.5)",
    border_radius: 5,
    item_gap: 5,
    artwork_inset: 5,
    title_size: 16,
    progress_height: 20,
    playing_color: "#2986cc",
    paused_color: "#f5a623",
    buffering_color: "#db4437",
  },
  modern: {
    card_background: "var(--ha-card-background, var(--card-background-color))",
    item_background: "color-mix(in srgb, var(--primary-background-color) 70%, transparent)",
    border_color: "color-mix(in srgb, var(--divider-color) 70%, transparent)",
    item_shadow: "0 2px 8px rgba(0, 0, 0, 0.18)",
    border_radius: 12,
    item_gap: 8,
    artwork_inset: 0,
    title_size: 16,
    progress_height: 7,
    playing_color: "var(--primary-color, #2986cc)",
    paused_color: "var(--warning-color, #f59e0b)",
    buffering_color: "var(--error-color, #db4437)",
  },
  minimal: {
    card_background: "transparent",
    item_background: "transparent",
    border_color: "transparent",
    item_shadow: "none",
    border_radius: 0,
    item_gap: 2,
    artwork_inset: 0,
    title_size: 16,
    progress_height: 5,
    playing_color: "var(--primary-color, #2986cc)",
    paused_color: "var(--warning-color, #f59e0b)",
    buffering_color: "var(--error-color, #db4437)",
  },
} as const;

export function modeTitle(config: CardConfig): string {
  if (config.title) return config.title;
  return {
    active: "Active streams",
    recently_added: "Recently added",
    popular: "Popular on Plex",
    users: "Plex user activity",
    history: "Watch history",
  }[config.mode];
}
