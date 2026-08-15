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
    expect(summaries).toContain("Card actions");
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
      expect(editor.renderRoot.textContent).toContain("action will appear on the main card");
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
            name: "Plex - Tardis",
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
    expect(editor.renderRoot.textContent).toContain("Plex - Tardis");
    expect(editor.renderRoot.textContent).not.toContain("Card API schema");

    activeCallback?.({ items: [{}, {}] });
    await vi.waitFor(() => {
      expect(editor.renderRoot.textContent).toContain("2 active streams available in the preview");
    });
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

    expect(editor.renderRoot.querySelectorAll('.drag-handle[draggable="true"]')).toHaveLength(16);
    expect(editor.renderRoot.querySelector('input[data-key="popup_summary_show_user"]')).not.toBeNull();
    expect(editor.renderRoot.querySelector('.detail-order-row input[data-key="popup_show_user"]')).not.toBeNull();
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

    const changes: Array<{ popup_detail_order?: string[] }> = [];
    editor.addEventListener("config-changed", (event) => changes.push((event as CustomEvent).detail.config));
    editor.renderRoot.querySelector<HTMLButtonElement>('button[aria-label="Move Plex user down"]')?.click();
    await editor.updateComplete;

    expect(changes.at(-1)?.popup_detail_order?.slice(0, 2)).toEqual(["player", "user"]);
    const rows = [...editor.renderRoot.querySelectorAll<HTMLElement>(".detail-order-row")];
    expect(rows.slice(0, 2).map((row) => row.dataset.detailField)).toEqual(["player", "user"]);
  });
});
