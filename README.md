# Tautulli Active Streams Card

A native, responsive Home Assistant dashboard card for the [Tautulli Active Streams integration](https://github.com/Richardvaio/Tautulli_Active_Streams). It replaces the original multi-card YAML layout with one dependency-free card and a guided visual editor.

This is the initial public beta. It requires **Tautulli Active Streams 2.7.0 or newer** and card API schema `1`.

## Features

- Active Plex streams with artwork, playback state, progress, users, clients, quality, bandwidth and remaining time.
- Recently added Plex media with library and media-type filters.
- Popular and top movies, television and music using Tautulli statistics.
- Privacy-safe Plex user activity summaries.
- Administrator-only, paginated watch history when enabled in the integration.
- Classic, modern, minimal and cinematic presentation options.
- Responsive grid, list and carousel layouts.
- Poster, square and backdrop artwork treatments.
- Configurable headers, counts, fields, colours, spacing, progress bars and artwork sizing.
- Detailed popup with configurable summary and reorderable stream-detail fields.
- Optional administrator-only stream termination with a separate confirmation dialog.
- Graceful loading, empty, stale and unavailable states.
- Visual editor support; no YAML is required for normal setup.

The card uses only Home Assistant's authenticated WebSocket and signed image endpoints. It never connects directly to Tautulli or Plex and never receives their credentials, IP addresses, filesystem paths or raw upstream payloads.

## Requirements

- Home Assistant with HACS installed.
- [Tautulli Active Streams integration](https://github.com/Richardvaio/Tautulli_Active_Streams) version 2.7.0 or newer.
- A configured and loaded Tautulli Active Streams entry.

No additional dashboard cards are required.

## Installation with HACS

1. Install or update **Tautulli Active Streams** to version 2.7.0 or newer.
2. Restart Home Assistant.
3. Open **HACS** and choose **Custom repositories** from the menu.
4. Add `https://github.com/Richardvaio/tautulli-active-streams-card` as a **Dashboard** repository.
5. Enable beta versions for the repository and download the latest beta.
6. Refresh the browser. A hard refresh may be required after an update.

HACS adds the JavaScript resource automatically. If the card is not visible after installation, confirm that `/hacsfiles/tautulli-active-streams-card/tautulli-active-streams-card.js` appears under **Settings → Dashboards → Resources**.

## Manual installation

1. Download `tautulli-active-streams-card.js` from the release.
2. Copy it to `<config>/www/tautulli-active-streams-card.js`.
3. Add `/local/tautulli-active-streams-card.js` as a **JavaScript module** under **Settings → Dashboards → Resources**.
4. Refresh the browser.

## Add the card

1. Edit a Home Assistant dashboard.
2. Select **Add card**.
3. Search for **Tautulli Media Card**.
4. Select a Tautulli server, choose a content view and adjust the presentation in the visual editor.

Minimal YAML remains available:

```yaml
type: custom:tautulli-media-card
entry_id: YOUR_CONFIG_ENTRY_ID
mode: active
```

The editor normally selects the only compatible Tautulli entry automatically.

## Content views

### Active streams

Displays current movie, television, live-video and music sessions. Choose all media, video only or music only, then configure sorting, visible information, progress styling and popup details.

### Recently added

Displays recently added Plex media with server-provided library and media-type filters. Television additions can remain as individual items or be grouped by show or season.

### Popular media

Displays Tautulli home statistics by plays or duration over a selectable period. Available rankings depend on the connected server's capabilities.

### Plex user activity

Displays privacy-safe aggregate activity for Plex users. User names and client detail remain subject to the integration's server-side dashboard access settings.

### Watch history

Displays a bounded, paginated history view. It requires a Home Assistant administrator and **Allow administrators to view watch history in cards** in the integration options.

## Visual editor

The editor separates dashboard-card settings from popup settings and keeps sections collapsed until needed.

- **Content and source** selects the Tautulli server and view.
- **Card layout** controls presets, layout, columns, density, artwork and responsive behaviour.
- **Visible information** controls the fields displayed on dashboard items.
- **Card actions** controls item clicks and the details popup.
- **Popup settings** controls popup width, artwork, summaries, progress and ordered detail fields.
- **Terminate stream** appears only for compatible active-stream actions.
- **Fine-tune colours and sizing** exposes current values, unit-aware sizing controls and reset-to-default behaviour.

Classic artwork defaults to 85px wide. Artwork retains its source aspect ratio and uses the selected crop or contain treatment without stretching.

## Details popup

The optional popup can show artwork, summary, Plex user, progress, remaining time, estimated finish, paused duration, client, device, playback decision, video/audio quality, bandwidth, media metadata and ratings. Stream-detail fields can be reordered by dragging their handles in the editor.

Paused duration is updated every second in the browser between integration polls. Paused and buffering states use distinct, theme-aware status colours.

## Stream termination

Termination is disabled by default and requires all of the following:

1. The signed-in Home Assistant account is an administrator.
2. **Allow administrators to terminate streams from cards** is enabled under the integration's **Dashboard card access** settings.
3. **Show terminate-stream action** is enabled in the card editor.

The action can appear in the popup, on the main card, or both. The popup action can use an icon or labelled button in a configurable position. A separate confirmation dialog is always required, and the details popup remains behind the confirmation until it is closed or the stream ends.

## Responsive and accessible behaviour

- Layout responds to the card's available dashboard width using container queries.
- Carousel views support touch scrolling, scroll snap, keyboard focus and desktop controls.
- Popups trap keyboard focus and close with Escape.
- Interactive controls retain visible focus states and touch-friendly sizes.
- Reduced-motion preferences disable pulse, shimmer and smooth-scroll animation.
- Temporary server failures retain cached content with a subtle stale indication.
- Initial loading and unavailable integrations never expose raw WebSocket errors.

## Troubleshooting

### The card is not listed

- Confirm the JavaScript resource exists under **Settings → Dashboards → Resources**.
- Refresh the browser or clear its frontend cache.
- Confirm the resource type is **JavaScript module**.

### No compatible server appears

- Install Tautulli Active Streams 2.7.0 or newer.
- Restart Home Assistant after updating the integration.
- Confirm the integration entry is loaded and can reach Tautulli.

### A view or action is missing

The editor only offers capabilities allowed by the integration. Open **Settings → Devices & services → Tautulli Active Streams → Configure → Dashboard card access** and review its privacy and administrator permissions.

### Artwork does not update after upgrading

Perform a hard browser refresh. HACS and Home Assistant cache frontend modules aggressively.

## Development

```bash
pnpm install
pnpm check
pnpm test
pnpm build
```

The HACS-compatible bundle is generated at `dist/tautulli-active-streams-card.js`. Automated validation checks TypeScript, ESLint, component tests, the committed production bundle and HACS dashboard structure.

## Support and contributing

Use the [GitHub issue tracker](https://github.com/Richardvaio/tautulli-active-streams-card/issues) for bug reports and feature requests. Include the card version, integration version, Home Assistant version and a privacy-safe description of the configuration involved.

Pull requests are welcome.

## License

This project is licensed under the [MIT License](LICENSE).
