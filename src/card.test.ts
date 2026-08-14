/** @vitest-environment happy-dom */

import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";
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
    internal._data = ENVELOPE;
    internal._loading = false;
    internal.requestUpdate();
    await card.updateComplete;

    expect(card.renderRoot.querySelector(".terminate")).toBeNull();
    card.renderRoot.querySelector<HTMLElement>(".open-details")?.click();
    await card.updateComplete;
    const dialog = card.renderRoot.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain("Example Movie");
    expect(dialog?.textContent).toContain("Living room TV");
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
});
