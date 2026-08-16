import { TautulliMediaCard } from "./card";
import { TautulliMediaCardEditor } from "./editor";

const CARD_VERSION = "0.1.0";

if (!customElements.get("tautulli-media-card")) {
  customElements.define("tautulli-media-card", TautulliMediaCard);
}
if (!customElements.get("tautulli-media-card-editor")) {
  customElements.define("tautulli-media-card-editor", TautulliMediaCardEditor);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "tautulli-media-card")) {
  window.customCards.push({
    type: "tautulli-media-card",
    name: "Tautulli Media Card",
    description: "Active streams, recently added media, popular titles, and watch history from Tautulli.",
    preview: true,
  });
}

console.info(`%c TAUTULLI MEDIA CARD %c ${CARD_VERSION} `, "color:white;background:#e5a00d;font-weight:700", "color:#e5a00d;background:#1f2329");
