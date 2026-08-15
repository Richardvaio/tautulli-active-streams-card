import { LitElement, html, nothing } from "lit";
import type { PropertyValues } from "lit";
import { getEntries, getLibraries, getUsers, subscribeActive } from "./api";
import { compactConfig, DEFAULT_POPUP_DETAIL_ORDER, normalizeConfig, STYLE_PRESETS } from "./config";
import { editorStyles } from "./styles";
import type { CardConfig, EntrySummary, HomeAssistant, PopupDetailField } from "./types";

interface SelectItem { value: string; label: string }

const STREAM_DETAIL_FIELDS: Array<{ field: PopupDetailField; key: keyof CardConfig; label: string }> = [
  { field: "user", key: "popup_show_user", label: "Plex user" },
  { field: "player", key: "popup_show_player", label: "Player / app" },
  { field: "device", key: "popup_show_device", label: "Device" },
  { field: "eta", key: "popup_show_eta", label: "Estimated finish time" },
  { field: "pause_duration", key: "popup_show_pause_duration", label: "Paused duration (when paused)" },
  { field: "playback_decision", key: "popup_show_playback_decision", label: "Playback decision" },
  { field: "video_quality", key: "popup_show_video_quality", label: "Video quality" },
  { field: "audio_quality", key: "popup_show_audio_quality", label: "Audio quality" },
  { field: "bandwidth", key: "popup_show_bandwidth", label: "Bandwidth" },
  { field: "episode", key: "popup_show_episode", label: "Season / episode" },
  { field: "year", key: "popup_show_year", label: "Year" },
  { field: "content_rating", key: "popup_show_content_rating", label: "Content rating" },
  { field: "rating", key: "popup_show_rating", label: "Rating" },
  { field: "audience_rating", key: "popup_show_audience_rating", label: "Audience rating" },
  { field: "genres", key: "popup_show_genres", label: "Genres" },
  { field: "studio", key: "popup_show_studio", label: "Studio" },
];

export class TautulliMediaCardEditor extends LitElement {
  static override properties = {
    hass: { attribute: false },
    _config: { state: true },
    _entries: { state: true },
    _libraries: { state: true },
    _users: { state: true },
    _activeCount: { state: true },
    _draggedDetailField: { state: true },
    _dragPreviewOrder: { state: true },
    _error: { state: true },
  };

  static override styles = editorStyles;
  declare hass?: HomeAssistant;
  declare private _config: CardConfig;
  declare private _entries: EntrySummary[];
  declare private _libraries: SelectItem[];
  declare private _users: SelectItem[];
  declare private _activeCount?: number;
  declare private _error?: string;
  private _activeEntryId?: string;
  private _unsubscribeActive?: () => void;
  private _subscriptionGeneration = 0;
  declare private _draggedDetailField?: PopupDetailField;
  declare private _dragPreviewOrder?: PopupDetailField[];
  private _lastDragTarget?: PopupDetailField;
  private _dragOriginalOrder?: PopupDetailField[];

  constructor() {
    super();
    this._config = normalizeConfig({});
    this._entries = [];
    this._libraries = [];
    this._users = [];
  }

  setConfig(config: Partial<CardConfig>): void {
    this._config = normalizeConfig(config);
  }

  override disconnectedCallback(): void {
    this._stopActiveSubscription();
    super.disconnectedCallback();
  }

  protected override updated(changed: PropertyValues): void {
    this.renderRoot.querySelectorAll<HTMLSelectElement>("select[data-key]").forEach((select) => {
      const key = select.dataset.key as keyof CardConfig;
      const value = this._config[key];
      if (value !== undefined) select.value = String(value);
    });
    if (changed.has("hass") && this.hass && !this._entries.length) void this._loadEntries();
    if (changed.has("hass") || changed.has("_config")) void this._startActiveSubscription();
  }

  private async _loadEntries(): Promise<void> {
    if (!this.hass) return;
    try {
      this._entries = await getEntries(this.hass);
      if (!this._config.entry_id && this._entries[0]) {
        this._update("entry_id", this._entries[0].entry_id);
      }
      await this._loadReferences();
      await this._startActiveSubscription();
    } catch (error) {
      this._error = error instanceof Error ? error.message : String(error);
    }
  }

  private async _startActiveSubscription(): Promise<void> {
    const entryId = this._config.entry_id;
    if (!this.hass || !entryId || this._activeEntryId === entryId) return;
    this._stopActiveSubscription();
    const generation = ++this._subscriptionGeneration;
    this._activeEntryId = entryId;
    this._activeCount = undefined;
    try {
      const unsubscribe = await subscribeActive(this.hass, entryId, (envelope) => {
        const count = envelope.items?.length ?? 0;
        queueMicrotask(() => {
          if (generation === this._subscriptionGeneration) this._activeCount = count;
        });
      });
      if (generation === this._subscriptionGeneration) this._unsubscribeActive = unsubscribe;
      else if (typeof unsubscribe === "function") unsubscribe();
    } catch {
      if (generation === this._subscriptionGeneration) this._activeCount = undefined;
    }
  }

  private _stopActiveSubscription(): void {
    this._subscriptionGeneration += 1;
    if (typeof this._unsubscribeActive === "function") this._unsubscribeActive();
    this._unsubscribeActive = undefined;
    this._activeEntryId = undefined;
  }

  private async _loadReferences(): Promise<void> {
    if (!this.hass || !this._config.entry_id) return;
    try {
      const [libraries, users] = await Promise.all([
        getLibraries(this.hass, this._config.entry_id),
        getUsers(this.hass, this._config.entry_id),
      ]);
      this._libraries = libraries.items.map((item) => ({ value: item.section_id, label: `${item.name} (${item.type})` }));
      this._users = users.items.map((item) => ({ value: item.user_id, label: item.display_name }));
      this._error = undefined;
    } catch (error) {
      this._error = error instanceof Error ? error.message : String(error);
    }
  }

  protected override render() {
    const mode = this._config.mode;
    const capabilities = this._entries.find(
      (entry) => entry.entry_id === this._config.entry_id,
    )?.capabilities;
    const modes: SelectItem[] = [
      { value: "active", label: "Active streams" },
      ...(capabilities?.recently_added === false ? [] : [{ value: "recently_added", label: "Recently added" }]),
      ...(capabilities?.home_stats === false ? [] : [{ value: "popular", label: "Popular and top media" }]),
      ...(capabilities?.user_stats === false ? [] : [{ value: "users", label: "Plex user activity" }]),
      ...(capabilities?.history === false ? [] : [{ value: "history", label: "Watch history (administrators)" }]),
    ];
    return html`<div class="editor">
      ${this._error ? html`<div class="error" role="alert">${this._error}</div>` : nothing}
      ${this._config.entry_id && capabilities ? html`<div class="compatibility"><span></span><div><strong>${this._entries.find((entry) => entry.entry_id === this._config.entry_id)?.name ?? "Tautulli"}</strong><small>${this._connectionMessage(mode)}</small></div></div>` : nothing}
      <details class="section">
        <summary>Content and source</summary>
        <p class="section-description">Choose the server and the information this card should display.</p>
        ${this._select("entry_id", "Tautulli server", this._entries.map((e) => ({ value: e.entry_id, label: e.name })), this._config.entry_id ?? "")}
        ${this._select("mode", "View", modes, mode)}
        <label>Title<input data-key="title" .value=${this._config.title ?? ""} @input=${this._input}></label>
        ${mode === "active" ? this._select("media_type", "Media", [
          { value: "all", label: "All active streams" }, { value: "video", label: "Movies and TV" }, { value: "music", label: "Music" },
        ], this._config.media_type ?? "all") : nothing}
        ${mode === "recently_added" ? this._select("media_type", "Media", [
          { value: "all", label: "All media" }, { value: "movie", label: "Movies" }, { value: "show", label: "TV" }, { value: "artist", label: "Music" },
        ], this._config.media_type ?? "all") : nothing}
        ${mode === "recently_added" ? this._select("recent_grouping", "Group additions", [
          {value:"none",label:"Show every item"},{value:"smart",label:"Smart TV and music grouping"},{value:"show",label:"Group TV by show"},{value:"season",label:"Group TV by season"},
        ], this._config.recent_grouping ?? "none") : nothing}
        ${mode !== "active" ? this._select("section_id", "Library", [{ value: "", label: "All libraries" }, ...this._libraries], this._config.section_id ?? "") : nothing}
        ${["popular", "history"].includes(mode) ? this._select("user_id", "Plex user", [{ value: "", label: "All users" }, ...this._users], this._config.user_id ?? "") : nothing}
        ${mode === "popular" ? html`
          ${this._select("stat_id", "Ranking", [
            {value:"popular_movies",label:"Popular movies"},{value:"top_movies",label:"Top movies"},{value:"popular_tv",label:"Popular TV"},{value:"top_tv",label:"Top TV"},{value:"popular_music",label:"Popular music"},{value:"top_music",label:"Top music"},{value:"top_users",label:"Top users"},{value:"top_libraries",label:"Top libraries"},{value:"top_platforms",label:"Top platforms"},{value:"last_watched",label:"Last watched"},{value:"most_concurrent",label:"Most concurrent"},
          ], this._config.stat_id ?? "popular_movies")}
          ${this._select("metric", "Rank by", [{value:"plays",label:"Play count"},{value:"duration",label:"Watch duration"}], this._config.metric ?? "plays")}
          <label>Time range (days)<input type="number" min="1" max="3650" data-key="time_range" .value=${String(this._config.time_range ?? 30)} @change=${this._input}></label>
        ` : nothing}
      </details>

      <h3 class="editor-group-title">Card settings</h3>
      <details class="section">
        <summary>Card layout and appearance</summary>
        <p class="section-description">Choose a ready-made look, then adjust only the layout and artwork settings that apply.</p>
        <div class="recipe-grid" aria-label="Quick layouts">
          ${this._recipe("classic", "Classic compact", "Original stream-panel look")}
          ${this._recipe("balanced", "Balanced", "Clean and adaptable")}
          ${this._recipe("cinematic", "Cinematic", "Backdrop and rich detail")}
          ${this._recipe("shelf", "Media shelf", "Horizontal poster carousel")}
        </div>
        ${this._select("style_preset", "Visual style", [
          {value:"classic",label:"Classic Tautulli"},
          {value:"modern",label:"Modern Home Assistant"},
          {value:"minimal",label:"Minimal"},
        ], this._config.style_preset ?? "classic")}
        ${this._select("layout", "Layout style", [
          {value:"grid",label:"Responsive grid"},{value:"list",label:"Single-column list"},{value:"carousel",label:"Poster shelf / carousel"},
        ], this._config.layout ?? "grid")}
        ${this._select("density", "Density", [{value:"compact",label:"Compact"},{value:"comfortable",label:"Comfortable"},{value:"detailed",label:"Detailed"}], this._config.density ?? "compact")}
        ${this._config.layout === "grid" ? this._select("columns", "Columns", [{value:"auto",label:"Automatic"},{value:"1",label:"1"},{value:"2",label:"2"},{value:"3",label:"3"},{value:"4",label:"4"}], String(this._config.columns ?? "auto")) : nothing}
        ${mode === "active" ? this._select("sort_by", "Sort active streams by", [
          {value:"server",label:"Tautulli order"},{value:"user",label:"Plex user"},{value:"title",label:"Media title"},{value:"state",label:"Playback state"},{value:"progress",label:"Progress"},
        ], this._config.sort_by ?? "server") : nothing}
        ${mode === "active" && this._config.sort_by !== "server" ? this._select("sort_direction", "Sort direction", [{value:"ascending",label:"Ascending"},{value:"descending",label:"Descending"}], this._config.sort_direction ?? "ascending") : nothing}
        ${this._select("artwork", "Artwork display", [
          {value:"poster",label:"Poster / cover"},
          {value:"backdrop",label:"Backdrop"},
          {value:"both",label:"Poster / cover with backdrop"},
          {value:"none",label:"None"},
        ], this._config.artwork ?? "poster")}
        ${this._config.artwork !== "none" ? html`<details class="inline-advanced">
          <summary>Artwork adjustments</summary>
          <p class="section-description">Recommended values come from the selected look. These controls only affect the artwork currently in use.</p>
          ${["poster", "both"].includes(this._config.artwork ?? "poster") ? this._select("artwork_placement", "Artwork position", [
            {value:"left",label:"Left of content"},{value:"right",label:"Right of content"},{value:"background",label:"Behind content (background)"},
          ], this._config.artwork_placement ?? "left") : nothing}
          ${["poster", "both"].includes(this._config.artwork ?? "poster") ? this._select("artwork_aspect", "Poster / cover shape", [
            {value:"auto",label:"Automatic for media"},{value:"poster",label:"Poster (2:3)"},{value:"square",label:"Square (1:1)"},{value:"backdrop",label:"Widescreen (16:9)"},
          ], this._config.artwork_aspect ?? "auto") : nothing}
          ${["poster", "both"].includes(this._config.artwork ?? "poster") ? this._select("artwork_fit", "Poster / cover fit", [{value:"cover",label:"Crop to fill"},{value:"contain",label:"Show whole image"}], this._config.artwork_fit ?? "cover") : nothing}
          ${this._select("artwork_position", "Image focus", [
            {value:"center",label:"Centre"},{value:"top",label:"Top"},{value:"bottom",label:"Bottom"},{value:"left",label:"Left"},{value:"right",label:"Right"},
          ], this._config.artwork_position ?? "center")}
          ${["backdrop", "both"].includes(this._config.artwork ?? "poster") ? this._number("backdrop_opacity", "Backdrop strength", 0, 100, "%") : nothing}
        </details>` : nothing}
        ${this._select("container_style", "Outer card background", [
          {value:"auto",label:"Automatic for style"},{value:"surface",label:"Home Assistant surface"},{value:"transparent",label:"Transparent (items only)"},
        ], this._config.container_style ?? "auto")}
        <label>${mode === "active" ? "Maximum active streams" : "Maximum items"}<input type="number" min="1" max="50" data-key="max_items" .value=${String(this._config.max_items ?? (mode === "active" ? 50 : 12))} @change=${this._input}></label>
        <details>
          <summary>Fine-tune colours and sizing</summary>
          <div class="fine-tune-header"><span>The selected style's values are shown until you override them.</span><button type="button" @click=${this._resetAppearance}>Restore style defaults</button></div>
          <div class="advanced">
            ${this._appearanceText("card_background", "Card background", "Theme variable, colour, or rgba()", true)}
            ${this._appearanceText("item_background", "Stream background", "Theme variable, colour, or rgba()", true)}
            ${this._appearanceText("border_color", "Border colour", "Theme variable or colour", true)}
            ${this._appearanceText("item_shadow", "Panel shadow", "CSS box-shadow value")}
            ${this._appearanceNumber("border_radius", "Corner radius", 0, 32, "px")}
            ${this._appearanceNumber("item_gap", "Item spacing", 0, 32, "px")}
            ${["poster", "both"].includes(this._config.artwork ?? "poster") ? this._appearanceNumber("artwork_width", "Poster / cover width", 48, 240, "px", this._config.style_preset === "classic" ? 85 : this._config.density === "comfortable" ? 112 : this._config.density === "detailed" ? 140 : 92) : nothing}
            ${["poster", "both"].includes(this._config.artwork ?? "poster") ? this._appearanceNumber("artwork_inset", "Poster / cover inset", 0, 24, "px") : nothing}
            ${this._appearanceNumber("title_size", "Base title size", 11, 32, "px")}
            ${this._appearanceNumber("progress_height", "Progress height", 2, 24, "px")}
            ${this._appearanceText("playing_color", "Playing colour", "Theme variable or colour", true)}
            ${this._appearanceText("paused_color", "Paused colour", "Theme variable or colour", true)}
            ${this._appearanceText("buffering_color", "Buffering colour", "Theme variable or colour", true)}
          </div>
        </details>
      </details>

      <details class="section">
        <summary>General</summary>
        <p class="section-description">Control header, empty states and animation behaviour.</p>
        <div class="toggles">
          ${this._toggle("show_header", "Header")}
          ${this._toggle("show_count", "Item count")}
          ${this._toggle("show_empty", "Show when empty")}
          ${this._toggle("animations", "State animations")}
        </div>
      </details>

      ${mode === "active" ? html`
      <details class="section">
        <summary>Stream information</summary>
        <p class="section-description">Control which identity and playback details appear on each stream card.</p>
        <details class="inline-advanced">
          <summary>Identity</summary>
          <div class="toggles">
            ${this._toggle("show_user", "Plex user")}
            ${this._toggle("show_device", "Player and device")}
          </div>
        </details>
        <details class="inline-advanced">
          <summary>Media details</summary>
          <div class="toggles">
            ${this._toggle("show_media_details", "Year / episode")}
            ${this._toggle("show_audio_quality", "Music audio quality")}
          </div>
        </details>
        <details class="inline-advanced">
          <summary>Playback and progress</summary>
          <div class="toggles">
            ${this._toggle("show_progress", "Progress bar")}
            ${this._toggle("show_progress_percent", "Progress percentage")}
            ${this._toggle("show_state", "Playback state")}
            ${this._toggle("show_pause_duration", "Paused duration")}
            ${this._toggle("show_track_number", "Music track number")}
            ${this._toggle("show_eta", "Estimated finish time")}
            ${this._toggle("show_remaining", "Time remaining")}
          </div>
        </details>
        <details class="inline-advanced">
          <summary>Quality and bandwidth</summary>
          <div class="toggles">
            ${this._toggle("show_quality", "Video quality")}
            ${this._toggle("show_bandwidth", "Bandwidth")}
          </div>
        </details>
      </details>
      ` : html`
      <details class="section">
        <summary>Card information</summary>
        <p class="section-description">Control what information appears on each item.</p>
        <div class="toggles">
          ${this._toggle("show_summary", "Summary")}
        </div>
      </details>
      `}

      <details class="section">
        <summary>Tap behaviour</summary>
        <p class="section-description">Choose what happens when an item is tapped on the dashboard card.</p>
        ${this._select("click_action", "Tap action", [{value:"none",label:"Do nothing"},{value:"details",label:"Open details popup"}], this._config.click_action ?? "none")}
        ${this._config.click_action === "details" ? html`<p class="hint">The popup has its own settings below under “Popup settings”.</p>` : nothing}
      </details>

      ${mode === "active" ? html`
        <details class="section">
          <summary>Terminate stream</summary>
          <p class="section-description">${this._config.click_action === "details"
            ? "Configure the administrator-only terminate button and where it appears."
            : "The terminate button will appear directly on stream cards in the main card."}</p>
          ${capabilities?.stream_termination
            ? this._toggle("allow_termination", "Enable terminate-stream action")
            : html`<p class="hint">Stream termination is disabled in the integration's Dashboard card access settings.</p>`}
          ${capabilities?.stream_termination && this._config.allow_termination ? html`
            ${this._config.click_action === "details"
              ? this._select("termination_location", "Show button in", [
                {value:"popup",label:"Details popup only"},{value:"card",label:"Main card only"},{value:"both",label:"Both popup and main card"},
              ], this._config.termination_location ?? "popup")
              : nothing}
            ${this._config.click_action === "details" && ["popup", "both"].includes(this._config.termination_location ?? "popup") ? html`
              ${this._select("termination_popup_placement", "Button position in popup", [{value:"footer",label:"Bottom right"},{value:"top",label:"Top right beside artwork"}], this._config.termination_popup_placement ?? "footer")}
              ${this._select("termination_button_style", "Button style in popup", [{value:"label",label:"Icon and text"},{value:"icon",label:"Compact stop icon"}], this._config.termination_button_style ?? "label")}
            ` : nothing}
          ` : nothing}
          <p class="hint">Requires “Allow administrators to terminate streams from cards” in the integration's Dashboard card access settings. A separate confirmation is always required.</p>
        </details>
      ` : nothing}

      ${this._config.click_action === "details" ? html`
        <h3 class="editor-group-title">Popup settings</h3>
        <details class="section">
          <summary>Popup layout and appearance</summary>
          <p class="section-description">Control the details window independently from the dashboard card.</p>
          ${this._select("popup_style", "Popup appearance", [{value:"clean",label:"Clean surface"},{value:"panel",label:"Framed summary"},{value:"cinematic",label:"Cinematic backdrop"}], this._config.popup_style ?? "clean")}
          ${this._select("popup_width", "Popup width", [{value:"compact",label:"Compact"},{value:"standard",label:"Standard"},{value:"wide",label:"Wide"}], this._config.popup_width ?? "standard")}
          ${this._select("popup_animation", "Open animation", [{value:"none",label:"None"},{value:"fade",label:"Fade in"},{value:"scale",label:"Scale up"},{value:"rise",label:"Rise from below"}], this._config.popup_animation ?? "scale")}
          ${(this._config.popup_animation ?? "scale") !== "none" ? this._number("popup_animation_duration", "Animation duration", 0, 1500, "ms") : nothing}
          ${this._toggleNumber("popup_backdrop_dim", "Dim background", 1, 95, "%")}
          ${this._toggleNumber("popup_backdrop_blur", "Blur background", 1, 24, "px")}
          ${this._appearanceText("popup_background", "Popup background", "Theme variable, colour, or rgba()", true)}
        </details>
        <details class="section">
          <summary>Popup summary</summary>
          <p class="section-description">Choose the media context displayed above the progress bar.</p>
          <div class="toggles">
            ${mode !== "users" ? this._toggle("popup_show_artwork", "Artwork") : nothing}
            ${mode !== "users" ? this._toggle("popup_show_summary", "Media description") : nothing}
            ${mode !== "users" && this._config.popup_show_summary ? this._select("popup_summary_lines", "Description length", [{value:"2",label:"2 lines"},{value:"3",label:"3 lines"},{value:"5",label:"5 lines"},{value:"0",label:"Full description"}], String(this._config.popup_summary_lines ?? 3)) : nothing}
            ${mode === "active" ? this._toggle("popup_summary_show_user", "Plex user") : nothing}
            ${mode === "history" ? this._toggle("popup_show_user", "Plex user") : nothing}
            ${mode === "active" ? this._toggle("popup_show_progress", "Progress") : nothing}
          </div>
        </details>
        <details class="section">
          <summary>${mode === "users" ? "User details" : mode === "active" ? "Stream details" : "Media details"}</summary>
          <p class="section-description">Choose the layout and every field shown in the details area below the popup summary.</p>
          ${this._select("popup_content_style", "Details presentation", [{value:"open",label:"Seamless — no panel"},{value:"panel",label:"Contained details panel"}], this._config.popup_content_style ?? "open")}
          ${mode === "active" ? this._renderOrderedStreamDetails() : html`<div class="toggles">
            ${mode !== "users" ? this._toggle("popup_show_media_type", "Media type") : nothing}
            ${mode !== "users" ? this._toggle("popup_show_year", "Year") : nothing}
            ${mode !== "users" ? this._toggle("popup_show_duration", "Duration") : nothing}
            ${mode !== "users" ? this._toggle("popup_show_library", "Library") : nothing}
            ${mode !== "users" ? this._toggle("popup_show_content_rating", "Content rating") : nothing}
            ${mode !== "users" ? this._toggle("popup_show_rating", "Rating") : nothing}
            ${mode !== "users" ? this._toggle("popup_show_audience_rating", "Audience rating") : nothing}
            ${mode !== "users" ? this._toggle("popup_show_genres", "Genres") : nothing}
            ${mode !== "users" ? this._toggle("popup_show_studio", "Studio") : nothing}
            ${mode === "users" ? this._toggle("popup_show_playback_breakdown", "Playback breakdown") : nothing}
            ${mode === "users" ? this._toggle("popup_show_favourites", "Favourite media") : nothing}
            ${mode === "users" ? this._toggle("popup_show_habits", "Viewing habits and player") : nothing}
            ${mode === "users" ? this._toggle("popup_show_recent_activity", "Recent activity") : nothing}
          </div>`}
        </details>
      ` : nothing}
      <p class="hint">Privacy and destructive permissions are enforced by the Tautulli Active Streams integration. Tokens and upstream image paths are never sent to this card.</p>
      <button class="reset-all" type="button" @click=${this._resetAllDefaults}>Reset all settings to defaults</button>
    </div>`;
  }

  private _connectionMessage(mode: CardConfig["mode"]): string {
    if (mode !== "active") return "Connected and ready";
    if (this._activeCount === undefined) return "Checking active streams…";
    if (this._activeCount === 0) return "No active streams — start playback in Plex to see the live card preview";
    return `${this._activeCount} active ${this._activeCount === 1 ? "stream" : "streams"} available in the preview`;
  }

  private _renderOrderedStreamDetails() {
    const order = this._dragPreviewOrder ?? this._config.popup_detail_order ?? DEFAULT_POPUP_DETAIL_ORDER;
    return html`<div class="detail-order-toolbar">
      <span>Drag the handle to reorder fields.</span>
      <div>
        <button type="button" @click=${() => this._setAllStreamDetails(true)}>Show all</button>
        <button type="button" @click=${() => this._setAllStreamDetails(false)}>Hide all</button>
        <button type="button" @click=${this._restoreStreamDetailOrder}>Restore order</button>
      </div>
    </div>
    <div class="detail-order-list">
      ${order.map((field, index) => this._renderStreamDetailRow(field, index, order.length))}
    </div>`;
  }

  private _renderStreamDetailRow(field: PopupDetailField, index: number, length: number) {
    const definition = STREAM_DETAIL_FIELDS.find((item) => item.field === field);
    if (!definition) return nothing;
    return html`<div class="detail-order-row ${this._draggedDetailField === field ? "dragging" : ""}" data-detail-field=${field}
      @dragover=${(event: DragEvent) => this._detailDragOver(event, field)}
      @drop=${(event: DragEvent) => this._detailDrop(event, field)}>
      <button class="drag-handle" type="button" draggable="true"
        title="Drag to reorder ${definition.label}"
        aria-label="Drag to reorder ${definition.label}"
        @dragstart=${(event: DragEvent) => this._detailDragStart(event, field)}
        @dragend=${this._detailDragEnd}>
        <ha-icon icon="mdi:drag-vertical"></ha-icon>
      </button>
      <span>${definition.label}</span>
      <div class="detail-order-actions">
        <button type="button" title="Move ${definition.label} up" aria-label="Move ${definition.label} up" ?disabled=${index === 0} @click=${() => this._moveStreamDetail(field, -1)}><ha-icon icon="mdi:chevron-up"></ha-icon></button>
        <button type="button" title="Move ${definition.label} down" aria-label="Move ${definition.label} down" ?disabled=${index === length - 1} @click=${() => this._moveStreamDetail(field, 1)}><ha-icon icon="mdi:chevron-down"></ha-icon></button>
        <input class="detail-order-toggle" type="checkbox" data-key=${definition.key} aria-label=${`Show ${definition.label}`} .checked=${Boolean(this._config[definition.key])} @change=${this._input}>
      </div>
    </div>`;
  }

  private _detailDragStart(event: DragEvent, field: PopupDetailField): void {
    const order = [...(this._config.popup_detail_order ?? DEFAULT_POPUP_DETAIL_ORDER)];
    this._draggedDetailField = field;
    this._lastDragTarget = undefined;
    this._dragOriginalOrder = order;
    this._dragPreviewOrder = order;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", field);
      const row = (event.currentTarget as HTMLElement).closest<HTMLElement>(".detail-order-row");
      if (row) event.dataTransfer.setDragImage(row, 24, Math.min(22, row.clientHeight / 2));
    }
  }

  private _detailDragOver(event: DragEvent, target: PopupDetailField): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    if (target !== this._draggedDetailField && this._lastDragTarget !== target) {
      const order = [...(this._dragPreviewOrder ?? this._config.popup_detail_order ?? DEFAULT_POPUP_DETAIL_ORDER)];
      const sourceIndex = this._draggedDetailField ? order.indexOf(this._draggedDetailField) : -1;
      const targetIndex = order.indexOf(target);
      if (sourceIndex < 0 || targetIndex < 0) return;
      const previousRects = new Map(
        [...this.renderRoot.querySelectorAll<HTMLElement>(".detail-order-row")].map((row) => [
          row.dataset.detailField,
          row.getBoundingClientRect(),
        ]),
      );
      const [source] = order.splice(sourceIndex, 1);
      order.splice(targetIndex, 0, source!);
      this._lastDragTarget = target;
      this._dragPreviewOrder = order;
      void this.updateComplete.then(() => this._animateDetailReorder(previousRects));
    }
  }

  private _detailDrop(event: DragEvent, target: PopupDetailField): void {
    event.preventDefault();
    const source = this._draggedDetailField ?? event.dataTransfer?.getData("text/plain") as PopupDetailField;
    const order = [...(this._dragPreviewOrder ?? this._config.popup_detail_order ?? DEFAULT_POPUP_DETAIL_ORDER)];
    const originalOrder = this._dragOriginalOrder ?? this._config.popup_detail_order ?? DEFAULT_POPUP_DETAIL_ORDER;
    this._draggedDetailField = undefined;
    this._lastDragTarget = undefined;
    this._dragPreviewOrder = undefined;
    this._dragOriginalOrder = undefined;
    if (!source || source === target && order.every((field, index) => field === originalOrder[index])) return;
    if (!order.every((field, index) => field === originalOrder[index])) this._update("popup_detail_order", order);
  }

  private _detailDragEnd = (): void => {
    this._draggedDetailField = undefined;
    this._lastDragTarget = undefined;
    this._dragPreviewOrder = undefined;
    this._dragOriginalOrder = undefined;
  };

  private _animateDetailReorder(previousRects: Map<string | undefined, DOMRect>): void {
    for (const row of this.renderRoot.querySelectorAll<HTMLElement>(".detail-order-row")) {
      const previous = previousRects.get(row.dataset.detailField);
      const current = row.getBoundingClientRect();
      const offset = previous ? previous.top - current.top : 0;
      if (offset && typeof row.animate === "function") {
        row.animate(
          [{ transform: `translateY(${offset}px)` }, { transform: "translateY(0)" }],
          { duration: 170, easing: "cubic-bezier(.2,.8,.2,1)" },
        );
      }
    }
  }

  private _moveStreamDetail(field: PopupDetailField, direction: -1 | 1): void {
    const order = [...(this._config.popup_detail_order ?? DEFAULT_POPUP_DETAIL_ORDER)];
    const index = order.indexOf(field);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= order.length) return;
    [order[index], order[nextIndex]] = [order[nextIndex]!, order[index]!];
    this._update("popup_detail_order", order);
  }

  private _setAllStreamDetails(visible: boolean): void {
    const config = { ...this._config } as CardConfig;
    for (const { key } of STREAM_DETAIL_FIELDS) (config as unknown as Record<string, unknown>)[key] = visible;
    this._config = normalizeConfig(config);
    this._emitConfig();
  }

  private _restoreStreamDetailOrder = (): void => {
    this._update("popup_detail_order", [...DEFAULT_POPUP_DETAIL_ORDER]);
  };

  private _select(key: keyof CardConfig, label: string, options: SelectItem[], value: string) {
    return html`<label>${label}<select data-key=${key} @change=${this._input}>
      ${options.map((option) => html`<option value=${option.value} ?selected=${option.value === value}>${option.label}</option>`)}
    </select></label>`;
  }

  private _toggle(key: keyof CardConfig, label: string) {
    return html`<label class="toggle"><input type="checkbox" data-key=${key} .checked=${Boolean(this._config[key])} @change=${this._input}>${label}</label>`;
  }

  private _text(key: keyof CardConfig, label: string, placeholder: string) {
    return html`<label>${label}<input data-key=${key} .value=${String(this._config[key] ?? "")} placeholder=${placeholder} @change=${this._input}></label>`;
  }

  private _number(key: keyof CardConfig, label: string, min: number, max: number, suffix: string) {
    return html`<label>${label} (${suffix})<input type="number" min=${min} max=${max} data-key=${key} .value=${this._config[key] === undefined ? "" : String(this._config[key])} @change=${this._input}></label>`;
  }

  private _toggleNumber(key: keyof CardConfig, label: string, min: number, max: number, suffix: string) {
    const enabled = Number(this._config[key] ?? 0) > 0;
    return html`<label class="toggle-number"><span class="toggle"><input type="checkbox" .checked=${enabled} @change=${(event: Event) => this._update(key, (event.currentTarget as HTMLInputElement).checked ? Math.max(min, 1) : 0)}>${label}</span>${enabled ? html`<span class="toggle-number-value"><input type="range" min=${min} max=${max} data-key=${key} .value=${String(this._config[key] ?? min)} @change=${this._input} @input=${this._input}> <span>${this._config[key] ?? min}${suffix}</span></span>` : nothing}</label>`;
  }

  private _appearanceText(key: keyof CardConfig, label: string, placeholder: string, colour = false) {
    const value = String(this._config[key] ?? this._presetValue(key) ?? "");
    const overridden = this._config[key] !== undefined;
    const hex = this._toHexColour(value);
    return html`<label class="appearance-field"><span>${label}${overridden ? html`<em>Custom</em>` : html`<em>Preset</em>`}</span><div class="field-row">
      ${colour ? html`<input class="colour-picker" type="color" .value=${hex} title="Choose ${label.toLowerCase()}" @input=${(event: Event) => this._setAppearance(key, (event.currentTarget as HTMLInputElement).value)}>` : nothing}
      <input data-key=${key} .value=${value} placeholder=${placeholder} @change=${this._input}>
      ${overridden ? html`<button class="field-reset" type="button" title="Restore preset value" aria-label="Restore ${label.toLowerCase()} preset value" @click=${() => this._setAppearance(key, undefined)}><ha-icon icon="mdi:restore"></ha-icon></button>` : nothing}
    </div></label>`;
  }

  private _appearanceNumber(key: keyof CardConfig, label: string, min: number, max: number, suffix: string, fallback?: number) {
    const value = this._config[key] ?? this._presetValue(key) ?? fallback ?? "";
    const overridden = this._config[key] !== undefined;
    return html`<label class="appearance-field"><span>${label} (${suffix})${overridden ? html`<em>Custom</em>` : html`<em>Preset</em>`}</span><div class="field-row">
      <input type="number" min=${min} max=${max} data-key=${key} .value=${String(value)} @change=${this._input}>
      ${overridden ? html`<button class="field-reset" type="button" title="Restore preset value" aria-label="Restore ${label.toLowerCase()} preset value" @click=${() => this._setAppearance(key, undefined)}><ha-icon icon="mdi:restore"></ha-icon></button>` : nothing}
    </div></label>`;
  }

  private _presetValue(key: keyof CardConfig): unknown {
    const preset = STYLE_PRESETS[this._config.style_preset ?? "classic"] as Record<string, unknown>;
    return preset[key];
  }

  private _toHexColour(value: string): string {
    const short = /^#([0-9a-f]{3})$/i.exec(value);
    if (short) return `#${[...short[1]!].map((character) => character + character).join("")}`;
    const full = /^#[0-9a-f]{6}$/i.exec(value);
    if (full) return full[0];
    const rgb = /rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i.exec(value);
    if (rgb) return `#${rgb.slice(1, 4).map((component) => Math.min(255, Number(component)).toString(16).padStart(2, "0")).join("")}`;
    return "#2986cc";
  }

  private _setAppearance(key: keyof CardConfig, value: unknown): void {
    this._update(key, value);
  }

  private _resetAppearance = (): void => {
    const config = { ...this._config } as CardConfig;
    for (const key of ["card_background", "item_background", "border_color", "item_shadow", "border_radius", "item_gap", "artwork_width", "artwork_inset", "title_size", "progress_height", "playing_color", "paused_color", "buffering_color"] as const) delete config[key];
    this._config = normalizeConfig(config);
    this._emitConfig();
  };

  private _resetAllDefaults = (): void => {
    const entryId = this._config.entry_id;
    this._config = normalizeConfig({ ...(entryId ? { entry_id: entryId } : {}) });
    this._emitConfig();
  };

  private _recipe(recipe: "classic" | "balanced" | "cinematic" | "shelf", title: string, description: string) {
    return html`<button class="recipe ${recipe}" type="button" @click=${() => this._applyRecipe(recipe)}><span class="recipe-preview"><i></i><i></i><i></i></span><strong>${title}</strong><small>${description}</small></button>`;
  }

  private _applyRecipe(recipe: "classic" | "balanced" | "cinematic" | "shelf"): void {
    const recipes: Record<typeof recipe, Partial<CardConfig>> = {
      classic: {
        style_preset: "classic", container_style: "transparent", layout: "grid", columns: "auto", density: "compact",
        artwork: "poster", artwork_placement: "left", artwork_aspect: "auto", artwork_fit: "cover", artwork_inset: 5,
        show_header: false, show_count: false, show_summary: false,
      },
      balanced: {
        style_preset: "modern", container_style: "surface", layout: "grid", columns: "auto", density: "comfortable",
        artwork: "poster", artwork_placement: "left", artwork_aspect: "auto", artwork_fit: "cover", artwork_inset: 0,
        show_header: true, show_count: false, show_summary: false,
      },
      cinematic: {
        style_preset: "modern", container_style: "transparent", layout: "list", density: "detailed",
        artwork: "backdrop", artwork_placement: "background", artwork_aspect: "backdrop", artwork_fit: "cover", backdrop_opacity: 38,
        show_header: true, show_count: false, show_summary: true, show_progress: true, show_remaining: true,
      },
      shelf: {
        style_preset: "modern", container_style: "transparent", layout: "carousel", density: "comfortable",
        artwork: "poster", artwork_placement: "left", artwork_aspect: "auto", artwork_fit: "cover", artwork_inset: 0,
        show_header: true, show_count: false, show_summary: false,
      },
    };
    const config = { ...this._config, ...recipes[recipe] } as CardConfig;
    for (const appearanceKey of ["card_background", "item_background", "border_color", "item_shadow", "border_radius", "item_gap", "artwork_width", "title_size", "progress_height", "playing_color", "paused_color", "buffering_color"] as const) {
      delete config[appearanceKey];
    }
    this._config = normalizeConfig(config);
    this._emitConfig();
  }

  private _input = (event: Event): void => {
    const target = event.currentTarget as HTMLInputElement | HTMLSelectElement;
    const key = target.dataset.key as keyof CardConfig;
    let value: unknown = target.value;
    if (target instanceof HTMLInputElement && target.type === "checkbox") value = target.checked;
    if (["max_items", "time_range", "border_radius", "item_gap", "artwork_width", "artwork_inset", "title_size", "progress_height", "backdrop_opacity", "popup_animation_duration", "popup_backdrop_dim", "popup_backdrop_blur"].includes(key)) {
      value = target.value === "" ? undefined : Number(target.value);
    }
    if (key === "columns" && target.value !== "auto") value = Number(target.value);
    if (key === "popup_summary_lines") value = Number(target.value);
    if (["section_id", "user_id", "title", "card_background", "item_background", "border_color", "item_shadow", "playing_color", "paused_color", "buffering_color", "popup_background"].includes(key) && target.value === "") value = undefined;
    if (key === "style_preset") {
      const config = { ...this._config, style_preset: value } as CardConfig;
      for (const appearanceKey of ["card_background", "item_background", "border_color", "item_shadow", "border_radius", "item_gap", "artwork_width", "artwork_inset", "title_size", "progress_height", "playing_color", "paused_color", "buffering_color"] as const) {
        delete config[appearanceKey];
      }
      this._config = normalizeConfig(config);
      this._emitConfig();
      return;
    }
    if (key === "artwork") {
      const artwork = value as CardConfig["artwork"];
      this._config = normalizeConfig({
        ...this._config,
        artwork,
        artwork_placement: artwork === "backdrop" ? "background" : "left",
      });
      this._emitConfig();
      return;
    }
    this._update(key, value);
    if (key === "entry_id") void this._loadReferences();
  };

  private _update(key: keyof CardConfig, value: unknown): void {
    const config = { ...this._config, [key]: value } as CardConfig;
    if (value === undefined) delete (config as unknown as Record<string, unknown>)[key];
    this._config = normalizeConfig(config);
    this._emitConfig();
  }

  private _emitConfig(): void {
    this.dispatchEvent(new CustomEvent("config-changed", {
      bubbles: true,
      composed: true,
      detail: { config: compactConfig(this._config) },
    }));
  }
}
