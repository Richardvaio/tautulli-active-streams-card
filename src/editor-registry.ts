import type { Capabilities, CardConfig, CardMode, EntrySummary } from "./types";

export interface SelectItem { value: string; label: string }

/** Runtime data the editor has loaded (servers, libraries, users, capabilities). */
export interface EditorData {
  entries: EntrySummary[];
  libraries: SelectItem[];
  users: SelectItem[];
  capabilities?: Capabilities;
}

/** Everything a field's visibility and options can depend on. */
export interface FieldContext {
  config: CardConfig;
  mode: CardMode;
  data: EditorData;
}

export interface Applicability {
  /** Modes the setting applies to. Omit for all modes. */
  modes?: readonly CardMode[];
  /** Config/runtime-dependent predicate. Omit for always (within modes). */
  when?: (ctx: FieldContext) => boolean;
}

type Label = string | ((ctx: FieldContext) => string);

interface BaseField extends Applicability {
  key: keyof CardConfig;
  label: Label;
}

export interface SelectField extends BaseField {
  kind: "select";
  options: SelectItem[] | ((ctx: FieldContext) => SelectItem[]);
}

export interface ToggleField extends BaseField {
  kind: "toggle";
}

export interface NumberField extends BaseField {
  kind: "number";
  min: number;
  max: number;
  suffix: string;
}

export interface ToggleNumberField extends BaseField {
  kind: "toggleNumber";
  min: number;
  max: number;
  suffix: string;
}

export interface TextField extends BaseField {
  kind: "text";
  placeholder?: string;
}

export interface AppearanceTextField extends BaseField {
  kind: "appearanceText";
  placeholder: string;
  colour?: boolean;
}

export interface AppearanceNumberField extends BaseField {
  kind: "appearanceNumber";
  min: number;
  max: number;
  suffix: string;
  fallback?: (ctx: FieldContext) => number;
}

export interface HintField extends Applicability {
  kind: "hint";
  text: string | ((ctx: FieldContext) => string);
}

export interface BlockField extends Applicability {
  kind: "block";
  /** Identifier of a composite block rendered by dedicated editor code. */
  block: "recipes" | "streamDetailOrder" | "terminationUnavailableHint";
}

export type Field =
  | SelectField
  | ToggleField
  | NumberField
  | ToggleNumberField
  | TextField
  | AppearanceTextField
  | AppearanceNumberField
  | HintField
  | BlockField;

export interface SubSection {
  summary: string;
  description?: string;
  /** Renders the fine-tune header (reset button + explanation). */
  header?: "fineTune";
  className?: string;
  fields?: Field[];
  applies?: Applicability;
}

export interface Section {
  id: string;
  /** Renders an <h3> group title above the section when set. */
  groupTitle?: string;
  summary: Label;
  description?: string | ((ctx: FieldContext) => string);
  fields?: Field[];
  subsections?: SubSection[];
  applies?: Applicability;
}

export const ALL_MODES: readonly CardMode[] = ["active", "recently_added", "popular", "users", "history"];
const NOT_ACTIVE: readonly CardMode[] = ["recently_added", "popular", "users", "history"];

export function appliesTo(applies: Applicability | undefined, ctx: FieldContext): boolean {
  if (applies?.modes && !applies.modes.includes(ctx.mode)) return false;
  if (applies?.when && !applies.when(ctx)) return false;
  return true;
}

const posterish = (ctx: FieldContext) => ["poster", "both"].includes(ctx.config.artwork ?? "poster");
const backdropish = (ctx: FieldContext) => ["backdrop", "both"].includes(ctx.config.artwork ?? "poster");
const popupEnabled = (ctx: FieldContext) => ctx.config.click_action === "details";
const animating = (ctx: FieldContext) => (ctx.config.popup_animation ?? "scale") !== "none";
const summaryShown = (ctx: FieldContext) => Boolean(ctx.config.popup_show_summary);
const canTerminate = (ctx: FieldContext) => Boolean(ctx.data.capabilities?.stream_termination);
const terminationArmed = (ctx: FieldContext) => canTerminate(ctx) && Boolean(ctx.config.allow_termination);
const terminationInPopup = (ctx: FieldContext) =>
  terminationArmed(ctx) && popupEnabled(ctx) && ["popup", "both"].includes(ctx.config.termination_location ?? "popup");

export const EDITOR_SECTIONS: Section[] = [
  {
    id: "content-source",
    summary: "Content and source",
    description: "Choose the server and the information this card should display.",
    fields: [
      {
        kind: "select", key: "entry_id", label: "Tautulli server",
        options: (ctx) => ctx.data.entries.map((e) => ({ value: e.entry_id, label: e.name })),
      },
      {
        kind: "select", key: "mode", label: "View",
        options: (ctx) => {
          const cap = ctx.data.capabilities;
          return [
            { value: "active", label: "Active streams" },
            ...(cap?.recently_added === false ? [] : [{ value: "recently_added", label: "Recently added" }]),
            ...(cap?.home_stats === false ? [] : [{ value: "popular", label: "Popular and top media" }]),
            ...(cap?.user_stats === false ? [] : [{ value: "users", label: "Plex user activity" }]),
            ...(cap?.history === false ? [] : [{ value: "history", label: "Watch history (administrators)" }]),
          ];
        },
      },
      { kind: "text", key: "title", label: "Title" },
      {
        kind: "select", key: "media_type", label: "Media", modes: ["active"],
        options: [
          { value: "all", label: "All active streams" },
          { value: "video", label: "Movies and TV" },
          { value: "music", label: "Music" },
        ],
      },
      {
        kind: "select", key: "media_type", label: "Media", modes: ["recently_added"],
        options: [
          { value: "all", label: "All media" },
          { value: "movie", label: "Movies" },
          { value: "show", label: "TV" },
          { value: "artist", label: "Music" },
        ],
      },
      {
        kind: "select", key: "recent_grouping", label: "Group additions", modes: ["recently_added"],
        options: [
          { value: "none", label: "Show every item" },
          { value: "smart", label: "Smart TV and music grouping" },
          { value: "show", label: "Group TV by show" },
          { value: "season", label: "Group TV by season" },
        ],
      },
      {
        kind: "select", key: "section_id", label: "Library", modes: NOT_ACTIVE,
        options: (ctx) => [{ value: "", label: "All libraries" }, ...ctx.data.libraries],
      },
      {
        kind: "select", key: "user_id", label: "Plex user", modes: ["popular", "history"],
        options: (ctx) => [{ value: "", label: "All users" }, ...ctx.data.users],
      },
      {
        kind: "select", key: "stat_id", label: "Ranking", modes: ["popular"],
        options: [
          { value: "popular_movies", label: "Popular movies" },
          { value: "top_movies", label: "Top movies" },
          { value: "popular_tv", label: "Popular TV" },
          { value: "top_tv", label: "Top TV" },
          { value: "popular_music", label: "Popular music" },
          { value: "top_music", label: "Top music" },
          { value: "top_users", label: "Top users" },
          { value: "top_libraries", label: "Top libraries" },
          { value: "top_platforms", label: "Top platforms" },
          { value: "last_watched", label: "Last watched" },
          { value: "most_concurrent", label: "Most concurrent" },
        ],
      },
      {
        kind: "select", key: "metric", label: "Rank by", modes: ["popular"],
        options: [
          { value: "plays", label: "Play count" },
          { value: "duration", label: "Watch duration" },
        ],
      },
      { kind: "number", key: "time_range", label: "Time range", min: 1, max: 3650, suffix: "days", modes: ["popular"] },
    ],
  },
  {
    id: "card-appearance",
    groupTitle: "Card settings",
    summary: "Card layout and appearance",
    description: "Choose a ready-made look, then adjust only the layout and artwork settings that apply.",
    fields: [
      { kind: "block", block: "recipes" },
      {
        kind: "select", key: "style_preset", label: "Visual style",
        options: [
          { value: "classic", label: "Classic Tautulli" },
          { value: "modern", label: "Modern Home Assistant" },
          { value: "minimal", label: "Minimal" },
        ],
      },
      {
        kind: "select", key: "layout", label: "Layout style",
        options: [
          { value: "grid", label: "Responsive grid" },
          { value: "list", label: "Single-column list" },
          { value: "carousel", label: "Poster shelf / carousel" },
        ],
      },
      {
        kind: "select", key: "density", label: "Density",
        options: [
          { value: "compact", label: "Compact" },
          { value: "comfortable", label: "Comfortable" },
          { value: "detailed", label: "Detailed" },
        ],
      },
      {
        kind: "select", key: "columns", label: "Columns", when: (ctx) => ctx.config.layout === "grid",
        options: [
          { value: "auto", label: "Automatic" },
          { value: "1", label: "1" }, { value: "2", label: "2" },
          { value: "3", label: "3" }, { value: "4", label: "4" },
        ],
      },
      {
        kind: "select", key: "sort_by", label: "Sort active streams by", modes: ["active"],
        options: [
          { value: "server", label: "Tautulli order" },
          { value: "user", label: "Plex user" },
          { value: "title", label: "Media title" },
          { value: "state", label: "Playback state" },
          { value: "progress", label: "Progress" },
        ],
      },
      {
        kind: "select", key: "sort_direction", label: "Sort direction",
        modes: ["active"], when: (ctx) => (ctx.config.sort_by ?? "server") !== "server",
        options: [
          { value: "ascending", label: "Ascending" },
          { value: "descending", label: "Descending" },
        ],
      },
      {
        kind: "select", key: "artwork", label: "Artwork display",
        options: [
          { value: "poster", label: "Poster / cover" },
          { value: "backdrop", label: "Backdrop" },
          { value: "both", label: "Poster / cover with backdrop" },
          { value: "none", label: "None" },
        ],
      },
      {
        kind: "select", key: "container_style", label: "Outer card background",
        options: [
          { value: "auto", label: "Automatic for style" },
          { value: "surface", label: "Home Assistant surface" },
          { value: "transparent", label: "Transparent (items only)" },
        ],
      },
      {
        kind: "number", key: "max_items",
        label: (ctx) => (ctx.mode === "active" ? "Maximum active streams" : "Maximum items"),
        min: 1, max: 50, suffix: "",
      },
    ],
    subsections: [
      {
        summary: "Artwork adjustments",
        className: "inline-advanced",
        applies: { when: (ctx) => (ctx.config.artwork ?? "poster") !== "none" },
        description: "Recommended values come from the selected look. These controls only affect the artwork currently in use.",
        fields: [
          {
            kind: "select", key: "artwork_placement", label: "Artwork position", when: posterish,
            options: [
              { value: "left", label: "Left of content" },
              { value: "right", label: "Right of content" },
              { value: "background", label: "Behind content (background)" },
            ],
          },
          {
            kind: "select", key: "artwork_aspect", label: "Poster / cover shape", when: posterish,
            options: [
              { value: "auto", label: "Automatic for media" },
              { value: "poster", label: "Poster (2:3)" },
              { value: "square", label: "Square (1:1)" },
              { value: "backdrop", label: "Widescreen (16:9)" },
            ],
          },
          {
            kind: "select", key: "artwork_fit", label: "Poster / cover fit", when: posterish,
            options: [
              { value: "cover", label: "Crop to fill" },
              { value: "contain", label: "Show whole image" },
            ],
          },
          {
            kind: "select", key: "artwork_position", label: "Image focus",
            options: [
              { value: "center", label: "Centre" },
              { value: "top", label: "Top" },
              { value: "bottom", label: "Bottom" },
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ],
          },
          { kind: "number", key: "backdrop_opacity", label: "Backdrop strength", min: 0, max: 100, suffix: "%", when: backdropish },
        ],
      },
      {
        summary: "Fine-tune colours and sizing",
        header: "fineTune",
        fields: [
          { kind: "appearanceText", key: "card_background", label: "Card background", placeholder: "Theme variable, colour, or rgba()", colour: true },
          { kind: "appearanceText", key: "item_background", label: "Stream background", placeholder: "Theme variable, colour, or rgba()", colour: true },
          { kind: "appearanceText", key: "border_color", label: "Border colour", placeholder: "Theme variable or colour", colour: true },
          { kind: "appearanceText", key: "item_shadow", label: "Panel shadow", placeholder: "CSS box-shadow value" },
          { kind: "appearanceNumber", key: "border_radius", label: "Corner radius", min: 0, max: 32, suffix: "px" },
          { kind: "appearanceNumber", key: "item_gap", label: "Item spacing", min: 0, max: 32, suffix: "px" },
          { kind: "appearanceNumber", key: "artwork_width", label: "Poster / cover width", min: 48, max: 240, suffix: "px", when: posterish,
            fallback: (ctx) => (ctx.config.style_preset === "classic" ? 85 : ctx.config.density === "comfortable" ? 112 : ctx.config.density === "detailed" ? 140 : 92) },
          { kind: "appearanceNumber", key: "artwork_inset", label: "Poster / cover inset", min: 0, max: 24, suffix: "px", when: posterish },
          { kind: "appearanceNumber", key: "title_size", label: "Base title size", min: 11, max: 32, suffix: "px" },
          { kind: "appearanceNumber", key: "progress_height", label: "Progress height", min: 2, max: 24, suffix: "px" },
          { kind: "appearanceText", key: "playing_color", label: "Playing colour", placeholder: "Theme variable or colour", colour: true },
          { kind: "appearanceText", key: "paused_color", label: "Paused colour", placeholder: "Theme variable or colour", colour: true },
          { kind: "appearanceText", key: "buffering_color", label: "Buffering colour", placeholder: "Theme variable or colour", colour: true },
        ],
      },
    ],
  },
  {
    id: "general",
    summary: "General",
    description: "Control header, empty states and animation behaviour.",
    fields: [
      { kind: "toggle", key: "show_header", label: "Header" },
      { kind: "toggle", key: "show_count", label: "Item count" },
      { kind: "toggle", key: "show_empty", label: "Show when empty" },
      { kind: "toggle", key: "animations", label: "State animations" },
    ],
  },
  {
    id: "stream-information",
    summary: "Stream information",
    description: "Control which identity and playback details appear on each stream card.",
    applies: { modes: ["active"] },
    subsections: [
      {
        summary: "Identity", className: "inline-advanced",
        fields: [
          { kind: "toggle", key: "show_user", label: "Plex user" },
          { kind: "toggle", key: "show_device", label: "Player and device" },
        ],
      },
      {
        summary: "Media details", className: "inline-advanced",
        fields: [
          { kind: "toggle", key: "show_media_details", label: "Year / episode" },
          { kind: "toggle", key: "show_audio_quality", label: "Music audio quality" },
        ],
      },
      {
        summary: "Playback and progress", className: "inline-advanced",
        fields: [
          { kind: "toggle", key: "show_progress", label: "Progress bar" },
          { kind: "toggle", key: "show_progress_percent", label: "Progress percentage" },
          { kind: "toggle", key: "show_state", label: "Playback state" },
          { kind: "toggle", key: "show_pause_duration", label: "Paused duration" },
          { kind: "toggle", key: "show_track_number", label: "Music track number" },
          { kind: "toggle", key: "show_eta", label: "Estimated finish time" },
          { kind: "toggle", key: "show_remaining", label: "Time remaining" },
        ],
      },
      {
        summary: "Quality and bandwidth", className: "inline-advanced",
        fields: [
          { kind: "toggle", key: "show_quality", label: "Video quality" },
          { kind: "toggle", key: "show_bandwidth", label: "Bandwidth" },
        ],
      },
    ],
  },
  {
    id: "card-information",
    summary: "Card information",
    description: "Control what information appears on each item.",
    applies: { modes: NOT_ACTIVE },
    fields: [
      { kind: "toggle", key: "show_summary", label: "Summary" },
    ],
  },
  {
    id: "tap-behaviour",
    summary: "Tap behaviour",
    description: "Choose what happens when an item is tapped on the dashboard card.",
    fields: [
      {
        kind: "select", key: "click_action", label: "Tap action",
        options: [
          { value: "none", label: "Do nothing" },
          { value: "details", label: "Open details popup" },
        ],
      },
      { kind: "hint", text: "The popup has its own settings below under “Popup settings”.", when: popupEnabled },
    ],
  },
  {
    id: "terminate",
    summary: "Terminate stream",
    description: (ctx) => popupEnabled(ctx)
      ? "Configure the administrator-only terminate button and where it appears."
      : "The terminate button will appear directly on stream cards in the main card.",
    applies: { modes: ["active"] },
    fields: [
      { kind: "block", block: "terminationUnavailableHint", when: (ctx) => !canTerminate(ctx) },
      { kind: "toggle", key: "allow_termination", label: "Enable terminate-stream action", when: canTerminate },
      {
        kind: "select", key: "termination_location", label: "Show button in",
        when: (ctx) => terminationArmed(ctx) && popupEnabled(ctx),
        options: [
          { value: "popup", label: "Details popup only" },
          { value: "card", label: "Main card only" },
          { value: "both", label: "Both popup and main card" },
        ],
      },
      {
        kind: "select", key: "termination_popup_placement", label: "Button position in popup", when: terminationInPopup,
        options: [
          { value: "footer", label: "Bottom right" },
          { value: "top", label: "Top right beside artwork" },
        ],
      },
      {
        kind: "select", key: "termination_button_style", label: "Button style in popup", when: terminationInPopup,
        options: [
          { value: "label", label: "Icon and text" },
          { value: "icon", label: "Compact stop icon" },
        ],
      },
      { kind: "hint", text: "Requires “Allow administrators to terminate streams from cards” in the integration's Dashboard card access settings. A separate confirmation is always required." },
    ],
  },
  {
    id: "popup-appearance",
    groupTitle: "Popup settings",
    summary: "Popup layout and appearance",
    description: "Control the details window independently from the dashboard card.",
    applies: { when: popupEnabled },
    fields: [
      {
        kind: "select", key: "popup_style", label: "Popup appearance",
        options: [
          { value: "clean", label: "Clean surface" },
          { value: "panel", label: "Framed summary" },
          { value: "cinematic", label: "Cinematic backdrop" },
        ],
      },
      { kind: "toggleNumber", key: "popup_cinematic_art", label: "Backdrop art strength", min: 5, max: 100, suffix: "%",
        when: (ctx) => (ctx.config.popup_style ?? "clean") === "cinematic" },
      {
        kind: "select", key: "popup_width", label: "Popup width",
        options: [
          { value: "compact", label: "Compact" },
          { value: "standard", label: "Standard" },
          { value: "wide", label: "Wide" },
        ],
      },
      {
        kind: "select", key: "popup_animation", label: "Open animation",
        options: [
          { value: "none", label: "None" },
          { value: "fade", label: "Fade in" },
          { value: "scale", label: "Scale up" },
          { value: "rise", label: "Rise from below" },
        ],
      },
      { kind: "number", key: "popup_animation_duration", label: "Animation duration", min: 0, max: 1500, suffix: "ms", when: animating },
      { kind: "toggleNumber", key: "popup_backdrop_dim", label: "Dim background", min: 1, max: 95, suffix: "%" },
      { kind: "toggleNumber", key: "popup_backdrop_blur", label: "Blur background", min: 1, max: 24, suffix: "px" },
      { kind: "appearanceText", key: "popup_background", label: "Popup background", placeholder: "Theme variable, colour, or rgba()", colour: true },
    ],
  },
  {
    id: "popup-summary",
    summary: "Popup summary",
    description: "Choose the media context displayed above the progress bar.",
    applies: { when: popupEnabled },
    fields: [
      { kind: "toggle", key: "popup_show_artwork", label: "Artwork", when: (ctx) => ctx.mode !== "users" },
      { kind: "toggle", key: "popup_show_summary", label: "Media description", when: (ctx) => ctx.mode !== "users" },
      {
        kind: "select", key: "popup_summary_lines", label: "Description length",
        when: (ctx) => ctx.mode !== "users" && summaryShown(ctx),
        options: [
          { value: "2", label: "2 lines" }, { value: "3", label: "3 lines" },
          { value: "5", label: "5 lines" }, { value: "0", label: "Full description" },
        ],
      },
      { kind: "toggle", key: "popup_summary_show_user", label: "Plex user", modes: ["active"] },
      { kind: "toggle", key: "popup_show_user", label: "Plex user", modes: ["history"] },
      { kind: "toggle", key: "popup_show_progress", label: "Progress", modes: ["active"] },
    ],
  },
  {
    id: "popup-details",
    summary: (ctx) => (ctx.mode === "users" ? "User details" : ctx.mode === "active" ? "Stream details" : "Media details"),
    description: "Choose the layout and every field shown in the details area below the popup summary.",
    applies: { when: popupEnabled },
    fields: [
      {
        kind: "select", key: "popup_content_style", label: "Details presentation",
        options: [
          { value: "open", label: "Seamless — no panel" },
          { value: "panel", label: "Contained details panel" },
        ],
      },
      { kind: "block", block: "streamDetailOrder", modes: ["active"] },
      { kind: "toggle", key: "popup_show_media_type", label: "Media type", when: (ctx) => ctx.mode !== "users" },
      { kind: "toggle", key: "popup_show_year", label: "Year", when: (ctx) => ctx.mode !== "users" },
      { kind: "toggle", key: "popup_show_duration", label: "Duration", when: (ctx) => ctx.mode !== "users" },
      { kind: "toggle", key: "popup_show_library", label: "Library", when: (ctx) => ctx.mode !== "users" },
      { kind: "toggle", key: "popup_show_content_rating", label: "Content rating", when: (ctx) => ctx.mode !== "users" },
      { kind: "toggle", key: "popup_show_rating", label: "Rating", when: (ctx) => ctx.mode !== "users" },
      { kind: "toggle", key: "popup_show_audience_rating", label: "Audience rating", when: (ctx) => ctx.mode !== "users" },
      { kind: "toggle", key: "popup_show_genres", label: "Genres", when: (ctx) => ctx.mode !== "users" },
      { kind: "toggle", key: "popup_show_studio", label: "Studio", when: (ctx) => ctx.mode !== "users" },
      { kind: "toggle", key: "popup_show_playback_breakdown", label: "Playback breakdown", modes: ["users"] },
      { kind: "toggle", key: "popup_show_favourites", label: "Favourite media", modes: ["users"] },
      { kind: "toggle", key: "popup_show_habits", label: "Viewing habits and player", modes: ["users"] },
      { kind: "toggle", key: "popup_show_recent_activity", label: "Recent activity", modes: ["users"] },
    ],
  },
];
