// Shared state, data registry, progress storage, sync, and small UI helpers.
import { supabase } from "./supabase.js";
import { clipUrl, AUDIO_READY } from "./voice.js";

/* ---------- Helpers ---------- */
export const $ = s => document.querySelector(s);
export const $$ = s => [...document.querySelectorAll(s)];
export const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const rich = s => esc(s).replace(/&lt;(\/?)(b|i)&gt;/g, "<$1$2>");
export const full = w => !w.art ? w.it : (w.art.endsWith("'") ? w.art + w.it : w.art + " " + w.it);
export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const pad = n => String(n).padStart(2, "0");
export const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
export const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
export const lsDel = k => { try { localStorage.removeItem(k); } catch (e) {} };
export const debounce = (fn, ms) => { let t; const f = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; f.flush = () => { clearTimeout(t); fn(); }; return f; };
// Short form for chips ("3 d"); long form for sentences ("3 days").
export function fmtIn(ms, long = true) {
  const m = Math.max(1, Math.round(ms / 6e4));
  const u = (n, s, l) => long ? `${n} ${l}${n === 1 ? "" : "s"}` : `${n} ${s}`;
  if (m < 60) return u(m, "min", "minute");
  const h = Math.round(m / 60); if (h < 24) return u(h, "h", "hour");
  return u(Math.round(h / 24), "d", "day");
}
export function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }
export const LEVELS = ["A1", "A2", "B1", "B2"];
export const LEVEL_NAMES = { A1: "Beginner", A2: "Elementary", B1: "Intermediate", B2: "Upper intermediate" };
export const TOPICS = {
  people: "People & relationships", daily: "Home & daily life", food: "Food & drink", places: "Travel & places",
  work: "Work & study", feelings: "Health & feelings", leisure: "Free time & culture", society: "Society & money",
  tech: "Media, science & tech", nature: "Nature & environment", language: "Language & expression"
};
export const ICON = {
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
  speak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18 9 12l6-6"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4z"/></svg>',
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 21H20"/></svg>',
  review: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  replay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
};

/* ---------- Light and dark ---------- */
// "system" follows the device. The choice is kept in the browser, and the start page uses the same key.
const THEME_KEY = "iub.theme", BG = { light: "#f4f0e7", dark: "#151b18" };
export const getTheme = () => { try { return localStorage.getItem(THEME_KEY) || "system"; } catch (e) { return "system"; } };
export const isDark = () => { const t = document.documentElement.dataset.theme; return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; };
export function setTheme(t) {
  try { t === "system" ? localStorage.removeItem(THEME_KEY) : localStorage.setItem(THEME_KEY, t); } catch (e) {}
  if (t === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.content = t === "system" ? BG[/dark/.test(m.media) ? "dark" : "light"] : BG[t]);
  emit("theme");
}

/* ---------- Speech ---------- */
// Recorded neural voices first (one clip per text and voice), device speech as the fallback.
export const canSpeak = true;
let speakQueueToken = 0, current = null;
function deviceSpeak(text, onEnd, scale = 1) {
  if (!("speechSynthesis" in window)) { onEnd && onEnd(); return; }
  try {
    const u = new SpeechSynthesisUtterance(String(text).replace(/[…—«»“”]/g, " ").replace(/\/[aie]+\b/g, ""));
    u.lang = "it-IT"; u.rate = 0.92 * scale;
    const v = speechSynthesis.getVoices().find(v => /^it/i.test(v.lang)); if (v) u.voice = v;
    if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
    speechSynthesis.speak(u);
  } catch (e) { onEnd && onEnd(); }
}
export function speak(text, onEnd, voice = "f", scale = 1) {
  if (!text) { onEnd && onEnd(); return; }
  if (!AUDIO_READY) { deviceSpeak(text, onEnd, scale); return; }
  const a = new Audio(clipUrl(text, voice));
  a.playbackRate = scale;
  let settled = false;
  const finish = () => { if (settled) return; settled = true; if (current === a) current = null; onEnd && onEnd(); };
  const fallback = () => { if (settled) return; if (current === a) current = null; deviceSpeak(text, () => { settled = true; onEnd && onEnd(); }, scale); };
  a.onended = finish; a.onerror = fallback;
  current = a;
  a.play().catch(fallback);
}
function stopAudio() { if (current) { current.onended = current.onerror = null; current.pause(); current = null; } if ("speechSynthesis" in window) speechSynthesis.cancel(); }
export function say(text, voice) { speakQueueToken++; stopAudio(); speak(text, null, voice); }
// lines: strings or { t, v } objects; scale slows or speeds the whole run.
// gap(i, ms): pause after line i (which took ms to say) before the next one, e.g. for repeating after the speaker.
export function speakAll(lines, onProgress, onDone, scale = 1, gap = null) {
  const token = ++speakQueueToken;
  stopAudio();
  let i = 0;
  const next = () => {
    if (token !== speakQueueToken) return;
    if (i >= lines.length) { onDone && onDone(); return; }
    onProgress && onProgress(i);
    // Fetch the next clip while this one plays, so long texts run without gaps.
    const n = lines[i + 1];
    if (AUDIO_READY && n) { const p = new Audio(); p.preload = "auto"; p.src = typeof n === "string" ? clipUrl(n, "f") : clipUrl(n.t, n.v); }
    const l = lines[i++], at = i - 1, t0 = Date.now();
    const after = () => { if (token !== speakQueueToken) return; const d = gap ? gap(at, Date.now() - t0) : 0; d ? setTimeout(next, d) : next(); };
    typeof l === "string" ? speak(l, after, "f", scale) : speak(l.t, after, l.v, scale);
  };
  next();
  return () => { speakQueueToken++; stopAudio(); onDone && onDone(); };
}
export function stopSpeaking() { speakQueueToken++; stopAudio(); }

/* ---------- Italian text is marked as Italian, so screen readers pronounce it right ---------- */
const IT_SEL = ".it, .it-text, .ex-it, .s-it, .sent";
let markQueued = false;
new MutationObserver(() => {
  if (markQueued) return; markQueued = true;
  queueMicrotask(() => { markQueued = false; document.querySelectorAll(IT_SEL).forEach(el => { if (el.lang !== "it") el.lang = "it"; }); });
}).observe(document.documentElement, { childList: true, subtree: true });

/* ---------- Toast & sheet ---------- */
export function showToast(text, actionLabel, action, ms = 4500) {
  const root = $("#toast-root");
  root.innerHTML = `<div class="toast" role="status"><span>${esc(text)}</span>${actionLabel ? `<button data-toast-act>${esc(actionLabel)}</button>` : ""}<button class="x" data-toast-x aria-label="Dismiss">${ICON.close}</button></div>`;
  const close = () => { root.innerHTML = ""; };
  root.querySelector("[data-toast-x]").onclick = close;
  if (actionLabel) root.querySelector("[data-toast-act]").onclick = () => { close(); action(); };
  if (ms) { const el = root.firstChild; setTimeout(() => { if (root.firstChild === el) close(); }, ms); }
}
let sheetReturn = null;
export function openSheet(html, onMount) {
  closeSheet(true);
  sheetReturn = document.activeElement;
  const el = document.createElement("div");
  el.id = "sheet";
  el.innerHTML = `<div class="sheet-backdrop" data-sheet-close></div><div class="sheet-panel" role="dialog" aria-modal="true"><button class="sheet-x icon-btn" data-sheet-close aria-label="Close">${ICON.close}</button>${html}</div>`;
  document.body.appendChild(el);
  // Name the dialog after its title, for screen readers.
  const title = el.querySelector(".sheet-panel .s-it, .sheet-panel h2, .sheet-panel .eyebrow");
  if (title) { title.id = title.id || "sheet-title"; el.querySelector(".sheet-panel").setAttribute("aria-labelledby", title.id); }
  requestAnimationFrame(() => el.classList.add("open"));
  const first = el.querySelector(".sheet-panel button:not(.sheet-x), .sheet-panel a, .sheet-panel input"); (first || el.querySelector(".sheet-x")).focus({ preventScroll: true });
  onMount && onMount(el);
  return el;
}
export function closeSheet(instant) {
  const el = $("#sheet"); if (!el) return;
  if (instant) el.remove(); else { el.classList.remove("open"); setTimeout(() => el.remove(), 180); }
  if (sheetReturn && document.contains(sheetReturn)) sheetReturn.focus({ preventScroll: true });
  sheetReturn = null;
}
document.addEventListener("click", e => { if (e.target.closest("[data-sheet-close]")) closeSheet(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && $("#sheet")) closeSheet(); });

/* ---------- Shared state ---------- */
export const S = {
  user: null, profile: null,
  st: {},                              // id -> entry
  pref: Object.assign({ newN: 10, level: "A1", groupBy: "level", size: 19 }, lsGet("parlo.pref", {})),
  view: { name: "home" }
};

/* ---------- Course registry ---------- */
export const D = { units: [], items: {}, order: [], unitIds: {}, grammar: null, reading: null, writing: null, speaking: null };
export const pkey = s => s.toLowerCase().replace(/[!?.…¡¿]/g, "").trim();
export const UNIT_TOPIC = { 1: "daily", 2: "people", 3: "food", 4: "daily", 5: "daily", 6: "places", 7: "daily", 8: "people", 9: "leisure", 10: "feelings", 11: "language", 12: "places", 13: "work", 14: "nature", 15: "feelings", 16: "daily", 17: "food", 18: "tech", 19: "leisure", 20: "daily", 21: "language", 22: "people", 23: "work", 24: "tech", 25: "nature", 26: "feelings", 27: "work", 28: "society", 29: "tech", 30: "language", 31: "society", 32: "society", 33: "society", 34: "leisure", 35: "tech", 36: "language", 37: "language", 38: "places", 39: "feelings", 40: "language" };
export function indexCourse(course) {
  D.units = course.units;
  for (const u of D.units) {
    u.topic = UNIT_TOPIC[u.n] || "daily";
    const ids = D.unitIds[u.n] = [];
    const add = (id, type, d) => { if (D.items[id]) return; D.items[id] = { id, type, u: u.n, d }; ids.push(id); D.order.push(id); };
    u.words.forEach(w => add("w:" + w.it, "w", w));
    u.verbs.forEach(v => add("v:" + v.inf, "v", v));
    u.phrases.forEach(p => add("p:" + pkey(p.it), "p", p));
  }
}
export const unitByN = n => D.units.find(u => u.n === n);
// Non-vocabulary progress is stored in its own sync rows, identified by id prefix.
const PREFIX_UNIT = { "g:": 101, "s:": 102, "r:": 103, "wr:": 104, "sp:": 105, "t:": 106, "cp:": 107, "to:": 107, "l:": 108 };
export function unitOf(id) {
  for (const [p, n] of Object.entries(PREFIX_UNIT)) if (id.startsWith(p)) return n;
  return D.items[id]?.u;
}
const known = id => !!(D.items[id] || /^(g|s|r|l|wr|sp|t|cp|to):/.test(id));
export const sayOf = id => { const it = D.items[id]; if (!it) return S.st[id]?.it || ""; return it.type === "w" ? full(it.d) : it.type === "v" ? it.d.inf : it.d.it; };
export const meaningOf = id => D.items[id]?.d.en ?? S.st[id]?.en ?? "";

/* ---------- Progress ---------- */
// entry: { d: due time, iv: last interval, k: known, s: in deck, t: last change, …extra fields for sentences/scores/texts }
const itemsKey = () => "parlo.items." + (S.user ? S.user.id : "guest");
const dirtyKey = () => "parlo.dirty." + (S.user ? S.user.id : "guest");
S.st = lsGet(itemsKey(), {});
export const saveLocal = debounce(() => lsSet(itemsKey(), S.st), 300);
export function savePref(patch) {
  Object.assign(S.pref, patch); lsSet("parlo.pref", S.pref);
  if (S.user && supabase && ("dir" in patch || "newN" in patch)) supabase.from("profiles").update({ direction: S.pref.dir, new_per_session: S.pref.newN, updated_at: new Date().toISOString() }).eq("id", S.user.id).then(() => {});
}
export const IV = { "10m": 6e5, "1d": 864e5, "3d": 2592e5, "7d": 6048e5, "14d": 12096e5, "30d": 2592e6 };
// "Got it": the gap grows each time you recall it.
const NEXT_IV = { "": "1d", "10m": "1d", "1d": "3d", "3d": "7d", "7d": "14d", "14d": "30d", "30d": "30d" };
export function statusOf(id) {
  const e = S.st[id];
  if (!e) return "new";
  if (e.k) return "known";
  if (e.d) return e.d <= Date.now() ? "due" : "later";
  return "new";
}
export const inDeck = id => !!S.st[id]?.s;
// Learned = recalled at least once (or marked as known), not only seen.
export const learned = id => { const e = S.st[id]; return !!e && (!!e.k || (!!e.iv && e.iv !== "10m")); };
export function setEntry(id, patch, replace) {
  S.st[id] = Object.assign({}, replace ? {} : (S.st[id] || {}), patch, { t: Date.now() });
  saveLocal(); markDirty(unitOf(id)); refreshItem(id); emit("change", id);
}
// "seen": met for the first time; due again at once, so it is recalled before it counts as learned.
export function schedule(id, key) {
  if (key === "known") setEntry(id, { k: 1, d: 0, iv: "" });
  else if (key === "seen") setEntry(id, { k: 0, d: Date.now(), iv: "" });
  else if (key === "got") { const iv = NEXT_IV[S.st[id]?.iv || ""] || "1d"; setEntry(id, { k: 0, d: Date.now() + IV[iv], iv }); }
  else if (key === "reset") setEntry(id, { k: 0, d: 0, iv: "" });
  else setEntry(id, { k: 0, d: Date.now() + IV[key], iv: key });
}
export function toggleDeck(id) {
  const on = !inDeck(id);
  setEntry(id, { s: on ? 1 : 0 });
  showToast(on ? "Saved to your deck." : "Removed from your deck.", on ? "Undo" : null, () => setEntry(id, { s: 0 }), 3000);
  return on;
}
// A sentence saved from a text. `it` may be part of a longer sentence `ctx`.
export function sentenceId(it) { return "s:" + hash(it.trim().toLowerCase()); }
export function saveSentence({ it, en, ctx, src, srcTitle, voice }) {
  const id = sentenceId(it);
  const had = inDeck(id);
  setEntry(id, { s: 1, it: it.trim(), en, ctx: ctx && ctx.trim() !== it.trim() ? ctx.trim() : "", src: src || "", st: srcTitle || "", vo: voice || "f" });
  if (!had) showToast("Sentence saved to your deck.", "Undo", () => setEntry(id, { s: 0 }), 3500);
  return id;
}
export function mergeEntries(items) {
  const changed = [];
  for (const [id, e] of Object.entries(items || {})) {
    if (!known(id) || !e || typeof e !== "object") continue;
    if (!S.st[id] || (e.t || 0) > (S.st[id].t || 0)) { S.st[id] = e; changed.push(id); }
  }
  return changed;
}
export function applyChanged(changed) {
  if (!changed.length) return;
  saveLocal(); changed.forEach(refreshItem); emit("change", null);
}

/* ---------- Generic live updates for item controls ---------- */
export function statusLabel(id) {
  const s = statusOf(id);
  return s === "new" ? "New" : s === "due" ? "Due" : s === "known" ? "Known" : "In " + fmtIn(S.st[id].d - Date.now(), false);
}
export function refreshItem(id) {
  if (!id) return;
  const sel = CSS.escape(id);
  document.querySelectorAll(`[data-deck="${sel}"]`).forEach(b => { const on = inDeck(id); b.setAttribute("aria-pressed", on); b.querySelector(".lbl") && (b.querySelector(".lbl").textContent = on ? "In deck" : "Save"); });
  document.querySelectorAll(`[data-dot="${sel}"]`).forEach(el => { el.className = "dot " + statusOf(id); });
  document.querySelectorAll(`[data-status="${sel}"]`).forEach(el => { el.className = "status " + statusOf(id); el.textContent = statusLabel(id); });
  document.querySelectorAll(`[data-sched-for="${sel}"]`).forEach(el => { el.outerHTML = schedHTML(id); });
}
// One toggle on word lists: mark a word as known (it leaves your reviews), or undo that.
export function schedHTML(id) {
  const k = !!S.st[id]?.k;
  return `<span data-sched-for="${esc(id)}"><button class="btn quiet small" data-sched="${k ? "reset" : "known"}" data-id="${esc(id)}" aria-pressed="${k}">${k ? "✓ Known" : "I know it"}</button></span>`;
}

/* ---------- Tiny event bus ---------- */
const handlers = {};
export const on = (ev, fn) => { (handlers[ev] = handlers[ev] || []).push(fn); };
export const emit = (ev, arg) => (handlers[ev] || []).forEach(fn => { try { fn(arg); } catch (e) { console.error(e); } });

/* ---------- Counts ---------- */
export function counts(ids) {
  let k = 0, l = 0, due = 0;
  for (const id of ids) { const s = statusOf(id); if (s === "known") k++; else if (s === "later") l++; else if (s === "due") { l++; due++; } }
  return { known: k, learning: l, due, total: ids.length };
}
export const dueIds = (pool) => (pool || allReviewable()).filter(id => statusOf(id) === "due").sort((a, b) => S.st[a].d - S.st[b].d);
export const deckIds = () => [...D.order.filter(inDeck), ...Object.keys(S.st).filter(id => id.startsWith("s:") && inDeck(id))];
export const allReviewable = () => [...D.order, ...Object.keys(S.st).filter(id => id.startsWith("s:") && inDeck(id))];
export const pct = c => Math.round(c.known / Math.max(1, c.total) * 100);
export const barHTML = (c, cls = "") => `<span class="bar ${cls}" aria-hidden="true"><span class="k" style="width:${c.known / Math.max(1, c.total) * 100}%"></span><span class="l" style="width:${c.learning / Math.max(1, c.total) * 100}%"></span></span>`;

/* ---------- Sync with Supabase ---------- */
let dirty = new Set(lsGet(dirtyKey(), []));
export const sync = { pushing: false, pulling: null, error: false, last: 0 };
export function markDirty(n) { if (!S.user || !n) return; dirty.add(n); lsSet(dirtyKey(), [...dirty]); pushSoon(); }
const pushSoon = debounce(() => push(), 1500);
function unitEntries(n) { const o = {}; for (const [id, e] of Object.entries(S.st)) if (unitOf(id) === n) o[id] = e; return o; }
export async function push() {
  if (!S.user || !supabase || sync.pushing || !dirty.size || !navigator.onLine) return setSync();
  sync.pushing = true; setSync();
  const units = [...dirty]; dirty.clear(); lsSet(dirtyKey(), []);
  const uid = S.user.id;
  try {
    const { data, error } = await supabase.from("progress").select("unit,items").eq("user_id", uid).in("unit", units);
    if (error) throw error;
    if (!S.user || S.user.id !== uid) return;
    const changed = []; (data || []).forEach(r => changed.push(...mergeEntries(r.items)));
    const now = new Date().toISOString();
    const { error: e2 } = await supabase.from("progress").upsert(units.map(n => ({ user_id: uid, unit: n, items: unitEntries(n), updated_at: now })));
    if (e2) throw e2;
    sync.error = false; sync.last = Date.now(); applyChanged(changed);
  } catch (e) {
    console.warn("Sync failed", e);
    units.forEach(n => dirty.add(n)); lsSet(dirtyKey(), [...dirty]);
    sync.error = true; setTimeout(pushSoon, 8000 + Math.random() * 4000);
  } finally {
    sync.pushing = false; setSync();
    if (dirty.size && !sync.error) pushSoon();
  }
}
export async function pull() {
  if (!S.user || !supabase || !navigator.onLine) return setSync();
  if (sync.pulling) return sync.pulling;
  sync.pulling = (async () => {
    const uid = S.user.id;
    try {
      const { data, error } = await supabase.from("progress").select("unit,items").eq("user_id", uid);
      if (error) throw error;
      if (!S.user || S.user.id !== uid) return;
      const remote = {}; (data || []).forEach(r => Object.assign(remote, r.items));
      const changed = mergeEntries(remote);
      for (const id of Object.keys(S.st)) if (known(id) && (!remote[id] || (S.st[id].t || 0) > (remote[id].t || 0))) dirty.add(unitOf(id));
      dirty.delete(undefined); lsSet(dirtyKey(), [...dirty]);
      sync.error = false; sync.last = Date.now(); applyChanged(changed);
      if (dirty.size) push();
    } catch (e) { console.warn("Pull failed", e); sync.error = true; }
    finally { sync.pulling = null; setSync(); }
  })();
  return sync.pulling;
}
export function syncText() {
  if (!supabase) return ["", "Saved on this device"];
  if (!S.user) return ["", "Not signed in · saved on this device"];
  if (!navigator.onLine) return ["warn", "Offline · will sync later"];
  if (sync.pushing || sync.pulling) return ["busy", "Syncing…"];
  if (sync.error) return ["warn", "Couldn't sync · retrying"];
  return ["on", "Synced"];
}
export function setSync() {
  const [cls, text] = syncText();
  $$("[data-sync]").forEach(el => { el.className = "sync " + cls; el.querySelector("span").textContent = text; });
}
window.addEventListener("online", () => pull());
window.addEventListener("offline", setSync);
let lastVisiblePull = 0;
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && Date.now() - lastVisiblePull > 30000) { lastVisiblePull = Date.now(); pull(); emit("change", null); }
  if (document.visibilityState === "hidden") { saveLocal.flush(); if (dirty.size) push(); }
});

export async function loadProfile() {
  if (!S.user || !supabase) return;
  const { data } = await supabase.from("profiles").select("display_name,new_per_session,direction").eq("id", S.user.id).maybeSingle();
  if (data) { S.profile = data; S.pref.dir = data.direction || S.pref.dir; S.pref.newN = data.new_per_session ?? S.pref.newN; lsSet("parlo.pref", S.pref); }
  else {
    const name = S.user.user_metadata?.full_name || S.user.user_metadata?.name || (S.user.email || "").split("@")[0];
    S.profile = { display_name: name, new_per_session: S.pref.newN, direction: S.pref.dir };
    await supabase.from("profiles").upsert({ id: S.user.id, ...S.profile });
  }
  emit("account");
}
export function switchUser(next) {
  const prevId = S.user?.id || null, nextId = next?.id || null;
  S.user = next;
  if (prevId === nextId) { emit("account"); return false; }
  S.st = lsGet(itemsKey(), {});
  dirty = new Set(lsGet(dirtyKey(), []));
  S.profile = null; sync.error = false; sync.last = 0;
  if (nextId) {
    const guest = lsGet("parlo.items.guest", {});
    const moved = mergeEntries(guest);
    if (Object.keys(guest).length) {
      lsDel("parlo.items.guest");
      Object.keys(guest).forEach(id => known(id) && dirty.add(unitOf(id)));
      dirty.delete(undefined); lsSet(dirtyKey(), [...dirty]); lsSet(itemsKey(), S.st);
      if (moved.length) showToast("Your progress on this device was added to your account.");
    }
    loadProfile(); pull();
  }
  emit("account"); setSync();
  return true;
}
export const displayName = () => S.profile?.display_name || S.user?.user_metadata?.full_name || (S.user?.email || "").split("@")[0] || "";
export function resetAll() {
  const now = Date.now();
  for (const id of Object.keys(S.st)) { S.st[id] = { t: now }; markDirty(unitOf(id)); }
  saveLocal(); emit("change", null);
}

/* ---------- Navigation helper (the router listens for "rerender") ---------- */
export function go(h) { if (location.hash !== h) location.hash = h; else emit("rerender"); }
// Remember what the learner opened last, for "Continue" on the home screen.
export function remember(kind, title, href, sub) { lsSet("parlo.last", { kind, title, href, sub, t: Date.now() }); }

/* ---------- Checking typed answers ---------- */
const norm = s => String(s).toLowerCase().replace(/[’‘`´]/g, "'").replace(/\s+/g, " ").trim().replace(/[.!?,;]+$/, "");
const plain = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const forms = f => /[oi]\/[ae]\b/.test(f) ? [f.replace(/([oi])\/([ae])\b/, "$1"), f.replace(/([oi])\/([ae])\b/, "$2")] : [f];
// One letter added, missing or wrong, or two letters swapped.
function oneOff(a, b) {
  if (Math.abs(a.length - b.length) > 1 || a === b) return false;
  let i = 0; while (i < a.length && a[i] === b[i]) i++;
  if (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2)) return true;
  return a.slice(i + 1) === b.slice(i + 1) || a.slice(i) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i);
}
// "ok" · "accent" (right apart from an accent) · "close" (one letter off; only when typo is on) · "no" · "empty"
// Typo tolerance is for recalling words. In grammar and verb forms the one letter is often the point.
export function judge(input, answers, typo = false) {
  const n = norm(input), all = answers.flatMap(forms).map(norm);
  if (!n) return "empty";
  if (all.includes(n)) return "ok";
  if (all.some(a => plain(a) === plain(n))) return "accent";
  if (typo && all.some(a => a.length >= 4 && oneOff(plain(a), plain(n)))) return "close";
  return "no";
}
// Adjectives are listed in the masculine singular; the other endings are also right.
export const adjForms = w => !w.art && /o$/.test(w.it) && !/\s/.test(w.it) ? ["a", "i", "e"].map(e => w.it.slice(0, -1) + e) : [];

/* ---------- Gendered forms about the learner ---------- */
// pref.gender: "m" | "f" | "x" (show both). Only forms about the learner ("io") change: "sono andato/a" → "sono andata".
export function gf(text, isIo = true) {
  const g = S.pref.gender;
  if (!text || !isIo || (g !== "m" && g !== "f")) return text;
  return String(text).replace(/(\p{L}+?)([oi])\/([ae])(?!\p{L})/gu, (_, stem, m, f) => stem + (g === "m" ? m : f));
}
// Example sentences said by "io" may have a version for the other gender: alt = { base: "m"|"f", other: "…" }.
export function exVoice(text, alt) { return !alt ? "f" : text === alt.other ? (alt.base === "m" ? "f" : "m") : alt.base; }
// "andato o andata" in a question to the learner → the learner's form.
export function gq(text) {
  const g = S.pref.gender;
  if (g !== "m" && g !== "f") return text;
  return gf(String(text).replace(/(\p{L}+)o o (\p{L}+)a(?!\p{L})/gu, (m, a, b) => a === b ? a + (g === "m" ? "o" : "a") : m));
}
export function pickEx(text, alt) {
  const g = S.pref.gender;
  if (alt && (g === "m" || g === "f") && alt.base !== g) return alt.other;
  return text;
}

/* ---------- Study time ---------- */
// Time is counted in 15-second ticks, only while the app is visible and the learner has interacted in the last 90 s.
// Each device writes its own record per day ("t:2026-10-26:abc123"), so devices never overwrite each other.
const DEVICE = lsGet("parlo.device", null) || (() => { const d = Math.random().toString(36).slice(2, 8); lsSet("parlo.device", d); return d; })();
let lastInput = Date.now(), lastTimeSync = 0;
["pointerdown", "keydown", "wheel", "touchstart", "input"].forEach(ev => addEventListener(ev, () => { lastInput = Date.now(); }, { passive: true, capture: true }));
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function activityCat(v) {
  switch (v.name) {
    case "unit": return "vocab";
    case "learn": return { vocab: "vocab", grammar: "grammar", reading: "reading", listening: "listening", writing: "writing", speaking: "speaking" }[v.section];
    case "grammar": return "grammar";
    case "reading": return "reading";
    case "listening": return "listening";
    case "writing": return "writing";
    case "speaking": return "speaking";
    case "session": case "deck": return "review";
    case "say": return "speaking";
    default: return null;
  }
}
setInterval(() => {
  if (document.visibilityState !== "visible" || Date.now() - lastInput > 90000) return;
  const cat = activityCat(S.view || {}); if (!cat) return;
  const id = `t:${dayKey()}:${DEVICE}`;
  const v = Object.assign({}, S.st[id]?.v || {}); v[cat] = (v[cat] || 0) + 15;
  S.st[id] = { v, t: Date.now() }; saveLocal();
  if (Date.now() - lastTimeSync > 120000) { lastTimeSync = Date.now(); markDirty(106); }
}, 15000);
// { "2026-10-26": { vocab: 300, reading: 120, … } } summed across devices.
export function activityByDay() {
  const out = {};
  for (const [id, e] of Object.entries(S.st)) {
    if (!id.startsWith("t:") || !e || !e.v) continue;
    const day = id.split(":")[1], o = out[day] = out[day] || {};
    for (const [k, sec] of Object.entries(e.v)) o[k] = (o[k] || 0) + sec;
  }
  return out;
}
export function fmtDur(sec) {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
