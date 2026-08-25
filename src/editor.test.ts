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
      layout: "carousel",
    });
    editor.hass = { callWS, connection: { subscribeMessage: vi.fn() } } as unknown as HomeAssistant;
    document.body.append(editor);
    await editor.updateComplete;

    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="popup_width"]')?.value).toBe("wide");
    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="popup_summary_lines"]')?.value).toBe("5");
    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="popup_style"]')?.value).toBe("cinematic");
    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="popup_content_style"]')?.value).toBe("panel");
    expect(editor.renderRoot.querySelector<HTMLSelectElement>('select[data-key="layout"]')?.value).toBe("carousel");
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
});
