import { LitElement, html, nothing } from "lit";
import type { PropertyValues, TemplateResult } from "lit";
import { getEntries, getLibraries, getUsers, subscribeActive } from "./api";
import {
  ACTIVE_POPUP_DETAIL_FIELDS,
  compactConfig,
  DEFAULT_CONFIG,
  DEFAULT_POPUP_DETAIL_ORDER,
  DEFAULT_USER_POPUP_DETAIL_ORDER,
  HISTORY_POPUP_DETAIL_FIELDS,
  MEDIA_POPUP_DETAIL_FIELDS,
  normalizeConfig,
  POPULAR_POPUP_DETAIL_FIELDS,
  STYLE_PRESETS,
} from "./config";
import { appliesTo, EDITOR_SECTIONS } from "./editor-registry";
import type { BlockField, Field, FieldContext, Section, SubSection } from "./editor-registry";
import { editorStyles } from "./styles";
import type { CardConfig, CardMode, EntrySummary, HomeAssistant, PopupDetailField, UserPopupDetailGroup } from "./types";

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
  { field: "media_type", key: "popup_show_media_type", label: "Media type" },
  { field: "year", key: "popup_show_year", label: "Year" },
  { field: "duration", key: "popup_show_duration", label: "Duration" },
  { field: "library", key: "popup_show_library", label: "Library" },
  { field: "content_rating", key: "popup_show_content_rating", label: "Content rating" },
  { field: "rating", key: "popup_show_rating", label: "Rating" },
  { field: "audience_rating", key: "popup_show_audience_rating", label: "Audience rating" },
  { field: "genres", key: "popup_show_genres", label: "Genres" },
  { field: "studio", key: "popup_show_studio", label: "Studio" },
  { field: "rank", key: "popup_show_rank", label: "Rank" },
  { field: "plays", key: "popup_show_plays", label: "Plays" },
  { field: "played", key: "popup_show_played", label: "Played" },
];

const USER_DETAIL_GROUPS: Array<{ group: UserPopupDetailGroup; key: keyof CardConfig; label: string }> = [
  { group: "playback", key: "popup_show_playback_breakdown", label: "Playback breakdown" },
  { group: "favourites", key: "popup_show_favourites", label: "Favourite media" },
  { group: "habits", key: "popup_show_habits", label: "Viewing habits and player" },
  { group: "recent_activity", key: "popup_show_recent_activity", label: "Recent activity" },
];

export class TautulliMediaCardEditor extends LitElement {
  static override properties = {
    hass: { attribute: false },
    _config: { state: true },
    _entries: { state: true },
    _libraries: { state: true },
    _users: { state: true },
    _entriesLoaded: { state: true },
    _activeCount: { state: true },
    _activeUnavailable: { state: true },
    _draggedDetailField: { state: true },
    _dragPreviewOrder: { state: true },
    _draggedUserDetail: { state: true },
    _dragUserPreviewOrder: { state: true },
    _error: { state: true },
  };

  static override styles = editorStyles;
  declare hass?: HomeAssistant;
  declare private _config: CardConfig;
  declare private _entries: EntrySummary[];
  declare private _libraries: SelectItem[];
  declare private _users: SelectItem[];
  declare private _entriesLoaded: boolean;
  declare private _activeCount?: number;
  declare private _activeUnavailable: boolean;
  declare private _error?: string;
  private _activeEntryId?: string;
  private _unsubscribeActive?: () => void;
  private _subscriptionGeneration = 0;
  declare private _draggedDetailField?: PopupDetailField;
  declare private _dragPreviewOrder?: PopupDetailField[];
  declare private _draggedUserDetail?: UserPopupDetailGroup;
  declare private _dragUserPreviewOrder?: UserPopupDetailGroup[];
  private _lastDragTarget?: PopupDetailField;
  private _lastGroupTitle?: string;
  private _dragOriginalOrder?: PopupDetailField[];
  private _dragUserOriginalOrder?: UserPopupDetailGroup[];
  private _lastUserDragTarget?: UserPopupDetailGroup;
  private _referenceGeneration = 0;
  private _referenceEntryId?: string;
  private _toggleNumberValues = new Map<keyof CardConfig, number>();
  private _posterArtworkPlacement?: CardConfig["artwork_placement"];

  constructor() {
    super();
    this._config = normalizeConfig({});
    this._entries = [];
    this._libraries = [];
    this._users = [];
    this._entriesLoaded = false;
    this._activeUnavailable = false;
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
    if (this.hass && this._config.entry_id && this._entries.length && this._referenceEntryId !== this._config.entry_id) {
      void this._loadReferences();
    }
    if (changed.has("hass") || changed.has("_config")) void this._startActiveSubscription();
  }

  private async _loadEntries(): Promise<void> {
    if (!this.hass) return;
    try {
      this._entries = await getEntries(this.hass);
      this._entriesLoaded = true;
      const selected = this._entries.find((entry) => entry.entry_id === this._config.entry_id) ?? this._entries[0];
      if (selected && selected.entry_id !== this._config.entry_id) {
        this._changeEntry(selected.entry_id);
      } else if (selected) {
        this._ensureSupportedMode(selected);
      }
      await this._loadReferences();
      await this._startActiveSubscription();
    } catch (error) {
      this._entriesLoaded = true;
      this._error = this._friendlyError(error);
    }
  }

  private async _startActiveSubscription(): Promise<void> {
    const entryId = this._config.entry_id;
    if (this._config.mode !== "active") {
      this._stopActiveSubscription();
      this._activeCount = undefined;
      return;
    }
    if (!this.hass || !entryId || this._activeEntryId === entryId) return;
    this._stopActiveSubscription();
    const generation = ++this._subscriptionGeneration;
    this._activeEntryId = entryId;
    this._activeCount = undefined;
    this._activeUnavailable = false;
    try {
      const unsubscribe = await subscribeActive(this.hass, entryId, (envelope) => {
        const count = envelope.items?.length ?? 0;
        queueMicrotask(() => {
          if (generation === this._subscriptionGeneration) {
            this._activeCount = count;
            this._activeUnavailable = false;
          }
        });
      });
      if (generation === this._subscriptionGeneration) this._unsubscribeActive = unsubscribe;
      else if (typeof unsubscribe === "function") unsubscribe();
    } catch {
      if (generation === this._subscriptionGeneration) {
        this._activeCount = undefined;
        this._activeUnavailable = true;
      }
    }
  }

  private _stopActiveSubscription(): void {
    this._subscriptionGeneration += 1;
    if (typeof this._unsubscribeActive === "function") this._unsubscribeActive();
    this._unsubscribeActive = undefined;
    this._activeEntryId = undefined;
  }

  private async _loadReferences(): Promise<void> {
    const entryId = this._config.entry_id;
    if (!this.hass || !entryId) return;
    const generation = ++this._referenceGeneration;
    this._referenceEntryId = entryId;
    const [libraries, users] = await Promise.allSettled([
      getLibraries(this.hass, entryId),
      getUsers(this.hass, entryId),
    ]);
    if (generation !== this._referenceGeneration || entryId !== this._config.entry_id) return;
    this._libraries = libraries.status === "fulfilled"
      ? libraries.value.items.map((item) => ({ value: item.section_id, label: `${item.name} (${item.type})` }))
      : [];
    this._users = users.status === "fulfilled"
      ? users.value.items.map((item) => ({ value: item.user_id, label: item.display_name }))
      : [];
    if (libraries.status === "rejected" && users.status === "rejected") {
      const error = libraries.reason ?? users.reason;
      this._error = this._friendlyError(error);
    } else {
      this._error = undefined;
    }
  }

  private get _fieldContext(): FieldContext {
    return {
      config: this._config,
      mode: this._config.mode,
      data: {
        entries: this._entries,
        libraries: this._libraries,
        users: this._users,
        capabilities: this._entries.find((entry) => entry.entry_id === this._config.entry_id)?.capabilities,
      },
    };
  }

  private _supportedModes(entry?: EntrySummary): CardMode[] {
    const capabilities = entry?.capabilities;
    return [
      ...(capabilities?.active_streams === false ? [] : ["active" as const]),
      ...(capabilities?.recently_added === false ? [] : ["recently_added" as const]),
      ...(capabilities?.home_stats === false ? [] : ["popular" as const]),
      ...(capabilities?.user_stats === false ? [] : ["users" as const]),
      ...(capabilities?.history === false ? [] : ["history" as const]),
    ];
  }

  private _ensureSupportedMode(entry: EntrySummary): void {
    const supported = this._supportedModes(entry);
    if (supported.includes(this._config.mode) || !supported[0]) return;
    const mode = supported[0];
    this._config = normalizeConfig({
      ...this._config,
      mode,
      media_type: this._mediaTypeForMode(mode, this._config.media_type),
    });
    this._emitConfig();
  }

  private _changeEntry(entryId: string): void {
    const entry = this._entries.find((candidate) => candidate.entry_id === entryId);
    const supported = this._supportedModes(entry);
    const mode = supported.includes(this._config.mode) ? this._config.mode : supported[0] ?? "active";
    this._referenceGeneration += 1;
    this._referenceEntryId = undefined;
    this._libraries = [];
    this._users = [];
    this._error = undefined;
    const config = {
      ...this._config,
      entry_id: entryId,
      mode,
      media_type: this._mediaTypeForMode(mode, this._config.media_type),
    } as CardConfig;
    delete config.section_id;
    delete config.user_id;
    this._config = normalizeConfig(config);
    this._emitConfig();
  }

  private _mediaTypeForMode(mode: CardMode, mediaType: CardConfig["media_type"]): CardConfig["media_type"] {
    if (mode === "active") {
      if (["all", "video", "music"].includes(mediaType ?? "")) return mediaType;
      if (mediaType === "artist") return "music";
      return mediaType === "movie" || mediaType === "show" ? "video" : "all";
    }
    if (mode === "recently_added") {
      if (["all", "movie", "show", "artist"].includes(mediaType ?? "")) return mediaType;
      if (mediaType === "music") return "artist";
      return "all";
    }
    return mediaType;
  }

  protected override render() {
    this._lastGroupTitle = undefined;
    const ctx = this._fieldContext;
    const capabilities = ctx.data.capabilities;
    const selectedEntry = ctx.data.entries.find((entry) => entry.entry_id === this._config.entry_id);
    const multipleServers = ctx.data.entries.length > 1;
    return html`<div class="editor">
      ${this._error ? html`<div class="error" role="alert">${this._error}</div>` : nothing}
      ${this._entriesLoaded && !this._entries.length && !this._error ? html`<div class="error" role="status">No Tautulli Active Streams integration was found. Add or reconnect the integration, then reopen this editor.</div>` : nothing}
      ${this._config.entry_id && capabilities ? html`<div class="compatibility ${multipleServers ? "multiple-servers" : "single-server"}"><span></span><div>${multipleServers ? html`<strong>${selectedEntry?.name ?? "Tautulli"}</strong>` : nothing}<small>${this._connectionMessage(ctx.mode)}</small></div></div>` : nothing}
      ${EDITOR_SECTIONS.map((section) => this._renderSection(section, ctx))}
      <p class="hint">Privacy and destructive permissions are enforced by the Tautulli Active Streams integration. Tokens and upstream image paths are never sent to this card.</p>
      <button class="reset-all" type="button" @click=${this._resetAllDefaults}>Reset all settings to defaults</button>
    </div>`;
  }

  private _renderSection(section: Section, ctx: FieldContext): TemplateResult | typeof nothing {
    if (!appliesTo(section.applies, ctx)) return nothing;
    let groupTitle: TemplateResult | typeof nothing = nothing;
    if (section.groupTitle && this._lastGroupTitle !== section.groupTitle) {
      this._lastGroupTitle = section.groupTitle;
      groupTitle = html`<h3 class="editor-group-title">${section.groupTitle}</h3>`;
    }
    const renderedFields = (section.fields ?? []).map((field) => this._renderField(field, ctx));
    const renderedSubsections = (section.subsections ?? []).map((sub) => this._renderSubSection(sub, ctx));
    const description = typeof section.description === "function" ? section.description(ctx) : section.description;
    return html`${groupTitle}<details class="section">
      <summary>${typeof section.summary === "function" ? section.summary(ctx) : section.summary}</summary>
      ${description ? html`<p class="section-description">${description}</p>` : nothing}
      ${renderedFields}
      ${renderedSubsections}
    </details>`;
  }

  private _renderSubSection(sub: SubSection, ctx: FieldContext): TemplateResult | typeof nothing {
    if (!appliesTo(sub.applies, ctx)) return nothing;
    const rendered = (sub.fields ?? []).map((field) => this._renderField(field, ctx));
    if (sub.header === "fineTune") {
      return html`<details>
        <summary>${sub.summary}</summary>
        <div class="fine-tune-header"><span>The selected style's values are shown until you override them.</span><button type="button" @click=${this._resetAppearance}>Restore style defaults</button></div>
        <div class="advanced">${rendered}</div>
      </details>`;
    }
    return html`<details class=${sub.className ?? ""}>
      <summary>${sub.summary}</summary>
      ${sub.description ? html`<p class="section-description">${sub.description}</p>` : nothing}
      ${rendered}
    </details>`;
  }

  private _renderField(field: Field, ctx: FieldContext): TemplateResult | typeof nothing {
    if (!appliesTo(field, ctx)) return nothing;
    if (field.kind === "hint") {
      return html`<p class="hint">${typeof field.text === "function" ? field.text(ctx) : field.text}</p>`;
    }
    if (field.kind === "block") return this._renderBlock(field.block);
    const label = typeof field.label === "function" ? field.label(ctx) : field.label;
    switch (field.kind) {
      case "select": {
        const options = typeof field.options === "function" ? field.options(ctx) : field.options;
        return this._select(field.key, label, options, String(this._config[field.key] ?? options[0]?.value ?? ""));
      }
      case "toggle":
        return this._toggle(field.key, label);
      case "number":
        return this._number(field.key, label, field.min, field.max, field.suffix);
      case "toggleNumber":
        return this._toggleNumber(field.key, label, field.min, field.max, field.suffix);
      case "slider":
        return this._slider(field.key, label, field.min, field.max, field.suffix);
      case "text":
        return this._text(field.key, label, field.placeholder ?? "");
      case "appearanceText":
        return this._appearanceText(field.key, label, field.placeholder, field.colour ?? false);
      case "appearanceNumber": {
        const fallback = field.fallback ? field.fallback(ctx) : undefined;
        return this._appearanceNumber(field.key, label, field.min, field.max, field.suffix, fallback);
      }
    }
  }

  private _renderBlock(block: BlockField["block"]): TemplateResult | typeof nothing {
    switch (block) {
      case "recipes":
        return html`<div class="recipe-grid" aria-label="Quick layouts">
          ${this._recipe("classic", "Classic compact", "Original stream-panel look")}
          ${this._recipe("balanced", "Balanced", "Clean and adaptable")}
          ${this._recipe("cinematic", "Cinematic", "Backdrop and rich detail")}
          ${this._recipe("shelf", "Media shelf", "Horizontal poster carousel")}
        </div>`;
      case "streamDetailOrder":
        return this._renderOrderedDetails();
      case "userDetailOrder":
        return this._renderUserOrderedDetails();
      case "terminationUnavailableHint":
        return html`<p class="hint">Stream termination is disabled in the integration's Dashboard card access settings.</p>`;
      case "episodeTextPreview":
        return this._episodeTextPreview();
    }
  }

  private _connectionMessage(mode: CardConfig["mode"]): string {
    if (mode !== "active") return "Connected and ready";
    if (this._activeUnavailable) return "Live preview unavailable — card settings can still be edited";
    if (this._activeCount === undefined) return "Checking active streams…";
    if (this._activeCount === 0) return "No active streams — start playback in Plex to see the live card preview";
    return `${this._activeCount} active ${this._activeCount === 1 ? "stream" : "streams"} available in the preview`;
  }

  private _friendlyError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("history_disabled")) return "Watch history is disabled in the integration’s Dashboard card access settings.";
    if (message.includes("unauthorized")) return "Administrator permission is required to load these card options.";
    if (message.includes("integration_unavailable") || message.includes("not_loaded")) {
      return "Tautulli Active Streams is unavailable. Reconnect the integration and try again.";
    }
    return "Could not load Tautulli card options. Check the integration connection and try again.";
  }

  private _renderOrderedDetails() {
    const availableFields = this._detailFieldsForMode();
    const available = new Set(availableFields);
    const order = (this._dragPreviewOrder ?? this._config.popup_detail_order ?? DEFAULT_POPUP_DETAIL_ORDER)
      .filter((field) => available.has(field));
    return html`<div class="detail-order-toolbar">
      <span>Drag the handle to reorder fields.</span>
      <div>
        <button type="button" @click=${() => this._setAllDetails(true)}>Show all</button>
        <button type="button" @click=${() => this._setAllDetails(false)}>Hide all</button>
        <button type="button" @click=${this._restoreStreamDetailOrder}>Restore order</button>
      </div>
    </div>
    <div class="detail-order-list">
      ${order.map((field, index) => this._renderStreamDetailRow(field, index, order.length))}
    </div>`;
  }

  private _renderUserOrderedDetails() {
    const order = this._dragUserPreviewOrder ?? this._config.popup_user_detail_order ?? DEFAULT_USER_POPUP_DETAIL_ORDER;
    return html`<div class="detail-order-toolbar">
      <span>Drag the handle to reorder groups.</span>
      <div>
        <button type="button" @click=${() => this._setAllUserDetails(true)}>Show all</button>
        <button type="button" @click=${() => this._setAllUserDetails(false)}>Hide all</button>
        <button type="button" @click=${this._restoreUserDetailOrder}>Restore order</button>
      </div>
    </div>
    <div class="detail-order-list">
      ${order.map((group, index) => this._renderUserDetailRow(group, index, order.length))}
    </div>`;
  }

  private _renderUserDetailRow(group: UserPopupDetailGroup, index: number, length: number) {
    const definition = USER_DETAIL_GROUPS.find((item) => item.group === group);
    if (!definition) return nothing;
    return html`<div class="detail-order-row ${this._draggedUserDetail === group ? "dragging" : ""}" data-detail-field=${group}
      @dragover=${(event: DragEvent) => this._userDetailDragOver(event, group)}
      @drop=${(event: DragEvent) => this._userDetailDrop(event, group)}>
      <button class="drag-handle" type="button" draggable="true"
        title="Drag to reorder ${definition.label}"
        aria-label="Drag to reorder ${definition.label}"
        @dragstart=${(event: DragEvent) => this._userDetailDragStart(event, group)}
        @dragend=${this._userDetailDragEnd}>
        <ha-icon icon="mdi:drag-vertical"></ha-icon>
      </button>
      <span>${definition.label}</span>
      <div class="detail-order-actions">
        <button type="button" title="Move ${definition.label} up" aria-label="Move ${definition.label} up" ?disabled=${index === 0} @click=${() => this._moveUserDetail(group, -1)}><ha-icon icon="mdi:chevron-up"></ha-icon></button>
        <button type="button" title="Move ${definition.label} down" aria-label="Move ${definition.label} down" ?disabled=${index === length - 1} @click=${() => this._moveUserDetail(group, 1)}><ha-icon icon="mdi:chevron-down"></ha-icon></button>
        <input class="detail-order-toggle" type="checkbox" data-key=${definition.key} aria-label=${`Show ${definition.label}`} .checked=${Boolean(this._config[definition.key])} @change=${this._input}>
      </div>
    </div>`;
  }

  private _userDetailDragStart(event: DragEvent, group: UserPopupDetailGroup): void {
    const order = [...(this._config.popup_user_detail_order ?? DEFAULT_USER_POPUP_DETAIL_ORDER)];
    this._draggedUserDetail = group;
    this._lastUserDragTarget = undefined;
    this._dragUserOriginalOrder = order;
    this._dragUserPreviewOrder = order;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", group);
      const row = (event.currentTarget as HTMLElement).closest<HTMLElement>(".detail-order-row");
      if (row) event.dataTransfer.setDragImage(row, 24, Math.min(22, row.clientHeight / 2));
    }
  }

  private _userDetailDragOver(event: DragEvent, target: UserPopupDetailGroup): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    if (target === this._draggedUserDetail || target === this._lastUserDragTarget) return;
    const order = [...(this._dragUserPreviewOrder ?? this._config.popup_user_detail_order ?? DEFAULT_USER_POPUP_DETAIL_ORDER)];
    const sourceIndex = this._draggedUserDetail ? order.indexOf(this._draggedUserDetail) : -1;
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
    this._lastUserDragTarget = target;
    this._dragUserPreviewOrder = order;
    void this.updateComplete.then(() => this._animateDetailReorder(previousRects));
  }

  private _userDetailDrop(event: DragEvent, target: UserPopupDetailGroup): void {
    event.preventDefault();
    const source = this._draggedUserDetail ?? event.dataTransfer?.getData("text/plain") as UserPopupDetailGroup;
    const order = [...(this._dragUserPreviewOrder ?? this._config.popup_user_detail_order ?? DEFAULT_USER_POPUP_DETAIL_ORDER)];
    const original = this._dragUserOriginalOrder ?? this._config.popup_user_detail_order ?? DEFAULT_USER_POPUP_DETAIL_ORDER;
    this._clearUserDetailDrag();
    if (!source || source === target && order.every((group, index) => group === original[index])) return;
    if (!order.every((group, index) => group === original[index])) this._update("popup_user_detail_order", order);
  }

  private _userDetailDragEnd = (): void => this._clearUserDetailDrag();

  private _clearUserDetailDrag(): void {
    this._draggedUserDetail = undefined;
    this._lastUserDragTarget = undefined;
    this._dragUserPreviewOrder = undefined;
    this._dragUserOriginalOrder = undefined;
  }

  private _moveUserDetail(group: UserPopupDetailGroup, direction: -1 | 1): void {
    const order = [...(this._config.popup_user_detail_order ?? DEFAULT_USER_POPUP_DETAIL_ORDER)];
    const index = order.indexOf(group);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target]!, order[index]!];
    this._update("popup_user_detail_order", order);
  }

  private _setAllUserDetails(visible: boolean): void {
    const config = { ...this._config } as CardConfig;
    for (const { key } of USER_DETAIL_GROUPS) (config as unknown as Record<string, unknown>)[key] = visible;
    this._config = normalizeConfig(config);
    this._emitConfig();
  }

  private _restoreUserDetailOrder = (): void => {
    this._update("popup_user_detail_order", [...DEFAULT_USER_POPUP_DETAIL_ORDER]);
  };

  private _detailFieldsForMode(): PopupDetailField[] {
    if (this._config.mode === "active") return ACTIVE_POPUP_DETAIL_FIELDS;
    if (this._config.mode === "popular") return POPULAR_POPUP_DETAIL_FIELDS;
    if (this._config.mode === "history") return HISTORY_POPUP_DETAIL_FIELDS;
    return MEDIA_POPUP_DETAIL_FIELDS;
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
    const available = new Set(this._detailFieldsForMode());
    const displayedOrder = order.filter((candidate) => available.has(candidate));
    const displayedIndex = displayedOrder.indexOf(field);
    const target = displayedOrder[displayedIndex + direction];
    if (displayedIndex < 0 || !target) return;
    const index = order.indexOf(field);
    const targetIndex = order.indexOf(target);
    [order[index], order[targetIndex]] = [order[targetIndex]!, order[index]!];
    this._update("popup_detail_order", order);
  }

  private _setAllDetails(visible: boolean): void {
    const config = { ...this._config } as CardConfig;
    const available = new Set(this._detailFieldsForMode());
    for (const { field, key } of STREAM_DETAIL_FIELDS) {
      if (available.has(field)) (config as unknown as Record<string, unknown>)[key] = visible;
    }
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
    return html`<label>${label}${suffix ? ` (${suffix})` : ""}<input type="number" min=${min} max=${max} data-key=${key} .value=${this._config[key] === undefined ? "" : String(this._config[key])} @change=${this._input}></label>`;
  }

  private _toggleNumber(key: keyof CardConfig, label: string, min: number, max: number, suffix: string) {
    const enabled = Number(this._config[key] ?? 0) > 0;
    return html`<label class="toggle-number"><span class="toggle"><input type="checkbox" .checked=${enabled} @change=${(event: Event) => this._toggleNumberChanged(key, min, (event.currentTarget as HTMLInputElement).checked)}>${label}</span>${enabled ? html`<span class="toggle-number-value"><input type="range" min=${min} max=${max} data-key=${key} .value=${String(this._config[key] ?? min)} @change=${this._input} @input=${this._input}> <span>${this._config[key] ?? min}${suffix}</span></span>` : nothing}</label>`;
  }

  private _toggleNumberChanged(key: keyof CardConfig, min: number, checked: boolean): void {
    const current = Number(this._config[key] ?? 0);
    if (!checked) {
      if (current > 0) this._toggleNumberValues.set(key, current);
      this._update(key, 0);
      return;
    }
    const configuredDefault = Number(DEFAULT_CONFIG[key] ?? 0);
    this._update(key, this._toggleNumberValues.get(key) ?? (configuredDefault > 0 ? configuredDefault : Math.max(min, 1)));
  }

  private _slider(key: keyof CardConfig, label: string, min: number, max: number, suffix: string) {
    return html`<label class="toggle-number"><span>${label}</span><span class="toggle-number-value"><input type="range" min=${min} max=${max} data-key=${key} .value=${String(this._config[key] ?? min)} @change=${this._input} @input=${this._input}> <span>${this._config[key] ?? min}${suffix}</span></span></label>`;
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

  private _episodeTextPreview() {
    const number = this._config.episode_number_style === "padded" ? "S01E02" : "S1 · E2";
    const show = "Example Show";
    const episode = "Episode Name";
    const full = `${show} — ${episode}`;
    let title = full;
    let subtitle = `${show} — ${number}`;
    switch (this._config.episode_layout ?? "current") {
      case "show_first":
        title = show;
        subtitle = `${number} — ${episode}`;
        break;
      case "episode_first":
        title = episode;
        subtitle = `${show} — ${number}`;
        break;
      case "custom": {
        title = {
          full_title: full,
          show,
          episode_title: episode,
        }[this._config.episode_title ?? "full_title"];
        subtitle = {
          show_and_number: `${show} — ${number}`,
          number_and_title: `${number} — ${episode}`,
          show_number_and_title: `${show} — ${number} — ${episode}`,
          number_only: number,
          episode_title: episode,
          none: "",
        }[this._config.episode_subtitle ?? "show_and_number"];
        break;
      }
    }
    return html`<div class="episode-preview" aria-live="polite"><small>Example</small><strong>${title}</strong>${subtitle ? html`<span>${subtitle}</span>` : nothing}</div>`;
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
    const recipeConfig: Partial<CardConfig> = { ...recipes[recipe] };
    const noMediaArtwork = this._config.mode === "users"
      || (this._config.mode === "popular" && ["top_users", "top_libraries", "top_platforms"].includes(this._config.stat_id ?? "popular_movies"));
    if (["active", "users"].includes(this._config.mode) || noMediaArtwork) delete recipeConfig.show_summary;
    if (noMediaArtwork) {
      for (const key of ["artwork", "artwork_placement", "artwork_aspect", "artwork_fit", "artwork_inset", "backdrop_opacity"] as const) {
        delete recipeConfig[key];
      }
    }
    const config = { ...this._config, ...recipeConfig } as CardConfig;
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
    if (["max_items", "time_range", "border_radius", "item_gap", "artwork_width", "artwork_inset", "title_size", "progress_height", "backdrop_opacity", "scroll_gap", "scroll_peek", "autoscroll_speed", "showcase_advance", "showcase_transition_duration", "popup_animation_duration", "popup_close_animation_duration", "popup_cinematic_art", "popup_backdrop_dim", "popup_backdrop_blur"].includes(key)) {
      value = target.value === "" ? undefined : Number(target.value);
    }
    if (key === "columns" && target.value !== "auto") value = Number(target.value);
    if (key === "popup_summary_lines") value = Number(target.value);
    if (["section_id", "user_id", "title", "card_background", "item_background", "border_color", "item_shadow", "playing_color", "paused_color", "buffering_color", "popup_background"].includes(key) && target.value === "") value = undefined;
    if (key === "entry_id") {
      this._changeEntry(String(value));
      void this._loadReferences();
      return;
    }
    if (key === "mode") {
      const mode = value as CardMode;
      this._config = normalizeConfig({
        ...this._config,
        mode,
        media_type: this._mediaTypeForMode(mode, this._config.media_type),
      });
      this._emitConfig();
      return;
    }
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
      if (artwork === "backdrop" && this._config.artwork !== "backdrop") {
        this._posterArtworkPlacement = this._config.artwork_placement;
      }
      const artworkPlacement = artwork === "backdrop"
        ? "background"
        : this._config.artwork === "backdrop"
          ? this._posterArtworkPlacement ?? "left"
          : this._config.artwork_placement ?? "left";
      this._config = normalizeConfig({
        ...this._config,
        artwork,
        artwork_placement: artworkPlacement,
      });
      this._emitConfig();
      return;
    }
    this._update(key, value);
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
