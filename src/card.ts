import { LitElement, html, nothing } from "lit";
import type { PropertyValues, TemplateResult } from "lit";
import { keyed } from "lit/directives/keyed.js";
import { getCardData, getEntries, subscribeActive, SUPPORTED_SCHEMA, terminateSession } from "./api";
import { DEFAULT_POPUP_DETAIL_ORDER, DEFAULT_USER_POPUP_DETAIL_ORDER, modeTitle, normalizeConfig, STYLE_PRESETS } from "./config";
import { cardStyles } from "./styles";
import type { ActiveStream, CardConfig, CardEnvelope, HomeAssistant, MediaItem, PopupDetailField, UserPopupDetailGroup } from "./types";

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
  media_type: "popup_show_media_type",
  year: "popup_show_year",
  duration: "popup_show_duration",
  library: "popup_show_library",
  content_rating: "popup_show_content_rating",
  rating: "popup_show_rating",
  audience_rating: "popup_show_audience_rating",
  genres: "popup_show_genres",
  studio: "popup_show_studio",
  rank: "popup_show_rank",
  plays: "popup_show_plays",
  played: "popup_show_played",
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
    _showcaseIndex: { state: true },
    _showcaseDirection: { state: true },
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
  private _dialogClosing = false;
  private _unsubscribe?: () => void;
  private _refreshTimer?: number;
  private _retryTimer?: number;
  private _retryAttempt = 0;
  private _loadVersion = 0;
  private _pauseTimer?: number;
  private _pauseAnchors = new Map<string, { baseSeconds: number; receivedAt: number }>();
  private _scrollLockCount = 0;
  private _marqueeVelocity = 0;
  private _showcaseTimer = 0;
  private _showcaseAnimationFrame = 0;
  private _showcaseScrollEndBound = (): void => this._showcaseScrollEnd();
  private _marqueeSets = 2;
  private _suppressNextClick = false;
  private _pointerDownAt: { x: number; y: number; showcase: boolean } | null = null;
  private _marqueeSetWidth = 0;
  private _marqueeTouching = false;
  private _marqueeShiftTotal = 0;
  private _marqueeDurationS = 0;
  private _marqueeDrag: { pointerId: number; startX: number; p: number } | null = null;
  private _showcaseIndex = 0;
  private _showcaseDirection: 1 | -1 = 1;

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
    const showcasePresentationChanged = previous.layout !== next.layout
      || previous.showcase_transition !== next.showcase_transition;
    this._config = next;
    if (showcasePresentationChanged) {
      window.cancelAnimationFrame(this._showcaseAnimationFrame);
      this._showcaseAnimationFrame = 0;
      this.renderRoot?.querySelector<HTMLElement>(".content.showcase")?.style.removeProperty("scroll-snap-type");
      this._showcaseIndex = 0;
      this._showcaseDirection = 1;
    }
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
    this.addEventListener("pointerdown", this._pointerDownTracker);
    this.addEventListener("pointerup", this._pointerUpClassifier);
    if (this.hass) void this._connect();
  }

  override disconnectedCallback(): void {
    window.clearInterval(this._showcaseTimer);
    window.cancelAnimationFrame(this._showcaseAnimationFrame);
    this.renderRoot?.querySelector<HTMLElement>(".content.showcase")?.style.removeProperty("scroll-snap-type");
    if (this._scrollLockCount > 0) {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      this._scrollLockCount = 0;
    }
    this._disconnect();
    document.removeEventListener("visibilitychange", this._visibilityChanged);
    this.removeEventListener("click", this._delegatedItemClick, { capture: true });
    this.removeEventListener("pointerdown", this._pointerDownTracker);
    this.removeEventListener("pointerup", this._pointerUpClassifier);
    super.disconnectedCallback();
  }

  protected override willUpdate(changed: PropertyValues): void {
    if (changed.has("_data")) this._syncPauseClock();
  }

  protected override updated(changed: PropertyValues): void {
    if (this._config?.layout === "marquee") {
      this._startMarquee();
      this._syncMarqueePause();
    } else {
      this._stopMarquee();
    }
    if (this._config?.layout === "showcase") {
      if (changed.has("_data") || changed.has("_config")) this._restartShowcase();
    } else {
      window.clearInterval(this._showcaseTimer);
      window.cancelAnimationFrame(this._showcaseAnimationFrame);
      this.renderRoot?.querySelector<HTMLElement>(".content.showcase")?.style.removeProperty("scroll-snap-type");
      this._showcaseTimer = 0;
      this._showcaseAnimationFrame = 0;
    }
    if (changed.has("_data") && this._config?.layout === "marquee") {
      // Re-measure + restart the compositor glide after DOM settles.
      window.setTimeout(() => this._startMarquee(), 150);
    }
    if (this._config?.layout === "showcase" && this._config.showcase_transition === "horizontal") {
      const track = this.renderRoot.querySelector<HTMLElement>(".content.showcase");
      track?.addEventListener("scrollend", this._showcaseScrollEndBound);
    }
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
      // Activate on click ONLY: the browser fires click for taps that were not
      // drags (scroll/swipe gestures cancel it natively). pointerup opens were
      // the leak: they fire mid-gesture before drift is classified.
      button.onclick = open;
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
      if (this._dialogClosing) {
        this._dialogClosing = false;
      }
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
    const showcaseTransition = this._config.showcase_transition ?? "fade";
    return html`
      <ha-card>
        ${this._config.show_header || this._config.show_count ? html`
          <div class="header">
            ${this._config.show_header ? html`<h2 class="title">${modeTitle(this._config)}</h2>` : html`<span></span>`}
            ${this._config.show_count && this._data ? html`<span class="badge" aria-label="${items.length} items">${items.length}</span>` : nothing}
          </div>` : nothing}
        ${this._data?.stale ? html`<p class="stale">Showing the last successful update</p>` : nothing}
        ${this._loading ? this._renderLoading()
          : !items.length ? html`<div class="empty">${this._emptyMessage()}</div>`
          : html`${(["horizontal", "carousel", "showcase"].includes(this._config.layout ?? "grid") && this._config.carousel_buttons !== false) ? html`<div class="carousel-controls" aria-label="Carousel controls">
              <button @click=${() => this._config.layout === "showcase" ? this._advanceShowcase(-1) : this._scrollCarousel(-1)} aria-label="Previous items"><ha-icon icon="mdi:chevron-left"></ha-icon></button>
              <button @click=${() => this._config.layout === "showcase" ? this._advanceShowcase(1) : this._scrollCarousel(1)} aria-label="Next items"><ha-icon icon="mdi:chevron-right"></ha-icon></button>
            </div>` : nothing}
            <div
              class="content ${this._config.layout ?? "grid"} ${columns === "auto" ? "auto" : ""} ${["horizontal", "marquee", "showcase"].includes(this._config.layout ?? "") && this._filteredItems().length < 2 ? "single" : ""} ${this._config.layout === "showcase" ? `showcase-transition-${showcaseTransition}` : ""}"
              style=${`--columns:${columns};--scroll-gap:${this._config.scroll_gap ?? 8}px;--scroll-peek:${this._config.scroll_peek ?? 36}px;--marquee-speed:${this._config.autoscroll_speed ?? 40}px;--showcase-transition-duration:${this._config.showcase_transition_duration ?? 400}ms`}
              tabindex=${this._config.layout === "showcase" ? "0" : nothing}
              role=${this._config.layout === "showcase" ? "region" : nothing}
              aria-roledescription=${this._config.layout === "showcase" ? "carousel" : nothing}
              aria-label=${this._config.layout === "showcase" ? "Media showcase" : nothing}
              @keydown=${this._showcaseKeydown}
            >
              ${this._config.layout === "showcase"
                ? this._renderShowcase(items)
                : this._config.layout === "marquee"
                  ? html`<div class="marquee-track">${this._renderMarqueeStrip(items)}</div>`
                  : items.map((item) => this._renderItem(item))}
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
    if (this._config.mode === "active" && this._config.playback_state_filter !== "all") {
      const state = this._config.playback_state_filter;
      items = items.filter((item) => String(item.state ?? "").toLowerCase() === state);
    }
    if (this._config.mode === "active" && this._config.stream_decision_filter !== "all") {
      const decision = this._config.stream_decision_filter;
      items = items.filter((item) => this._streamDecision(item) === decision);
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
          remaining: [left.playback?.remaining_ms, right.playback?.remaining_ms],
          bandwidth: [left.quality?.bandwidth_kbps, right.quality?.bandwidth_kbps],
        };
        const [a, b] = values[key] ?? [0, 0];
        if (typeof a === "number" || typeof b === "number") return ((Number(a) || 0) - (Number(b) || 0)) * direction;
        return String(a ?? "").localeCompare(String(b ?? ""), this.hass?.locale?.language) * direction;
      });
    }
    return items.slice(0, this._config.max_items);
  }

  private _emptyMessage(): string {
    if (this._config.mode !== "active") return "No matching media";
    if (
      this._config.media_type !== "all"
      || this._config.playback_state_filter !== "all"
      || this._config.stream_decision_filter !== "all"
    ) return "No streams match the selected filters";
    return "Nothing is playing";
  }

  private _streamDecision(item: UnknownItem): CardConfig["stream_decision_filter"] | undefined {
    const decision = String(item.quality?.decision ?? "")
      .trim()
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ");
    if (decision.includes("transcod")) return "transcode";
    if (decision === "copy" || decision.includes("direct stream")) return "direct_stream";
    if (decision.includes("direct play")) return "direct_play";
    return undefined;
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
        const show = hierarchy.grandparent_id
          ?? hierarchy.show
          ?? (type === "season" ? hierarchy.parent_id ?? this._seasonShowTitle(media) : media.title);
        const season = type === "season"
          ? this._seasonLabel(media)
          : hierarchy.season_number ?? hierarchy.season;
        key = grouping === "season" ? `tv:${show}:${season}` : `tv:${show}`;
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
      const title = tv
        ? representative.type === "season" ? this._seasonShowTitle(representative) || representative.title : hierarchy.show ?? representative.title
        : hierarchy.album ?? hierarchy.artist ?? representative.title;
      const season = representative.type === "season"
        ? this._seasonLabel(representative)
        : hierarchy.season_number ? `Season ${hierarchy.season_number}` : hierarchy.season;
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

  private _renderItem(item: UnknownItem, _index?: number, clone = false): TemplateResult {
    if (clone) {
      // Duplicate copy for seamless infinite strips: same pixels, hidden from a11y tree.
      return html`<div class="strip-clone" aria-hidden="true" data-item-id=${this._itemId(item)}>${this._renderItem(item, undefined, false)}</div>`;
    }
    if (this._config.mode === "active") return this._renderActive(item as ActiveStream);
    if (this._config.mode === "users") return this._renderUser(item);
    const media: MediaItem = this._config.mode === "recently_added" ? item as MediaItem : item.media ?? {};
    const title = this._cardEpisodeTitle(media, "media");
    const subtitle = item._group_subtitle ?? this._cardEpisodeSubtitle(media, "media");
    const showYearInMeta = Boolean(media.year)
      && !(media.type === "movie" && this._config.movie_subtitle === "year");
    const image = this._image(media.images);
    const background = this._backgroundImage(media.images);
    const displayDuration = this._config.mode === "history"
      ? Number(item.play_duration_seconds) || 0
      : Number(media.duration_seconds) || 0;
    return html`
      <article data-item-id=${this._itemId(item)} class="item media-item ${media.type ?? "unknown"} ${this._artClass(image, background)} ${this._config.click_action === "details" ? "interactive" : ""}" style=${this._backgroundStyle(background)}>
        ${this._openDetailsButton(item, title)}
        ${image ? html`<img class="art" src=${image} alt="" loading="lazy" referrerpolicy="no-referrer">` : nothing}
        <div class="body">
          <div class="eyebrow"><span>${this._itemEyebrow(item, media)}</span></div>
          <h3 class="name">${title}</h3>
          ${subtitle ? html`<div class="subtitle">${subtitle}</div>` : nothing}
          <div class="meta">
            ${showYearInMeta ? html`<span>${media.year}</span>` : nothing}
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
    const showTotals = this._config.user_card_show_plays
      || this._config.user_card_show_watch_time
      || this._config.user_card_show_completion;
    const showBreakdown = this._config.user_card_show_media_breakdown
      || this._config.user_card_show_playback_breakdown;
    return html`<article data-item-id=${this._itemId(item)} class="item user-item ${this._config.click_action === "details" ? "interactive" : ""}">
      ${this._openDetailsButton(item, `${displayName} user details`)}
      <div class="user-avatar" aria-hidden="true">${initial}</div>
      <div class="body">
        ${this._config.user_card_show_last_active ? html`<div class="eyebrow"><span>${item.last_seen_at ? `Last active ${this._date(item.last_seen_at)}` : "Plex activity summary"}</span></div>` : nothing}
        <h3 class="name">${displayName}</h3>
        ${showTotals ? html`<div class="user-stats">
          ${this._config.user_card_show_plays ? html`<span><strong>${item.total_plays ?? 0}</strong> plays</span>` : nothing}
          ${this._config.user_card_show_watch_time ? html`<span><strong>${this._duration(total)}</strong> watched</span>` : nothing}
          ${this._config.user_card_show_completion ? html`<span><strong>${item.completion_percent ?? 0}%</strong> completion</span>` : nothing}
        </div>` : nothing}
        ${showBreakdown ? html`<div class="user-breakdown">
          ${this._config.user_card_show_media_breakdown && item.movie_plays ? html`<span><ha-icon icon="mdi:movie-open"></ha-icon>${item.movie_plays} movies</span>` : nothing}
          ${this._config.user_card_show_media_breakdown && item.tv_plays ? html`<span><ha-icon icon="mdi:television-classic"></ha-icon>${item.tv_plays} episodes</span>` : nothing}
          ${this._config.user_card_show_playback_breakdown && item.direct_play_count ? html`<span><ha-icon icon="mdi:play-circle-outline"></ha-icon>${item.direct_play_count} direct plays</span>` : nothing}
          ${this._config.user_card_show_playback_breakdown && item.transcode_count ? html`<span><ha-icon icon="mdi:swap-horizontal"></ha-icon>${item.transcode_count} transcodes</span>` : nothing}
        </div>` : nothing}
        ${this._config.user_card_show_favourites ? html`<div class="user-favourites optional">
          ${item.popular_movie ? html`<span><small>Favourite movie</small>${item.popular_movie}</span>` : nothing}
          ${item.popular_show ? html`<span><small>Favourite show</small>${item.popular_show}</span>` : nothing}
        </div>` : nothing}
        ${this._config.user_card_show_habits ? html`<div class="user-favourites optional">
          ${item.most_used_device ? html`<span><small>Most-used player</small>${item.most_used_device}</span>` : nothing}
          ${item.preferred_day ? html`<span><small>Usually watches</small>${item.preferred_day} ${item.preferred_time ?? ""}</span>` : nothing}
        </div>` : nothing}
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
    const music = ["track", "album", "artist"].includes(media.type ?? "");
    const title = this._cardEpisodeTitle(media, "active");
    const subtitle = this._cardEpisodeSubtitle(media, "active");
    const mediaDetail = music
      ? subtitle
      : media.type === "movie"
        ? subtitle
        : subtitle || (media.year ? String(media.year) : "");
    const showVideoQuality = !music && Boolean(this._config.show_quality);
    const showAudioQuality = music && Boolean(this._config.show_audio_quality);
    const showBandwidth = Boolean(this._config.show_bandwidth && item.quality?.bandwidth_kbps);
    const image = this._image(item.images);
    const background = this._backgroundImage(item.images);
    const progress = Math.max(0, Math.min(100, Number(item.playback?.progress_percent) || 0));
    const stateColor = this._playbackStateColor(item, music);
    const canTerminate = this._canTerminate(item) && (
      this._config.click_action !== "details"
      || ["card", "both"].includes(this._config.termination_location ?? "popup")
    );
    return html`
      <article data-item-id=${this._itemId(item)} class="item ${this._artClass(image, background)} ${this._config.click_action === "details" ? "interactive" : ""}" style=${this._backgroundStyle(background, stateColor)}>
        ${this._openDetailsButton(item, title)}
        ${image ? html`<img class="art" src=${image} alt="" loading="lazy" referrerpolicy="no-referrer">` : nothing}
        <div class="body">
          <div class="eyebrow">
            ${this._config.show_state ? html`<span class="state ${item.state}">${this._stateText(item, music)}</span>` : nothing}
            ${this._config.show_user && item.user?.display_name ? html`<span>${item.user.display_name}</span>` : nothing}
          </div>
          <h3 class="name">${title}</h3>
          ${mediaDetail && (music || this._config.show_media_details) ? html`<div class="subtitle">${mediaDetail}</div>` : nothing}
          ${(this._config.show_device && item.client) || (this._config.show_eta && this._eta(item)) ? html`<div class="meta">
            ${this._config.show_device && item.client ? html`<span>${item.client.player || item.client.product || item.client.device}</span>` : nothing}
            ${this._config.show_eta && this._eta(item) ? html`<span class="modern-eta">ETA: ${this._eta(item)}</span>` : nothing}
          </div>` : nothing}
          ${showVideoQuality || showAudioQuality || showBandwidth ? html`<div class="details optional">
            ${showVideoQuality && item.quality?.decision ? html`<span>${item.quality.decision}</span>` : nothing}
            ${showVideoQuality && item.quality?.video_resolution ? html`<span>${item.quality.video_resolution}</span>` : nothing}
            ${(showVideoQuality || showAudioQuality) && item.quality?.atmos ? html`<span>Atmos</span>` : nothing}
            ${showAudioQuality && item.quality?.audio_codec ? html`<span>${item.quality.audio_codec}</span>` : nothing}
            ${showAudioQuality && item.quality?.audio_channel_layout ? html`<span>${item.quality.audio_channel_layout}</span>` : nothing}
            ${showAudioQuality && item.quality?.audio_bitrate_kbps ? html`<span>${item.quality.audio_bitrate_kbps} Kbps</span>` : nothing}
            ${showBandwidth && item.quality?.bandwidth_kbps ? html`<span>${this._bandwidth(item.quality.bandwidth_kbps)}</span>` : nothing}
          </div>` : nothing}
          ${this._config.show_progress ? html`<div class="modern-progress-row">
            ${this._config.show_progress_percent ? html`<span class="modern-progress-percent">${Math.round(progress)}%</span>` : nothing}
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
    const stateColor = this._playbackStateColor(item, music);
    const hierarchy = media.hierarchy ?? {};
    const primaryTitle = music
      ? [hierarchy.artist, hierarchy.album].filter(Boolean).join(" — ")
      : this._cardEpisodeTitle(media, "classic");
    const secondaryTitle = music ? media.title || media.full_title : "";
    const mediaDetail = music
      ? ""
      : media.type === "episode"
        ? this._cardEpisodeSubtitle(media, "classic")
        : media.year ? `(${media.year})` : "";
    const client = [item.client?.product, item.client?.player].filter(Boolean).join(" — ") || item.client?.device;
    const videoQuality = [
      item.quality?.decision,
      item.quality?.video_resolution,
      item.quality?.atmos ? "Atmos" : undefined,
    ].filter(Boolean).join(" — ");
    const audioQuality = [
      item.quality?.audio_codec,
      item.quality?.audio_channel_layout,
      item.quality?.audio_bitrate_kbps ? `${item.quality.audio_bitrate_kbps} Kbps` : undefined,
      item.quality?.atmos ? "Atmos" : undefined,
    ].filter(Boolean).join(" · ");
    const canTerminate = this._canTerminate(item) && (
      this._config.click_action !== "details"
      || ["card", "both"].includes(this._config.termination_location ?? "popup")
    );
    return html`
      <article data-item-id=${this._itemId(item)} class="classic-item ${music ? "music" : "video"} ${item.state} ${this._artClass(image, background)} ${this._config.click_action === "details" ? "interactive" : ""}" style=${this._backgroundStyle(background, stateColor)}>
        ${this._openDetailsButton(item, primaryTitle)}
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
            ${this._config.show_media_details && mediaDetail ? html`<span class="media-detail"><ha-icon icon=${media.type === "episode" ? "mdi:television-classic" : "mdi:filmstrip"}></ha-icon><span>${mediaDetail}</span></span>` : html`<span></span>`}
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

  private _playbackStateColor(item: ActiveStream, music = false): string {
    const preset = STYLE_PRESETS[this._config.style_preset ?? "classic"];
    if (item.state === "paused") return this._config.paused_color ?? preset.paused_color;
    if (item.state === "buffering") return this._config.buffering_color ?? preset.buffering_color;
    return this._config.playing_color ?? (music ? "#1db954" : preset.playing_color);
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
      if (this._dialogClosing || this._selectedItem === item) return;
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

  /** Records where a touch/press started so we can tell taps from scroll gestures. */
  private _pointerDownTracker = (event: PointerEvent): void => {
    const showcase = this._config.layout === "showcase"
      && event.composedPath().some((node) => node instanceof Element && node.matches(".content.showcase"));
    if (showcase && this._config.showcase_transition === "horizontal") {
      window.cancelAnimationFrame(this._showcaseAnimationFrame);
      this._showcaseAnimationFrame = 0;
      this.renderRoot?.querySelector<HTMLElement>(".content.showcase")?.style.removeProperty("scroll-snap-type");
    }
    this._pointerDownAt = { x: event.clientX, y: event.clientY, showcase };
    this._marqueeTouching = true;
    this._syncMarqueePause();
  };

  /** A press that moved >12px before release was a scroll, not a tap - suppress its click. */
  private _pointerUpClassifier = (event: PointerEvent): void => {
    this._marqueeTouching = false;
    this._syncMarqueePause();
    const start = this._pointerDownAt;
    this._pointerDownAt = null;
    if (!start) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const drift = Math.hypot(deltaX, deltaY);
    if (drift > 12) this._suppressNextClick = true;
    if (
      start.showcase
      && this._config.showcase_transition !== "horizontal"
      && Math.abs(deltaX) >= 36
      && Math.abs(deltaX) > Math.abs(deltaY) * 1.2
    ) {
      this._advanceShowcase(deltaX < 0 ? 1 : -1);
    }
  };

  private _delegatedItemClick = (event: Event): void => {
    if (this._config.click_action !== "details") return;
    if (this._suppressNextClick) {
      this._suppressNextClick = false;
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    const path = event.composedPath();
    if (path.some((node) => node instanceof Element && (node.matches(".terminate") || node.closest(".dialog-backdrop")))) return;
    const target = path.find((node) => node instanceof HTMLElement && node.dataset.itemId) as HTMLElement | undefined;
    if (!target) return;
    const item = this._filteredItems().find((candidate) => this._itemId(candidate) === target.dataset.itemId);
    if (item) this._openDetails(item);
  };

  private _closeDetails = (): void => {
    if (this._dialogClosing) return;
    const style = this._config.popup_animation ?? "scale";
    const duration = this._config.animations === false || style === "none" ? 0 : this._config.popup_close_animation_duration ?? 200;
    if (duration <= 0) {
      this._selectedItem = undefined;
      this._unlockBodyScroll();
      this.requestUpdate();
      return;
    }
    // Timer-driven close: the CSS exit animation plays independently while
    // _dialogClosing keeps the render applying the closing classes; unmount
    // on a slightly padded timer so no animationend edge case can stall it.
    this._dialogClosing = true;
    this.requestUpdate();
    window.setTimeout(() => {
      this._selectedItem = undefined;
      this._dialogClosing = false;
      this._unlockBodyScroll();
      this.requestUpdate();
      if (this._config?.layout === "showcase") this._restartShowcase();
    }, duration + 60);
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

  /** Renders enough copies of the item set that the strip is far wider than the
   *  viewport; the engine silently reloops by one set width for a seamless
   *  infinite scroll (121212… / 123123123…). */
  private _renderMarqueeStrip(items: UnknownItem[]): TemplateResult {
    if (items.length < 2) {
      // Single card: no loop needed - render it once at full width.
      this._marqueeSets = 1;
      return html`${items.map((item) => this._renderItem(item, undefined, false))}`;
    }
    const copies = items.length <= 4 ? 4 : items.length <= 8 ? 3 : 2;
    this._marqueeSets = copies;
    return html`${Array.from({ length: copies }, (_, copy) =>
      items.map((item) => this._renderItem(item, undefined, copy > 0)))}`;
  }

  /** Marquee (auto-scroll) engine: rAF loop that scrolls the strip, decelerates
   *  smoothly on pointer interaction, and resumes after popups close. */
  private _marqueeItemsPerSet(): number {
    return Math.max(1, this._filteredItems().length || this._data?.items.length || 1);
  }

  /** Marquee engine v2: GPU-compositor animation. The strip translates via a
   *  CSS keyframe animation (never main-thread JS), so mobile dashboards with
   *  busy main threads scroll just as smoothly as desktop. JS only measures,
   *  sets duration, and pauses/resumes. */
  private _startMarquee(): void {
    if ((this._filteredItems().length || 0) < 2) return; // one card: no loop
    if (this._marqueeDrag) return; // mid-drag: the finger owns the track
    const strip = this.renderRoot.querySelector<HTMLElement>(".content.marquee");
    const track = this.renderRoot.querySelector<HTMLElement>(".marquee-track");
    if (!strip || !track) return;
    // Measure one set width from the DOM (clone wrapper has no box - measure child).
    const perSet = this._marqueeItemsPerSet();
    if (perSet <= 0 || track.children.length < perSet * 2) return;
    const first = track.children[0] as HTMLElement;
    const boundary = track.children[perSet] as HTMLElement;
    const boundaryBox = boundary.firstElementChild instanceof HTMLElement ? boundary.firstElementChild : boundary;
    const setWidth = boundaryBox.getBoundingClientRect().left - first.getBoundingClientRect().left;
    if (setWidth <= 0) return;
    const speed = this._config.autoscroll_speed ?? 60;
    const rtl = this._config.autoscroll_direction === "rtl";
    const durationS = setWidth / speed;
    this._marqueeShiftTotal = rtl ? setWidth : -setWidth;
    this._marqueeDurationS = durationS;
    track.style.setProperty("--marquee-shift", rtl ? `${setWidth}px` : `-${setWidth}px`);
    // Preserve the visible position across restarts (data refreshes re-run this).
    const prevP = this._marqueeProgress();
    track.style.animation = `marquee-glide ${durationS}s linear infinite`;
    const anim = track.getAnimations()[0];
    if (anim && prevP > 0) anim.currentTime = prevP * durationS * 1000;
    this._attachMarqueeDrag(strip);
    this._syncMarqueePause(track);
  }

  private _stopMarquee(): void {
    const track = this.renderRoot.querySelector<HTMLElement>(".marquee-track");
    if (track) {
      track.style.animation = "";
      track.style.transform = "";
    }
  }

  /** Finger-driven scrolling on the transform track: the drag moves the strip
   *  directly (with seamless wrap via progress normalisation), and releasing
   *  resumes the compositor glide from the exact position the finger left. */
  private _attachMarqueeDrag(strip: HTMLElement): void {
    if (strip.dataset.dragBound === "1") return;
    strip.dataset.dragBound = "1";
    strip.addEventListener("pointerdown", (event: PointerEvent) => {
      if (this._marqueeDrag || !this._marqueeShiftTotal) return;
      const track = this.renderRoot.querySelector<HTMLElement>(".marquee-track");
      if (!track) return;
      // Strict order: read live position, lock it as an inline transform, THEN
      // retire the animation. Reveal order guarantees no frame at wrong pixels.
      const p = this._marqueeProgress();
      track.style.transform = `translateX(${p * this._marqueeShiftTotal}px)`;
      track.style.animation = "none";
      this._marqueeDrag = { pointerId: event.pointerId, startX: event.clientX, p };
      strip.setPointerCapture(event.pointerId);
    });
    strip.addEventListener("pointermove", (event: PointerEvent) => {
      const drag = this._marqueeDrag;
      if (!drag || drag.pointerId !== event.pointerId || !this._marqueeShiftTotal) return;
      const dx = event.clientX - drag.startX;
      drag.startX = event.clientX;
      drag.p = (((drag.p + dx / this._marqueeShiftTotal) % 1) + 1) % 1;
      const track = this.renderRoot.querySelector<HTMLElement>(".marquee-track");
      if (track) track.style.transform = `translateX(${drag.p * this._marqueeShiftTotal}px)`;
    });
    const release = (event: PointerEvent): void => {
      const drag = this._marqueeDrag;
      if (!drag || drag.pointerId !== event.pointerId) return;
      this._marqueeDrag = null;
      this._resumeMarqueeAt(drag.p);
    };
    strip.addEventListener("pointerup", release);
    strip.addEventListener("pointercancel", release);
  }

  /** Current glide progress (0-1): from the live animation clock, falling back
   *  to the actual rendered transform matrix (a not-yet-ticked or restarted
   *  animation reports 0 and would visibly lurch the strip). */
  private _marqueeProgress(): number {
    const track = this.renderRoot.querySelector<HTMLElement>(".marquee-track");
    if (!track || !this._marqueeShiftTotal) return 0;
    const anim = track.getAnimations()[0];
    if (anim && anim.currentTime !== null && this._marqueeDurationS) {
      const p = (Number(anim.currentTime) / (this._marqueeDurationS * 1000)) % 1;
      return p < 0 ? p + 1 : p;
    }
    const matrix = new DOMMatrixReadOnly(getComputedStyle(track).transform);
    if (matrix.isIdentity || matrix.m41 === 0) return 0;
    const p = matrix.m41 / this._marqueeShiftTotal;
    return ((p % 1) + 1) % 1;
  }

  /** Restart the glide at progress p (finger release / popup close).
   *  Order matters: start the animation and seek it to p BEFORE dropping the
   *  inline transform, so no frame ever renders at the wrong position. */
  private _resumeMarqueeAt(p: number): void {
    const track = this.renderRoot.querySelector<HTMLElement>(".marquee-track");
    if (!track || !this._marqueeDurationS) return;
    track.style.animation = `marquee-glide ${this._marqueeDurationS}s linear infinite`;
    const anim = track.getAnimations()[0];
    if (anim) anim.currentTime = p * this._marqueeDurationS * 1000;
    track.style.transform = "";
    this._syncMarqueePause(track);
  }

  /** Pause the glide while popups are open / finger is down; resume after. */
  private _syncMarqueePause(track?: HTMLElement | null): void {
    const el = track ?? this.renderRoot.querySelector<HTMLElement>(".marquee-track");
    if (!el) return;
    el.style.animationPlayState = this._marqueePaused() || this._marqueeTouching ? "paused" : "running";
  }



  private _marqueePaused(): boolean {
    return Boolean(this._selectedItem) || this._dialogClosing || Boolean(this._pendingTermination);
  }

  private _renderShowcase(items: UnknownItem[]): TemplateResult {
    if (this._config.showcase_transition === "horizontal") {
      return html`${items.map((item) => this._renderItem(item))}${items.length >= 2
        ? items.map((item) => this._renderItem(item, undefined, true))
        : nothing}`;
    }
    const index = this._normalizedShowcaseIndex(items.length);
    const item = items[index];
    if (!item) return html``;
    const transition = this._config.showcase_transition ?? "fade";
    const direction = this._showcaseDirection === -1 ? "previous" : "next";
    const key = `${transition}:${index}:${this._itemId(item)}`;
    return html`${keyed(key, html`
      <div class="showcase-slide ${transition} ${direction}" aria-label=${`Item ${index + 1} of ${items.length}`}>
        ${this._renderItem(item)}
      </div>
    `)}`;
  }

  private _normalizedShowcaseIndex(itemCount: number): number {
    if (itemCount <= 0) return 0;
    return ((this._showcaseIndex % itemCount) + itemCount) % itemCount;
  }

  /** Showcase auto-advance pauses while a popup or confirmation is open. */
  private _restartShowcase(): void {
    window.clearInterval(this._showcaseTimer);
    this._showcaseTimer = 0;
    if (this._config.layout !== "showcase") return;
    const seconds = this._config.showcase_advance ?? 6;
    if ((this._filteredItems().length || 0) < 2) return; // one slide: nothing to advance to
    this._showcaseTimer = window.setInterval(() => {
      if (this._marqueePaused() || !this._data?.items.length) return;
      this._advanceShowcase(this._config.showcase_direction === "right" ? -1 : 1);
    }, seconds * 1000);
  }

  /** Horizontal showcase uses two identical sets for seamless native swiping. */
  private _showcaseReloop(): void {
    const track = this.renderRoot.querySelector<HTMLElement>(".content.showcase");
    if (!track) return;
    const slideWidth = this._showcaseSlideStep(track);
    const itemCount = this._filteredItems().length;
    if (itemCount < 2 || slideWidth <= 0) return;
    const setWidth = slideWidth * itemCount;
    if (setWidth <= 0) return;
    if (track.scrollLeft >= setWidth) track.scrollLeft -= setWidth;
  }

  /** Use the rendered snap interval so padding, gaps and fractional columns cannot offset a slide. */
  private _showcaseSlideStep(track: HTMLElement): number {
    const firstSlide = track.firstElementChild;
    const secondSlide = firstSlide?.nextElementSibling;
    const firstBounds = firstSlide?.getBoundingClientRect();
    const secondBounds = secondSlide?.getBoundingClientRect();
    const renderedStep = firstBounds && secondBounds ? Math.abs(secondBounds.left - firstBounds.left) : 0;
    if (renderedStep > 0) return renderedStep;
    const renderedWidth = firstBounds?.width ?? 0;
    return renderedWidth > 0 ? renderedWidth : track.clientWidth;
  }

  private _showcaseScrollEnd(): void {
    const track = this.renderRoot.querySelector<HTMLElement>(".content.showcase");
    const itemCount = this._filteredItems().length;
    if (!track || itemCount <= 0) return;
    const slideWidth = this._showcaseSlideStep(track);
    if (slideWidth <= 0) return;
    this._showcaseIndex = Math.round(track.scrollLeft / slideWidth) % itemCount;
    this._showcaseReloop();
  }

  private _advanceShowcase(step: 1 | -1): void {
    const itemCount = this._filteredItems().length;
    if (itemCount < 2) return;
    this._showcaseDirection = step;
    if (this._config.showcase_transition !== "horizontal") {
      this._showcaseIndex = (this._normalizedShowcaseIndex(itemCount) + step + itemCount) % itemCount;
      return;
    }
    const track = this.renderRoot.querySelector<HTMLElement>(".content.showcase");
    if (!track) return;
    const slideWidth = this._showcaseSlideStep(track);
    const setWidth = slideWidth * itemCount;
    if (step === -1 && setWidth > 0 && track.scrollLeft < slideWidth * 0.5) {
      track.scrollLeft += setWidth;
    } else if (step === 1 && setWidth > 0 && track.scrollLeft + slideWidth >= track.scrollWidth - slideWidth * 0.5) {
      track.scrollLeft -= setWidth;
    }
    this._animateShowcaseHorizontal(track, track.scrollLeft + step * slideWidth);
  }

  private _animateShowcaseHorizontal(track: HTMLElement, targetScrollLeft: number): void {
    window.cancelAnimationFrame(this._showcaseAnimationFrame);
    this._showcaseAnimationFrame = 0;
    if (!this._showcaseMotionAllowed()) {
      track.scrollLeft = targetScrollLeft;
      this._showcaseScrollEnd();
      return;
    }
    const startScrollLeft = track.scrollLeft;
    const distance = targetScrollLeft - startScrollLeft;
    const duration = this._config.showcase_transition_duration ?? 400;
    const startedAt = performance.now();
    track.style.scrollSnapType = "none";
    const animate = (now: number): void => {
      const progress = Math.min(1, Math.max(0, (now - startedAt) / duration));
      const eased = 1 - ((1 - progress) ** 3);
      track.scrollLeft = startScrollLeft + (distance * eased);
      if (progress < 1) {
        this._showcaseAnimationFrame = window.requestAnimationFrame(animate);
      } else {
        this._showcaseAnimationFrame = 0;
        track.style.removeProperty("scroll-snap-type");
        this._showcaseScrollEnd();
      }
    };
    this._showcaseAnimationFrame = window.requestAnimationFrame(animate);
  }

  private _showcaseMotionAllowed(): boolean {
    return this._config.animations !== false
      && !(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  }

  private _showcaseKeydown = (event: KeyboardEvent): void => {
    if (this._config.layout !== "showcase" || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    this._advanceShowcase(event.key === "ArrowLeft" ? -1 : 1);
  }

  private _scrollCarousel(direction: -1 | 1): void {
    const carousel = this.renderRoot.querySelector<HTMLElement>(
      this._config.layout === "horizontal" ? ".content.horizontal" : ".content.carousel",
    );
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
    const backdropStyle = `--scrim-color:rgb(0 0 0 / ${dim}%);--scrim-blur:${blur ? `blur(${blur}px)` : "none"};--dialog-animation-duration:${this._config.popup_animation_duration ?? 220}ms;`;
    const popupBackground = this._config.popup_background;
    const animationDuration = this._config.popup_animation_duration ?? 220;
    // Close speed is independently configurable (defaults to a snappy 200ms).
    const closeDuration = this._config.popup_close_animation_duration ?? 200;
    const cinematicArt = (this._config.popup_cinematic_art ?? 45) / 100;
    const dialogStyle = `${style}--dialog-animation-duration:${animationDuration}ms;--dialog-close-duration:${closeDuration}ms;--cinematic-art-opacity:${cinematicArt};${popupBackground ? `background:${popupBackground};` : ""}`;
    return html`<div class="dialog-backdrop ${this._dialogClosing ? "closing" : ""}" style=${backdropStyle} @click=${this._backdropClickClose} @keydown=${this._detailsKeydown}>
      <section class="details-dialog anim-${this._config.popup_animation ?? "scale"} ${this._dialogClosing ? "closing" : ""} popup-${this._config.popup_style ?? "clean"} popup-content-${this._config.popup_content_style ?? "open"} popup-width-${this._config.popup_width ?? "standard"} ${backdrop ? "has-backdrop" : ""}" style=${dialogStyle} role="dialog" aria-modal="true" aria-labelledby="details-title">
        <button class="dialog-close" @click=${this._closeDetails} aria-label="Close details"><ha-icon icon="mdi:close"></ha-icon></button>
        <div class="details-content">${titleInContent ? nothing : html`<h2 id="details-title">${title}</h2>`}${content}</div>
      </section>
    </div>`;
  }

  private _renderActiveDetails(item: ActiveStream): TemplateResult {
    const media = item.media ?? {};
    const progress = Math.max(0, Math.min(100, Number(item.playback?.progress_percent) || 0));
    const hierarchy = media.hierarchy ?? {};
    const subtitle = this._popupMediaSubtitle(media, "active");
    const poster = this._config.popup_show_artwork ? item.images?.poster_url ?? undefined : undefined;
    const backdrop = this._config.popup_show_artwork ? item.images?.backdrop_url ?? undefined : undefined;
    const allowPopupTermination = this._canTerminate(item) && ["popup", "both"].includes(this._config.termination_location ?? "popup");
    const terminationAtTop = allowPopupTermination && (this._config.termination_popup_placement ?? "footer") === "top";
    const title = this._popupMediaTitle(media, "active") || "Stream details";
    const stateColor = this._playbackStateColor(item, ["track", "album", "artist"].includes(media.type ?? ""));
    const detailFields = (this._config.popup_detail_order ?? DEFAULT_POPUP_DETAIL_ORDER)
      .map((field) => this._config[STREAM_DETAIL_VISIBILITY[field]]
        ? this._renderActiveDetailField(field, item, media, hierarchy)
        : nothing)
      .filter((field) => field !== nothing);
    const body = html`
      <section class="popup-summary" style=${this._backgroundStyle(undefined, stateColor)}><div class="details-hero ${poster ? "with-poster" : ""}">
        ${poster ? html`<img src=${poster} alt="" loading="lazy" referrerpolicy="no-referrer">` : nothing}
        ${terminationAtTop ? html`<div class="details-top-action">${this._popupTerminationButton(item)}</div>` : nothing}
        <div class="details-primary">
          <div class="details-heading-line">
            <h2 id="details-title" class="details-inline-title">${title}</h2>
            ${this._config.popup_summary_show_user && item.user?.display_name ? html`<span class="details-summary-user"><ha-icon icon="mdi:account"></ha-icon>${item.user.display_name}</span>` : nothing}
          </div>
          <div class="details-chips">${[ "paused", "buffering" ].includes(item.state) ? html`<span class="state ${item.state}">${item.state}</span>` : nothing}${media.type ? html`<span>${media.type}</span>` : nothing}${media.year ? html`<span>${media.year}</span>` : nothing}</div>
          ${subtitle ? html`<p>${subtitle}</p>` : nothing}
          ${this._config.popup_show_summary && media.summary ? html`<p class="details-summary ${this._config.popup_summary_lines === 0 ? "" : "compact"}" style=${`--summary-lines:${this._config.popup_summary_lines ?? 3}`}>${media.summary}</p>` : nothing}
          ${this._config.popup_show_progress ? html`<div class="details-progress"><span style=${`width:${progress}%`}></span></div>
          <div class="details-progress-label"><span>${Math.round(progress)}% watched</span>${item.playback?.remaining_ms ? html`<span>${this._duration(Math.ceil(item.playback.remaining_ms / 1000))} remaining</span>` : nothing}</div>` : nothing}
        </div>
      </div></section>
      ${detailFields.length ? html`<h3 class="details-section-title">Stream details</h3><div class="details-grid">${detailFields}</div>` : nothing}
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
      case "audio_quality": return this._detailValue("Audio", [
        item.quality?.audio_codec,
        item.quality?.audio_channel_layout,
        item.quality?.atmos ? "Atmos" : undefined,
      ].filter(Boolean).join(" · "));
      case "bandwidth": return this._detailValue("Bandwidth", item.quality?.bandwidth_kbps ? this._bandwidth(item.quality.bandwidth_kbps) : undefined);
      case "episode": return this._detailValue("Season / episode", media.type === "episode" ? `S${hierarchy.season_number ?? "–"} · E${hierarchy.episode_number ?? hierarchy.episode ?? "–"}` : undefined);
      case "media_type": return this._detailValue("Media type", media.type);
      case "year": return this._detailValue("Year", media.year);
      case "duration": return this._detailValue("Duration", media.duration_seconds
        ? this._duration(media.duration_seconds)
        : item.playback?.duration_ms ? this._duration(Math.ceil(item.playback.duration_ms / 1000)) : undefined);
      case "library": return this._detailValue("Library", media.library?.name);
      case "content_rating": return this._detailValue("Content rating", media.content_rating);
      case "rating": return this._detailValue("Rating", media.rating);
      case "audience_rating": return this._detailValue("Audience rating", media.audience_rating);
      case "genres": return this._detailValue("Genres", media.genres?.join(" · "));
      case "studio": return this._detailValue("Studio", media.studio);
      case "rank":
      case "plays":
      case "played": return nothing;
    }
  }

  private _popupTerminationButton(item: ActiveStream): TemplateResult {
    const iconOnly = (this._config.termination_button_style ?? "label") === "icon";
    return html`<button class="danger ${iconOnly ? "icon-only" : ""}" @click=${(event: Event) => this._terminateFromDetails(item, event)} title="Terminate stream" aria-label="Terminate stream"><ha-icon icon="mdi:stop-circle-outline"></ha-icon>${iconOnly ? nothing : "Terminate stream"}</button>`;
  }

  private _renderUserDetails(item: UnknownItem): TemplateResult {
    const detailFields = (this._config.popup_user_detail_order ?? DEFAULT_USER_POPUP_DETAIL_ORDER)
      .flatMap((group) => this._renderUserDetailGroup(group, item))
      .filter((field) => field !== nothing);
    const body = html`
      <section class="popup-summary"><div class="user-popup-summary">
        <div class="user-avatar large" aria-hidden="true">${String(item.display_name || "?").charAt(0).toUpperCase()}</div>
        <div><strong>${item.total_plays ?? 0} plays</strong><span>${this._duration(Number(item.total_duration_seconds) || 0)} watched</span></div>
      </div></section>
      ${detailFields.length ? html`<h3 class="details-section-title">User details</h3><div class="details-grid">${detailFields}</div>` : nothing}`;
    return this._renderDialogShell(item.display_name || "Private user", body);
  }

  private _renderUserDetailGroup(group: UserPopupDetailGroup, item: UnknownItem): Array<TemplateResult | typeof nothing> {
    switch (group) {
      case "playback": return this._config.popup_show_playback_breakdown ? [
        this._detailValue("Movies", item.movie_plays),
        this._detailValue("TV episodes", item.tv_plays),
        this._detailValue("Completion", item.completion_percent !== undefined ? `${item.completion_percent}%` : undefined),
        this._detailValue("Transcoded", item.transcode_percent !== undefined ? `${item.transcode_percent}%` : undefined),
        this._detailValue("Direct plays", item.direct_play_count),
        this._detailValue("Direct streams", item.direct_stream_count),
        this._detailValue("Transcodes", item.transcode_count),
      ] : [];
      case "favourites": return this._config.popup_show_favourites ? [
        this._detailValue("Favourite movie", item.popular_movie),
        this._detailValue("Favourite show", item.popular_show),
      ] : [];
      case "habits": return this._config.popup_show_habits ? [
        this._detailValue("Most-used player", item.most_used_device),
        this._detailValue("Usually watches", [item.preferred_day, item.preferred_time].filter(Boolean).join(" ")),
      ] : [];
      case "recent_activity": return this._config.popup_show_recent_activity ? [
        this._detailValue("Last active", item.last_seen_at ? this._date(item.last_seen_at) : undefined),
      ] : [];
    }
  }

  private _renderMediaDetails(item: UnknownItem): TemplateResult {
    const media: MediaItem = this._config.mode === "recently_added" ? item as MediaItem : item.media ?? {};
    const poster = this._config.popup_show_artwork ? media.images?.poster_url ?? undefined : undefined;
    const backdrop = this._config.popup_show_artwork ? media.images?.backdrop_url ?? undefined : undefined;
    const title = this._popupMediaTitle(media, "media") || "Media details";
    const subtitle = this._popupMediaSubtitle(media, "media");
    const detailFields = (this._config.popup_detail_order ?? DEFAULT_POPUP_DETAIL_ORDER)
      .map((field) => this._config[STREAM_DETAIL_VISIBILITY[field]]
        ? this._renderMediaDetailField(field, item, media)
        : nothing)
      .filter((field) => field !== nothing);
    const body = html`
      <section class="popup-summary media-summary"><div class="details-hero ${poster ? "with-poster" : ""}">
        ${poster ? html`<img class="details-media-poster" src=${poster} alt="" loading="lazy" referrerpolicy="no-referrer">` : nothing}
        <div class="details-primary">
          <h2 id="details-title" class="details-inline-title">${title}</h2>
          ${subtitle ? html`<p class="details-subtitle">${subtitle}</p>` : nothing}
          ${this._config.popup_show_summary && media.summary ? html`<p class="details-summary ${this._config.popup_summary_lines === 0 ? "" : "compact"}" style=${`--summary-lines:${this._config.popup_summary_lines ?? 3}`}>${media.summary}</p>` : nothing}
        </div>
      </div></section>
      ${detailFields.length ? html`<h3 class="details-section-title">${this._config.mode === "popular" ? "Ranking details" : "Media details"}</h3><div class="details-grid">${detailFields}</div>` : nothing}`;
    return this._renderDialogShell(title, body, backdrop, true);
  }

  private _renderMediaDetailField(field: PopupDetailField, item: UnknownItem, media: MediaItem): TemplateResult | typeof nothing {
    switch (field) {
      case "user": return this._detailValue("Plex user", item.user?.display_name);
      case "media_type": return this._detailValue("Media type", media.type);
      case "year": return this._detailValue("Year", media.year);
      case "duration": return this._detailValue("Duration", media.duration_seconds ? this._duration(media.duration_seconds) : undefined);
      case "library": return this._detailValue("Library", media.library?.name);
      case "content_rating": return this._detailValue("Content rating", media.content_rating);
      case "rating": return this._detailValue("Rating", media.rating);
      case "audience_rating": return this._detailValue("Audience rating", media.audience_rating);
      case "genres": return this._detailValue("Genres", media.genres?.join(" · "));
      case "studio": return this._detailValue("Studio", media.studio);
      case "rank": return this._detailValue("Rank", item.rank ? `#${item.rank}` : undefined);
      case "plays": return this._detailValue("Plays", item.total_plays);
      case "played": return this._detailValue("Played", item.started_at ? this._date(item.started_at) : undefined);
      default: return nothing;
    }
  }

  private _detailValue(label: string, value: unknown): TemplateResult | typeof nothing {
    if (value === undefined || value === null || value === "") return nothing;
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
      const episode = media.type === "episode" ? this._episodeNumber(media, "compact") : "";
      return [h.show, episode].filter(Boolean).join(" — ");
    }
    return "";
  }

  private _popupMediaTitle(media: MediaItem, context: "active" | "media"): string {
    if (media.type === "season") return this._cardEpisodeTitle(media, context);
    if (media.type !== "episode") return media.full_title || media.title || "";
    const layout = this._config.popup_episode_layout ?? "automatic";
    if (layout === "card") return this._cardEpisodeTitle(media, context);
    if (layout !== "custom") return media.full_title || media.title || "";
    const hierarchy = media.hierarchy ?? {};
    const show = this._displayText(hierarchy.show);
    const episodeTitle = media.title || "";
    const fullTitle = media.full_title || episodeTitle || show;
    switch (this._config.popup_episode_title ?? "full_title") {
      case "show": return show || fullTitle || episodeTitle;
      case "episode_title": return episodeTitle || fullTitle || show;
      default: return fullTitle || episodeTitle || show;
    }
  }

  private _popupMediaSubtitle(media: MediaItem, context: "active" | "media"): string {
    if (media.type === "season") return this._cardEpisodeSubtitle(media, context);
    if (media.type !== "episode") return this._mediaSubtitle(media);
    const layout = this._config.popup_episode_layout ?? "automatic";
    if (layout === "card") return this._cardEpisodeSubtitle(media, context);
    if (layout !== "custom") return this._mediaSubtitle(media);
    const hierarchy = media.hierarchy ?? {};
    const show = this._displayText(hierarchy.show);
    const episodeTitle = media.title || "";
    const number = this._episodeNumber(media, this._config.popup_episode_number_style ?? "compact");
    switch (this._config.popup_episode_subtitle ?? "show_and_number") {
      case "number_and_title": return this._joinText(number, episodeTitle);
      case "show_number_and_title": return this._joinText(show, number, episodeTitle);
      case "number_only": return number;
      case "episode_title": return episodeTitle;
      case "none": return "";
      default: return this._joinText(show, number);
    }
  }

  private _movieSubtitle(media: MediaItem, context: "active" | "classic" | "media"): string {
    const source = this._config.movie_subtitle ?? "automatic";
    if (source === "automatic") {
      return context === "active" && media.year ? String(media.year) : "";
    }
    switch (source) {
      case "year": return media.year ? String(media.year) : "";
      case "content_rating": return media.content_rating ?? "";
      case "rating": return media.rating !== null && media.rating !== undefined ? `Critic ★ ${media.rating}` : "";
      case "audience_rating": return media.audience_rating !== null && media.audience_rating !== undefined ? `Audience ★ ${media.audience_rating}` : "";
      case "genres": return media.genres?.filter(Boolean).join(" · ") ?? "";
      case "studio": return media.studio ?? "";
      default: return "";
    }
  }

  private _cardEpisodeTitle(media: MediaItem, context: "active" | "classic" | "media"): string {
    const normalTitle = context === "media"
      ? media.title || media.full_title
      : media.full_title || media.title;
    if (media.type === "season") return this._seasonShowTitle(media) || normalTitle || "Untitled";
    if (media.type !== "episode") return normalTitle || "Untitled";

    const hierarchy = media.hierarchy ?? {};
    const show = this._displayText(hierarchy.show);
    const episodeTitle = media.title || "";
    const fullTitle = media.full_title || episodeTitle || show;
    const layout = this._config.episode_layout ?? "current";
    if (layout === "show_first") return show || fullTitle || "Untitled";
    if (layout === "episode_first") return episodeTitle || fullTitle || show || "Untitled";
    if (layout !== "custom") return normalTitle || show || "Untitled";

    switch (this._config.episode_title ?? "full_title") {
      case "show": return show || fullTitle || episodeTitle || "Untitled";
      case "episode_title": return episodeTitle || fullTitle || show || "Untitled";
      default: return fullTitle || episodeTitle || show || "Untitled";
    }
  }

  private _cardEpisodeSubtitle(media: MediaItem, context: "active" | "classic" | "media"): string {
    if (media.type === "season") {
      const label = this._seasonLabel(media);
      const title = this._seasonShowTitle(media) || this._displayText(media.title || media.full_title);
      return label === title ? "" : label;
    }
    if (media.type === "movie") return this._movieSubtitle(media, context);
    if (media.type !== "episode") return this._mediaSubtitle(media);
    const hierarchy = media.hierarchy ?? {};
    const show = this._displayText(hierarchy.show);
    const episodeTitle = media.title || "";
    const number = this._episodeNumber(media);
    const layout = this._config.episode_layout ?? "current";

    if (layout === "show_first") return this._joinText(number, episodeTitle);
    if (layout === "episode_first") return this._joinText(show, number);

    let source = this._config.episode_subtitle ?? "show_and_number";
    if (layout === "current") source = context === "classic" ? "number_only" : "show_and_number";
    switch (source) {
      case "number_and_title": return this._joinText(number, episodeTitle);
      case "show_number_and_title": return this._joinText(show, number, episodeTitle);
      case "number_only": return number;
      case "episode_title": return episodeTitle;
      case "none": return "";
      default: return this._joinText(show, number);
    }
  }

  private _episodeNumber(media: MediaItem, style = this._config.episode_number_style ?? "compact"): string {
    const hierarchy = media.hierarchy ?? {};
    const season = hierarchy.season_number ?? hierarchy.season;
    const episode = hierarchy.episode_number ?? hierarchy.episode;
    if (season === undefined || season === null || episode === undefined || episode === null) return "";
    if (style === "padded") {
      return `S${this._paddedIndex(season)}E${this._paddedIndex(episode)}`;
    }
    return `S${this._displayText(season)} · E${this._displayText(episode)}`;
  }

  private _seasonShowTitle(media: MediaItem): string {
    const hierarchy = media.hierarchy ?? {};
    const show = this._displayText(hierarchy.show);
    if (show) return show;
    const legacyParent = this._displayText(hierarchy.season);
    return legacyParent && legacyParent !== this._seasonLabel(media) ? legacyParent : "";
  }

  private _seasonLabel(media: MediaItem): string {
    const title = this._displayText(media.title || media.full_title);
    if (title) return title;
    const hierarchy = media.hierarchy ?? {};
    const season = this._displayText(hierarchy.season);
    const show = this._displayText(hierarchy.show);
    if (season && season !== show) return season;
    const number = hierarchy.season_number;
    return number === undefined || number === null ? "" : `Season ${this._displayText(number)}`;
  }

  private _paddedIndex(value: string | number): string {
    const text = this._displayText(value);
    return /^\d+$/.test(text) ? text.padStart(2, "0") : text;
  }

  private _displayText(value: unknown): string {
    return value === undefined || value === null ? "" : String(value).trim();
  }

  private _joinText(...values: Array<string | undefined>): string {
    return values.filter(Boolean).join(" — ");
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
    const remainingMs = Number(item.playback?.remaining_ms) || 0;
    if (remainingMs <= 0) return upstream ?? "";
    const generatedAt = Date.parse(this._data?.generated_at ?? "");
    const baseTime = Number.isNaN(generatedAt) ? Date.now() : generatedAt;
    const selectedFormat = this._config.eta_time_format ?? "automatic";
    const homeAssistantFormat = this.hass?.locale?.time_format;
    const hourCycle: "h12" | "h23" | undefined = selectedFormat === "12"
      ? "h12"
      : selectedFormat === "24"
        ? "h23"
        : homeAssistantFormat === "12"
          ? "h12"
          : homeAssistantFormat === "24"
            ? "h23"
            : undefined;
    const language = selectedFormat === "automatic" && homeAssistantFormat === "system"
      ? undefined
      : this.hass?.locale?.language;
    return new Intl.DateTimeFormat(language, {
      hour: "numeric",
      minute: "2-digit",
      ...(hourCycle ? { hourCycle } : {}),
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
