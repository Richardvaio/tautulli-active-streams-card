/** @vitest-environment happy-dom */

import { afterEach, describe, expect, it, vi } from "vitest";
import "./index";
import type { HomeAssistant } from "./types";

afterEach(() => document.body.replaceChildren());

describe("visual editor", () => {
  it("uses progressive sections and emits compact independent header settings", async () => {
    const callWS = vi.fn().mockImplementation(async (request: Record<string, unknown>) => {
      if (request.type === "tautulli_active_streams/get_entries") {
        return {
          entries: [{
            entry_id: "entry-1",
            name: "Plex",
            capabilities: { recently_added: true, home_stats: true, user_stats: true, history: true, stream_termination: true },
          }],
        };
      }
      return { items: [] };
    });
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({ type: "custom:tautulli-media-card", entry_id: "entry-1", mode: "active", click_action: "details" });
    editor.hass = { callWS, connection: { subscribeMessage: vi.fn() } } as unknown as HomeAssistant;
    document.body.append(editor);
    await editor.updateComplete;

    const summaries = [...editor.renderRoot.querySelectorAll("summary")].map((element) => element.textContent?.trim());
    expect(summaries).toContain("Content and source");
    expect(summaries).toContain("Tap behaviour");
    expect(summaries).toContain("Terminate stream");
    expect(summaries).toContain("Popup layout and appearance");
    expect(summaries).toContain("Popup summary");
    expect(summaries).toContain("Stream details");
    expect(editor.renderRoot.textContent).toContain("Card settings");
    expect(editor.renderRoot.textContent).toContain("Popup settings");
    expect(editor.renderRoot.querySelector('details.section[open]')).toBeNull();
    expect(editor.renderRoot.querySelector<HTMLInputElement>('input[data-key="artwork_width"]')?.value).toBe("85");
    expect(editor.renderRoot.querySelector('input[data-key="title"]')).toBeNull();

    const changes: unknown[] = [];
    editor.addEventListener("config-changed", (event) => changes.push((event as CustomEvent).detail.config));
    const header = editor.renderRoot.querySelector<HTMLInputElement>('input[data-key="show_header"]');
    expect(header).not.toBeNull();
    if (header) {
      header.checked = true;
      header.dispatchEvent(new Event("change", { bubbles: true }));
    }
    expect(changes.at(-1)).toMatchObject({
      type: "custom:tautulli-media-card",
      config_version: 1,
      entry_id: "entry-1",
      show_header: true,
    });
    expect(changes.at(-1)).not.toHaveProperty("show_count");
    await editor.updateComplete;
    expect(editor.renderRoot.querySelector('input[data-key="title"]')).not.toBeNull();
  });

  it("saves and restores the Modern active-stream playback toggles", async () => {
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      style_preset: "modern",
    });
    document.body.append(editor);
    await editor.updateComplete;

    const changes: Array<Record<string, unknown>> = [];
    editor.addEventListener("config-changed", (event) => changes.push((event as CustomEvent).detail.config));
    for (const key of ["show_state", "show_progress_percent", "show_eta"]) {
      const toggle = editor.renderRoot.querySelector<HTMLInputElement>(`input[data-key="${key}"]`);
      expect(toggle?.checked).toBe(true);
      if (toggle) {
        toggle.checked = false;
        toggle.dispatchEvent(new Event("change", { bubbles: true }));
      }
      await editor.updateComplete;
    }

    expect(changes.at(-1)).toMatchObject({
      show_state: false,
      show_progress_percent: false,
      show_eta: false,
    });
    editor.setConfig(changes.at(-1) ?? {});
    await editor.updateComplete;
    for (const key of ["show_state", "show_progress_percent", "show_eta"]) {
      expect(editor.renderRoot.querySelector<HTMLInputElement>(`input[data-key="${key}"]`)?.checked).toBe(false);
    }
  });

  it("saves and restores ETA format and active-stream controls", async () => {
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
    });
    document.body.append(editor);
    await editor.updateComplete;

    const changes: Array<Record<string, unknown>> = [];
    editor.addEventListener("config-changed", (event) => changes.push((event as CustomEvent).detail.config));
    for (const [key, value] of [
      ["eta_time_format", "24"],
      ["playback_state_filter", "paused"],
      ["stream_decision_filter", "transcode"],
      ["sort_by", "bandwidth"],
      ["sort_direction", "descending"],
    ] as const) {
      const select = editor.renderRoot.querySelector<HTMLSelectElement>(`select[data-key="${key}"]`);
      expect(select).not.toBeNull();
      if (select) {
        select.value = value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      await editor.updateComplete;
    }

    expect(changes.at(-1)).toMatchObject({
      eta_time_format: "24",
      playback_state_filter: "paused",
      stream_decision_filter: "transcode",
      sort_by: "bandwidth",
      sort_direction: "descending",
    });
    editor.setConfig(changes.at(-1) ?? {});
    await editor.updateComplete;
    for (const [key, value] of [
      ["eta_time_format", "24"],
      ["playback_state_filter", "paused"],
      ["stream_decision_filter", "transcode"],
      ["sort_by", "bandwidth"],
      ["sort_direction", "descending"],
    ] as const) {
      expect(editor.renderRoot.querySelector<HTMLSelectElement>(`select[data-key="${key}"]`)?.value).toBe(value);
    }
  });

  it("hides every popup setting when the detailed popup is disabled", async () => {
    const callWS = vi.fn().mockResolvedValue({
      entries: [{
        entry_id: "entry-1",
        name: "Plex",
        capabilities: { stream_termination: true },
      }],
      items: [],
    });
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      click_action: "none",
      allow_termination: true,
      termination_location: "popup",
    });
    editor.hass = { callWS, connection: { subscribeMessage: vi.fn() } } as unknown as HomeAssistant;
    document.body.append(editor);
    await editor.updateComplete;

    await vi.waitFor(() => {
      expect(editor.renderRoot.textContent).toContain("terminate button will appear directly on stream cards");
    });

    expect(editor.renderRoot.textContent).not.toContain("Popup settings");
    expect(editor.renderRoot.querySelector('[data-key="popup_width"]')).toBeNull();
    expect(editor.renderRoot.querySelector('[data-key="termination_location"]')).toBeNull();
    expect(editor.renderRoot.querySelector('[data-key="termination_popup_placement"]')).toBeNull();
  });

  it("shows live stream guidance and count in the connection status", async () => {
    let activeCallback: ((data: { items: unknown[] }) => void) | undefined;
    const callWS = vi.fn().mockImplementation(async (request: Record<string, unknown>) => {
      if (request.type === "tautulli_active_streams/get_entries") {
        return {
          entries: [{
            entry_id: "entry-1",
            name: "Primary Plex",
            capabilities: { active_streams: true, active_stream_subscription: true },
          }],
        };
      }
      return { items: [] };
    });
    const subscribeMessage = vi.fn().mockImplementation(async (callback: (data: { items: unknown[] }) => void) => {
      activeCallback = callback;
      callback({ items: [] });
      return () => undefined;
    });
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({ type: "custom:tautulli-media-card", entry_id: "entry-1", mode: "active" });
    editor.hass = { callWS, connection: { subscribeMessage } } as unknown as HomeAssistant;
    document.body.append(editor);

    await vi.waitFor(() => {
      expect(editor.renderRoot.textContent).toContain("No active streams — start playback in Plex");
    });
    expect(editor.renderRoot.querySelector(".compatibility")?.textContent).not.toContain("Primary Plex");
    expect(editor.renderRoot.textContent).not.toContain("Card API schema");

    activeCallback?.({ items: [{}, {}] });
    await vi.waitFor(() => {
      expect(editor.renderRoot.textContent).toContain("2 active streams available in the preview");
    });
  });

  it("shows the selected server name only when multiple servers are configured", async () => {
    const callWS = vi.fn().mockImplementation(async (request: Record<string, unknown>) => {
      if (request.type === "tautulli_active_streams/get_entries") {
        return {
          entries: [
            { entry_id: "entry-1", name: "Living Room Plex", capabilities: { active_streams: true } },
            { entry_id: "entry-2", name: "Family Plex", capabilities: { active_streams: true } },
          ],
        };
      }
      return { items: [] };
    });
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({ type: "custom:tautulli-media-card", entry_id: "entry-1", mode: "active" });
    editor.hass = {
      callWS,
      connection: { subscribeMessage: vi.fn().mockResolvedValue(() => undefined) },
    } as unknown as HomeAssistant;
    document.body.append(editor);

    await vi.waitFor(() => {
      expect(editor.renderRoot.querySelector(".compatibility")?.textContent).toContain("Living Room Plex");
    });
    expect(editor.renderRoot.querySelector(".compatibility")?.textContent).not.toContain("Family Plex");
  });

  it("preserves popup and layout select values when the editor is reopened", async () => {
    const callWS = vi.fn().mockResolvedValue({ entries: [], items: [] });
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      click_action: "details",
      popup_width: "wide",
      popup_summary_lines: 5,
      popup_style: "cinematic",
      popup_content_style: "panel",
      popup_episode_layout: "custom",
      popup_episode_title: "show",
      popup_episode_subtitle: "number_and_title",
      popup_episode_number_style: "padded",
      layout: "carousel",
    });
    editor.hass = { callWS, connection: { subscribeMessage: vi.fn() } } as unknown as HomeAssistant;
    document.body.append(editor);
    await editor.updateComplete;

    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="popup_width"]')?.value).toBe("wide");
    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="popup_summary_lines"]')?.value).toBe("5");
    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="popup_style"]')?.value).toBe("cinematic");
    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="popup_content_style"]')?.value).toBe("panel");
    expect(editor.renderRoot.querySelector<HTMLInputElement>('input[data-key="popup_animation_duration"]')?.type).toBe("range");
    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="popup_episode_layout"]')?.value).toBe("custom");
    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="popup_episode_title"]')?.value).toBe("show");
    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="popup_episode_subtitle"]')?.value).toBe("number_and_title");
    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="popup_episode_number_style"]')?.value).toBe("padded");
    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="layout"]')?.value).toBe("carousel");
    expect(editor.renderRoot.querySelector<HTMLInputElement>('input[data-key="carousel_buttons"]')?.checked).toBe(true);
  });

  it("saves and restores every showcase transition and its timing", async () => {
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "active",
      layout: "showcase",
      showcase_transition: "horizontal",
      showcase_direction: "right",
      showcase_transition_duration: 725,
    });
    editor.hass = {
      callWS: vi.fn().mockResolvedValue({ entries: [], items: [] }),
      connection: { subscribeMessage: vi.fn() },
    } as unknown as HomeAssistant;
    document.body.append(editor);
    await editor.updateComplete;

    const select = editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="showcase_transition"]');
    const direction = editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="showcase_direction"]');
    const duration = editor.renderRoot.querySelector<HTMLInputElement>('input[data-key="showcase_transition_duration"]');
    expect(select?.value).toBe("horizontal");
    expect(direction?.value).toBe("right");
    expect([...select?.options ?? []].map((option) => option.value)).toEqual(["fade", "slide", "horizontal"]);
    expect(duration?.type).toBe("range");
    expect(duration?.value).toBe("725");

    const changes: Array<Record<string, unknown>> = [];
    editor.addEventListener("config-changed", (event) => changes.push((event as CustomEvent).detail.config));
    if (direction) {
      direction.value = "left";
      direction.dispatchEvent(new Event("change", { bubbles: true }));
    }
    expect(changes.at(-1)?.showcase_direction).toBeUndefined();
    if (duration) {
      duration.value = "900";
      duration.dispatchEvent(new Event("input", { bubbles: true }));
    }
    expect(changes.at(-1)?.showcase_transition_duration).toBe(900);
    if (select) {
      select.value = "slide";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    expect(changes.at(-1)?.showcase_transition).toBe("slide");
    editor.setConfig(changes.at(-1) ?? {});
    await editor.updateComplete;
    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="showcase_transition"]')?.value).toBe("slide");
    expect(editor.renderRoot.querySelector<HTMLInputElement>('input[data-key="showcase_transition_duration"]')?.value).toBe("900");
  });

  it("shows only artwork controls relevant to the selected display", async () => {
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.hass = {
      callWS: vi.fn().mockResolvedValue({ entries: [], items: [] }),
      connection: { subscribeMessage: vi.fn() },
    } as unknown as HomeAssistant;
    document.body.append(editor);

    editor.setConfig({ type: "custom:tautulli-media-card", mode: "active", artwork: "both" });
    await editor.updateComplete;
    expect(editor.renderRoot.querySelector('select[data-key="artwork_aspect"]')).not.toBeNull();
    expect(editor.renderRoot.querySelector('select[data-key="artwork_fit"]')).not.toBeNull();
    expect(editor.renderRoot.querySelector('input[data-key="backdrop_opacity"]')).not.toBeNull();
    expect(editor.renderRoot.querySelector('select[data-key="artwork_placement"]')).not.toBeNull();

    editor.setConfig({ type: "custom:tautulli-media-card", mode: "active", artwork: "backdrop" });
    await editor.updateComplete;
    expect(editor.renderRoot.querySelector('select[data-key="artwork_aspect"]')).toBeNull();
    expect(editor.renderRoot.querySelector('select[data-key="artwork_fit"]')).toBeNull();
    expect(editor.renderRoot.querySelector('select[data-key="artwork_placement"]')).toBeNull();
    expect(editor.renderRoot.querySelector('input[data-key="artwork_width"]')).toBeNull();
    expect(editor.renderRoot.querySelector('input[data-key="backdrop_opacity"]')).not.toBeNull();
  });

  it("restores poster placement after temporarily selecting backdrop-only artwork", async () => {
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({
      type: "custom:tautulli-media-card",
      mode: "active",
      artwork: "both",
      artwork_placement: "right",
    });
    document.body.append(editor);
    await editor.updateComplete;
    const changes: Array<Record<string, unknown>> = [];
    editor.addEventListener("config-changed", (event) => changes.push((event as CustomEvent).detail.config));

    const artwork = editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="artwork"]');
    if (artwork) {
      artwork.value = "backdrop";
      artwork.dispatchEvent(new Event("change", { bubbles: true }));
    }
    await editor.updateComplete;
    expect(changes.at(-1)).toMatchObject({ artwork: "backdrop", artwork_placement: "background" });

    const backdropArtwork = editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="artwork"]');
    if (backdropArtwork) {
      backdropArtwork.value = "poster";
      backdropArtwork.dispatchEvent(new Event("change", { bubbles: true }));
    }
    await editor.updateComplete;
    expect(changes.at(-1)).toMatchObject({ artwork_placement: "right" });
    expect(changes.at(-1)).not.toHaveProperty("artwork");
  });

  it("does not save recipe settings that are invisible in the selected view", async () => {
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({ type: "custom:tautulli-media-card", mode: "users" });
    document.body.append(editor);
    await editor.updateComplete;
    const changes: Array<Record<string, unknown>> = [];
    editor.addEventListener("config-changed", (event) => changes.push((event as CustomEvent).detail.config));
    editor.renderRoot.querySelector<HTMLButtonElement>("button.recipe.cinematic")?.click();
    await editor.updateComplete;
    expect(changes.at(-1)).not.toHaveProperty("artwork");
    expect(changes.at(-1)).not.toHaveProperty("show_summary");
    expect(changes.at(-1)).toMatchObject({ layout: "list", density: "detailed" });
  });

  it("saves and restores custom playback colours from the visual editor", async () => {
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({ type: "custom:tautulli-media-card", entry_id: "entry-1", mode: "active" });
    editor.hass = {
      callWS: vi.fn().mockResolvedValue({ entries: [], items: [] }),
      connection: { subscribeMessage: vi.fn() },
    } as unknown as HomeAssistant;
    document.body.append(editor);
    await editor.updateComplete;

    const changes: Array<Record<string, unknown>> = [];
    editor.addEventListener("config-changed", (event) => changes.push((event as CustomEvent).detail.config));
    const picker = editor.renderRoot.querySelector<HTMLInputElement>('input[title="Choose paused colour"]');
    expect(picker).not.toBeNull();
    if (picker) {
      picker.value = "#2468ac";
      picker.dispatchEvent(new Event("input", { bubbles: true }));
    }
    await editor.updateComplete;

    expect(changes.at(-1)?.paused_color).toBe("#2468ac");
    editor.setConfig(changes.at(-1) ?? {});
    await editor.updateComplete;
    expect(editor.renderRoot.querySelector<HTMLInputElement>('input[data-key="paused_color"]')?.value).toBe("#2468ac");
  });

  it("provides intuitive episode layouts with conditional custom controls and a live example", async () => {
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.hass = {
      callWS: vi.fn().mockResolvedValue({ entries: [], items: [] }),
      connection: { subscribeMessage: vi.fn() },
    } as unknown as HomeAssistant;
    document.body.append(editor);

    editor.setConfig({
      type: "custom:tautulli-media-card",
      mode: "active",
      media_type: "video",
      episode_layout: "show_first",
      episode_number_style: "padded",
    });
    await editor.updateComplete;
    expect(editor.renderRoot.textContent).toContain("TV episode text");
    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="episode_layout"]')?.value).toBe("show_first");
    expect(editor.renderRoot.querySelector(".episode-preview strong")?.textContent).toBe("Example Show");
    expect(editor.renderRoot.querySelector(".episode-preview span")?.textContent).toBe("S01E02 — Episode Name");
    expect(editor.renderRoot.querySelector('select[data-key="episode_title"]')).toBeNull();

    editor.setConfig({
      type: "custom:tautulli-media-card",
      mode: "active",
      media_type: "video",
      episode_layout: "custom",
      episode_title: "episode_title",
      episode_subtitle: "none",
      episode_number_style: "padded",
    });
    await editor.updateComplete;
    expect(editor.renderRoot.querySelector('select[data-key="episode_title"]')).not.toBeNull();
    expect(editor.renderRoot.querySelector('select[data-key="episode_subtitle"]')).not.toBeNull();
    expect(editor.renderRoot.querySelector('select[data-key="episode_number_style"]')).toBeNull();
    expect(editor.renderRoot.querySelector(".episode-preview strong")?.textContent).toBe("Episode Name");
    expect(editor.renderRoot.querySelector(".episode-preview span")).toBeNull();

    editor.setConfig({ type: "custom:tautulli-media-card", mode: "active", media_type: "music" });
    await editor.updateComplete;
    expect(editor.renderRoot.textContent).not.toContain("TV episode text");
  });

  it("restores and saves the selected movie subtitle source", async () => {
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.hass = {
      callWS: vi.fn().mockResolvedValue({ entries: [], items: [] }),
      connection: { subscribeMessage: vi.fn() },
    } as unknown as HomeAssistant;
    editor.setConfig({
      type: "custom:tautulli-media-card",
      mode: "recently_added",
      media_type: "movie",
      movie_subtitle: "studio",
    });
    document.body.append(editor);
    await editor.updateComplete;

    const select = editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="movie_subtitle"]');
    expect(editor.renderRoot.textContent).toContain("Movie text");
    expect(select?.value).toBe("studio");
    expect([...select?.options ?? []].map((option) => option.textContent)).toEqual(expect.arrayContaining([
      "Release year",
      "Critic rating",
      "Audience rating",
      "Genres",
      "Studio",
      "Hidden",
    ]));

    const changes: Array<{ movie_subtitle?: string }> = [];
    editor.addEventListener("config-changed", (event) => changes.push((event as CustomEvent).detail.config));
    if (select) {
      select.value = "genres";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    expect(changes.at(-1)?.movie_subtitle).toBe("genres");

    editor.setConfig(changes.at(-1) ?? {});
    await editor.updateComplete;
    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="movie_subtitle"]')?.value).toBe("genres");
  });

  it("renders draggable stream fields and saves their reordered position", async () => {
    const callWS = vi.fn().mockImplementation(async (request: Record<string, unknown>) => request.type === "tautulli_active_streams/get_entries"
      ? { entries: [{ entry_id: "entry-1", name: "Plex", capabilities: { active_streams: true } }] }
      : { items: [] });
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({ type: "custom:tautulli-media-card", entry_id: "entry-1", mode: "active", click_action: "details" });
    editor.hass = { callWS, connection: { subscribeMessage: vi.fn() } } as unknown as HomeAssistant;
    document.body.append(editor);
    await editor.updateComplete;

    expect(editor.renderRoot.querySelectorAll('.drag-handle[draggable="true"]')).toHaveLength(19);
    expect(editor.renderRoot.querySelector('input[data-key="popup_summary_show_user"]')).not.toBeNull();
    expect(editor.renderRoot.querySelector('.detail-order-row input[data-key="popup_show_user"]')).not.toBeNull();
    for (const field of ["media_type", "duration", "library"]) {
      expect(editor.renderRoot.querySelector(`.detail-order-row[data-detail-field="${field}"]`)).not.toBeNull();
    }
    for (const key of ["popup_show_year", "popup_show_content_rating", "popup_show_rating", "popup_show_audience_rating", "popup_show_genres", "popup_show_studio"]) {
      expect(editor.renderRoot.querySelectorAll(`input[data-key="${key}"]`), `${key} should appear once`).toHaveLength(1);
    }
    const dragHandle = editor.renderRoot.querySelector<HTMLElement>('.detail-order-row[data-detail-field="user"] .drag-handle');
    const targetRow = editor.renderRoot.querySelector<HTMLElement>('.detail-order-row[data-detail-field="device"]');
    const dataTransfer = {
      effectAllowed: "none",
      dropEffect: "none",
      setData: vi.fn(),
      getData: vi.fn().mockReturnValue("user"),
      setDragImage: vi.fn(),
    };
    const dragStart = new Event("dragstart", { bubbles: true });
    Object.defineProperty(dragStart, "dataTransfer", { value: dataTransfer });
    dragHandle?.dispatchEvent(dragStart);
    await editor.updateComplete;

    expect(editor.renderRoot.querySelector('.detail-order-row[data-detail-field="user"]')?.classList).toContain("dragging");
    expect(dataTransfer.setDragImage).toHaveBeenCalled();

    const dragOver = new Event("dragover", { bubbles: true, cancelable: true });
    Object.defineProperty(dragOver, "dataTransfer", { value: dataTransfer });
    targetRow?.dispatchEvent(dragOver);
    await editor.updateComplete;
    expect(editor.renderRoot.querySelectorAll(".detail-order-row.dragging")).toHaveLength(1);
    expect(editor.renderRoot.querySelector('.detail-order-row[data-detail-field="user"]')?.classList).toContain("dragging");
    expect(editor.renderRoot.querySelector('.detail-order-row[data-detail-field="device"]')?.classList).not.toContain("dragging");
    expect([...editor.renderRoot.querySelectorAll<HTMLElement>(".detail-order-row")].slice(0, 3).map((row) => row.dataset.detailField)).toEqual(["player", "device", "user"]);

    dragHandle?.dispatchEvent(new Event("dragend", { bubbles: true }));
    await editor.updateComplete;
    expect(editor.renderRoot.querySelector(".detail-order-row.dragging")).toBeNull();
    expect([...editor.renderRoot.querySelectorAll<HTMLElement>(".detail-order-row")].slice(0, 3).map((row) => row.dataset.detailField)).toEqual(["user", "player", "device"]);

    const changes: Array<{ popup_detail_order?: string[]; popup_show_duration?: boolean }> = [];
    editor.addEventListener("config-changed", (event) => changes.push((event as CustomEvent).detail.config));

    const durationToggle = editor.renderRoot.querySelector<HTMLInputElement>('.detail-order-row input[data-key="popup_show_duration"]');
    expect(durationToggle?.checked).toBe(true);
    if (durationToggle) {
      durationToggle.checked = false;
      durationToggle.dispatchEvent(new Event("change", { bubbles: true }));
    }
    expect(changes.at(-1)?.popup_show_duration).toBe(false);
    editor.setConfig(changes.at(-1) ?? {});
    await editor.updateComplete;
    expect(editor.renderRoot.querySelector<HTMLInputElement>('.detail-order-row input[data-key="popup_show_duration"]')?.checked).toBe(false);

    editor.renderRoot.querySelector<HTMLButtonElement>('button[aria-label="Move Plex user down"]')?.click();
    await editor.updateComplete;

    expect(changes.at(-1)?.popup_detail_order?.slice(0, 2)).toEqual(["player", "user"]);
    const rows = [...editor.renderRoot.querySelectorAll<HTMLElement>(".detail-order-row")];
    expect(rows.slice(0, 2).map((row) => row.dataset.detailField)).toEqual(["player", "user"]);
  });

  it("uses the same sortable detail controls for media popups", async () => {
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "recently_added",
      click_action: "details",
      popup_detail_order: ["studio", "media_type", "year"],
    });
    editor.hass = {
      callWS: vi.fn().mockResolvedValue({ entries: [], items: [] }),
      connection: { subscribeMessage: vi.fn() },
    } as unknown as HomeAssistant;
    document.body.append(editor);
    await editor.updateComplete;

    const rows = [...editor.renderRoot.querySelectorAll<HTMLElement>(".detail-order-row")];
    expect(rows).toHaveLength(9);
    expect(rows.slice(0, 3).map((row) => row.dataset.detailField)).toEqual(["studio", "media_type", "year"]);
    expect(editor.renderRoot.querySelector('.detail-order-row[data-detail-field="player"]')).toBeNull();
    expect(editor.renderRoot.querySelectorAll('input[data-key="popup_show_year"]')).toHaveLength(1);

    const changes: Array<{ popup_detail_order?: string[] }> = [];
    editor.addEventListener("config-changed", (event) => changes.push((event as CustomEvent).detail.config));
    editor.renderRoot.querySelector<HTMLButtonElement>('button[aria-label="Move Studio down"]')?.click();
    await editor.updateComplete;
    expect(changes.at(-1)?.popup_detail_order?.filter((field) => ["studio", "media_type", "year"].includes(field)).slice(0, 3)).toEqual(["media_type", "studio", "year"]);
  });

  it("includes view-specific ranking and history fields in the sortable popup list", async () => {
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    document.body.append(editor);

    editor.setConfig({ type: "custom:tautulli-media-card", mode: "popular", click_action: "details" });
    await editor.updateComplete;
    expect(editor.renderRoot.querySelector('.detail-order-row[data-detail-field="rank"]')).not.toBeNull();
    expect(editor.renderRoot.querySelector('.detail-order-row[data-detail-field="plays"]')).not.toBeNull();
    expect(editor.renderRoot.querySelector('.detail-order-row[data-detail-field="user"]')).toBeNull();

    editor.setConfig({ type: "custom:tautulli-media-card", mode: "history", click_action: "details" });
    await editor.updateComplete;
    expect(editor.renderRoot.querySelector('.detail-order-row[data-detail-field="user"]')).not.toBeNull();
    expect(editor.renderRoot.querySelector('.detail-order-row[data-detail-field="played"]')).not.toBeNull();
    expect(editor.renderRoot.querySelectorAll('input[data-key="popup_show_user"]')).toHaveLength(1);
    const popupSummary = [...editor.renderRoot.querySelectorAll("details.section")]
      .find((section) => section.querySelector(":scope > summary")?.textContent?.trim() === "Popup summary");
    expect(popupSummary?.querySelector('input[data-key="popup_show_user"]')).toBeNull();
  });

  it("hides empty media and popup controls in the user activity view", async () => {
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({
      type: "custom:tautulli-media-card",
      mode: "users",
      click_action: "details",
      popup_style: "cinematic",
    });
    document.body.append(editor);
    await editor.updateComplete;

    const summaries = [...editor.renderRoot.querySelectorAll("details.section > summary")].map((summary) => summary.textContent?.trim());
    expect(summaries).not.toContain("Card information");
    expect(summaries).not.toContain("Popup summary");
    expect(editor.renderRoot.querySelector('[data-key="artwork"]')).toBeNull();
    expect(editor.renderRoot.querySelector('[data-key="artwork_width"]')).toBeNull();
    expect(editor.renderRoot.querySelector('[data-key="popup_cinematic_art"]')).toBeNull();
    expect(editor.renderRoot.querySelectorAll(".detail-order-row")).toHaveLength(4);
    expect([...editor.renderRoot.querySelectorAll<HTMLElement>(".detail-order-row")].map((row) => row.dataset.detailField)).toEqual([
      "playback",
      "favourites",
      "habits",
      "recent_activity",
    ]);
    const changes: Array<{ popup_user_detail_order?: string[] }> = [];
    editor.addEventListener("config-changed", (event) => changes.push((event as CustomEvent).detail.config));
    editor.renderRoot.querySelector<HTMLButtonElement>('button[aria-label="Move Playback breakdown down"]')?.click();
    await editor.updateComplete;
    expect(changes.at(-1)?.popup_user_detail_order?.slice(0, 2)).toEqual(["favourites", "playback"]);
  });

  it("translates incompatible media filters when the view changes", async () => {
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({ type: "custom:tautulli-media-card", mode: "recently_added", media_type: "movie" });
    document.body.append(editor);
    await editor.updateComplete;

    const changes: Array<Record<string, unknown>> = [];
    editor.addEventListener("config-changed", (event) => changes.push((event as CustomEvent).detail.config));
    const view = editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="mode"]');
    expect(view?.value).toBe("recently_added");
    if (view) {
      view.value = "active";
      view.dispatchEvent(new Event("change", { bubbles: true }));
    }
    await editor.updateComplete;
    expect(changes.at(-1)).toMatchObject({ media_type: "video" });
    expect(changes.at(-1)).not.toHaveProperty("mode");
    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="media_type"]')?.value).toBe("video");

    editor.setConfig({ type: "custom:tautulli-media-card", mode: "active", media_type: "music" });
    await editor.updateComplete;
    const activeView = editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="mode"]');
    if (activeView) {
      activeView.value = "recently_added";
      activeView.dispatchEvent(new Event("change", { bubbles: true }));
    }
    await editor.updateComplete;
    expect(changes.at(-1)).toMatchObject({ mode: "recently_added", media_type: "artist" });
    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="media_type"]')?.value).toBe("artist");
  });

  it("keeps group headings after dependent editor rerenders", async () => {
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({ type: "custom:tautulli-media-card", mode: "active", click_action: "none" });
    document.body.append(editor);
    await editor.updateComplete;
    expect(editor.renderRoot.textContent).toContain("Card settings");

    const header = editor.renderRoot.querySelector<HTMLInputElement>('input[data-key="show_header"]');
    if (header) {
      header.checked = true;
      header.dispatchEvent(new Event("change", { bubbles: true }));
    }
    await editor.updateComplete;
    expect(editor.renderRoot.textContent).toContain("Card settings");
  });

  it("restores toggle-slider values and omits empty unit punctuation", async () => {
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({
      type: "custom:tautulli-media-card",
      mode: "active",
      click_action: "details",
      popup_style: "cinematic",
      popup_cinematic_art: 45,
    });
    document.body.append(editor);
    await editor.updateComplete;

    const cinematicControl = [...editor.renderRoot.querySelectorAll<HTMLElement>(".toggle-number")]
      .find((element) => element.textContent?.includes("Backdrop art strength"));
    const enabled = cinematicControl?.querySelector<HTMLInputElement>('input[type="checkbox"]');
    expect(enabled?.checked).toBe(true);
    if (enabled) {
      enabled.checked = false;
      enabled.dispatchEvent(new Event("change", { bubbles: true }));
    }
    await editor.updateComplete;
    const disabledControl = [...editor.renderRoot.querySelectorAll<HTMLElement>(".toggle-number")]
      .find((element) => element.textContent?.includes("Backdrop art strength"));
    const disabledToggle = disabledControl?.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (disabledToggle) {
      disabledToggle.checked = true;
      disabledToggle.dispatchEvent(new Event("change", { bubbles: true }));
    }
    await editor.updateComplete;
    expect(editor.renderRoot.querySelector<HTMLInputElement>('input[data-key="popup_cinematic_art"]')?.value).toBe("45");

    const maximum = editor.renderRoot.querySelector<HTMLInputElement>('input[data-key="max_items"]')?.closest("label");
    expect(maximum?.textContent).toContain("Maximum active streams");
    expect(maximum?.textContent).not.toContain("()");
  });

  it("clears server-specific filters and falls back from unsupported views", async () => {
    const callWS = vi.fn().mockImplementation(async (request: Record<string, unknown>) => {
      if (request.type === "tautulli_active_streams/get_entries") {
        return {
          entries: [
            { entry_id: "entry-1", name: "First", capabilities: { active_streams: true, history: true } },
            { entry_id: "entry-2", name: "Second", capabilities: { active_streams: true, history: false } },
          ],
        };
      }
      return { items: [] };
    });
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({
      type: "custom:tautulli-media-card",
      entry_id: "entry-1",
      mode: "history",
      section_id: "7",
      user_id: "42",
    });
    editor.hass = { callWS, connection: { subscribeMessage: vi.fn() } } as unknown as HomeAssistant;
    document.body.append(editor);
    await vi.waitFor(() => expect(editor.renderRoot.querySelectorAll('select[data-key="entry_id"] option')).toHaveLength(2));

    const changes: Array<Record<string, unknown>> = [];
    editor.addEventListener("config-changed", (event) => changes.push((event as CustomEvent).detail.config));
    const server = editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="entry_id"]');
    if (server) {
      server.value = "entry-2";
      server.dispatchEvent(new Event("change", { bubbles: true }));
    }
    await editor.updateComplete;
    expect(changes.at(-1)).toMatchObject({ entry_id: "entry-2" });
    expect(changes.at(-1)).not.toHaveProperty("mode");
    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="mode"]')?.value).toBe("active");
    expect(changes.at(-1)).not.toHaveProperty("section_id");
    expect(changes.at(-1)).not.toHaveProperty("user_id");
  });

  it("does not subscribe to active streams while editing another view", async () => {
    const subscribeMessage = vi.fn();
    const callWS = vi.fn().mockImplementation(async (request: Record<string, unknown>) => request.type === "tautulli_active_streams/get_entries"
      ? { entries: [{ entry_id: "entry-1", name: "Plex", capabilities: { active_streams: true, user_stats: true } }] }
      : { items: [] });
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
    };
    editor.setConfig({ type: "custom:tautulli-media-card", entry_id: "entry-1", mode: "users" });
    editor.hass = { callWS, connection: { subscribeMessage } } as unknown as HomeAssistant;
    document.body.append(editor);
    await vi.waitFor(() => expect(callWS).toHaveBeenCalledWith({ type: "tautulli_active_streams/get_entries" }));
    expect(subscribeMessage).not.toHaveBeenCalled();
  });

  it("ignores late library and user results from the previously selected server", async () => {
    const deferred = <T,>() => {
      let resolve!: (value: T) => void;
      const promise = new Promise<T>((done) => { resolve = done; });
      return { promise, resolve };
    };
    const firstLibraries = deferred<{ items: Array<{ section_id: string; name: string; type: string }> }>();
    const firstUsers = deferred<{ items: Array<{ user_id: string; display_name: string }> }>();
    const secondLibraries = deferred<{ items: Array<{ section_id: string; name: string; type: string }> }>();
    const secondUsers = deferred<{ items: Array<{ user_id: string; display_name: string }> }>();
    const callWS = vi.fn().mockImplementation((request: Record<string, unknown>) => {
      if (request.type === "tautulli_active_streams/get_entries") {
        return Promise.resolve({ entries: [
          { entry_id: "entry-1", name: "First", capabilities: { active_streams: true, recently_added: true } },
          { entry_id: "entry-2", name: "Second", capabilities: { active_streams: true, recently_added: true } },
        ] });
      }
      if (request.type === "tautulli_active_streams/get_libraries") return request.entry_id === "entry-1" ? firstLibraries.promise : secondLibraries.promise;
      if (request.type === "tautulli_active_streams/get_users") return request.entry_id === "entry-1" ? firstUsers.promise : secondUsers.promise;
      return Promise.resolve({ items: [] });
    });
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      updateComplete: Promise<boolean>;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({ type: "custom:tautulli-media-card", entry_id: "entry-1", mode: "recently_added" });
    editor.hass = { callWS, connection: { subscribeMessage: vi.fn() } } as unknown as HomeAssistant;
    document.body.append(editor);
    await vi.waitFor(() => expect(editor.renderRoot.querySelectorAll('select[data-key="entry_id"] option')).toHaveLength(2));

    const server = editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="entry_id"]');
    if (server) {
      server.value = "entry-2";
      server.dispatchEvent(new Event("change", { bubbles: true }));
    }
    secondLibraries.resolve({ items: [{ section_id: "2", name: "Second Movies", type: "movie" }] });
    secondUsers.resolve({ items: [{ user_id: "2", display_name: "Second User" }] });
    await vi.waitFor(() => expect(editor.renderRoot.querySelector('select[data-key="section_id"]')?.textContent).toContain("Second Movies"));

    firstLibraries.resolve({ items: [{ section_id: "1", name: "Old Movies", type: "movie" }] });
    firstUsers.resolve({ items: [{ user_id: "1", display_name: "Old User" }] });
    await Promise.resolve();
    await editor.updateComplete;
    expect(editor.renderRoot.querySelector('select[data-key="section_id"]')?.textContent).toContain("Second Movies");
    expect(editor.renderRoot.querySelector('select[data-key="section_id"]')?.textContent).not.toContain("Old Movies");
  });

  it("shows actionable guidance when no integration is available", async () => {
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({ type: "custom:tautulli-media-card", mode: "active" });
    editor.hass = {
      callWS: vi.fn().mockResolvedValue({ entries: [] }),
      connection: { subscribeMessage: vi.fn() },
    } as unknown as HomeAssistant;
    document.body.append(editor);
    await vi.waitFor(() => expect(editor.renderRoot.textContent).toContain("No Tautulli Active Streams integration was found"));
    expect(editor.renderRoot.textContent).not.toContain("[object Object]");
  });

  it("keeps the editor usable when the live preview subscription is unavailable", async () => {
    const editor = document.createElement("tautulli-media-card-editor") as HTMLElement & {
      hass: HomeAssistant;
      setConfig(config: Record<string, unknown>): void;
      renderRoot: ShadowRoot;
    };
    editor.setConfig({ type: "custom:tautulli-media-card", entry_id: "entry-1", mode: "active" });
    editor.hass = {
      callWS: vi.fn().mockImplementation(async (request: Record<string, unknown>) => request.type === "tautulli_active_streams/get_entries"
        ? { entries: [{ entry_id: "entry-1", name: "Plex", capabilities: { active_streams: true } }] }
        : { items: [] }),
      connection: { subscribeMessage: vi.fn().mockRejectedValue(new Error("integration_unavailable")) },
    } as unknown as HomeAssistant;
    document.body.append(editor);
    await vi.waitFor(() => expect(editor.renderRoot.textContent).toContain("Live preview unavailable — card settings can still be edited"));
    expect(editor.renderRoot.textContent).toContain("Content and source");
  });
});
