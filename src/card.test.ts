/** @vitest-environment happy-dom */

import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";
import { cardStyles } from "./styles";
import type { ActiveStream, CardEnvelope, HomeAssistant } from "./types";

const STREAM: ActiveStream = {
  id: "server:session-1",
  session_id: "session-1",
  state: "playing",
  user: { display_name: "Viewer" },
  media: { type: "movie", title: "Example Movie", full_title: "Example Movie" },
  playback: {
    progress_percent: 42,
    duration_ms: 7_200_000,
    remaining_ms: 4_176_000,
    paused_seconds: 0,
  },
  client: { product: "Plex", player: "Living room TV" },
  quality: { decision: "direct play", bandwidth_kbps: 8000 },
};

const EPISODE_STREAM: ActiveStream = {
  ...STREAM,
  id: "server:episode-session",
  session_id: "episode-session",
  media: {
    type: "episode",
    title: "Episode Name",
    full_title: "Example Show — Episode Name",
    hierarchy: {
      show: "Example Show",
      season_number: 1,
      episode_number: 2,
    },
  },
};

const DETAILED_STREAM: ActiveStream = {
  ...STREAM,
  media: {
    ...STREAM.media,
    year: 2026,
    duration_seconds: 7200,
    library: { id: "1", name: "Movies" },
    content_rating: "PG-13",
    rating: 8.2,
    audience_rating: 8.8,
    genres: ["Drama", "Mystery"],
    studio: "Example Studio",
  },
};

const MUSIC_STREAM: ActiveStream = {
  ...STREAM,
  id: "server:music-session",
  session_id: "music-session",
  media: {
    type: "track",
    title: "Example Track",
    full_title: "Example Track",
    hierarchy: { artist: "Example Artist", album: "Example Album" },
  },
  quality: {
    decision: "direct play",
    audio_codec: "flac",
    audio_channel_layout: "stereo",
    audio_bitrate_kbps: 1411,
    audio_atmos: true,
    stream_audio_atmos: true,
    atmos: true,
  },
};

const ENVELOPE: CardEnvelope<ActiveStream> = {
  schema_version: 1,
  entry_id: "entry-1",
  server: { id: "server", name: "Plex" },
  generated_at: new Date().toISOString(),
  stale: false,
  capabilities: {
    active_streams: true,
    active_stream_subscription: true,
    recently_added: true,
    home_stats: true,
    users: true,
    user_stats: true,
    libraries: true,
    history: true,
    stream_termination: true,
  },
  items: [STREAM],
};

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("stream termination confirmation", () => {
  it("never fabricates a sample stream in an empty editor preview", async () => {
    const preview = document.createElement("div");
    preview.className = "card-preview";
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      show_empty: true,
      demo_when_empty: true,
    });
    preview.append(card);
    document.body.append(preview);
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
    internal._data = { ...ENVELOPE, items: [] };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    expect(card.renderRoot.querySelector("article")).toBeNull();
    expect(card.renderRoot.textContent).not.toContain("Spider-Man");
    expect(card.renderRoot.textContent).toContain("Nothing is playing");
  });

  it("shows a neutral skeleton while loading and hides technical startup failures", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({ type: "custom:tautulli-media-card", entry_id: "entry-1", mode: "active" });
    document.body.append(card);
    await card.updateComplete;

    expect(card.renderRoot.querySelector(".loading-grid")).not.toBeNull();
    expect(card.renderRoot.querySelector(".error")).toBeNull();
    expect(card.renderRoot.textContent).not.toContain("[object Object]");

    const internal = card as unknown as { _setError(error: unknown): void };
    internal._setError({ code: "cannot_connect", message: "private transport detail" });
    await card.updateComplete;

    expect(card.renderRoot.querySelector("ha-card")).toBeNull();
    expect(card.renderRoot.textContent).not.toContain("private transport detail");
    expect(card.renderRoot.textContent).not.toContain("[object Object]");
  });

  it("keeps cached content instead of replacing it with an outage error", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({ type: "custom:tautulli-media-card", entry_id: "entry-1", mode: "active" });
    document.body.append(card);
    const internal = card as unknown as {
      _data: CardEnvelope<ActiveStream>;
      _loading: boolean;
      _setError(error: unknown): void;
    };
    internal._data = ENVELOPE;
    internal._loading = false;
    await card.updateComplete;
    internal._setError(new Error("Tautulli connection failed"));
    await card.updateComplete;

    expect(card.renderRoot.querySelector("article")).not.toBeNull();
    expect(card.renderRoot.querySelector(".stale")?.textContent).toContain("last successful update");
    expect(card.renderRoot.textContent).not.toContain("Tautulli connection failed");
  });

  it("shows termination on the card when the details popup is disabled", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      click_action: "none",
      allow_termination: true,
      termination_location: "popup",
    });
    card.hass = {
      callWS: vi.fn(),
      connection: { subscribeMessage: vi.fn().mockResolvedValue(() => undefined) },
    } as unknown as HomeAssistant;
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
    internal._data = ENVELOPE;
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    expect(card.renderRoot.querySelector(".terminate")).not.toBeNull();
    expect(card.renderRoot.querySelector(".open-details")).toBeNull();
  });

  it("uses a themed modal and calls the scoped WebSocket command only after confirmation", async () => {
    const callWS = vi.fn().mockResolvedValue({ succeeded: true });
    const subscribeMessage = vi.fn().mockImplementation(async (callback) => {
      callback(ENVELOPE);
      return () => undefined;
    });
    const hass = { callWS, connection: { subscribeMessage } } as unknown as HomeAssistant;
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      allow_termination: true,
      termination_location: "card",
    });
    card.hass = hass;
    document.body.append(card);
    await card.updateComplete;
    await new Promise((resolve) => setTimeout(resolve, 0));
    await card.updateComplete;

    const browserConfirm = vi.spyOn(window, "confirm");
    const terminateButton = card.renderRoot.querySelector<HTMLButtonElement>(".terminate");
    expect(terminateButton).not.toBeNull();
    terminateButton?.click();
    await card.updateComplete;

    const dialog = card.renderRoot.querySelector('[role="alertdialog"]');
    expect(dialog?.textContent).toContain("Terminate this stream?");
    expect(dialog?.textContent).toContain("Example Movie");
    expect(dialog?.textContent).toContain("Viewer · Plex · Living room TV");
    expect(browserConfirm).not.toHaveBeenCalled();
    expect(callWS).not.toHaveBeenCalled();

    card.renderRoot.querySelector<HTMLButtonElement>(".dialog-confirm")?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(callWS).toHaveBeenCalledWith({
      type: "tautulli_active_streams/terminate_session",
      entry_id: "entry-1",
      session_id: "session-1",
    });
  });

  it("closes without sending a command when cancelled", async () => {
    const callWS = vi.fn();
    const hass = {
      callWS,
      connection: { subscribeMessage: vi.fn().mockResolvedValue(() => undefined) },
    } as unknown as HomeAssistant;
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({ type: "custom:tautulli-media-card", entry_id: "entry-1", mode: "active", allow_termination: true, termination_location: "card" });
    card.hass = hass;
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
    internal._data = ENVELOPE;
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;
    card.renderRoot.querySelector<HTMLButtonElement>(".terminate")?.click();
    await card.updateComplete;
    card.renderRoot.querySelector<HTMLButtonElement>(".dialog-cancel")?.click();
    await card.updateComplete;

    expect(card.renderRoot.querySelector('[role="alertdialog"]')).toBeNull();
    expect(callWS).not.toHaveBeenCalled();
  });

  it("opens full stream details and keeps termination in the popup when selected", async () => {
    const hass = {
      callWS: vi.fn(),
      connection: { subscribeMessage: vi.fn().mockResolvedValue(() => undefined) },
    } as unknown as HomeAssistant;
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      click_action: "details",
      allow_termination: true,
      termination_location: "popup",
    });
    card.hass = hass;
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
    internal._data = {
      ...ENVELOPE,
      items: [{
        ...STREAM,
        quality: {
          ...STREAM.quality,
          video_resolution: "2160p",
          audio_codec: "truehd",
          audio_channel_layout: "7.1",
          atmos: true,
        },
      }],
    };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    expect(card.renderRoot.querySelector(".terminate")).toBeNull();
    card.renderRoot.querySelector<HTMLElement>(".open-details")?.click();
    await card.updateComplete;
    const dialog = card.renderRoot.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain("Example Movie");
    expect(dialog?.textContent).toContain("Living room TV");
    expect(dialog?.textContent).toContain("2160p");
    expect(dialog?.textContent).toContain("truehd · 7.1 · Atmos");
    expect(dialog?.textContent).toContain("Estimated finish");
    expect(dialog?.textContent).toContain("Terminate stream");
    expect(dialog?.querySelector(".details-heading-line > #details-title")?.textContent).toContain("Example Movie");
    expect(dialog?.querySelector(".details-chips .state")).toBeNull();
  });

  it("shows elapsed pause time only while a stream is paused", async () => {
    vi.useFakeTimers();
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      click_action: "details",
      popup_show_pause_duration: true,
    });
    card.hass = { callWS: vi.fn(), connection: { subscribeMessage: vi.fn().mockResolvedValue(() => undefined) } } as unknown as HomeAssistant;
    document.body.append(card);
    const pausedStream: ActiveStream = {
      ...STREAM,
      state: "paused",
      playback: { ...STREAM.playback, paused_seconds: 125 },
    };
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
    internal._data = { ...ENVELOPE, items: [pausedStream] };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;
    card.renderRoot.querySelector<HTMLElement>(".open-details")?.click();
    await card.updateComplete;

    expect(card.renderRoot.querySelector('[role="dialog"]')?.textContent).toContain("Paused for");
    expect(card.renderRoot.querySelector('[role="dialog"]')?.textContent).toContain("2m 5s");
    expect(card.renderRoot.querySelector(".details-chips .state.paused")).not.toBeNull();
    expect(card.renderRoot.textContent).toContain("2m 5s");

    vi.advanceTimersByTime(3000);
    await card.updateComplete;
    expect(card.renderRoot.querySelector('[role="dialog"]')?.textContent).toContain("2m 8s");
    expect(card.renderRoot.textContent).toContain("2m 8s");

    internal._data = { ...ENVELOPE, items: [{ ...pausedStream, state: "buffering" }] };
    internal.requestUpdate();
    await card.updateComplete;
    expect(card.renderRoot.querySelector(".details-chips .state.buffering")).not.toBeNull();
    expect(card.renderRoot.querySelector(".details-grid")?.textContent).not.toContain("Paused for");
  });

  it("renders stream details in the configured order", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      click_action: "details",
      popup_detail_order: ["bandwidth", "user", "player"],
    });
    card.hass = {
      callWS: vi.fn(),
      connection: { subscribeMessage: vi.fn().mockResolvedValue(() => undefined) },
    } as unknown as HomeAssistant;
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
    internal._data = ENVELOPE;
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;
    card.renderRoot.querySelector<HTMLElement>(".open-details")?.click();
    await card.updateComplete;

    const labels = [...card.renderRoot.querySelectorAll(".details-grid .detail-value small")].map((element) => element.textContent);
    expect(labels.slice(0, 3)).toEqual(["Bandwidth", "Plex user", "Player"]);
  });

  it("renders every selectable media field in the active-stream popup", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      click_action: "details",
      popup_detail_order: ["media_type", "year", "duration", "library", "content_rating", "rating", "audience_rating", "genres", "studio"],
    });
    card.hass = {
      callWS: vi.fn(),
      connection: { subscribeMessage: vi.fn().mockResolvedValue(() => undefined) },
    } as unknown as HomeAssistant;
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
    internal._data = { ...ENVELOPE, items: [DETAILED_STREAM] };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;
    card.renderRoot.querySelector<HTMLElement>(".open-details")?.click();
    await card.updateComplete;

    const detailText = new Map(
      [...card.renderRoot.querySelectorAll(".details-grid .detail-value")].map((element) => [
        element.querySelector("small")?.textContent,
        element.querySelector("span")?.textContent,
      ]),
    );
    expect(detailText.get("Media type")).toBe("movie");
    expect(detailText.get("Year")).toBe("2026");
    expect(detailText.get("Duration")).toBe("2h 0m");
    expect(detailText.get("Library")).toBe("Movies");
    expect(detailText.get("Content rating")).toBe("PG-13");
    expect(detailText.get("Rating")).toBe("8.2");
    expect(detailText.get("Audience rating")).toBe("8.8");
    expect(detailText.get("Genres")).toBe("Drama · Mystery");
    expect(detailText.get("Studio")).toBe("Example Studio");

    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      click_action: "details",
      popup_show_media_type: false,
      popup_show_duration: false,
      popup_show_library: false,
    });
    await card.updateComplete;
    const hiddenLabels = [...card.renderRoot.querySelectorAll(".details-grid .detail-value small")].map((element) => element.textContent);
    expect(hiddenLabels).not.toContain("Media type");
    expect(hiddenLabels).not.toContain("Duration");
    expect(hiddenLabels).not.toContain("Library");
  });

  it("honours media-detail toggles on modern active-stream cards", async () => {
    const renderStream = async (stream: ActiveStream, config: Record<string, unknown>) => {
      const card = document.createElement("tautulli-media-card") as HTMLElement & {
        setConfig(config: Record<string, unknown>): void;
        updateComplete: Promise<boolean>;
        renderRoot: ShadowRoot;
      };
      card.setConfig({
        type: "custom:tautulli-media-card",
        entry_id: "entry-1",
        mode: "active",
        style_preset: "modern",
        ...config,
      });
      document.body.append(card);
      const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
      internal._data = { ...ENVELOPE, items: [stream] };
      internal._loading = false;
      internal.requestUpdate();
      await card.updateComplete;
      return card;
    };

    const movie = await renderStream(DETAILED_STREAM, { show_media_details: true });
    expect(movie.renderRoot.querySelector(".subtitle")?.textContent).toBe("2026");

    const hiddenEpisode = await renderStream(EPISODE_STREAM, { show_media_details: false });
    expect(hiddenEpisode.renderRoot.querySelector(".subtitle")).toBeNull();

    const music = await renderStream(MUSIC_STREAM, { show_quality: false, show_audio_quality: true });
    expect(music.renderRoot.querySelector(".subtitle")?.textContent).toBe("Example Artist — Example Album");
    expect(music.renderRoot.querySelector(".details.optional")?.textContent).toContain("flac");
    expect(music.renderRoot.querySelector(".details.optional")?.textContent).toContain("stereo");
    expect(music.renderRoot.querySelector(".details.optional")?.textContent).toContain("1411 Kbps");
    expect(music.renderRoot.querySelector(".details.optional")?.textContent).toContain("Atmos");

    const hiddenMusicQuality = await renderStream(MUSIC_STREAM, { show_quality: false, show_audio_quality: false });
    expect(hiddenMusicQuality.renderRoot.querySelector(".details.optional")).toBeNull();
  });

  it("shows Atmos with classic video quality", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      style_preset: "classic",
      show_quality: true,
    });
    document.body.append(card);
    const internal = card as unknown as {
      _data: CardEnvelope<ActiveStream>;
      _loading: boolean;
      requestUpdate(): void;
    };
    internal._data = {
      ...ENVELOPE,
      items: [{
        ...STREAM,
        quality: {
          ...STREAM.quality,
          video_resolution: "2160p",
          atmos: true,
        },
      }],
    };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    expect(card.renderRoot.querySelector(".classic-bottom")?.textContent).toContain(
      "direct play — 2160p — Atmos",
    );
  });

  it.each([
    ["year", "2026"],
    ["content_rating", "PG-13"],
    ["rating", "Critic ★ 8.2"],
    ["audience_rating", "Audience ★ 8.8"],
    ["genres", "Drama · Mystery"],
    ["studio", "Example Studio"],
    ["none", null],
  ])("renders the selected %s movie subtitle on modern media cards", async (movieSubtitle, expected) => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "recently_added",
      style_preset: "modern",
      movie_subtitle: movieSubtitle,
    });
    document.body.append(card);
    const internal = card as unknown as {
      _data: CardEnvelope<typeof DETAILED_STREAM.media>;
      _loading: boolean;
      requestUpdate(): void;
    };
    internal._data = { ...ENVELOPE, items: [DETAILED_STREAM.media] };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    const subtitle = card.renderRoot.querySelector(".subtitle");
    if (expected === null) expect(subtitle).toBeNull();
    else expect(subtitle?.textContent).toBe(expected);
  });

  it("keeps automatic movie subtitles backward compatible and avoids a duplicate selected year", async () => {
    const renderMovie = async (movieSubtitle?: string) => {
      const card = document.createElement("tautulli-media-card") as HTMLElement & {
        setConfig(config: Record<string, unknown>): void;
        updateComplete: Promise<boolean>;
        renderRoot: ShadowRoot;
      };
      card.setConfig({
        type: "custom:tautulli-media-card",
        entry_id: "entry-1",
        mode: "recently_added",
        style_preset: "modern",
        ...(movieSubtitle ? { movie_subtitle: movieSubtitle } : {}),
      });
      document.body.append(card);
      const internal = card as unknown as {
        _data: CardEnvelope<typeof DETAILED_STREAM.media>;
        _loading: boolean;
        requestUpdate(): void;
      };
      internal._data = { ...ENVELOPE, items: [DETAILED_STREAM.media] };
      internal._loading = false;
      internal.requestUpdate();
      await card.updateComplete;
      return card;
    };

    const automatic = await renderMovie();
    expect(automatic.renderRoot.querySelector(".subtitle")).toBeNull();
    expect(automatic.renderRoot.querySelector(".meta")?.textContent).toContain("2026");

    const year = await renderMovie("year");
    expect(year.renderRoot.querySelector(".subtitle")?.textContent).toBe("2026");
    expect(year.renderRoot.querySelector(".meta")?.textContent).not.toContain("2026");
  });

  it.each([
    ["rating", "Critic ★ 8.2"],
    ["none", null],
  ])("applies the %s movie subtitle to modern active streams", async (movieSubtitle, expected) => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      style_preset: "modern",
      show_media_details: true,
      movie_subtitle: movieSubtitle,
    });
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
    internal._data = { ...ENVELOPE, items: [DETAILED_STREAM] };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    const subtitle = card.renderRoot.querySelector(".subtitle");
    if (expected === null) expect(subtitle).toBeNull();
    else expect(subtitle?.textContent).toBe(expected);
  });

  it("places media-popup text beside artwork in the responsive hero layout", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "recently_added",
      click_action: "details",
      popup_summary_lines: 2,
      popup_detail_order: ["studio", "media_type", "year"],
    });
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<Record<string, unknown>>; _loading: boolean; requestUpdate(): void };
    internal._data = {
      ...ENVELOPE,
      items: [{
        id: "movie-1",
        type: "movie",
        title: "Example Movie",
        year: 2026,
        summary: "A responsive popup summary.",
        studio: "Example Studio",
        images: { poster_url: "/poster.jpg" },
      }],
    };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;
    card.renderRoot.querySelector<HTMLElement>(".open-details")?.click();
    await card.updateComplete;

    const hero = card.renderRoot.querySelector(".media-summary .details-hero.with-poster");
    expect(hero).not.toBeNull();
    expect(hero?.querySelector(":scope > img.details-media-poster")).not.toBeNull();
    expect(hero?.querySelector(".details-primary #details-title")?.textContent).toBe("Example Movie");
    expect(hero?.querySelector(".details-primary .details-summary")?.textContent).toBe("A responsive popup summary.");
    expect(hero?.querySelector<HTMLElement>(".details-primary .details-summary")?.classList).toContain("compact");
    expect(hero?.querySelector<HTMLElement>(".details-primary .details-summary")?.style.getPropertyValue("--summary-lines")).toBe("2");
    const labels = [...card.renderRoot.querySelectorAll(".details-grid .detail-value small")].map((element) => element.textContent);
    expect(labels.slice(0, 3)).toEqual(["Studio", "Media type", "Year"]);
    expect(cardStyles.cssText).toMatch(/\.details-dialog\s*\{[^}]*container-type:inline-size;/);
    expect(cardStyles.cssText).toMatch(/@container \(max-width: 420px\)\s*\{[\s\S]*?\.details-hero\.with-poster\s*\{\s*grid-template-columns:1fr;/);
  });

  it("orders ranking and history fields with the other popup details and preserves zero values", async () => {
    const render = async (mode: "popular" | "history", item: Record<string, unknown>, order: string[]) => {
      const card = document.createElement("tautulli-media-card") as HTMLElement & {
        setConfig(config: Record<string, unknown>): void;
        updateComplete: Promise<boolean>;
        renderRoot: ShadowRoot;
      };
      card.setConfig({
        type: "custom:tautulli-media-card",
        entry_id: "entry-1",
        mode,
        click_action: "details",
        popup_detail_order: order,
      });
      document.body.append(card);
      const internal = card as unknown as { _data: CardEnvelope<Record<string, unknown>>; _loading: boolean; requestUpdate(): void };
      internal._data = { ...ENVELOPE, items: [item] };
      internal._loading = false;
      internal.requestUpdate();
      await card.updateComplete;
      card.renderRoot.querySelector<HTMLElement>(".open-details")?.click();
      await card.updateComplete;
      return card;
    };

    const popular = await render("popular", {
      rank: 2,
      total_plays: 0,
      media: { id: "movie-1", type: "movie", title: "Example Movie" },
    }, ["plays", "rank"]);
    const popularDetails = [...popular.renderRoot.querySelectorAll(".details-grid .detail-value")];
    expect(popularDetails.slice(0, 2).map((field) => field.querySelector("small")?.textContent)).toEqual(["Plays", "Rank"]);
    expect(popularDetails[0]?.querySelector("span")?.textContent).toBe("0");
    expect(popular.renderRoot.querySelector(".details-section-title")?.textContent).toBe("Ranking details");

    const history = await render("history", {
      started_at: "2026-08-25T20:00:00Z",
      user: { display_name: "Viewer" },
      media: { id: "movie-2", type: "movie", title: "History Movie" },
    }, ["played", "user"]);
    expect([...history.renderRoot.querySelectorAll(".details-grid .detail-value small")].slice(0, 2).map((field) => field.textContent)).toEqual(["Played", "Plex user"]);
  });

  it("omits the popup details heading when every selected value is unavailable", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "recently_added",
      click_action: "details",
      popup_show_media_type: false,
      popup_show_summary: false,
    });
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<Record<string, unknown>>; _loading: boolean; requestUpdate(): void };
    internal._data = { ...ENVELOPE, items: [{ id: "unknown-1", title: "Minimal item" }] };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;
    card.renderRoot.querySelector<HTMLElement>(".open-details")?.click();
    await card.updateComplete;
    expect(card.renderRoot.querySelector(".details-section-title")).toBeNull();
    expect(card.renderRoot.querySelector(".details-grid")).toBeNull();
  });

  it("configures Plex user card information without exposing irrelevant artwork controls", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "users",
      user_card_show_last_active: false,
      user_card_show_watch_time: false,
      user_card_show_completion: false,
      user_card_show_media_breakdown: false,
      user_card_show_favourites: false,
    });
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<Record<string, unknown>>; _loading: boolean; requestUpdate(): void };
    internal._data = {
      ...ENVELOPE,
      items: [{
        id: "user-1",
        display_name: "Viewer",
        last_seen_at: "2026-08-25T20:00:00Z",
        total_plays: 12,
        total_duration_seconds: 3600,
        completion_percent: 80,
        movie_plays: 5,
        tv_plays: 7,
        direct_play_count: 8,
        transcode_count: 4,
        popular_movie: "Favourite Movie",
        most_used_device: "Living Room TV",
      }],
    };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    const user = card.renderRoot.querySelector(".user-item");
    expect(user?.querySelector(".eyebrow")).toBeNull();
    expect(user?.querySelector(".user-stats")?.textContent).toContain("12 plays");
    expect(user?.querySelector(".user-stats")?.textContent).not.toContain("watched");
    expect(user?.querySelector(".user-stats")?.textContent).not.toContain("completion");
    expect(user?.querySelector(".user-breakdown")?.textContent).toContain("8 direct plays");
    expect(user?.querySelector(".user-breakdown")?.textContent).not.toContain("movies");
    expect(user?.textContent).not.toContain("Favourite Movie");
    expect(user?.textContent).toContain("Living Room TV");
  });

  it("renders Plex user popup groups in their configured order", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "users",
      click_action: "details",
      popup_user_detail_order: ["recent_activity", "favourites", "habits", "playback"],
    });
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<Record<string, unknown>>; _loading: boolean; requestUpdate(): void };
    internal._data = {
      ...ENVELOPE,
      items: [{
        id: "user-1",
        display_name: "Viewer",
        total_plays: 12,
        last_seen_at: "2026-08-25T20:00:00Z",
        popular_movie: "Favourite Movie",
        most_used_device: "Living Room TV",
        movie_plays: 5,
      }],
    };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;
    card.renderRoot.querySelector<HTMLElement>(".open-details")?.click();
    await card.updateComplete;
    expect([...card.renderRoot.querySelectorAll(".details-grid .detail-value small")].slice(0, 4).map((field) => field.textContent)).toEqual([
      "Last active",
      "Favourite movie",
      "Most-used player",
      "Movies",
    ]);
  });

  it("controls the summary user independently from the ordered user detail", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      click_action: "details",
      popup_summary_show_user: true,
      popup_show_user: false,
    });
    card.hass = { callWS: vi.fn(), connection: { subscribeMessage: vi.fn().mockResolvedValue(() => undefined) } } as unknown as HomeAssistant;
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
    internal._data = ENVELOPE;
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;
    card.renderRoot.querySelector<HTMLElement>(".open-details")?.click();
    await card.updateComplete;

    expect(card.renderRoot.querySelector(".details-summary-user")?.textContent).toContain("Viewer");
    const labels = [...card.renderRoot.querySelectorAll(".details-grid .detail-value small")].map((element) => element.textContent);
    expect(labels).not.toContain("Plex user");
  });

  it("places an icon-only terminate action beside the popup artwork when configured", async () => {
    const hass = {
      callWS: vi.fn(),
      connection: { subscribeMessage: vi.fn().mockResolvedValue(() => undefined) },
    } as unknown as HomeAssistant;
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      click_action: "details",
      allow_termination: true,
      termination_location: "popup",
      termination_popup_placement: "top",
      termination_button_style: "icon",
    });
    card.hass = hass;
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
    internal._data = ENVELOPE;
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;
    card.renderRoot.querySelector<HTMLElement>(".open-details")?.click();
    await card.updateComplete;

    const action = card.renderRoot.querySelector(".details-top-action .danger");
    expect(action).not.toBeNull();
    expect(action?.classList.contains("icon-only")).toBe(true);
    expect(action?.getAttribute("aria-label")).toBe("Terminate stream");
    expect(card.renderRoot.querySelector(".details-actions")).toBeNull();
  });

  it("keeps stream details behind termination confirmation until cancelled or the stream ends", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      click_action: "details",
      allow_termination: true,
      termination_location: "popup",
    });
    card.hass = { callWS: vi.fn(), connection: { subscribeMessage: vi.fn().mockResolvedValue(() => undefined) } } as unknown as HomeAssistant;
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void; _receive(data: CardEnvelope<ActiveStream>): void };
    internal._data = ENVELOPE;
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;
    card.renderRoot.querySelector<HTMLButtonElement>(".open-details")?.click();
    await card.updateComplete;
    card.renderRoot.querySelector<HTMLButtonElement>(".details-actions .danger")?.click();
    await card.updateComplete;

    expect(card.renderRoot.querySelector('[role="dialog"]')).not.toBeNull();
    expect(card.renderRoot.querySelector('[role="alertdialog"]')).not.toBeNull();
    card.renderRoot.querySelector<HTMLButtonElement>(".dialog-cancel")?.click();
    await card.updateComplete;
    expect(card.renderRoot.querySelector('[role="alertdialog"]')).toBeNull();
    expect(card.renderRoot.querySelector('[role="dialog"]')).not.toBeNull();

    internal._receive({ ...ENVELOPE, items: [] });
    await card.updateComplete;
    expect(card.renderRoot.querySelector('[role="dialog"]')).toBeNull();
  });

  it("groups recent episodes by show without changing the backend payload", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "recently_added",
      recent_grouping: "show",
      show_empty: true,
    });
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<Record<string, unknown>>; _loading: boolean; requestUpdate(): void };
    internal._data = {
      ...ENVELOPE,
      items: [
        { id: "episode-1", type: "episode", title: "Pilot", hierarchy: { show: "Example Show", season_number: 1, episode: 1 } },
        { id: "episode-2", type: "episode", title: "Second", hierarchy: { show: "Example Show", season_number: 1, episode: 2 } },
      ],
    };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    expect(card.renderRoot.querySelectorAll("article.media-item")).toHaveLength(1);
    expect(card.renderRoot.textContent).toContain("2 new episodes");
    expect(card.renderRoot.textContent).toContain("Example Show");
  });

  it.each([
    ["legacy", { show: null, season: "Below Deck Mediterranean", season_number: 1, parent_id: "show-1" }],
    ["corrected", { show: "Below Deck Mediterranean", season: "Season 10", season_number: 10, parent_id: "show-1" }],
  ])("renders the parent show and season label from %s season payloads", async (_payloadType, hierarchy) => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "recently_added",
      recent_grouping: "none",
      click_action: "details",
    });
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<Record<string, unknown>>; _loading: boolean; requestUpdate(): void };
    internal._data = {
      ...ENVELOPE,
      items: [{
        id: "season-10",
        type: "season",
        title: "Season 10",
        full_title: "Season 10",
        hierarchy,
      }],
    };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    expect(card.renderRoot.querySelector(".name")?.textContent).toBe("Below Deck Mediterranean");
    expect(card.renderRoot.querySelector(".subtitle")?.textContent).toBe("Season 10");

    card.renderRoot.querySelector<HTMLElement>(".open-details")?.click();
    await card.updateComplete;
    expect(card.renderRoot.querySelector("#details-title")?.textContent).toBe("Below Deck Mediterranean");
    expect(card.renderRoot.querySelector(".details-subtitle")?.textContent).toBe("Season 10");
  });

  it("groups legacy season payloads by their parent show", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "recently_added",
      recent_grouping: "show",
    });
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<Record<string, unknown>>; _loading: boolean; requestUpdate(): void };
    internal._data = {
      ...ENVELOPE,
      items: [
        { id: "season-9", type: "season", title: "Season 9", hierarchy: { show: null, season: "Example Show", parent_id: "show-1" } },
        { id: "season-10", type: "season", title: "Season 10", hierarchy: { show: null, season: "Example Show", parent_id: "show-1" } },
      ],
    };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    expect(card.renderRoot.querySelectorAll("article.media-item")).toHaveLength(1);
    expect(card.renderRoot.querySelector(".name")?.textContent).toBe("Example Show");
    expect(card.renderRoot.textContent).toContain("2 new episodes");
  });

  it("shows remaining time at the right of the modern cinematic progress bar", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      style_preset: "modern",
      artwork_placement: "background",
      show_progress: true,
      show_remaining: true,
    });
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
    internal._data = ENVELOPE;
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    expect(card.renderRoot.querySelector(".modern-progress-row")).not.toBeNull();
    expect(card.renderRoot.querySelector(".modern-progress-remaining")?.textContent).toContain("remaining");
  });

  it("supports automatic, card-matched and custom TV episode text in popups", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void; _selectedItem?: ActiveStream };
    const openWith = async (config: Record<string, unknown>) => {
      card.setConfig({
        type: "custom:tautulli-media-card",
        entry_id: "entry-1",
        mode: "active",
        click_action: "details",
        ...config,
      });
      internal._data = { ...ENVELOPE, items: [EPISODE_STREAM] };
      internal._loading = false;
      internal._selectedItem = EPISODE_STREAM;
      internal.requestUpdate();
      await card.updateComplete;
    };
    document.body.append(card);

    await openWith({ popup_episode_layout: "automatic" });
    expect(card.renderRoot.querySelector("#details-title")?.textContent).toBe("Example Show — Episode Name");
    expect(card.renderRoot.querySelector(".popup-summary .details-primary > p")?.textContent).toBe("Example Show — S1 · E2");

    await openWith({
      popup_episode_layout: "card",
      episode_layout: "episode_first",
      episode_number_style: "padded",
    });
    expect(card.renderRoot.querySelector("#details-title")?.textContent).toBe("Episode Name");
    expect(card.renderRoot.querySelector(".popup-summary .details-primary > p")?.textContent).toBe("Example Show — S01E02");

    await openWith({
      popup_episode_layout: "custom",
      popup_episode_title: "show",
      popup_episode_subtitle: "number_and_title",
      popup_episode_number_style: "padded",
    });
    expect(card.renderRoot.querySelector("#details-title")?.textContent).toBe("Example Show");
    expect(card.renderRoot.querySelector(".popup-summary .details-primary > p")?.textContent).toBe("S01E02 — Episode Name");
  });

  it("honours every playback information toggle in the modern presentation", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      style_preset: "modern",
      show_state: false,
      show_progress: true,
      show_progress_percent: false,
      show_eta: false,
    });
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
    internal._data = ENVELOPE;
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    expect(card.renderRoot.querySelector(".eyebrow .state")).toBeNull();
    expect(card.renderRoot.querySelector(".modern-progress-percent")).toBeNull();
    expect(card.renderRoot.querySelector(".modern-eta")).toBeNull();

    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      style_preset: "modern",
      show_state: true,
      show_progress: true,
      show_progress_percent: true,
      show_eta: true,
    });
    await card.updateComplete;
    expect(card.renderRoot.querySelector(".eyebrow .state")?.textContent).toContain("playing");
    expect(card.renderRoot.querySelector(".modern-progress-percent")?.textContent).toBe("42%");
    expect(card.renderRoot.querySelector(".modern-eta")?.textContent).toContain("ETA:");

    internal._data = { ...ENVELOPE, items: [{ ...MUSIC_STREAM, media: { ...MUSIC_STREAM.media, hierarchy: { ...MUSIC_STREAM.media.hierarchy, track_number: 4 } } }] };
    internal.requestUpdate();
    await card.updateComplete;
    expect(card.renderRoot.querySelector(".eyebrow .state")?.textContent).toContain("track 4");
  });

  it("renders a foreground poster and a dimmed backdrop when both are selected", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      style_preset: "modern",
      artwork: "both",
    });
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
    internal._data = {
      ...ENVELOPE,
      items: [{
        ...STREAM,
        images: {
          poster_url: "/api/tautulli/image/poster",
          backdrop_url: "/api/tautulli/image/backdrop",
        },
      }],
    };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    const item = card.renderRoot.querySelector<HTMLElement>("article.item");
    expect(item?.classList).toContain("background-art");
    expect(item?.classList).toContain("art-left");
    expect(item?.querySelector<HTMLImageElement>("img.art")?.src).toContain("/api/tautulli/image/poster");
    expect(item?.getAttribute("style")).toContain("/api/tautulli/image/backdrop");
  });

  it.each(["modern", "classic"])("applies custom playback colours directly to %s stream accents", async (stylePreset) => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      style_preset: stylePreset,
      playing_color: "#123456",
      paused_color: "#2468ac",
      buffering_color: "#bada55",
    });
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
    internal._data = ENVELOPE;
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    const selector = stylePreset === "classic" ? "article.classic-item" : "article.item";
    expect(card.style.getPropertyValue("--tas-playing-color")).toBe("#123456");
    expect(card.renderRoot.querySelector<HTMLElement>(selector)?.style.getPropertyValue("--state-color")).toBe("#123456");

    internal._data = { ...ENVELOPE, items: [{ ...STREAM, state: "paused" }] };
    internal.requestUpdate();
    await card.updateComplete;
    expect(card.renderRoot.querySelector<HTMLElement>(selector)?.style.getPropertyValue("--state-color")).toBe("#2468ac");

    internal._data = { ...ENVELOPE, items: [{ ...STREAM, state: "buffering" }] };
    internal.requestUpdate();
    await card.updateComplete;
    expect(card.renderRoot.querySelector<HTMLElement>(selector)?.style.getPropertyValue("--state-color")).toBe("#bada55");
  });

  it("uses the configured state accent in the active-stream popup", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      click_action: "details",
      paused_color: "#2468ac",
    });
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
    internal._data = { ...ENVELOPE, items: [{ ...STREAM, state: "paused" }] };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;
    card.renderRoot.querySelector<HTMLElement>(".open-details")?.click();
    await card.updateComplete;

    expect(card.renderRoot.querySelector<HTMLElement>(".popup-summary")?.style.getPropertyValue("--state-color")).toBe("#2468ac");
  });

  it("preserves the existing modern episode text by default", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({ type: "custom:tautulli-media-card", entry_id: "entry-1", mode: "active", style_preset: "modern" });
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
    internal._data = { ...ENVELOPE, items: [EPISODE_STREAM] };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    expect(card.renderRoot.querySelector(".name")?.textContent).toBe("Example Show — Episode Name");
    expect(card.renderRoot.querySelector(".subtitle")?.textContent).toBe("Example Show — S1 · E2");
  });

  it.each([
    ["show_first", "Example Show", "S01E02 — Episode Name"],
    ["episode_first", "Episode Name", "Example Show — S01E02"],
  ])("renders the %s episode layout with padded numbering", async (episodeLayout, expectedTitle, expectedSubtitle) => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      style_preset: "modern",
      episode_layout: episodeLayout,
      episode_number_style: "padded",
    });
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
    internal._data = { ...ENVELOPE, items: [EPISODE_STREAM] };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    expect(card.renderRoot.querySelector(".name")?.textContent).toBe(expectedTitle);
    expect(card.renderRoot.querySelector(".subtitle")?.textContent).toBe(expectedSubtitle);
  });

  it("supports custom episode text and applies it to the classic presentation", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      style_preset: "classic",
      episode_layout: "custom",
      episode_title: "show",
      episode_subtitle: "show_number_and_title",
      episode_number_style: "padded",
    });
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
    internal._data = { ...ENVELOPE, items: [EPISODE_STREAM] };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    expect(card.renderRoot.querySelector(".classic-title span")?.textContent).toBe("Example Show");
    expect(card.renderRoot.querySelector(".media-detail span")?.textContent).toBe("Example Show — S01E02 — Episode Name");
  });
});

describe("showcase transitions", () => {
  const SECOND_STREAM: ActiveStream = {
    ...STREAM,
    id: "server:session-2",
    session_id: "session-2",
    media: { ...STREAM.media, title: "Second Movie", full_title: "Second Movie" },
  };

  async function createShowcase(
    transition: "fade" | "slide" | "horizontal",
    animations = true,
    transitionDuration = 400,
    direction: "left" | "right" = "left",
  ) {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      style_preset: "modern",
      layout: "showcase",
      showcase_transition: transition,
      showcase_direction: direction,
      showcase_transition_duration: transitionDuration,
      carousel_buttons: true,
      animations,
    });
    document.body.append(card);
    const internal = card as unknown as {
      _data: CardEnvelope<ActiveStream>;
      _loading: boolean;
      _advanceShowcase(step: 1 | -1): void;
      requestUpdate(): void;
    };
    internal._data = { ...ENVELOPE, items: [STREAM, SECOND_STREAM] };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;
    return { card, internal };
  }

  it.each([
    ["fade", "showcase-transition-fade"],
    ["slide", "showcase-transition-slide"],
  ] as const)("renders and advances the %s transition as a single animated item", async (transition, className) => {
    const { card, internal } = await createShowcase(transition);
    const track = card.renderRoot.querySelector<HTMLElement>(".content.showcase");
    expect(track?.classList.contains(className)).toBe(true);
    expect(track?.querySelectorAll(".showcase-slide")).toHaveLength(1);
    expect(track?.querySelector(".name")?.textContent).toBe("Example Movie");
    expect(track?.style.getPropertyValue("--showcase-transition-duration")).toBe("400ms");

    internal._advanceShowcase(1);
    await card.updateComplete;
    expect(track?.querySelector(".name")?.textContent).toBe("Second Movie");
    expect(track?.querySelector(".showcase-slide")?.classList.contains("next")).toBe(true);

    internal._advanceShowcase(-1);
    await card.updateComplete;
    expect(track?.querySelector(".name")?.textContent).toBe("Example Movie");
    expect(track?.querySelector(".showcase-slide")?.classList.contains("previous")).toBe(true);
  });

  it("uses the configured timing and loops the horizontal track backwards from the first item", async () => {
    const { card, internal } = await createShowcase("horizontal", true, 800);
    const track = card.renderRoot.querySelector<HTMLElement>(".content.showcase");
    expect(track?.classList.contains("showcase-transition-horizontal")).toBe(true);
    expect(track?.children).toHaveLength(4);
    expect(track?.querySelector(".showcase-slide")).toBeNull();
    if (!track) return;

    Object.defineProperty(track, "clientWidth", { configurable: true, value: 500 });
    Object.defineProperty(track, "scrollWidth", { configurable: true, value: 2000 });
    track.scrollLeft = 0;
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: false } as MediaQueryList);
    vi.spyOn(performance, "now").mockReturnValue(1000);
    let nextFrame: FrameRequestCallback | undefined;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      nextFrame = callback;
      return 7;
    });

    internal._advanceShowcase(-1);
    expect(track.scrollLeft).toBe(1000);
    expect(track.style.getPropertyValue("--showcase-transition-duration")).toBe("800ms");
    expect(track.style.scrollSnapType).toBe("none");
    expect(nextFrame).toBeTypeOf("function");
    nextFrame?.(1400);
    expect(track.scrollLeft).toBeCloseTo(562.5);
    nextFrame?.(1800);
    expect(track.scrollLeft).toBe(500);
    expect(track.style.scrollSnapType).toBe("");
  });

  it("disables horizontal motion when card animations are disabled", async () => {
    const { card, internal } = await createShowcase("horizontal", false);
    const track = card.renderRoot.querySelector<HTMLElement>(".content.showcase");
    if (!track) return;
    Object.defineProperty(track, "clientWidth", { configurable: true, value: 500 });
    Object.defineProperty(track, "scrollWidth", { configurable: true, value: 2000 });
    const requestFrame = vi.spyOn(window, "requestAnimationFrame");

    internal._advanceShowcase(1);
    expect(track.scrollLeft).toBe(500);
    expect(requestFrame).not.toHaveBeenCalled();
    expect(card.hasAttribute("animations")).toBe(false);
  });

  it("uses the rendered slide width when container padding and fractional columns differ", async () => {
    const { card, internal } = await createShowcase("horizontal", false);
    const track = card.renderRoot.querySelector<HTMLElement>(".content.showcase");
    const firstSlide = track?.firstElementChild as HTMLElement | null;
    const secondSlide = firstSlide?.nextElementSibling as HTMLElement | null;
    if (!track || !firstSlide || !secondSlide) return;
    Object.defineProperty(track, "clientWidth", { configurable: true, value: 500 });
    Object.defineProperty(track, "scrollWidth", { configurable: true, value: 1940 });
    vi.spyOn(firstSlide, "getBoundingClientRect").mockReturnValue({ left: 1, width: 484.5 } as DOMRect);
    vi.spyOn(secondSlide, "getBoundingClientRect").mockReturnValue({ left: 493.5, width: 484.5 } as DOMRect);

    internal._advanceShowcase(1);

    expect(track.scrollLeft).toBe(492.5);
  });

  it("uses the selected direction for automatic horizontal movement", async () => {
    vi.useFakeTimers();
    const { internal } = await createShowcase("horizontal", false, 400, "right");
    const advance = vi.spyOn(internal, "_advanceShowcase");

    vi.advanceTimersByTime(6000);

    expect(advance).toHaveBeenCalledWith(-1);
  });

  it("uses automatic horizontal movement when reduced motion is requested", async () => {
    const { card, internal } = await createShowcase("horizontal");
    const track = card.renderRoot.querySelector<HTMLElement>(".content.showcase");
    if (!track) return;
    Object.defineProperty(track, "clientWidth", { configurable: true, value: 500 });
    Object.defineProperty(track, "scrollWidth", { configurable: true, value: 2000 });
    const requestFrame = vi.spyOn(window, "requestAnimationFrame");
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);

    internal._advanceShowcase(1);
    expect(track.scrollLeft).toBe(500);
    expect(requestFrame).not.toHaveBeenCalled();
    expect(cardStyles.cssText).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("supports swipe release and keyboard arrows for non-horizontal transitions", async () => {
    const { card, internal } = await createShowcase("fade");
    const track = card.renderRoot.querySelector<HTMLElement>(".content.showcase");
    expect(track?.getAttribute("aria-roledescription")).toBe("carousel");
    if (!track) return;

    const gestures = internal as typeof internal & {
      _pointerDownTracker(event: PointerEvent): void;
      _pointerUpClassifier(event: PointerEvent): void;
    };
    gestures._pointerDownTracker({
      clientX: 180,
      clientY: 50,
      composedPath: () => [track],
    } as unknown as PointerEvent);
    gestures._pointerUpClassifier({ clientX: 80, clientY: 54 } as PointerEvent);

    await card.updateComplete;
    expect(track.querySelector(".name")?.textContent).toBe("Second Movie");

    track.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));
    await card.updateComplete;
    expect(track.querySelector(".name")?.textContent).toBe("Example Movie");
  });
});

describe("horizontal row layout", () => {
  it("renders full horizontal cards with snap controls", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      style_preset: "modern",
      layout: "horizontal",
      scroll_gap: 12,
      scroll_peek: 48,
    });
    document.body.append(card);
    const internal = card as unknown as {
      _data: CardEnvelope<ActiveStream>;
      _loading: boolean;
      _scrollCarousel(direction: -1 | 1): void;
      requestUpdate(): void;
    };
    internal._data = {
      ...ENVELOPE,
      items: [STREAM, { ...STREAM, id: "server:session-2", session_id: "session-2" }],
    };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    const row = card.renderRoot.querySelector<HTMLElement>(".content.horizontal");
    expect(row?.children).toHaveLength(2);
    expect(row?.style.getPropertyValue("--scroll-gap")).toBe("12px");
    expect(row?.style.getPropertyValue("--scroll-peek")).toBe("48px");
    expect(card.renderRoot.querySelectorAll(".carousel-controls button")).toHaveLength(2);
    expect(cardStyles.cssText).toContain(".content.horizontal");
    expect(cardStyles.cssText).toContain("padding-inline:1px");
    expect(cardStyles.cssText).toContain("scroll-padding-inline:1px");
    expect(cardStyles.cssText).toContain("scroll-padding-inline:var(--tas-gap, 8px)");
    if (!row) return;

    Object.defineProperty(row, "clientWidth", { configurable: true, value: 600 });
    const scrollBy = vi.fn();
    row.scrollBy = scrollBy;
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: false } as MediaQueryList);
    internal._scrollCarousel(1);
    const scrollOptions = scrollBy.mock.calls[0]?.[0] as ScrollToOptions;
    expect(scrollOptions.left).toBeCloseTo(492);
    expect(scrollOptions.behavior).toBe("smooth");
  });

  it("honours navigation buttons and spacing only in supported shelf layouts", async () => {
    const card = document.createElement("tautulli-media-card") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      layout: "carousel",
      carousel_buttons: false,
      scroll_gap: 19,
    });
    document.body.append(card);
    const internal = card as unknown as { _data: CardEnvelope<ActiveStream>; _loading: boolean; requestUpdate(): void };
    internal._data = { ...ENVELOPE, items: [STREAM, { ...STREAM, id: "server:session-2" }] };
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    expect(card.renderRoot.querySelector(".carousel-controls")).toBeNull();
    expect(card.renderRoot.querySelector<HTMLElement>(".content.carousel")?.style.getPropertyValue("--scroll-gap")).toBe("19px");
    expect(cardStyles.cssText).toContain(".content.carousel { display:flex; gap:var(--scroll-gap, 8px)");

    card.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      layout: "marquee",
      carousel_buttons: true,
    });
    await card.updateComplete;
    expect(card.renderRoot.querySelector(".carousel-controls")).toBeNull();
  });
});
