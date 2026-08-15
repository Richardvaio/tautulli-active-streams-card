import { LitElement, html, nothing } from "lit";
import type { PropertyValues, TemplateResult } from "lit";
import { getCardData, getEntries, subscribeActive, SUPPORTED_SCHEMA, terminateSession } from "./api";
import { DEFAULT_POPUP_DETAIL_ORDER, modeTitle, normalizeConfig, STYLE_PRESETS } from "./config";
import { cardStyles } from "./styles";
import type { ActiveStream, CardConfig, CardEnvelope, HomeAssistant, MediaItem, PopupDetailField } from "./types";

type UnknownItem = Record<string, any>;

const STREAM_DETAIL_VISIBILITY: Record<PopupDetailField, keyof CardConfig> = {
  user: "popup_show_user",
  player: "popup_show_player",
  device: "popup_show_device",
  eta: "popup_show_eta",
  pause_duration: "popup_show_pause_duration",
  playback_decision: "popup_show_playback_decision",
  video_quality: "popup_show_video_quality",
  audio_quality: "popup_show_audio_quality",
  bandwidth: "popup_show_bandwidth",
  episode: "popup_show_episode",
  year: "popup_show_year",
  content_rating: "popup_show_content_rating",
  rating: "popup_show_rating",
  audience_rating: "popup_show_audience_rating",
  genres: "popup_show_genres",
  studio: "popup_show_studio",
};

export class TautulliMediaCard extends LitElement {
  static override properties = {
    hass: { attribute: false },
    _config: { state: true },
    _data: { state: true },
    _loading: { state: true },
    _error: { state: true },
    _pendingTermination: { state: true },
    _terminating: { state: true },
    _selectedItem: { state: true },
    _pauseClock: { state: true },
  };

  static override styles = cardStyles;

  declare hass?: HomeAssistant;
  declare private _config: CardConfig;
  declare private _data?: CardEnvelope<UnknownItem>;
  declare private _loading: boolean;
  declare private _error?: string;
  declare private _pendingTermination?: ActiveStream;
  declare private _terminating: boolean;
  declare private _pauseClock: number;
  private _terminationTrigger?: HTMLElement;
  declare private _selectedItem?: UnknownItem;
  private _dialogOpenedAt = 0;
  private _unsubscribe?: () => void;
  private _refreshTimer?: number;
  private _retryTimer?: number;
  private _retryAttempt = 0;
  private _loadVersion = 0;
  private _pauseTimer?: number;
  private _pauseAnchors = new Map<string, { baseSeconds: number; receivedAt: number }>();
  private _scrollLockCount = 0;

  constructor() {
    super();
    this._config = normalizeConfig({});
    this._loading = true;
    this._terminating = false;
    this._pauseClock = Date.now();
  }

  static getStubConfig(): Omit<CardConfig, "type"> {
    const config = { ...normalizeConfig({}) } as Partial<CardConfig>;
    delete config.type;
    return config as Omit<CardConfig, "type">;
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("tautulli-media-card-editor");
  }

  getGridOptions() {
    const itemCount = Math.max(1, Math.min(this._filteredItems().length, 4));
    return { columns: 6, rows: itemCount * 3, min_columns: 3, min_rows: 2 };
  }

  setConfig(config: Partial<CardConfig>): void {
    const previous = this._config;
    const next = normalizeConfig(config);
    const sourceKeys: Array<keyof CardConfig> = ["entry_id", "mode", "max_items", "section_id", "user_id", "stat_id", "time_range", "metric"];
    if (next.mode !== "active") sourceKeys.push("media_type");
    const sourceChanged = sourceKeys.some((key) => previous[key] !== next[key]);
    const datasetChanged = previous.entry_id !== next.entry_id || previous.mode !== next.mode;
    this._config = next;
    this.setAttribute("density", this._config.density ?? "compact");
    this.setAttribute("layout", this._config.layout ?? "grid");
    const containerStyle = this._config.container_style === "auto"
      ? this._config.style_preset === "modern" ? "surface" : "transparent"
      : this._config.container_style ?? "transparent";
    this.setAttribute("container-style", containerStyle);
    this.toggleAttribute("animations", Boolean(this._config.animations));
    this._applyAppearance();
    if (datasetChanged) this._data = undefined;
    if (sourceChanged && this.isConnected && this.hass) void this._connect();
  }

  getCardSize(): number {
    const count = this._data?.items.length ?? 1;
    const columns = typeof this._config.columns === "number" ? this._config.columns : 1;
    return Math.max(1, Math.ceil(count / columns) * 3 + (this._config.show_header || this._config.show_count ? 1 : 0));
  }

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("visibilitychange", this._visibilityChanged);
    this.addEventListener("click", this._delegatedItemClick, { capture: true });
    if (this.hass) void this._connect();
  }

  override disconnectedCallback(): void {
    if (this._scrollLockCount > 0) {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      this._scrollLockCount = 0;
    }
    this._disconnect();
    document.removeEventListener("visibilitychange", this._visibilityChanged);
    this.removeEventListener("click", this._delegatedItemClick, { capture: true });
    super.disconnectedCallback();
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has("_data")) this._syncPauseClock();
  }

  protected override updated(changed: PropertyValues): void {
    this.renderRoot.querySelectorAll<HTMLElement>("[data-item-id]").forEach((element) => {
      element.onclick = (event: MouseEvent): void => {
        if (event.composedPath().some((node) => node instanceof Element && node.matches(".terminate"))) return;
        const item = this._filteredItems().find((candidate) => this._itemId(candidate) === element.dataset.itemId);
        if (item) this._openDetails(item);
      };
    });
    this.renderRoot.querySelectorAll<HTMLButtonElement>(".open-details").forEach((button) => {
      let lastOpenAt = 0;
      const open = (event: Event): void => {
        event.stopPropagation();
        event.preventDefault();
        const now = Date.now();
        if (now - lastOpenAt < 400) return;
        lastOpenAt = now;
        const item = this._filteredItems().find((candidate) => this._itemId(candidate) === button.dataset.detailId);
        if (item) this._openDetails(item);
      };
      button.onclick = open;
      button.onpointerup = open;
    });
    if (changed.has("hass") && this.hass && !this._data && !this._error) {
      void this._connect();
    }
    if (changed.has("_pendingTermination") && this._pendingTermination) {
      this.renderRoot.querySelector<HTMLElement>(".dialog-confirm")?.focus();
    }
    if (changed.has("_selectedItem") && this._selectedItem) {
      this.renderRoot.querySelector<HTMLElement>(".dialog-close")?.focus();
    }
  }

  private _visibilityChanged = (): void => {
    if (document.visibilityState === "visible" && this._config.mode !== "active") {
      void this._loadData();
    }
  };

  private _disconnect(): void {
    this._loadVersion += 1;
    this._unsubscribe?.();
    this._unsubscribe = undefined;
    if (this._refreshTimer) window.clearInterval(this._refreshTimer);
    this._refreshTimer = undefined;
    if (this._retryTimer) window.clearTimeout(this._retryTimer);
    this._retryTimer = undefined;
    if (this._pauseTimer) window.clearInterval(this._pauseTimer);
    this._pauseTimer = undefined;
    this._pauseAnchors.clear();
  }

  private _applyAppearance(): void {
    const preset = STYLE_PRESETS[this._config.style_preset ?? "classic"];
    const values: Record<string, string | number | undefined> = {
      "--tas-card-background": this._config.card_background ?? preset.card_background,
      "--tas-item-background": this._config.item_background ?? preset.item_background,
      "--tas-border-color": this._config.border_color ?? preset.border_color,
      "--tas-shadow": this._config.item_shadow ?? preset.item_shadow,
      "--tas-radius": `${this._config.border_radius ?? preset.border_radius}px`,
      "--tas-gap": `${this._config.item_gap ?? preset.item_gap}px`,
      "--tas-title-size": `${this._config.title_size ?? preset.title_size}px`,
      "--tas-progress-height": `${this._config.progress_height ?? preset.progress_height}px`,
      "--tas-playing-color": this._config.playing_color ?? preset.playing_color,
      "--tas-paused-color": this._config.paused_color ?? preset.paused_color,
      "--tas-buffering-color": this._config.buffering_color ?? preset.buffering_color,
      "--art-width": this._config.artwork_width ? `${this._config.artwork_width}px` : undefined,
      "--tas-art-inset": `${this._config.artwork_inset ?? preset.artwork_inset}px`,
      "--tas-art-fit": this._config.artwork_fit ?? "cover",
      "--tas-art-position": this._config.artwork_position ?? "center",
      "--tas-art-aspect": this._config.artwork_aspect === "poster" ? "2/3" : this._config.artwork_aspect === "square" ? "1/1" : this._config.artwork_aspect === "backdrop" || (this._config.artwork_aspect === "auto" && this._config.artwork === "backdrop") ? "16/9" : undefined,
    };
    for (const [property, value] of Object.entries(values)) {
      if (value === undefined) this.style.removeProperty(property);
      else this.style.setProperty(property, String(value));
    }
  }

  private async _connect(): Promise<void> {
    if (!this.hass) return;
    this._disconnect();
    const version = this._loadVersion;
    this._loading = !this._data;
    this._error = undefined;
    try {
      if (!this._config.entry_id) {
        const entries = await getEntries(this.hass);
        if (!entries.length) throw new Error("No loaded Tautulli Active Streams integration was found");
        this._config = { ...this._config, entry_id: entries[0]?.entry_id };
      }
      if (version !== this._loadVersion) return;
      if (this._config.mode === "active") {
        this._unsubscribe = await subscribeActive(
          this.hass,
          this._config.entry_id!,
          (data) => this._receive(data as CardEnvelope<UnknownItem>),
        );
      } else {
        await this._loadData(version);
        const interval = ["popular", "users"].includes(this._config.mode) ? 15 * 60_000 : this._config.mode === "history" ? 60_000 : 5 * 60_000;
        this._refreshTimer = window.setInterval(() => void this._loadData(), interval);
      }
    } catch (error) {
      if (version === this._loadVersion) this._setError(error);
    }
  }

  private async _loadData(version = this._loadVersion): Promise<void> {
    if (!this.hass || !this._config.entry_id) return;
    try {
      const data = await getCardData(this.hass, this._config);
      if (version === this._loadVersion) this._receive(data as CardEnvelope<UnknownItem>);
    } catch (error) {
      if (version === this._loadVersion) this._setError(error);
    }
  }

  private _receive(data: CardEnvelope<UnknownItem>): void {
    if (data.schema_version > SUPPORTED_SCHEMA) {
      if (this._data) {
        this._data = { ...this._data, stale: true };
        this._error = undefined;
      } else {
        this._error = "integration_unavailable";
      }
      this._loading = false;
      return;
    }
    this._data = data;
    const selectedSessionId = this._config.mode === "active" ? this._selectedItem?.session_id : undefined;
    if (selectedSessionId && !data.items.some((item) => item.session_id === selectedSessionId)) {
      this._selectedItem = undefined;
      if (this._pendingTermination?.session_id === selectedSessionId) this._pendingTermination = undefined;
    }
    this._retryAttempt = 0;
    this._error = undefined;
    this._loading = false;
  }

  private _setError(error: unknown): void {
    const message = this._friendlyError(error instanceof Error ? error.message : String(error));
    if (this._data) {
      this._data = { ...this._data, stale: true };
      this._error = undefined;
    } else {
      this._error = message;
    }
    this._loading = false;
    this._scheduleRetry();
  }

  private _scheduleRetry(): void {
    if (!this.isConnected || !this.hass || this._retryTimer) return;
    const delay = Math.min(60_000, 2_000 * (2 ** Math.min(this._retryAttempt, 5)));
    this._retryAttempt += 1;
    this._retryTimer = window.setTimeout(() => {
      this._retryTimer = undefined;
      void this._connect();
    }, delay);
  }

  protected override render(): TemplateResult | typeof nothing {
    const items = this._filteredItems();
    if (this._error && !this._data) return nothing;
    if (!this._loading && !this._error && !items.length && !this._config.show_empty) return nothing;
    const columns = this._config.columns === "auto" ? "auto" : String(this._config.columns ?? 1);
    return html`
      <ha-card>
        ${this._config.show_header || this._config.show_count ? html`
          <div class="header">
            ${this._config.show_header ? html`<h2 class="title">${modeTitle(this._config)}</h2>` : html`<span></span>`}
            ${this._config.show_count && this._data ? html`<span class="badge" aria-label="${items.length} items">${items.length}</span>` : nothing}
          </div>` : nothing}
        ${this._data?.stale ? html`<p class="stale">Showing the last successful update</p>` : nothing}
        ${this._loading ? this._renderLoading()
          : !items.length ? html`<div class="empty">${this._config.mode === "active" ? "Nothing is playing" : "No matching media"}</div>`
          : html`${this._config.layout === "carousel" ? html`<div class="carousel-controls" aria-label="Carousel controls">
              <button @click=${() => this._scrollCarousel(-1)} aria-label="Previous items"><ha-icon icon="mdi:chevron-left"></ha-icon></button>
              <button @click=${() => this._scrollCarousel(1)} aria-label="Next items"><ha-icon icon="mdi:chevron-right"></ha-icon></button>
            </div>` : nothing}
            <div class="content ${this._config.layout ?? "grid"} ${columns === "auto" ? "auto" : ""}" style=${`--columns:${columns}`}>
              ${items.map((item) => this._renderItem(item))}
            </div>`}
      </ha-card>
      ${this._renderDetailsDialog()}
      ${this._renderTerminationDialog()}
    `;
  }

  private _filteredItems(): UnknownItem[] {
    let items = [...(this._data?.items ?? [])];
    if (this._config.mode === "recently_added" && this._config.recent_grouping !== "none") {
      items = this._groupRecent(items);
    }
    if (this._config.mode === "active" && this._config.media_type !== "all") {
      items = items.filter((item) => {
        const type = String(item.media?.type ?? "");
        if (this._config.media_type === "music") return ["track", "album", "artist"].includes(type);
        if (this._config.media_type === "video") return ["movie", "episode", "show", "clip", "live"].includes(type);
        return type === this._config.media_type;
      });
    }
    if (this._config.mode === "active" && this._config.sort_by !== "server") {
      const key = this._config.sort_by ?? "server";
      const direction = this._config.sort_direction === "descending" ? -1 : 1;
      items.sort((left, right) => {
        const values: Record<string, [unknown, unknown]> = {
          user: [left.user?.display_name, right.user?.display_name],
          title: [left.media?.full_title ?? left.media?.title, right.media?.full_title ?? right.media?.title],
          state: [left.state, right.state],
          progress: [left.playback?.progress_percent, right.playback?.progress_percent],
        };
        const [a, b] = values[key] ?? [0, 0];
        if (typeof a === "number" || typeof b === "number") return ((Number(a) || 0) - (Number(b) || 0)) * direction;
        return String(a ?? "").localeCompare(String(b ?? ""), this.hass?.locale?.language) * direction;
      });
    }
    return items.slice(0, this._config.max_items);
  }

  private _groupRecent(items: UnknownItem[]): UnknownItem[] {
    const grouping = this._config.recent_grouping ?? "none";
    const groups = new Map<string, UnknownItem[]>();
    for (const item of items) {
      const media = item as MediaItem;
      const hierarchy = media.hierarchy ?? {};
      const type = media.type ?? "unknown";
      let key = media.id ?? `${type}:${media.title}:${media.added_at}`;
      if (["episode", "show", "season"].includes(type) && ["smart", "show", "season"].includes(grouping)) {
        const show = hierarchy.grandparent_id ?? hierarchy.show ?? media.title;
        key = grouping === "season" ? `tv:${show}:${hierarchy.season_number ?? hierarchy.season}` : `tv:${show}`;
      } else if (["track", "album", "artist"].includes(type) && grouping === "smart") {
        key = `music:${hierarchy.parent_id ?? hierarchy.album ?? hierarchy.artist ?? media.title}`;
      }
      const group = groups.get(String(key)) ?? [];
      group.push(item);
      groups.set(String(key), group);
    }
    return [...groups.values()].map((group) => {
      if (group.length === 1) return group[0]!;
      const representative = group[0] as MediaItem;
      const hierarchy = representative.hierarchy ?? {};
      const tv = ["episode", "show", "season"].includes(representative.type ?? "");
      const title = tv ? hierarchy.show ?? representative.title : hierarchy.album ?? hierarchy.artist ?? representative.title;
      const season = hierarchy.season_number ? `Season ${hierarchy.season_number}` : hierarchy.season;
      return {
        ...representative,
        type: tv ? "show" : "album",
        title,
        full_title: title,
        hierarchy: { ...hierarchy, episode: null, episode_number: null },
        _group_count: group.length,
        _group_label: `${group.length} new ${tv ? group.length === 1 ? "episode" : "episodes" : group.length === 1 ? "item" : "items"}`,
        _group_subtitle: tv && grouping === "season" ? season : tv ? "New episodes" : hierarchy.artist,
      };
    });
  }

  private _renderItem(item: UnknownItem): TemplateResult {
    if (this._config.mode === "active") return this._renderActive(item as ActiveStream);
    if (this._config.mode === "users") return this._renderUser(item);
    const media: MediaItem = this._config.mode === "recently_added" ? item as MediaItem : item.media ?? {};
    const subtitle = item._group_subtitle ?? this._mediaSubtitle(media);
    const image = this._image(media.images);
    const background = this._backgroundImage(media.images);
    const displayDuration = this._config.mode === "history"
      ? Number(item.play_duration_seconds) || 0
      : Number(media.duration_seconds) || 0;
    return html`
      <article data-item-id=${this._itemId(item)} class="item media-item ${media.type ?? "unknown"} ${this._artClass(image, background)} ${this._config.click_action === "details" ? "interactive" : ""}" style=${this._backgroundStyle(background)}>
        ${this._openDetailsButton(item, media.full_title || media.title || "media")}
        ${image ? html`<img class="art" src=${image} alt="" loading="lazy" referrerpolicy="no-referrer">` : nothing}
        <div class="body">
          <div class="eyebrow"><span>${this._itemEyebrow(item, media)}</span></div>
          <h3 class="name">${media.title || media.full_title || "Untitled"}</h3>
          ${subtitle ? html`<div class="subtitle">${subtitle}</div>` : nothing}
          <div class="meta">
            ${media.year ? html`<span>${media.year}</span>` : nothing}
            ${displayDuration ? html`<span>${this._duration(displayDuration)}${this._config.mode === "history" ? " watched" : ""}</span>` : nothing}
            ${media.library?.name ? html`<span>${media.library.name}</span>` : nothing}
          </div>
          ${this._config.show_summary && media.summary ? html`<div class="summary">${media.summary}</div>` : nothing}
        </div>
      </article>`;
  }

  private _renderUser(item: UnknownItem): TemplateResult {
    const total = Number(item.total_duration_seconds) || 0;
    const displayName = item.display_name || "Private user";
    const initial = String(displayName).trim().charAt(0).toUpperCase() || "?";
    return html`<article data-item-id=${this._itemId(item)} class="item user-item ${this._config.click_action === "details" ? "interactive" : ""}">
      ${this._openDetailsButton(item, `${displayName} user details`)}
      <div class="user-avatar" aria-hidden="true">${initial}</div>
      <div class="body">
        <div class="eyebrow"><span>${item.last_seen_at ? `Last active ${this._date(item.last_seen_at)}` : "Plex activity summary"}</span></div>
        <h3 class="name">${displayName}</h3>
        <div class="user-stats">
          <span><strong>${item.total_plays ?? 0}</strong> plays</span>
          <span><strong>${this._duration(total)}</strong> watched</span>
          <span><strong>${item.completion_percent ?? 0}%</strong> completion</span>
        </div>
        <div class="user-breakdown">
          ${item.movie_plays ? html`<span><ha-icon icon="mdi:movie-open"></ha-icon>${item.movie_plays} movies</span>` : nothing}
          ${item.tv_plays ? html`<span><ha-icon icon="mdi:television-classic"></ha-icon>${item.tv_plays} episodes</span>` : nothing}
          ${item.direct_play_count ? html`<span><ha-icon icon="mdi:play-circle-outline"></ha-icon>${item.direct_play_count} direct plays</span>` : nothing}
          ${item.transcode_count ? html`<span><ha-icon icon="mdi:swap-horizontal"></ha-icon>${item.transcode_count} transcodes</span>` : nothing}
        </div>
        <div class="user-favourites optional">
          ${item.popular_movie ? html`<span><small>Favourite movie</small>${item.popular_movie}</span>` : nothing}
          ${item.popular_show ? html`<span><small>Favourite show</small>${item.popular_show}</span>` : nothing}
          ${item.most_used_device ? html`<span><small>Most-used player</small>${item.most_used_device}</span>` : nothing}
          ${item.preferred_day ? html`<span><small>Usually watches</small>${item.preferred_day} ${item.preferred_time ?? ""}</span>` : nothing}
        </div>
      </div>
    </article>`;
  }

  private _renderLoading(): TemplateResult {
    return html`<div class="content grid auto loading-grid" aria-label="Loading Tautulli media" aria-busy="true">
      ${[0, 1].map(() => html`<div class="item skeleton" aria-hidden="true">
        <div class="skeleton-art"></div>
        <div class="skeleton-body"><span></span><span></span><span></span></div>
      </div>`)}
    </div>`;
  }

  private _renderActive(item: ActiveStream): TemplateResult {
    if (this._config.style_preset === "classic") {
      return this._renderClassicActive(item);
    }
    const media = item.media ?? {};
    const image = this._image(item.images);
    const background = this._backgroundImage(item.images);
    const progress = Math.max(0, Math.min(100, Number(item.playback?.progress_percent) || 0));
    const stateColor = item.state === "paused" ? "var(--tas-paused-color)" : item.state === "buffering" ? "var(--tas-buffering-color)" : media.type === "track" ? "#1db954" : "var(--tas-playing-color)";
    const canTerminate = this._canTerminate(item) && (
      this._config.click_action !== "details"
      || ["card", "both"].includes(this._config.termination_location ?? "popup")
    );
    return html`
      <article data-item-id=${this._itemId(item)} class="item ${this._artClass(image, background)} ${this._config.click_action === "details" ? "interactive" : ""}" style=${this._backgroundStyle(background, stateColor)}>
        ${this._openDetailsButton(item, media.full_title || media.title || "stream")}
        ${image ? html`<img class="art" src=${image} alt="" loading="lazy" referrerpolicy="no-referrer">` : nothing}
        <div class="body">
          <div class="eyebrow">
            <span class="state ${item.state}">${item.state}${item.state === "paused" && this._config.show_pause_duration ? ` · ${this._elapsedDuration(this._pausedSeconds(item))}` : ""}</span>
            ${this._config.show_user && item.user?.display_name ? html`<span>${item.user.display_name}</span>` : nothing}
          </div>
          <h3 class="name">${media.full_title || media.title || "Untitled"}</h3>
          ${this._mediaSubtitle(media) ? html`<div class="subtitle">${this._mediaSubtitle(media)}</div>` : nothing}
          ${this._config.show_device && item.client ? html`<div class="meta"><span>${item.client.player || item.client.product || item.client.device}</span></div>` : nothing}
          ${this._config.show_quality ? html`<div class="details optional">
            ${item.quality?.decision ? html`<span>${item.quality.decision}</span>` : nothing}
            ${item.quality?.video_resolution ? html`<span>${item.quality.video_resolution}</span>` : nothing}
            ${item.quality?.bandwidth_kbps ? html`<span>${this._bandwidth(item.quality.bandwidth_kbps)}</span>` : nothing}
          </div>` : nothing}
          ${this._config.show_progress ? html`<div class="modern-progress-row">
            <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(progress)} style=${`--progress:${progress}%`}></div>
            ${this._config.show_remaining && item.playback?.remaining_ms ? html`<span class="modern-progress-remaining">${this._duration(Math.ceil(item.playback.remaining_ms / 1000))} remaining</span>` : nothing}
          </div>` : nothing}
        </div>
        ${canTerminate ? html`<button class="terminate" @click=${(event: Event) => this._openTerminationDialog(item, event)} title="Terminate stream" aria-label="Terminate stream"><ha-icon icon="mdi:stop-circle-outline"></ha-icon></button>` : nothing}
      </article>`;
  }

  private _renderClassicActive(item: ActiveStream): TemplateResult {
    const media = item.media ?? {};
    const music = ["track", "album", "artist"].includes(media.type ?? "");
    const image = this._image(item.images);
    const background = this._backgroundImage(item.images);
    const progress = Math.max(0, Math.min(100, Number(item.playback?.progress_percent) || 0));
    const stateColor = item.state === "paused" ? "var(--tas-paused-color)" : item.state === "buffering" ? "var(--tas-buffering-color)" : music ? "#1db954" : "var(--tas-playing-color)";
    const hierarchy = media.hierarchy ?? {};
    const primaryTitle = music
      ? [hierarchy.artist, hierarchy.album].filter(Boolean).join(" — ")
      : media.full_title || media.title || "Untitled";
    const secondaryTitle = music ? media.title || media.full_title : "";
    const mediaDetail = music
      ? ""
      : media.type === "episode"
        ? `S${hierarchy.season_number ?? "–"} · E${hierarchy.episode_number ?? hierarchy.episode ?? "–"}`
        : media.year ? `(${media.year})` : "";
    const client = [item.client?.product, item.client?.player].filter(Boolean).join(" — ") || item.client?.device;
    const videoQuality = [item.quality?.decision, item.quality?.video_resolution].filter(Boolean).join(" — ");
    const audioQuality = [
      item.quality?.audio_codec,
      item.quality?.audio_channel_layout,
      item.quality?.audio_bitrate_kbps ? `${item.quality.audio_bitrate_kbps} Kbps` : undefined,
    ].filter(Boolean).join(" · ");
    const canTerminate = this._canTerminate(item) && (
      this._config.click_action !== "details"
      || ["card", "both"].includes(this._config.termination_location ?? "popup")
    );
    return html`
      <article data-item-id=${this._itemId(item)} class="classic-item ${music ? "music" : "video"} ${item.state} ${this._artClass(image, background)} ${this._config.click_action === "details" ? "interactive" : ""}" style=${this._backgroundStyle(background, stateColor)}>
        ${this._openDetailsButton(item, media.full_title || media.title || "stream")}
        ${image ? html`<img class="classic-art" src=${image} alt="" loading="lazy" referrerpolicy="no-referrer">` : !background ? html`<div class="classic-art placeholder"><ha-icon icon="${music ? "mdi:music" : "mdi:movie-open"}"></ha-icon></div>` : nothing}
        <div class="classic-body">
          <div class="classic-top">
            ${this._config.show_device && client ? html`<span>${client}</span>` : html`<span></span>`}
            ${this._config.show_user && item.user?.display_name ? html`<strong>${item.user.display_name}</strong>` : nothing}
          </div>
          <h3 class="classic-title">
            <ha-icon icon=${this._stateIcon(item.state, music)}></ha-icon>
            <span>${primaryTitle}</span>
          </h3>
          ${music && secondaryTitle ? html`<div class="classic-track"><ha-icon icon="mdi:music-note"></ha-icon><span>${secondaryTitle}</span></div>` : nothing}
          <div class="classic-info">
            ${this._config.show_media_details && mediaDetail ? html`<span class="media-detail"><ha-icon icon=${media.type === "episode" ? "mdi:television-classic" : "mdi:filmstrip"}></ha-icon>${mediaDetail}</span>` : html`<span></span>`}
            ${this._config.show_eta && this._eta(item) ? html`<span>ETA: ${this._eta(item)}</span>` : nothing}
          </div>
          ${this._config.show_progress ? html`
            <div class="classic-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(progress)} style=${`--progress:${progress}%`}>
              ${this._config.show_state ? html`<span class="progress-state">${this._stateText(item, music)}</span>` : nothing}
              ${this._config.show_progress_percent ? html`<span class="progress-percent">${Math.round(progress)}%</span>` : nothing}
              ${this._config.show_remaining && item.playback?.remaining_ms ? html`<span class="progress-remaining"><span class="remaining-label">Remaining - </span>${this._duration(Math.ceil(item.playback.remaining_ms / 1000))}</span>` : nothing}
            </div>` : nothing}
          <div class="classic-bottom">
            ${music && this._config.show_audio_quality && audioQuality ? html`<span>${audioQuality}</span>` : !music && this._config.show_quality && videoQuality ? html`<span>${videoQuality}</span>` : html`<span></span>`}
            <span>
              ${this._config.show_bandwidth && item.quality?.bandwidth_kbps ? html`Bandwidth: ${this._bandwidth(item.quality.bandwidth_kbps)}` : nothing}
            </span>
          </div>
        </div>
        ${canTerminate ? html`<button class="terminate" @click=${(event: Event) => this._openTerminationDialog(item, event)} title="Terminate stream" aria-label="Terminate stream"><ha-icon icon="mdi:stop-circle-outline"></ha-icon></button>` : nothing}
      </article>`;
  }

  private _stateIcon(state: string, music: boolean): string {
    if (state === "paused") return "mdi:pause";
    if (state === "buffering") return "mdi:loading";
    return music ? "mdi:music-circle" : "mdi:play";
  }

  private _stateText(item: ActiveStream, music: boolean): string {
    const parts = [item.state || "unknown"];
    if (item.state === "paused" && this._config.show_pause_duration) {
      parts.push(this._elapsedDuration(this._pausedSeconds(item)));
    }
    const track = item.media.hierarchy?.track_number ?? item.media.hierarchy?.track;
    if (music && this._config.show_track_number && track) parts.push(`track ${track}`);
    return parts.join(" · ");
  }

  private _artClass(image?: string, background?: string): string {
    if (background) return `${image ? "art-left " : ""}background-art`;
    if (!image) return "no-art";
    if (this._config.artwork_placement === "right") return "art-right";
    return "art-left";
  }

  private _backgroundStyle(image?: string, stateColor?: string): string {
    const declarations: string[] = [];
    if (stateColor) declarations.push(`--state-color:${stateColor}`);
    if (image) {
      declarations.push(`--tas-background-image:url("${image.replaceAll('"', "")}")`);
      declarations.push(`--tas-backdrop-opacity:${(this._config.backdrop_opacity ?? 35) / 100}`);
    }
    return declarations.join(";");
  }

  private _openDetails(item: UnknownItem): void {
    if (this._config.click_action === "details") {
      if (this._selectedItem === item) return;
      this._selectedItem = item;
      this._dialogOpenedAt = Date.now();
      this._lockBodyScroll();
      this.requestUpdate();
    }
  }

  private _openDetailsButton(item: UnknownItem, title: unknown): TemplateResult | typeof nothing {
    if (this._config.click_action !== "details") return nothing;
    return html`<button class="open-details" type="button" data-detail-id=${this._itemId(item)} aria-label="Open details for ${String(title)}"></button>`;
  }

  private _itemId(item: UnknownItem): string {
    return String(item.id ?? item.session_id ?? item.media?.id ?? `${item.rank ?? ""}:${item.display_name ?? item.media?.title ?? item.title ?? "item"}`);
  }

  private _delegatedItemClick = (event: Event): void => {
    if (this._config.click_action !== "details") return;
    const path = event.composedPath();
    if (path.some((node) => node instanceof Element && (node.matches(".terminate") || node.closest(".dialog-backdrop")))) return;
    const target = path.find((node) => node instanceof HTMLElement && node.dataset.itemId) as HTMLElement | undefined;
    if (!target) return;
    const item = this._filteredItems().find((candidate) => this._itemId(candidate) === target.dataset.itemId);
    if (item) this._openDetails(item);
  };

  private _closeDetails = (): void => {
    this._selectedItem = undefined;
    this._unlockBodyScroll();
  };

  private _backdropClickClose = (event: Event): void => {
    if (event.target !== event.currentTarget) return;
    if (Date.now() - this._dialogOpenedAt < 350) return;
    this._closeDetails();
  };

  private _lockBodyScroll(): void {
    if (this._scrollLockCount === 0 && document.body.scrollHeight > window.innerHeight) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    this._scrollLockCount += 1;
  }

  private _unlockBodyScroll(): void {
    this._scrollLockCount = Math.max(0, this._scrollLockCount - 1);
    if (this._scrollLockCount === 0) {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
  }

  private _detailsKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.preventDefault();
      this._closeDetails();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...this.renderRoot.querySelectorAll<HTMLElement>(".details-dialog button:not(:disabled), .details-dialog [href], .details-dialog [tabindex]:not([tabindex='-1'])")];
    const first = focusable[0];
    const last = focusable.at(-1);
    const activeElement = this.renderRoot instanceof ShadowRoot ? this.renderRoot.activeElement : document.activeElement;
    if (event.shiftKey && activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  private _scrollCarousel(direction: -1 | 1): void {
    const carousel = this.renderRoot.querySelector<HTMLElement>(".content.carousel");
    if (!carousel) return;
    carousel.scrollBy({
      left: direction * Math.max(240, carousel.clientWidth * 0.82),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  private _canTerminate(item: ActiveStream): boolean {
    return Boolean(this._config.allow_termination && this._data?.capabilities.stream_termination && item.session_id);
  }

  private _renderDetailsDialog(): TemplateResult | typeof nothing {
    const selected = this._selectedItem;
    if (!selected) return nothing;
    const item = this._data?.items.find((candidate) => this._itemId(candidate) === this._itemId(selected)) ?? selected;
    if (this._config.mode === "active") return this._renderActiveDetails(item as ActiveStream);
    if (this._config.mode === "users") return this._renderUserDetails(item);
    return this._renderMediaDetails(item);
  }

  private _renderDialogShell(title: string, content: TemplateResult, backdrop?: string, titleInContent = false): TemplateResult {
    const style = backdrop ? `--details-backdrop:url("${backdrop.replaceAll('"', "")}");` : "";
    const dim = this._config.popup_backdrop_dim ?? 58;
    const blur = this._config.popup_backdrop_blur ?? 0;
    const backdropStyle = `background:rgb(0 0 0 / ${dim}%);${blur ? `backdrop-filter:blur(${blur}px);` : ""}`;
    const popupBackground = this._config.popup_background;
    const animationDuration = this._config.popup_animation_duration ?? 220;
    const dialogStyle = `${style}--dialog-animation-duration:${animationDuration}ms;${popupBackground ? `background:${popupBackground};` : ""}`;
    return html`<div class="dialog-backdrop" style=${backdropStyle} @click=${this._backdropClickClose} @keydown=${this._detailsKeydown}>
      <section class="details-dialog anim-${this._config.popup_animation ?? "scale"} popup-${this._config.popup_style ?? "clean"} popup-content-${this._config.popup_content_style ?? "open"} popup-width-${this._config.popup_width ?? "standard"} ${backdrop ? "has-backdrop" : ""}" style=${dialogStyle} role="dialog" aria-modal="true" aria-labelledby="details-title">
        <button class="dialog-close" @click=${this._closeDetails} aria-label="Close details"><ha-icon icon="mdi:close"></ha-icon></button>
        <div class="details-content">${titleInContent ? nothing : html`<h2 id="details-title">${title}</h2>`}${content}</div>
      </section>
    </div>`;
  }

  private _renderActiveDetails(item: ActiveStream): TemplateResult {
    const media = item.media ?? {};
    const progress = Math.max(0, Math.min(100, Number(item.playback?.progress_percent) || 0));
    const hierarchy = media.hierarchy ?? {};
    const subtitle = this._mediaSubtitle(media);
    const poster = this._config.popup_show_artwork ? item.images?.poster_url ?? undefined : undefined;
    const backdrop = this._config.popup_show_artwork ? item.images?.backdrop_url ?? undefined : undefined;
    const allowPopupTermination = this._canTerminate(item) && ["popup", "both"].includes(this._config.termination_location ?? "popup");
    const terminationAtTop = allowPopupTermination && (this._config.termination_popup_placement ?? "footer") === "top";
    const title = media.full_title || media.title || "Stream details";
    const body = html`
      <section class="popup-summary"><div class="details-hero ${poster ? "with-poster" : ""}">
        ${poster ? html`<img src=${poster} alt="" loading="lazy" referrerpolicy="no-referrer">` : nothing}
        ${terminationAtTop ? html`<div class="details-top-action">${this._popupTerminationButton(item)}</div>` : nothing}
        <div class="details-primary">
          <div class="details-heading-line">
            <h2 id="details-title" class="details-inline-title">${title}</h2>
            ${this._config.popup_summary_show_user && item.user?.display_name ? html`<span class="details-summary-user"><ha-icon icon="mdi:account"></ha-icon>${item.user.display_name}</span>` : nothing}
          </div>
          <div class="details-chips">${["paused", "buffering"].includes(item.state) ? html`<span class="state ${item.state}">${item.state}</span>` : nothing}${media.type ? html`<span>${media.type}</span>` : nothing}${media.year ? html`<span>${media.year}</span>` : nothing}</div>
          ${subtitle ? html`<p>${subtitle}</p>` : nothing}
          ${this._config.popup_show_summary && media.summary ? html`<p class="details-summary ${this._config.popup_summary_lines === 0 ? "" : "compact"}" style=${`--summary-lines:${this._config.popup_summary_lines ?? 3}`}>${media.summary}</p>` : nothing}
          ${this._config.popup_show_progress ? html`<div class="details-progress"><span style=${`width:${progress}%`}></span></div>
          <div class="details-progress-label"><span>${Math.round(progress)}% watched</span>${item.playback?.remaining_ms ? html`<span>${this._duration(Math.ceil(item.playback.remaining_ms / 1000))} remaining</span>` : nothing}</div>` : nothing}
        </div>
      </div></section>
      <h3 class="details-section-title">Stream details</h3>
      <div class="details-grid">
        ${(this._config.popup_detail_order ?? DEFAULT_POPUP_DETAIL_ORDER).map((field) =>
          this._config[STREAM_DETAIL_VISIBILITY[field]]
            ? this._renderActiveDetailField(field, item, media, hierarchy)
            : nothing)}
      </div>
      ${allowPopupTermination && !terminationAtTop ? html`<div class="details-actions">${this._popupTerminationButton(item)}</div>` : nothing}`;
    return this._renderDialogShell(title, body, backdrop, true);
  }

  private _renderActiveDetailField(
    field: PopupDetailField,
    item: ActiveStream,
    media: MediaItem,
    hierarchy: Record<string, string | number | null>,
  ): TemplateResult | typeof nothing {
    switch (field) {
      case "user": return this._detailValue("Plex user", item.user?.display_name);
      case "player": return this._detailValue("Player", [item.client?.product, item.client?.player].filter(Boolean).join(" · "));
      case "device": return this._detailValue("Device", item.client?.device);
      case "eta": return this._detailValue("Estimated finish", this._eta(item));
      case "pause_duration": return item.state === "paused"
        ? this._detailValue("Paused for", this._elapsedDuration(this._pausedSeconds(item)))
        : nothing;
      case "playback_decision": return this._detailValue("Playback", item.quality?.decision);
      case "video_quality": return this._detailValue("Video", item.quality?.video_resolution);
      case "audio_quality": return this._detailValue("Audio", [item.quality?.audio_codec, item.quality?.audio_channel_layout].filter(Boolean).join(" · "));
      case "bandwidth": return this._detailValue("Bandwidth", item.quality?.bandwidth_kbps ? this._bandwidth(item.quality.bandwidth_kbps) : undefined);
      case "episode": return this._detailValue("Season / episode", media.type === "episode" ? `S${hierarchy.season_number ?? "–"} · E${hierarchy.episode_number ?? hierarchy.episode ?? "–"}` : undefined);
      case "year": return this._detailValue("Year", media.year);
      case "content_rating": return this._detailValue("Content rating", media.content_rating);
      case "rating": return this._detailValue("Rating", media.rating);
      case "audience_rating": return this._detailValue("Audience rating", media.audience_rating);
      case "genres": return this._detailValue("Genres", media.genres?.join(" · "));
      case "studio": return this._detailValue("Studio", media.studio);
    }
  }

  private _popupTerminationButton(item: ActiveStream): TemplateResult {
    const iconOnly = (this._config.termination_button_style ?? "label") === "icon";
    return html`<button class="danger ${iconOnly ? "icon-only" : ""}" @click=${(event: Event) => this._terminateFromDetails(item, event)} title="Terminate stream" aria-label="Terminate stream"><ha-icon icon="mdi:stop-circle-outline"></ha-icon>${iconOnly ? nothing : "Terminate stream"}</button>`;
  }

  private _renderUserDetails(item: UnknownItem): TemplateResult {
    const body = html`
      <section class="popup-summary"><div class="user-popup-summary">
        <div class="user-avatar large" aria-hidden="true">${String(item.display_name || "?").charAt(0).toUpperCase()}</div>
        <div><strong>${item.total_plays ?? 0} plays</strong><span>${this._duration(Number(item.total_duration_seconds) || 0)} watched</span></div>
      </div></section>
      <h3 class="details-section-title">User details</h3>
      <div class="details-grid">
        ${this._config.popup_show_playback_breakdown ? html`
          ${this._detailValue("Movies", item.movie_plays)}
          ${this._detailValue("TV episodes", item.tv_plays)}
          ${this._detailValue("Completion", item.completion_percent !== undefined ? `${item.completion_percent}%` : undefined)}
          ${this._detailValue("Transcoded", item.transcode_percent !== undefined ? `${item.transcode_percent}%` : undefined)}
          ${this._detailValue("Direct plays", item.direct_play_count)}
          ${this._detailValue("Direct streams", item.direct_stream_count)}
          ${this._detailValue("Transcodes", item.transcode_count)}
        ` : nothing}
        ${this._config.popup_show_favourites ? html`${this._detailValue("Favourite movie", item.popular_movie)}${this._detailValue("Favourite show", item.popular_show)}` : nothing}
        ${this._config.popup_show_habits ? html`${this._detailValue("Most-used player", item.most_used_device)}${this._detailValue("Usually watches", [item.preferred_day, item.preferred_time].filter(Boolean).join(" "))}` : nothing}
        ${this._config.popup_show_recent_activity ? this._detailValue("Last active", item.last_seen_at ? this._date(item.last_seen_at) : undefined) : nothing}
      </div>`;
    return this._renderDialogShell(item.display_name || "Private user", body);
  }

  private _renderMediaDetails(item: UnknownItem): TemplateResult {
    const media: MediaItem = this._config.mode === "recently_added" ? item as MediaItem : item.media ?? {};
    const poster = this._config.popup_show_artwork ? media.images?.poster_url ?? undefined : undefined;
    const backdrop = this._config.popup_show_artwork ? media.images?.backdrop_url ?? undefined : undefined;
    const body = html`
      <section class="popup-summary media-summary">${poster ? html`<img class="details-media-poster" src=${poster} alt="" loading="lazy" referrerpolicy="no-referrer">` : nothing}
      ${this._mediaSubtitle(media) ? html`<p class="details-subtitle">${this._mediaSubtitle(media)}</p>` : nothing}
      ${this._config.popup_show_summary && media.summary ? html`<p class="details-summary">${media.summary}</p>` : nothing}</section>
      <h3 class="details-section-title">Media details</h3>
      <div class="details-grid">
        ${this._config.popup_show_media_type ? this._detailValue("Media type", media.type) : nothing}
        ${this._config.popup_show_year ? this._detailValue("Year", media.year) : nothing}
        ${this._config.popup_show_duration ? this._detailValue("Duration", media.duration_seconds ? this._duration(media.duration_seconds) : undefined) : nothing}
        ${this._config.popup_show_library ? this._detailValue("Library", media.library?.name) : nothing}
        ${this._config.popup_show_content_rating ? this._detailValue("Content rating", media.content_rating) : nothing}
        ${this._config.popup_show_rating ? this._detailValue("Rating", media.rating) : nothing}
        ${this._config.popup_show_audience_rating ? this._detailValue("Audience rating", media.audience_rating) : nothing}
        ${this._config.popup_show_genres ? this._detailValue("Genres", media.genres?.join(" · ")) : nothing}
        ${this._config.popup_show_studio ? this._detailValue("Studio", media.studio) : nothing}
        ${this._config.mode === "popular" ? this._detailValue("Rank", item.rank ? `#${item.rank}` : undefined) : nothing}
        ${this._config.mode === "popular" ? this._detailValue("Plays", item.total_plays) : nothing}
        ${this._config.mode === "history" && this._config.popup_show_user ? this._detailValue("Plex user", item.user?.display_name) : nothing}
        ${this._config.mode === "history" ? this._detailValue("Played", item.started_at ? this._date(item.started_at) : undefined) : nothing}
      </div>`;
    return this._renderDialogShell(media.full_title || media.title || "Media details", body, backdrop);
  }

  private _detailValue(label: string, value: unknown): TemplateResult | typeof nothing {
    if (value === undefined || value === null || value === "" || value === 0) return nothing;
    return html`<div class="detail-value"><small>${label}</small><span>${String(value)}</span></div>`;
  }

  private _terminateFromDetails(item: ActiveStream, event: Event): void {
    this._openTerminationDialog(item, event);
  }

  private _image(images?: { poster_url?: string | null; backdrop_url?: string | null }): string | undefined {
    if (this._config.artwork === "none") return undefined;
    if (this._config.artwork === "backdrop") return undefined;
    if (this._config.artwork === "poster" && this._config.artwork_placement === "background") return undefined;
    return images?.poster_url ?? undefined;
  }

  private _backgroundImage(images?: { poster_url?: string | null; backdrop_url?: string | null }): string | undefined {
    if (this._config.artwork === "none") return undefined;
    if (["backdrop", "both"].includes(this._config.artwork ?? "poster")) {
      return images?.backdrop_url ?? images?.poster_url ?? undefined;
    }
    if (this._config.artwork_placement === "background") {
      return images?.poster_url ?? images?.backdrop_url ?? undefined;
    }
    return undefined;
  }

  private _mediaSubtitle(media: MediaItem): string {
    const h = media.hierarchy ?? {};
    if (["track", "album"].includes(media.type ?? "")) return [h.artist, h.album].filter(Boolean).join(" — ");
    if (["episode", "show"].includes(media.type ?? "")) {
      const episode = h.season_number && h.episode ? `S${h.season_number} · E${h.episode}` : "";
      return [h.show, episode].filter(Boolean).join(" — ");
    }
    return "";
  }

  private _itemEyebrow(item: UnknownItem, media: MediaItem): string {
    if (item._group_label) return String(item._group_label);
    if (this._config.mode === "popular") {
      const value = this._config.metric === "duration" ? this._duration(item.total_duration_seconds ?? 0) : `${item.total_plays ?? 0} plays`;
      return `#${item.rank ?? "–"} · ${value}`;
    }
    if (this._config.mode === "history") return [item.user?.display_name, this._date(item.started_at)].filter(Boolean).join(" · ");
    return [media.type, this._date(media.added_at)].filter(Boolean).join(" · ");
  }

  private _duration(seconds: number): string {
    const minutes = Math.max(0, Math.ceil(seconds / 60));
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }

  private _elapsedDuration(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const remainingSeconds = total % 60;
    if (hours) return `${hours}h ${minutes}m ${remainingSeconds}s`;
    if (minutes) return `${minutes}m ${remainingSeconds}s`;
    return `${remainingSeconds}s`;
  }

  private _pausedSeconds(item: ActiveStream): number {
    const anchor = this._pauseAnchors.get(this._itemId(item));
    if (!anchor) return Math.max(0, Math.floor(item.playback?.paused_seconds ?? 0));
    return anchor.baseSeconds + Math.max(0, Math.floor((this._pauseClock - anchor.receivedAt) / 1000));
  }

  private _syncPauseClock(): void {
    const receivedAt = Date.now();
    const pausedItems = (this._data?.items ?? []).filter(
      (item): item is ActiveStream => item?.state === "paused",
    );
    this._pauseAnchors = new Map(pausedItems.map((item) => [
      this._itemId(item),
      { baseSeconds: Math.max(0, Math.floor(item.playback?.paused_seconds ?? 0)), receivedAt },
    ]));
    this._pauseClock = receivedAt;
    if (pausedItems.length && !this._pauseTimer) {
      this._pauseTimer = window.setInterval(() => {
        this._pauseClock = Date.now();
      }, 1000);
    } else if (!pausedItems.length && this._pauseTimer) {
      window.clearInterval(this._pauseTimer);
      this._pauseTimer = undefined;
    }
  }

  private _eta(item: ActiveStream): string {
    const upstream = item.playback?.eta?.trim();
    if (upstream) return upstream;
    const remainingMs = Number(item.playback?.remaining_ms) || 0;
    if (remainingMs <= 0) return "";
    const generatedAt = Date.parse(this._data?.generated_at ?? "");
    const baseTime = Number.isNaN(generatedAt) ? Date.now() : generatedAt;
    return new Intl.DateTimeFormat(this.hass?.locale?.language, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(baseTime + remainingMs));
  }

  private _bandwidth(kbps: number): string {
    return kbps >= 1000 ? `${(kbps / 1000).toFixed(1)} Mbps` : `${kbps} Kbps`;
  }

  private _date(value?: string | null): string {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.valueOf())) return "";
    return new Intl.DateTimeFormat(this.hass?.locale?.language, { dateStyle: "medium" }).format(date);
  }

  private _friendlyError(message: string): string {
    if (message.includes("history_disabled")) return "Watch history is disabled in the integration’s Dashboard card access settings.";
    if (message.includes("unauthorized")) return "Administrator permission is required for this view.";
    return message;
  }

  private _openTerminationDialog(item: ActiveStream, event: Event): void {
    event.stopPropagation();
    this._terminationTrigger = event.currentTarget as HTMLElement;
    this._pendingTermination = item;
    this._dialogOpenedAt = Date.now();
  }

  private _backdropTerminationClose = (event: Event): void => {
    if (event.target !== event.currentTarget) return;
    if (Date.now() - this._dialogOpenedAt < 350) return;
    this._closeTerminationDialog();
  };

  private _closeTerminationDialog(): void {
    if (!this._terminating) {
      this._pendingTermination = undefined;
      requestAnimationFrame(() => this._terminationTrigger?.focus());
    }
  }

  private _dialogKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.preventDefault();
      this._closeTerminationDialog();
      return;
    }
    if (event.key !== "Tab") return;
    const buttons = [...this.renderRoot.querySelectorAll<HTMLButtonElement>(".dialog-actions button:not(:disabled)")];
    if (!buttons.length) return;
    const first = buttons[0];
    const last = buttons.at(-1);
    const activeElement = this.renderRoot instanceof ShadowRoot ? this.renderRoot.activeElement : document.activeElement;
    if (event.shiftKey && activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  private _renderTerminationDialog(): TemplateResult | typeof nothing {
    const item = this._pendingTermination;
    if (!item) return nothing;
    const title = item.media.full_title || item.media.title || "Untitled stream";
    const details = [item.user?.display_name, item.client?.product, item.client?.player].filter(Boolean).join(" · ");
    return html`<div class="dialog-backdrop" tabindex="-1" @click=${this._backdropTerminationClose} @keydown=${this._dialogKeydown}>
      <section class="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="terminate-title" aria-describedby="terminate-description">
        <div class="dialog-content">
          <div class="dialog-icon"><ha-icon icon="mdi:stop-circle-outline"></ha-icon></div>
          <h2 id="terminate-title">Terminate this stream?</h2>
          <p id="terminate-description">Playback will stop immediately on the selected Plex player.</p>
          <div class="dialog-stream"><strong>${title}</strong>${details ? html`<span>${details}</span>` : nothing}</div>
        </div>
        <div class="dialog-actions">
          <button class="dialog-cancel" ?disabled=${this._terminating} @click=${this._closeTerminationDialog}>Cancel</button>
          <button class="dialog-confirm" ?disabled=${this._terminating} @click=${() => this._confirmTermination(item)}>${this._terminating ? "Terminating…" : "Terminate stream"}</button>
        </div>
      </section>
    </div>`;
  }

  private async _confirmTermination(item: ActiveStream): Promise<void> {
    if (!this.hass || !this._config.entry_id || !item.session_id) return;
    this._terminating = true;
    try {
      const result = await terminateSession(this.hass, this._config.entry_id, item.session_id);
      this._pendingTermination = undefined;
      this.dispatchEvent(new CustomEvent("hass-notification", {
        bubbles: true,
        composed: true,
        detail: { message: result.succeeded ? "Stream terminated" : "Tautulli rejected the request" },
      }));
    } catch (error) {
      this._setError(error);
    } finally {
      this._terminating = false;
    }
  }
}
