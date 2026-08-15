export type CardMode = "active" | "recently_added" | "popular" | "users" | "history";
export type Density = "compact" | "comfortable" | "detailed";
export type ArtworkMode = "poster" | "backdrop" | "both" | "none";
export type LayoutMode = "grid" | "list" | "carousel";
export type ArtworkFit = "cover" | "contain";
export type ArtworkAspect = "auto" | "poster" | "square" | "backdrop";
export type ArtworkPlacement = "left" | "right" | "background";
export type StylePreset = "classic" | "modern" | "minimal";
export type PopupDetailField =
  | "user"
  | "player"
  | "device"
  | "eta"
  | "pause_duration"
  | "playback_decision"
  | "video_quality"
  | "audio_quality"
  | "bandwidth"
  | "episode"
  | "year"
  | "content_rating"
  | "rating"
  | "audience_rating"
  | "genres"
  | "studio";

export interface HomeAssistant {
  callWS<T>(message: Record<string, unknown>): Promise<T>;
  connection: {
    subscribeMessage<T>(
      callback: (event: T) => void,
      message: Record<string, unknown>,
    ): Promise<() => void>;
  };
  locale?: { language?: string };
  themes?: { darkMode?: boolean };
}

export interface CardConfig {
  type: "custom:tautulli-media-card";
  config_version?: number;
  entry_id?: string;
  mode: CardMode;
  title?: string;
  media_type?: "all" | "video" | "music" | "movie" | "show" | "artist";
  section_id?: string;
  recent_grouping?: "none" | "smart" | "show" | "season";
  user_id?: string;
  max_items?: number;
  columns?: "auto" | number;
  layout?: LayoutMode;
  sort_by?: "server" | "user" | "title" | "state" | "progress";
  sort_direction?: "ascending" | "descending";
  density?: Density;
  artwork?: ArtworkMode;
  artwork_fit?: ArtworkFit;
  artwork_aspect?: ArtworkAspect;
  artwork_position?: "center" | "top" | "bottom" | "left" | "right";
  artwork_placement?: ArtworkPlacement;
  backdrop_opacity?: number;
  style_preset?: StylePreset;
  container_style?: "auto" | "surface" | "transparent";
  card_background?: string;
  item_background?: string;
  border_color?: string;
  item_shadow?: string;
  border_radius?: number;
  item_gap?: number;
  artwork_width?: number;
  artwork_inset?: number;
  title_size?: number;
  progress_height?: number;
  playing_color?: string;
  paused_color?: string;
  buffering_color?: string;
  show_header?: boolean;
  show_count?: boolean;
  show_user?: boolean;
  show_device?: boolean;
  show_quality?: boolean;
  show_progress?: boolean;
  show_progress_percent?: boolean;
  show_state?: boolean;
  show_pause_duration?: boolean;
  show_track_number?: boolean;
  show_eta?: boolean;
  show_remaining?: boolean;
  show_bandwidth?: boolean;
  show_media_details?: boolean;
  show_audio_quality?: boolean;
  show_summary?: boolean;
  show_empty?: boolean;
  animations?: boolean;
  allow_termination?: boolean;
  termination_location?: "popup" | "card" | "both";
  click_action?: "none" | "details";
  popup_style?: "clean" | "panel" | "cinematic";
  popup_content_style?: "open" | "panel";
  popup_detail_order?: PopupDetailField[];
  popup_show_artwork?: boolean;
  popup_show_summary?: boolean;
  popup_summary_show_user?: boolean;
  popup_summary_lines?: 0 | 2 | 3 | 5;
  popup_width?: "compact" | "standard" | "wide";
  popup_animation?: "none" | "fade" | "scale" | "rise";
  popup_animation_duration?: number;
  popup_backdrop_dim?: number;
  popup_backdrop_blur?: number;
  popup_background?: string;
  termination_popup_placement?: "top" | "footer";
  termination_button_style?: "label" | "icon";
  popup_show_technical?: boolean;
  popup_show_user?: boolean;
  popup_show_progress?: boolean;
  popup_show_timing?: boolean;
  popup_show_client?: boolean;
  popup_show_quality?: boolean;
  popup_show_eta?: boolean;
  popup_show_pause_duration?: boolean;
  popup_show_player?: boolean;
  popup_show_device?: boolean;
  popup_show_playback_decision?: boolean;
  popup_show_video_quality?: boolean;
  popup_show_audio_quality?: boolean;
  popup_show_bandwidth?: boolean;
  popup_show_media_details?: boolean;
  popup_show_ratings?: boolean;
  popup_show_episode?: boolean;
  popup_show_media_type?: boolean;
  popup_show_year?: boolean;
  popup_show_duration?: boolean;
  popup_show_library?: boolean;
  popup_show_content_rating?: boolean;
  popup_show_rating?: boolean;
  popup_show_audience_rating?: boolean;
  popup_show_genres?: boolean;
  popup_show_studio?: boolean;
  popup_show_playback_breakdown?: boolean;
  popup_show_favourites?: boolean;
  popup_show_habits?: boolean;
  popup_show_recent_activity?: boolean;
  stat_id?: string;
  time_range?: number;
  metric?: "plays" | "duration";
}

export interface Capabilities {
  active_streams: boolean;
  active_stream_subscription: boolean;
  recently_added: boolean;
  home_stats: boolean;
  users: boolean;
  user_stats: boolean;
  libraries: boolean;
  history: boolean;
  stream_termination: boolean;
}

export interface EntrySummary {
  entry_id: string;
  name: string;
  server_id: string;
  schema_version: number;
  capabilities: Capabilities;
}

export interface ImageSet {
  poster_url?: string | null;
  poster_aspect?: string;
  backdrop_url?: string | null;
  backdrop_aspect?: string;
}

export interface MediaItem {
  id?: string | null;
  rating_key?: string | null;
  type?: string;
  title?: string | null;
  full_title?: string | null;
  year?: number | null;
  added_at?: string | null;
  duration_seconds?: number;
  summary?: string | null;
  content_rating?: string | null;
  rating?: number | null;
  audience_rating?: number | null;
  genres?: string[];
  studio?: string | null;
  hierarchy?: Record<string, string | number | null>;
  library?: { id?: string | null; name?: string | null };
  images?: ImageSet;
}

export interface ActiveStream {
  id: string;
  session_id?: string | null;
  state: string;
  user?: { id?: string | null; user_id?: string | null; display_name?: string | null };
  media: MediaItem;
  playback: {
    progress_percent: number;
    duration_ms: number;
    remaining_ms: number;
    paused_seconds: number;
    eta?: string | null;
  };
  client?: { product?: string | null; player?: string | null; device?: string | null } | null;
  quality?: {
    decision?: string | null;
    bandwidth_kbps?: number;
    video_resolution?: string | null;
    audio_codec?: string | null;
    audio_channel_layout?: string | null;
    audio_bitrate_kbps?: number;
  };
  images?: ImageSet;
}

export interface CardEnvelope<T> {
  schema_version: number;
  entry_id: string;
  server: { id: string; name: string };
  generated_at: string;
  stale: boolean;
  capabilities: Capabilities;
  items: T[];
  next_offset?: number | null;
  total?: number;
}

declare global {
  interface Window {
    customCards?: Array<{ type: string; name: string; description: string; preview?: boolean }>;
  }
}
