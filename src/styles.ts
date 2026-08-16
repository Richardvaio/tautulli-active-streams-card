import { css } from "lit";

export const cardStyles = css`
  :host { display: block; container-type: inline-size; }
  ha-card { overflow: hidden; background:var(--tas-card-background, var(--ha-card-background, var(--card-background-color))); }
  :host([container-style="transparent"]) ha-card { border:0; background:transparent; box-shadow:none; }
  .header { display:flex; align-items:center; justify-content:space-between; padding:16px 16px 8px; gap:12px; }
  .title { margin:0; font-size:var(--ha-card-header-font-size, 20px); font-weight:500; line-height:1.25; }
  .badge { font-size:12px; min-width:1.5rem; text-align:center; color:var(--secondary-text-color); background:color-mix(in srgb, var(--primary-text-color) 9%, transparent); border-radius:999px; padding:3px 8px; }
  .stale { margin:0 16px 8px; color:var(--warning-color, #f59e0b); font-size:12px; }
  .content { display:grid; grid-template-columns:repeat(var(--columns, 1), minmax(0, 1fr)); gap:var(--tas-gap, 8px); padding:var(--tas-gap, 8px); }
  .content.grid.auto { grid-template-columns:repeat(auto-fit, minmax(min(100%, var(--item-min, 340px)), 1fr)); }
  .content.list { grid-template-columns:1fr; }
  .content.carousel { display:flex; overflow-x:auto; overscroll-behavior-inline:contain; scroll-snap-type:x mandatory; scrollbar-width:thin; padding-bottom:12px; }
  .content.carousel > .item { flex:0 0 min(78cqw, var(--carousel-width, 280px)); scroll-snap-align:start; }
  .content.carousel > .classic-item { flex:0 0 min(90cqw, 600px); scroll-snap-align:start; }
  .content.carousel > .media-item { display:flex; flex-direction:column; }
  .content.carousel > .media-item { --media-aspect:2/3; }
  .content.carousel > .media-item.track,.content.carousel > .media-item.album,.content.carousel > .media-item.artist { --media-aspect:1/1; }
  .content.carousel > .media-item .art { height:auto; min-height:0; aspect-ratio:var(--tas-art-aspect, var(--media-aspect)); }
  .content.carousel > .media-item .body { flex:1; padding:10px 12px 12px; }
  .carousel-controls { display:flex; justify-content:flex-end; gap:5px; padding:0 var(--tas-gap, 8px); }
  .carousel-controls button { width:38px; height:38px; display:grid; place-items:center; border:1px solid var(--tas-border-color, var(--divider-color)); border-radius:50%; color:var(--primary-text-color); background:var(--tas-item-background, var(--card-background-color)); cursor:pointer; }
  .carousel-controls button:hover { border-color:var(--primary-color); }
  .carousel-controls button:focus-visible { outline:2px solid var(--primary-color); outline-offset:2px; }
  .item { position:relative; min-width:0; display:grid; grid-template-columns:var(--art-width, 92px) minmax(0,1fr); gap:10px; overflow:hidden; border:1px solid var(--tas-border-color, var(--divider-color)); border-radius:var(--tas-radius, var(--ha-card-border-radius, 12px)); background:var(--tas-item-background, var(--primary-background-color)); box-shadow:var(--tas-shadow, 0 2px 8px rgb(0 0 0 / 18%)); }
  .item.no-art { grid-template-columns:1fr; }
  .item.art-right { grid-template-columns:minmax(0,1fr) var(--art-width, 92px); }
  .item.art-right .art { order:2; }
  .item.art-right .body { order:1; padding:10px 0 10px 10px; }
  .item.background-art,.classic-item.background-art { isolation:isolate; }
  .item.background-art:not(.art-left),.classic-item.background-art:not(.art-left) { grid-template-columns:1fr; }
  .background-art::before { content:""; position:absolute; z-index:0; inset:0 0 0 28%; background-image:linear-gradient(90deg, transparent 0%, rgb(0 0 0 / 35%) 32%, rgb(0 0 0 / 10%) 100%), var(--tas-background-image); background-size:cover; background-position:var(--tas-art-position, center); opacity:var(--tas-backdrop-opacity, .35); -webkit-mask-image:linear-gradient(90deg, transparent, #000 35%); mask-image:linear-gradient(90deg, transparent, #000 35%); }
  .background-art > * { position:relative; z-index:1; }
  .item.background-art:not(.art-left) .body,.classic-item.background-art:not(.art-left) .classic-body { padding:12px; }
  .interactive { cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
  .interactive:hover { border-color:color-mix(in srgb, var(--primary-color) 55%, var(--tas-border-color)); }
  .interactive:focus-visible { outline:2px solid var(--primary-color); outline-offset:2px; }
  .interactive:active { transform:scale(.985); transition:transform .12s ease; }
  .open-details { position:absolute; z-index:2; inset:0; width:100%; height:100%; padding:0; border:0; border-radius:inherit; background:transparent; cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
  .open-details:focus-visible { outline:2px solid var(--primary-color); outline-offset:-3px; }
  .terminate { z-index:4; }
  .art { width:calc(100% - var(--tas-art-inset, 0px) - var(--tas-art-inset, 0px)); height:calc(100% - var(--tas-art-inset, 0px) - var(--tas-art-inset, 0px)); min-height:128px; margin:var(--tas-art-inset, 0px); object-fit:var(--tas-art-fit, cover); object-position:var(--tas-art-position, center); border-radius:max(0px, calc(var(--tas-radius, 12px) - 2px)); background:var(--secondary-background-color); }
  .body { min-width:0; padding:10px 10px 10px 0; display:flex; flex-direction:column; gap:5px; }
  .no-art .body { padding:12px; }
  .eyebrow,.meta,.details,.summary { color:var(--secondary-text-color); }
  .eyebrow { display:flex; gap:7px; align-items:center; font-size:12px; min-width:0; }
  .eyebrow span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .state { color:var(--state-color, var(--primary-color)); font-weight:600; text-transform:capitalize; }
  :host([animations]) .state.paused { animation:pulse 1.5s ease-in-out infinite; }
  :host([animations]) .state.buffering { animation:pulse .8s ease-in-out infinite; }
  .name { margin:0; font-size:var(--tas-title-size, 16px); font-weight:600; line-height:1.25; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
  .subtitle { font-size:13px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .meta,.details { display:flex; flex-wrap:wrap; gap:4px 10px; font-size:12px; }
  .summary { font-size:12px; line-height:1.4; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
  .progress { height:var(--tas-progress-height, 7px); border-radius:99px; overflow:hidden; background:color-mix(in srgb, var(--primary-text-color) 14%, transparent); margin-top:auto; }
  .progress::before { content:""; display:block; height:100%; width:var(--progress, 0%); background:var(--state-color, var(--primary-color)); transition:width .4s ease; }
  .modern-progress-row { display:grid; grid-template-columns:minmax(64px,1fr) auto; align-items:center; gap:10px; margin-top:auto; }
  .modern-progress-row .progress { width:100%; margin-top:0; }
  .modern-progress-remaining { color:var(--secondary-text-color); font-size:11px; text-align:right; white-space:nowrap; }
  .terminate { position:absolute; right:6px; top:6px; display:grid; place-items:center; width:32px; height:32px; padding:0; border:1px solid color-mix(in srgb, var(--error-color) 28%, transparent); border-radius:50%; color:var(--error-color); background:color-mix(in srgb, var(--error-color) 16%, transparent); box-shadow:0 3px 10px rgb(0 0 0 / 14%); cursor:pointer; transition:background .16s ease,border-color .16s ease,transform .16s ease; }
  .terminate:hover { border-color:color-mix(in srgb, var(--error-color) 42%, transparent); background:color-mix(in srgb, var(--error-color) 24%, transparent); transform:translateY(-1px); }
  .classic-item { position:relative; min-width:0; display:grid; grid-template-columns:minmax(48px, var(--art-width, 85px)) minmax(0, 1fr); gap:5px; overflow:hidden; color:var(--primary-text-color); border:1px solid var(--tas-border-color); border-radius:var(--tas-radius); background:var(--tas-item-background); box-shadow:var(--tas-shadow); }
  .classic-item.art-right { grid-template-columns:minmax(0,1fr) minmax(48px, var(--art-width, 85px)); }
  .classic-item.art-right .classic-art { order:2; }
  .classic-item.art-right .classic-body { order:1; padding:5px 0 5px 7px; }
  .classic-art { width:calc(100% - var(--tas-art-inset, 5px) - var(--tas-art-inset, 5px)); height:calc(100% - var(--tas-art-inset, 5px) - var(--tas-art-inset, 5px)); min-height:116px; margin:var(--tas-art-inset, 5px); object-fit:var(--tas-art-fit, cover); object-position:var(--tas-art-position, center); border-radius:4px; background:var(--secondary-background-color); }
  .classic-item.music .classic-art { height:auto; min-height:0; aspect-ratio:var(--tas-art-aspect, 1); align-self:center; }
  .classic-art.placeholder { display:grid; place-items:center; color:var(--secondary-text-color); }
  .classic-art.placeholder ha-icon { --mdc-icon-size:36px; }
  .classic-body { min-width:0; display:grid; align-content:center; grid-template-rows:auto auto auto auto auto auto; gap:3px; padding:5px 7px 5px 0; }
  .classic-top,.classic-info,.classic-bottom { min-width:0; display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:8px; color:var(--secondary-text-color); font-size:11px; line-height:1.2; }
  .classic-top > span,.classic-bottom > span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .classic-top strong { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:right; font:italic 700 12px Arial,sans-serif; letter-spacing:1.5px; color:var(--primary-text-color); }
  .classic-item:has(.terminate) .classic-top { padding-right:34px; }
  .classic-title { min-width:0; margin:0; display:flex; align-items:center; gap:5px; font-size:var(--tas-title-size, 26px); font-weight:500; line-height:1.05; }
  .classic-item.video .classic-title { font-size:max(var(--tas-title-size, 16px), 26px); }
  .classic-item.music .classic-title { font-size:max(var(--tas-title-size, 16px), 18px); }
  .classic-title ha-icon,.classic-track ha-icon { flex:none; --mdc-icon-size:1em; }
  .classic-title span,.classic-track span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .classic-track { min-width:0; display:flex; align-items:center; gap:5px; font-size:15px; color:var(--secondary-text-color); }
  .classic-info > :last-child,.classic-bottom > :last-child { text-align:right; }
  .media-detail { display:flex; align-items:center; gap:4px; color:var(--primary-text-color); font-size:15px; font-weight:600; }
  .media-detail ha-icon { --mdc-icon-size:15px; }
  .classic-progress { position:relative; min-width:0; height:var(--tas-progress-height, 20px); display:grid; grid-template-columns:1fr auto 1fr; align-items:center; overflow:hidden; border-radius:999px; color:#fff; background:rgba(0,0,0,.6); font-size:11px; font-weight:600; }
  .classic-progress::before { content:""; position:absolute; inset:0 auto 0 0; width:var(--progress, 0%); background:var(--state-color); transition:width .4s ease; }
  .classic-progress span { position:relative; z-index:1; }
  .progress-state { grid-column:1; padding-left:8px; text-transform:capitalize; white-space:nowrap; }
  .progress-percent { grid-column:2; }
  .progress-remaining { grid-column:3; padding-right:8px; color:rgb(255 255 255 / 42%); text-align:right; white-space:nowrap; }
  :host([animations]) .classic-item.paused .classic-progress::before { animation:pulse 1.5s ease-in-out infinite; }
  :host([animations]) .classic-item.buffering .classic-progress::before { animation:pulse .8s ease-in-out infinite; }
  .dialog-backdrop { position:fixed; inset:0; z-index:1000; display:grid; place-items:center; padding:20px; background:rgb(0 0 0 / 58%); animation:backdrop-fade var(--dialog-animation-duration, 220ms) ease-out; }
  .details-dialog.anim-fade { animation:dialog-fade var(--dialog-animation-duration, 220ms) ease-out; }
  .details-dialog.anim-scale { animation:dialog-scale var(--dialog-animation-duration, 220ms) cubic-bezier(.2,.8,.2,1); }
  .details-dialog.anim-rise { animation:dialog-rise var(--dialog-animation-duration, 220ms) cubic-bezier(.2,.8,.2,1); }
  :host(:not([animations])) .details-dialog { animation:none !important; }
  @keyframes dialog-fade { from { opacity:0; } }
  @keyframes backdrop-fade { from { opacity:0; } }
  @keyframes dialog-scale { from { transform:scale(.96) translateY(6px); } }
  @keyframes dialog-rise { from { transform:translateY(100vh); } }
  :host(:not([animations])) .dialog-backdrop { animation:none !important; }
  .confirm-dialog { width:min(420px, 100%); overflow:hidden; border:1px solid var(--divider-color); border-radius:var(--ha-dialog-border-radius, 18px); color:var(--primary-text-color); background:var(--card-background-color); box-shadow:0 18px 54px rgb(0 0 0 / 42%); }
  .dialog-content { display:grid; gap:14px; padding:24px; }
  .dialog-icon { width:48px; height:48px; display:grid; place-items:center; border-radius:50%; color:var(--error-color); background:color-mix(in srgb, var(--error-color) 14%, transparent); }
  .dialog-icon ha-icon { --mdc-icon-size:28px; }
  .dialog-content h2 { margin:0; font-size:22px; line-height:1.2; }
  .dialog-content p { margin:0; color:var(--secondary-text-color); line-height:1.45; }
  .dialog-stream { display:grid; gap:4px; padding:12px 14px; border-radius:10px; background:var(--secondary-background-color); }
  .dialog-stream strong,.dialog-stream span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .dialog-stream span { color:var(--secondary-text-color); font-size:13px; }
  .dialog-actions { display:flex; justify-content:flex-end; gap:8px; padding:12px 16px; border-top:1px solid var(--divider-color); }
  .dialog-actions button { min-height:40px; padding:0 18px; border:0; border-radius:10px; font:600 14px inherit; cursor:pointer; }
  .dialog-cancel { color:var(--primary-text-color); background:transparent; }
  .dialog-confirm { color:#fff; background:var(--error-color, #db4437); }
  .dialog-actions button:focus-visible,.terminate:focus-visible { outline:2px solid var(--primary-color); outline-offset:2px; }
  .dialog-actions button:disabled { opacity:.55; cursor:wait; }
  .details-dialog { position:relative; width:min(720px, 100%); max-height:min(86vh, 780px); overflow-x:hidden; overflow-y:auto; border:1px solid var(--divider-color); border-radius:var(--ha-dialog-border-radius, 18px); color:var(--primary-text-color); background:var(--card-background-color); box-shadow:0 18px 54px rgb(0 0 0 / 45%); isolation:isolate; min-width:0; }
  .details-dialog.popup-width-compact { width:min(520px, 100%); }
  .details-dialog.popup-width-wide { width:min(940px, 100%); }
  .details-dialog.has-backdrop::before { content:""; position:absolute; z-index:-1; inset:0 0 auto 28%; height:270px; background-image:linear-gradient(180deg, rgb(0 0 0 / 10%), var(--card-background-color) 96%), linear-gradient(90deg, transparent, rgb(0 0 0 / 20%)), var(--details-backdrop); background-size:cover; background-position:center; opacity:.5; -webkit-mask-image:linear-gradient(90deg, transparent, #000 35%); mask-image:linear-gradient(90deg, transparent, #000 35%); }
  .dialog-close { position:sticky; z-index:3; float:right; top:12px; right:12px; width:40px; height:40px; display:grid; place-items:center; margin:12px 12px 0 0; border:0; border-radius:50%; color:var(--primary-text-color); background:color-mix(in srgb, var(--card-background-color) 82%, transparent); cursor:pointer; backdrop-filter:blur(8px); }
  .details-content { display:grid; grid-template-columns:minmax(0,1fr); gap:18px; padding:24px; clear:both; min-width:0; }
  .details-content h2 { max-width:calc(100% - 44px); margin:0; font-size:clamp(22px, 4cqw, 32px); line-height:1.12; }
  .details-hero { position:relative; display:grid; gap:16px; }
  .popup-summary { display:grid; gap:14px; padding:14px; border:1px solid color-mix(in srgb, var(--divider-color) 80%, transparent); border-radius:14px; background:color-mix(in srgb, var(--primary-text-color) 4%, transparent); backdrop-filter:blur(4px); }
  .popup-clean .popup-summary { padding:0; border:0; border-radius:0; background:transparent; backdrop-filter:none; }
  .popup-cinematic.has-backdrop::before { inset:0; height:330px; opacity:.72; -webkit-mask-image:linear-gradient(180deg,#000 0%,transparent 100%); mask-image:linear-gradient(180deg,#000 0%,transparent 100%); }
  .popup-cinematic .popup-summary { min-height:190px; align-content:end; padding:22px; border:0; background:linear-gradient(180deg,transparent,color-mix(in srgb,var(--card-background-color) 55%,transparent)); }
  .media-summary { justify-items:start; }
  .details-section-title { margin:2px 0 -8px; color:var(--secondary-text-color); font-size:12px; text-transform:uppercase; letter-spacing:.65px; }
  .details-hero.with-poster { grid-template-columns:minmax(90px, 150px) minmax(0,1fr); }
  .details-hero > img { width:100%; aspect-ratio:2/3; object-fit:cover; border-radius:10px; box-shadow:0 8px 24px rgb(0 0 0 / 35%); }
  .details-primary { min-width:0; display:grid; align-content:end; gap:10px; }
  .details-hero .details-primary { align-content:start; display:flex; flex-direction:column; gap:8px; }
  .details-hero .details-primary .details-progress { margin-top:auto; }
  .details-heading-line { min-width:0; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
  .details-inline-title { min-width:0; overflow-wrap:anywhere; }
  .details-inline-title { max-width:none !important; margin:0; padding-right:4px; font-size:clamp(22px, 4cqw, 32px); line-height:1.12; }
  .details-summary-user { max-width:42%; flex:none; display:flex; align-items:center; gap:5px; overflow:hidden; padding:5px 9px; border:1px solid color-mix(in srgb, var(--divider-color) 70%, transparent); border-radius:999px; color:var(--secondary-text-color); background:color-mix(in srgb, var(--primary-text-color) 7%, transparent); font-size:11px; font-weight:600; text-overflow:ellipsis; white-space:nowrap; }
  .details-summary-user ha-icon { --mdc-icon-size:15px; flex:none; }
  .details-primary p,.details-subtitle { margin:0; color:var(--secondary-text-color); }
  .details-chips { display:flex; flex-wrap:wrap; gap:6px; min-width:0; }
  .details-chips span { padding:4px 9px; border-radius:999px; color:var(--secondary-text-color); background:color-mix(in srgb, var(--primary-text-color) 8%, transparent); font-size:12px; text-transform:capitalize; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .details-chips .chip-user { display:inline-flex; align-items:center; gap:5px; max-width:100%; }
  .details-chips .chip-user ha-icon { --mdc-icon-size:14px; flex:none; }
  .details-chips .chip-user span, .details-chips .chip-user { overflow:hidden; text-overflow:ellipsis; }
  .details-chips .state { color:var(--primary-text-color); background:color-mix(in srgb, var(--primary-color) 32%, transparent); }
  .details-chips .state.paused { color:var(--secondary-text-color); background:color-mix(in srgb, var(--tas-paused-color, #e5a00d) 42%, transparent); box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--tas-paused-color, #e5a00d) 58%, transparent); }
  .details-chips .state.buffering { color:var(--secondary-text-color); background:color-mix(in srgb, var(--tas-buffering-color, #d32f2f) 42%, transparent); box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--tas-buffering-color, #d32f2f) 58%, transparent); }
  .details-progress { height:10px; overflow:hidden; border-radius:99px; background:color-mix(in srgb, var(--primary-text-color) 12%, transparent); }
  .details-progress span { display:block; height:100%; border-radius:inherit; background:var(--primary-color); }
  .details-progress-label { display:flex; justify-content:space-between; gap:12px; color:var(--secondary-text-color); font-size:12px; }
  .details-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:8px; }
  .detail-value { min-width:0; display:grid; gap:3px; padding:10px 12px; border-radius:10px; background:color-mix(in srgb, var(--primary-text-color) 6%, transparent); }
  .detail-value small { color:var(--secondary-text-color); font-size:10px; text-transform:uppercase; letter-spacing:.45px; }
  .detail-value span { overflow:hidden; text-overflow:ellipsis; font-size:13px; }
  .popup-content-panel .details-grid { padding:10px; border:1px solid color-mix(in srgb, var(--divider-color) 80%, transparent); border-radius:14px; background:color-mix(in srgb, var(--primary-text-color) 4%, transparent); }
  .details-actions { display:flex; justify-content:flex-end; padding-top:4px; }
  .details-top-action { position:absolute; z-index:2; top:0; right:0; }
  .details-top-action + .details-primary { padding-right:56px; }
  .details-actions button { min-height:42px; display:flex; align-items:center; gap:7px; padding:0 16px; border:0; border-radius:10px; font-weight:700; cursor:pointer; }
  .details-top-action button { min-height:38px; display:flex; align-items:center; gap:7px; padding:0 12px; border:0; border-radius:10px; font-weight:700; cursor:pointer; box-shadow:0 4px 14px rgb(0 0 0 / 25%); }
  .details-actions .danger,.details-top-action .danger { color:var(--error-color); background:color-mix(in srgb, var(--error-color) 16%, transparent); border:1px solid color-mix(in srgb, var(--error-color) 30%, transparent); backdrop-filter:blur(8px); transition:color .16s ease,background .16s ease,border-color .16s ease,transform .16s ease; }
  .details-actions .danger:hover,.details-actions .danger:focus-visible,.details-top-action .danger:hover,.details-top-action .danger:focus-visible { background:color-mix(in srgb, var(--error-color) 24%, transparent); border-color:color-mix(in srgb, var(--error-color) 44%, transparent); transform:translateY(-1px); }
  .details-actions .icon-only,.details-top-action .icon-only { width:42px; padding:0; justify-content:center; border-radius:50%; }
  .details-media-poster { width:min(190px, 42%); aspect-ratio:2/3; object-fit:cover; border-radius:10px; box-shadow:0 8px 24px rgb(0 0 0 / 32%); }
  .details-summary { margin:0; color:var(--secondary-text-color); line-height:1.55; }
  .details-summary.compact { display:-webkit-box; -webkit-line-clamp:var(--summary-lines, 3); -webkit-box-orient:vertical; overflow:hidden; font-size:12px; line-height:1.45; }
  .user-popup-summary { display:flex; align-items:center; gap:14px; }
  .user-avatar.large { width:58px; height:58px; margin:0; font-size:24px; }
  .user-popup-summary > div:last-child { display:grid; gap:3px; }
  .user-popup-summary span { color:var(--secondary-text-color); }
  .empty { padding:28px 18px; text-align:center; color:var(--secondary-text-color); }
  .user-item { grid-template-columns:64px minmax(0,1fr); }
  .user-avatar { width:44px; height:44px; align-self:start; margin:12px 0 0 12px; display:grid; place-items:center; border-radius:50%; color:var(--text-primary-color, #fff); background:linear-gradient(145deg, var(--primary-color), color-mix(in srgb, var(--primary-color) 55%, #7c3aed)); font-size:20px; font-weight:700; }
  .user-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; }
  .user-stats span { display:grid; gap:1px; padding:7px 8px; border-radius:8px; color:var(--secondary-text-color); background:color-mix(in srgb, var(--primary-text-color) 5%, transparent); font-size:10px; }
  .user-stats strong { color:var(--primary-text-color); font-size:13px; }
  .user-breakdown { display:flex; flex-wrap:wrap; gap:5px 10px; color:var(--secondary-text-color); font-size:11px; }
  .user-breakdown span { display:flex; align-items:center; gap:3px; }
  .user-breakdown ha-icon { --mdc-icon-size:13px; }
  .user-favourites { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:6px; }
  .user-favourites span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11px; }
  .user-favourites small { display:block; color:var(--secondary-text-color); font-size:9px; text-transform:uppercase; letter-spacing:.4px; }
  .skeleton { min-height:132px; pointer-events:none; }
  .skeleton-art,.skeleton-body span { background:linear-gradient(90deg, color-mix(in srgb, var(--primary-text-color) 6%, transparent) 25%, color-mix(in srgb, var(--primary-text-color) 12%, transparent) 45%, color-mix(in srgb, var(--primary-text-color) 6%, transparent) 65%); background-size:250% 100%; animation:shimmer 1.5s ease-in-out infinite; }
  .skeleton-art { min-height:132px; }
  .skeleton-body { display:grid; align-content:center; gap:12px; padding:14px 14px 14px 0; }
  .skeleton-body span { height:10px; border-radius:999px; }
  .skeleton-body span:nth-child(1) { width:45%; }
  .skeleton-body span:nth-child(2) { width:88%; height:17px; }
  .skeleton-body span:nth-child(3) { width:65%; }
  :host([density="comfortable"]) { --art-width:112px; --item-min:390px; }
  :host([density="detailed"]) { --art-width:140px; --item-min:440px; }
  :host(:not([animations])) .progress::before { transition:none; }
  @keyframes pulse { 50% { opacity:.35; } }
  @keyframes shimmer { from { background-position:100% 0; } to { background-position:-100% 0; } }
  @container (max-width: 420px) {
    .content { grid-template-columns:1fr !important; }
    .item { --art-width:82px; }
    .details.optional,.summary { display:none; }
    .classic-item { grid-template-columns:80px minmax(0,1fr); }
    .classic-body { padding-right:5px; }
    .classic-item.video .classic-title { font-size:18px; }
    .classic-top,.classic-info,.classic-bottom { font-size:10px; }
    .remaining-label { display:none; }
    .progress-state { padding-left:5px; }
    .progress-remaining { padding-right:5px; }
    .details-hero.with-poster { grid-template-columns:72px minmax(0,1fr); gap:12px; }
    .details-hero > img { border-radius:8px; }
    .details-heading-line { align-items:flex-start; flex-direction:column; gap:7px; }
    .details-summary-user { max-width:100%; }
    .details-content { padding:14px; gap:14px; }
    .details-inline-title { font-size:20px; }
    .details-grid { grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:6px; }
    .detail-value { padding:8px 10px; }
    .detail-value span { font-size:12px; white-space:normal; overflow-wrap:anywhere; }
    .popup-summary { padding:10px; gap:10px; }
    .details-progress { height:8px; }
    .dialog-backdrop { padding:10px; }
    .details-dialog { border-radius:14px; }
    .dialog-close { width:36px; height:36px; margin:8px 8px 0 0; }
    .details-actions button, .details-top-action button { min-height:44px; }
    .carousel-controls { display:none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .progress::before { transition:none; }
    * { animation:none !important; }
  }
`;

export const editorStyles = css`
  .editor-group-title { margin:10px 2px -2px; color:var(--primary-text-color); font-size:13px; font-weight:700; letter-spacing:.35px; text-transform:uppercase; }
  :host { display:block; }
  .editor { display:grid; gap:16px; padding:8px 0; }
  .compatibility { display:flex; align-items:center; gap:11px; padding:12px 14px; border:1px solid color-mix(in srgb, var(--success-color, #43a047) 35%, var(--divider-color)); border-radius:12px; background:color-mix(in srgb, var(--success-color, #43a047) 7%, transparent); }
  .compatibility > span { width:10px; height:10px; flex:none; border-radius:50%; background:var(--success-color, #43a047); box-shadow:0 0 0 4px color-mix(in srgb, var(--success-color, #43a047) 15%, transparent); }
  .compatibility > div { min-width:0; display:grid; gap:2px; }
  .compatibility strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:13px; }
  .compatibility small { color:var(--secondary-text-color); font-size:11px; }
  .section { overflow:hidden; border:1px solid var(--divider-color); border-radius:12px; padding:14px; background:color-mix(in srgb, var(--card-background-color) 96%, var(--primary-color) 4%); transition:border-color .18s ease, box-shadow .18s ease; }
  .section[open] { border-color:color-mix(in srgb, var(--primary-color) 32%, var(--divider-color)); box-shadow:0 3px 12px rgb(0 0 0 / 7%); }
  .section[open] { display:grid; gap:12px; }
  .section > summary { margin:-2px 0; cursor:pointer; color:var(--primary-text-color); font-size:15px; font-weight:600; list-style-position:inside; }
  .section[open] > summary { margin-bottom:2px; }
  .section-description { margin:0; color:var(--secondary-text-color); font-size:12px; line-height:1.45; }
  label { display:grid; gap:6px; color:var(--primary-text-color); font-size:13px; }
  input,select { box-sizing:border-box; width:100%; min-height:42px; padding:8px 10px; border:1px solid var(--divider-color); border-radius:9px; color:var(--primary-text-color); background:var(--card-background-color); font:inherit; transition:border-color .16s ease, box-shadow .16s ease; }
  input:focus-visible,select:focus-visible,summary:focus-visible { outline:none; border-color:var(--primary-color); box-shadow:0 0 0 2px color-mix(in srgb, var(--primary-color) 23%, transparent); }
  .toggles { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:9px; }
  .option-group { display:grid; gap:8px; padding-top:4px; }
  .option-group + .option-group { padding-top:12px; border-top:1px solid var(--divider-color); }
  .option-group h4 { margin:0; font-size:12px; text-transform:uppercase; letter-spacing:.5px; color:var(--secondary-text-color); }
  .toggle { min-height:42px; display:flex; flex-direction:row-reverse; align-items:center; justify-content:space-between; gap:9px; padding:0 10px; border:1px solid color-mix(in srgb, var(--divider-color) 75%, transparent); border-radius:9px; background:color-mix(in srgb, var(--primary-text-color) 3%, transparent); }
  .toggle-number { display:grid; gap:8px; padding:8px 10px; border:1px solid color-mix(in srgb, var(--divider-color) 75%, transparent); border-radius:9px; background:color-mix(in srgb, var(--primary-text-color) 3%, transparent); }
  .toggle-number .toggle { min-height:0; border:0; background:transparent; padding:0; }
  .toggle-number-value { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--secondary-text-color); }
  .toggle-number-value input[type="range"] { flex:1; min-height:24px; accent-color:var(--primary-color); }
  .toggle input { position:relative; width:38px; height:22px; min-height:22px; flex:none; padding:0; appearance:none; border:0; border-radius:99px; background:color-mix(in srgb, var(--primary-text-color) 24%, transparent); cursor:pointer; }
  .toggle input::before { content:""; position:absolute; width:18px; height:18px; left:2px; top:2px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgb(0 0 0 / 32%); transition:transform .18s ease; }
  .toggle input:checked { background:var(--primary-color); }
  .toggle input:checked::before { transform:translateX(16px); }
  .detail-order-toolbar { display:flex; align-items:center; justify-content:space-between; gap:10px; color:var(--secondary-text-color); font-size:11px; }
  .detail-order-toolbar > div { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:5px; }
  .detail-order-toolbar button { min-height:30px; padding:0 8px; border:1px solid var(--divider-color); border-radius:7px; color:var(--primary-color); background:transparent; font:600 10px inherit; cursor:pointer; }
  .detail-order-list { display:grid; gap:6px; }
  .detail-order-row { position:relative; min-height:44px; display:grid; grid-template-columns:38px minmax(0,1fr) auto; align-items:center; gap:7px; padding:4px 6px 4px 2px; border:1px solid color-mix(in srgb, var(--divider-color) 78%, transparent); border-radius:9px; background:color-mix(in srgb, var(--primary-text-color) 3%, transparent); transition:opacity .14s ease,transform .14s ease,border-color .14s ease,background .14s ease,box-shadow .14s ease; }
  .detail-order-row.dragging { opacity:.55; transform:scale(.985); border-color:var(--primary-color); border-style:dashed; background:color-mix(in srgb, var(--primary-color) 10%, var(--card-background-color)); box-shadow:0 4px 14px rgb(0 0 0 / 15%); }
  .drag-handle,.detail-order-actions button { display:grid; place-items:center; padding:0; border:0; color:var(--secondary-text-color); background:transparent; cursor:pointer; }
  .drag-handle { width:38px; height:38px; cursor:grab; touch-action:none; }
  .drag-handle:active { cursor:grabbing; }
  .drag-handle ha-icon { --mdc-icon-size:22px; }
  .detail-order-actions { display:flex; align-items:center; gap:2px; }
  .detail-order-actions button { width:30px; height:34px; border-radius:6px; }
  .detail-order-actions button:hover:not(:disabled),.detail-order-actions button:focus-visible { color:var(--primary-color); background:color-mix(in srgb, var(--primary-color) 10%, transparent); outline:none; }
  .detail-order-actions button:disabled { opacity:.3; cursor:default; }
  .detail-order-actions ha-icon { --mdc-icon-size:18px; }
  .detail-order-toggle { position:relative; width:38px; height:22px; min-height:22px; margin:0 3px 0 6px; padding:0; appearance:none; border:0; border-radius:99px; background:color-mix(in srgb, var(--primary-text-color) 24%, transparent); cursor:pointer; }
  .detail-order-toggle::before { content:""; position:absolute; width:18px; height:18px; left:2px; top:2px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgb(0 0 0 / 32%); transition:transform .18s ease; }
  .detail-order-toggle:checked { background:var(--primary-color); }
  .detail-order-toggle:checked::before { transform:translateX(16px); }
  .hint { margin:0; font-size:12px; color:var(--secondary-text-color); line-height:1.4; }
  .reset-all { display:block; margin:12px 0 0; padding:8px 14px; border:1px solid var(--error-color, #db4437); border-radius:8px; color:var(--error-color, #db4437); background:transparent; font:600 12px inherit; cursor:pointer; }
  .reset-all:hover { background:color-mix(in srgb, var(--error-color, #db4437) 10%, transparent); }
  .error { color:var(--error-color); font-size:12px; }
  .section details { border-top:1px solid var(--divider-color); padding-top:10px; }
  .section details summary { cursor:pointer; color:var(--primary-text-color); font-size:13px; font-weight:600; }
  .advanced { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:10px; padding-top:12px; }
  .fine-tune-header { display:flex; align-items:center; justify-content:space-between; gap:12px; padding-top:10px; color:var(--secondary-text-color); font-size:11px; }
  .fine-tune-header button { flex:none; min-height:34px; padding:0 10px; border:1px solid var(--divider-color); border-radius:8px; color:var(--primary-color); background:transparent; font:600 11px inherit; cursor:pointer; }
  .appearance-field > span { display:flex; align-items:center; justify-content:space-between; gap:6px; }
  .appearance-field em { padding:2px 5px; border-radius:5px; color:var(--secondary-text-color); background:color-mix(in srgb, var(--primary-text-color) 6%, transparent); font:normal 9px inherit; text-transform:uppercase; letter-spacing:.3px; }
  .field-row { display:flex; gap:5px; }
  .field-row > input:not(.colour-picker) { min-width:0; flex:1; }
  .colour-picker { width:42px; flex:none; padding:4px; cursor:pointer; }
  .field-reset { width:42px; flex:none; display:grid; place-items:center; border:1px solid var(--divider-color); border-radius:9px; color:var(--primary-color); background:var(--card-background-color); cursor:pointer; }
  .field-reset ha-icon { --mdc-icon-size:18px; }
  .recipe-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
  .recipe { min-width:0; display:grid; grid-template-columns:44px minmax(0,1fr); grid-template-rows:auto auto; column-gap:10px; padding:9px; border:1px solid var(--divider-color); border-radius:10px; color:var(--primary-text-color); background:var(--card-background-color); text-align:left; cursor:pointer; }
  .recipe:hover,.recipe:focus-visible { border-color:var(--primary-color); box-shadow:0 0 0 2px color-mix(in srgb, var(--primary-color) 17%, transparent); outline:none; }
  .recipe-preview { grid-row:1 / 3; width:42px; height:42px; display:grid; grid-template-columns:13px 1fr; grid-template-rows:repeat(2,1fr); gap:2px; overflow:hidden; border-radius:6px; background:#08111e; box-shadow:inset 0 0 0 1px rgb(255 255 255 / 13%); }
  .recipe-preview i { display:block; background:#2b435d; }
  .recipe-preview i:first-child { grid-row:1 / 3; background:#e5a00d; }
  .recipe.cinematic .recipe-preview i:first-child { grid-column:1 / 3; grid-row:1 / 3; background:linear-gradient(90deg,#08111e,#854d60); }
  .recipe.shelf .recipe-preview { grid-template-columns:repeat(3,1fr); grid-template-rows:1fr; }
  .recipe.shelf .recipe-preview i:first-child { grid-column:auto; grid-row:auto; }
  .recipe.minimal .recipe-preview { background:transparent; }
  .recipe strong { align-self:end; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; }
  .recipe small { align-self:start; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--secondary-text-color); font-size:10px; }
  @media (max-width: 360px) {
    .recipe-grid { grid-template-columns:1fr; }
    .detail-order-toolbar { align-items:flex-start; flex-direction:column; }
    .detail-order-toolbar > div { justify-content:flex-start; }
  }
`;
