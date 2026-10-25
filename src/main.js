import "./styles.css";
import { registerSW } from "virtual:pwa-register";
import { supabase, appUrl } from "./supabase.js";

/* ================= Constants ================= */
const IV = { "10m": 6e5, "1d": 864e5, "3d": 2592e5, "7d": 6048e5 };
const IV_LABEL = { "10m": "10 min", "1d": "1 day", "3d": "3 days", "7d": "7 days" };
const RATE_KEYS = ["10m", "1d", "3d", "7d", "known"];
const POS = { adj: "adjective", adv: "adverb", q: "question word", prep: "preposition", conj: "conjunction", pron: "pronoun", num: "number", expr: "expression", noun: "noun" };
const LEVELS = { A1: "Beginner · get through everyday situations", A2: "Elementary · talk about your life and your past", B1: "Intermediate · opinions, plans and stories", B2: "Upper intermediate · fluent, nuanced conversation" };
const PRON = ["io", "tu", "lui / lei", "noi", "voi", "loro"];
const TENSES = [
  { k: "pres", it: "Presente", en: "I do / I'm doing" },
  { k: "pp", it: "Passato prossimo", en: "I did / I have done" },
  { k: "imp", it: "Imperfetto", en: "I used to / I was doing" },
  { k: "fut", it: "Futuro", en: "I will do" },
  { k: "cond", it: "Condizionale", en: "I would do" },
  { k: "cong", it: "Congiuntivo presente", en: "that I do (after “penso che”, “voglio che”…)" }
];

/* ================= Helpers ================= */
const $ = s => document.querySelector(s);
const app = $("#app");
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const rich = s => esc(s).replace(/&lt;(\/?)(b|i)&gt;/g, "<$1$2>");
const full = w => !w.art ? w.it : (w.art.endsWith("'") ? w.art + w.it : w.art + " " + w.it);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const pad = n => String(n).padStart(2, "0");
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const lsDel = k => { try { localStorage.removeItem(k); } catch (e) {} };
const debounce = (fn, ms) => { let t; return () => { clearTimeout(t); t = setTimeout(fn, ms); }; };
function fmtIn(ms) {
  const m = Math.max(1, Math.round(ms / 6e4));
  if (m < 60) return m + " min";
  const h = Math.round(m / 60); if (h < 24) return h + " h";
  return Math.round(h / 24) + " d";
}
const ICON = {
  speak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" fill-opacity=".15"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/></svg>',
  google: '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.5z"/></svg>'
};
const canSpeak = "speechSynthesis" in window;
function speak(text) {
  if (!canSpeak) return;
  try {
    const u = new SpeechSynthesisUtterance(String(text).replace(/[…—]/g, " "));
    u.lang = "it-IT"; u.rate = 0.9;
    const v = speechSynthesis.getVoices().find(v => /^it/i.test(v.lang)); if (v) u.voice = v;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) {}
}
function showToast(text, actionLabel, action, ms = 5000) {
  const root = $("#toast-root");
  root.innerHTML = `<div class="toast" role="status"><span>${esc(text)}</span>${actionLabel ? `<button data-toast-act>${esc(actionLabel)}</button>` : ""}<button class="x" data-toast-x aria-label="Dismiss">✕</button></div>`;
  const close = () => { root.innerHTML = ""; };
  root.querySelector("[data-toast-x]").onclick = close;
  if (actionLabel) root.querySelector("[data-toast-act]").onclick = () => { close(); action(); };
  if (ms) setTimeout(() => { if (root.firstChild && root.firstChild.textContent.startsWith(text)) close(); }, ms);
}

/* ================= Course data ================= */
let UNITS = [];
const ITEMS = {}, ORDER = [], UNIT_IDS = {};
const pkey = s => s.toLowerCase().replace(/[!?.…¡¿]/g, "").trim();
function indexCourse(course) {
  UNITS = course.units;
  for (const u of UNITS) {
    const ids = UNIT_IDS[u.n] = [];
    const add = (id, type, d) => { if (ITEMS[id]) return; ITEMS[id] = { id, type, u: u.n, d }; ids.push(id); ORDER.push(id); };
    u.words.forEach(w => add("w:" + w.it, "w", w));
    u.verbs.forEach(v => add("v:" + v.inf, "v", v));
    u.phrases.forEach(p => add("p:" + pkey(p.it), "p", p));
  }
}
const unitOf = id => ITEMS[id]?.u;
const unitByN = n => UNITS.find(u => u.n === n);
const say = id => { const it = ITEMS[id]; return it.type === "w" ? full(it.d) : it.type === "v" ? it.d.inf : it.d.it; };
const meaning = id => ITEMS[id].d.en;

/* ================= Account state ================= */
let user = null;        // Supabase user, or null on this device only
let profile = null;     // { display_name, new_per_session, direction }
const owner = () => user ? user.id : "guest";
const itemsKey = () => "parlo.items." + owner();
const dirtyKey = () => "parlo.dirty." + owner();

/* ================= Progress state ================= */
// entry: { d: due timestamp, iv: last interval, k: 1 known, s: 1 starred, t: last change }
let st = lsGet(itemsKey(), {});
let pref = Object.assign({ dir: "it", newN: 10 }, lsGet("parlo.pref", {}));
const saveLocal = debounce(() => lsSet(itemsKey(), st), 300);
function statusOf(id) {
  const e = st[id];
  if (!e) return "new";
  if (e.k) return "known";
  if (e.d) return e.d <= Date.now() ? "due" : "later";
  return "new";
}
const starred = id => !!st[id]?.s;
function setEntry(id, patch) {
  st[id] = Object.assign({}, st[id] || {}, patch, { t: Date.now() });
  saveLocal(); markDirty(unitOf(id)); refreshItem(id); refreshCounts();
}
function schedule(id, key) {
  if (key === "known") setEntry(id, { k: 1, d: 0, iv: "" });
  else if (key === "reset") setEntry(id, { k: 0, d: 0, iv: "" });
  else setEntry(id, { k: 0, d: Date.now() + IV[key], iv: key });
}
const toggleStar = id => setEntry(id, { s: starred(id) ? 0 : 1 });
function mergeEntries(items) {
  const changed = [];
  for (const [id, e] of Object.entries(items || {})) {
    if (!ITEMS[id] || !e || typeof e !== "object") continue;
    if (!st[id] || (e.t || 0) > (st[id].t || 0)) { st[id] = e; changed.push(id); }
  }
  return changed;
}
function applyChanged(changed) {
  if (!changed.length) return;
  saveLocal(); changed.forEach(refreshItem); refreshCounts();
}
function savePref(patch) {
  Object.assign(pref, patch); lsSet("parlo.pref", pref);
  if (user && supabase) supabase.from("profiles").update({ direction: pref.dir, new_per_session: pref.newN, updated_at: new Date().toISOString() }).eq("id", user.id).then(() => {});
}

/* ================= Sync (Supabase) ================= */
let dirty = new Set(lsGet(dirtyKey(), []));
let pushing = false, syncError = false, lastSync = 0;
function markDirty(n) {
  if (!user || !n) return;
  dirty.add(n); lsSet(dirtyKey(), [...dirty]); pushSoon();
}
const pushSoon = debounce(() => push(), 1500);
function unitEntries(n) { const o = {}; for (const id of UNIT_IDS[n] || []) if (st[id]) o[id] = st[id]; return o; }
async function push() {
  if (!user || !supabase || pushing || !dirty.size) return setSync();
  if (!navigator.onLine) return setSync();
  pushing = true; setSync();
  const units = [...dirty]; dirty.clear(); lsSet(dirtyKey(), []);
  const uid = user.id;
  try {
    // Merge whatever another device saved for these units first, so nothing is overwritten.
    const { data, error } = await supabase.from("progress").select("unit,items").eq("user_id", uid).in("unit", units);
    if (error) throw error;
    if (!user || user.id !== uid) return;
    const changed = []; (data || []).forEach(r => changed.push(...mergeEntries(r.items)));
    const now = new Date().toISOString();
    const { error: e2 } = await supabase.from("progress").upsert(units.map(n => ({ user_id: uid, unit: n, items: unitEntries(n), updated_at: now })));
    if (e2) throw e2;
    syncError = false; lastSync = Date.now(); applyChanged(changed);
  } catch (e) {
    console.warn("Sync failed", e);
    units.forEach(n => dirty.add(n)); lsSet(dirtyKey(), [...dirty]);
    syncError = true; setTimeout(pushSoon, 8000 + Math.random() * 4000);
  } finally {
    pushing = false; setSync();
    if (dirty.size && !syncError) pushSoon();
  }
}
let pulling = null;
async function pull() {
  if (!user || !supabase || !navigator.onLine) return setSync();
  if (pulling) return pulling;
  pulling = (async () => {
    const uid = user.id;
    try {
      const { data, error } = await supabase.from("progress").select("unit,items").eq("user_id", uid);
      if (error) throw error;
      if (!user || user.id !== uid) return;
      const remote = {}; (data || []).forEach(r => Object.assign(remote, r.items));
      const changed = mergeEntries(remote);
      for (const id of Object.keys(st)) if (ITEMS[id] && (!remote[id] || (st[id].t || 0) > (remote[id].t || 0))) dirty.add(unitOf(id));
      lsSet(dirtyKey(), [...dirty]);
      syncError = false; lastSync = Date.now(); applyChanged(changed);
      if (dirty.size) push();
    } catch (e) { console.warn("Pull failed", e); syncError = true; }
    finally { pulling = null; setSync(); }
  })();
  return pulling;
}
function setSync() {
  const el = $("#sync"); if (!el) return;
  let cls = "", text;
  if (!supabase) text = "Saved on this device";
  else if (!user) text = "Not signed in · saved on this device";
  else if (!navigator.onLine) { cls = "warn"; text = "Offline · will sync when you're back online"; }
  else if (pushing || pulling) { cls = "busy"; text = "Syncing…"; }
  else if (syncError) { cls = "warn"; text = "Couldn't sync · retrying"; }
  else { cls = "on"; text = "Synced to your account"; }
  el.className = "sync " + cls; el.querySelector("span").textContent = text;
  if (view.name === "account") { const ls = $("#last-sync"); if (ls) ls.textContent = lastSync ? new Date(lastSync).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"; }
}
window.addEventListener("online", () => { pull(); });
window.addEventListener("offline", setSync);
let lastVisiblePull = 0;
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && Date.now() - lastVisiblePull > 30000) { lastVisiblePull = Date.now(); pull(); refreshCounts(); }
  if (document.visibilityState === "hidden" && dirty.size) push();
});

async function loadProfile() {
  if (!user || !supabase) return;
  const { data } = await supabase.from("profiles").select("display_name,new_per_session,direction").eq("id", user.id).maybeSingle();
  if (data) {
    profile = data;
    pref.dir = data.direction || pref.dir; pref.newN = data.new_per_session ?? pref.newN; lsSet("parlo.pref", pref);
  } else {
    const name = user.user_metadata?.full_name || user.user_metadata?.name || (user.email || "").split("@")[0];
    profile = { display_name: name, new_per_session: pref.newN, direction: pref.dir };
    await supabase.from("profiles").upsert({ id: user.id, ...profile });
  }
  renderAccountButton();
  if (view.name === "account") viewAccount();
}

// Switch whose progress is on screen when someone signs in or out.
function switchUser(next) {
  const prevId = user?.id || null, nextId = next?.id || null;
  user = next;
  if (prevId === nextId) { renderAccountButton(); return; }
  st = lsGet(itemsKey(), {});
  dirty = new Set(lsGet(dirtyKey(), []));
  profile = null; syncError = false; lastSync = 0;
  if (nextId) {
    // Bring progress made on this device before signing in into the account.
    const guest = lsGet("parlo.items.guest", {});
    const moved = mergeEntries(guest);
    if (Object.keys(guest).length) {
      lsDel("parlo.items.guest");
      Object.keys(guest).forEach(id => ITEMS[id] && dirty.add(unitOf(id)));
      lsSet(dirtyKey(), [...dirty]); lsSet(itemsKey(), st);
      if (moved.length) showToast("Your progress on this device was added to your account.");
    }
    loadProfile(); pull();
  }
  renderAccountButton(); refreshCounts(); setSync();
  if (UNITS.length) render();
}
function displayName() { return profile?.display_name || user?.user_metadata?.full_name || (user?.email || "").split("@")[0] || "Account"; }
function renderAccountButton() {
  const b = $("#acct-btn");
  if (user) { b.className = "acct-btn"; b.innerHTML = `<span class="avatar">${esc(displayName().charAt(0).toUpperCase())}</span><span>${esc(displayName().split(" ")[0])}</span>`; b.setAttribute("aria-label", "Your account"); }
  else { b.className = "acct-btn out"; b.textContent = supabase ? "Sign in" : "Settings"; b.removeAttribute("aria-label"); }
}

/* ================= Shared item UI ================= */
let openMenu = null;
function statusLabel(id) {
  const s = statusOf(id);
  return s === "new" ? "New" : s === "due" ? "Due now" : s === "known" ? "Known" : "In " + fmtIn(st[id].d - Date.now());
}
function actionsHTML(id) {
  const lbl = esc(say(id));
  return `${canSpeak ? `<button class="icon-btn" data-say="${esc(id)}" aria-label="Listen to ${lbl}" title="Listen">${ICON.speak}</button>` : ""}
    <button class="icon-btn star" data-star="${esc(id)}" aria-pressed="${starred(id)}" aria-label="${starred(id) ? "Remove from" : "Add to"} my deck" title="${starred(id) ? "In my deck" : "Add to my deck"}">${ICON.star}</button>
    <button class="status ${statusOf(id)}" data-menu="${esc(id)}" aria-expanded="${openMenu === id}" title="Schedule review">${statusLabel(id)}</button>`;
}
function menuHTML(id) {
  if (openMenu !== id) return "";
  const e = st[id] || {};
  return `<div class="sched" role="group" aria-label="Review again in"><span class="lbl">Review again in</span>
    ${["10m", "1d", "3d", "7d"].map(k => `<button data-sched="${k}" data-id="${esc(id)}" class="${!e.k && e.iv === k && e.d ? "cur" : ""}">${IV_LABEL[k]}</button>`).join("")}
    <button class="known ${e.k ? "cur" : ""}" data-sched="known" data-id="${esc(id)}">I know this</button>
    ${e.k || e.d ? `<button class="reset" data-sched="reset" data-id="${esc(id)}">Reset to new</button>` : ""}</div>`;
}
function rowHTML(id, ctx) {
  const it = ITEMS[id], d = it.d;
  const ub = ctx === "global" ? `<button class="ubadge" data-unit="${it.u}" title="Open unit ${it.u}">U${it.u}</button>` : "";
  let cls = it.type, body = "";
  if (it.type === "w") {
    cls = d.g || "";
    const tag = d.g ? `<span class="tag ${d.g}">${d.g === "m" ? "masc." : "fem."}${d.pl ? " · pl. " + esc(d.pl) : ""}</span>` : `<span class="tag">${POS[d.pos] || esc(d.pos)}</span>`;
    body = `<div class="head"><span class="term">${d.art ? `<span class="art">${esc(d.art)}</span>${d.art.endsWith("'") ? "" : " "}` : ""}${esc(d.it)}</span><span class="en">${esc(d.en)}</span>${tag}${ub}</div>
      <div class="ex"><span class="it">${esc(d.ex)}</span><br>${esc(d.exEn)}</div>${d.note ? `<div class="note">${rich(d.note)}</div>` : ""}`;
  } else if (it.type === "p") {
    body = `<div class="head"><span class="term">${esc(d.it)}</span>${ub}</div>
      <div><span class="en">${esc(d.en)}</span> <span class="lit">literally “${esc(d.lit)}”</span> <span class="reg">${esc(d.reg)}</span></div>
      <div class="ex"><span class="it">${esc(d.ex)}</span><br>${esc(d.exEn)}</div>${d.note ? `<div class="note">${rich(d.note)}</div>` : ""}`;
  } else {
    body = `<div class="head"><button class="term it" data-open-verb="${esc(id)}" style="border:0;background:none;padding:0;font-style:italic;text-decoration:underline;text-decoration-color:var(--line);text-underline-offset:4px">${esc(d.inf)}</button><span class="en">${esc(d.en)}</span><span class="tag">${esc(d.kind)}</span>${ub}</div>
      <div class="ex"><span class="it">${d.t.pres.slice(0, 3).map((f, i) => (["io", "tu", "lui"][i]) + " " + esc(f)).join(" · ")}</span><br>past with ${esc(d.aux)}</div>`;
  }
  return `<div class="row ${cls}" data-row="${esc(id)}" data-ctx="${ctx}"><span class="stripe"></span><div class="body">${body}</div><div class="actions">${actionsHTML(id)}</div>${menuHTML(id)}</div>`;
}
function refreshItem(id) {
  if (!id || !ITEMS[id]) return;
  const sel = CSS.escape(id);
  document.querySelectorAll(`[data-row="${sel}"]`).forEach(el => { el.outerHTML = rowHTML(id, el.dataset.ctx); });
  document.querySelectorAll(`[data-vhead="${sel}"]`).forEach(el => { el.innerHTML = vheadHTML(id); });
  document.querySelectorAll(`[data-vdot="${sel}"]`).forEach(el => { el.className = "dot " + statusOf(id); });
}
function counts(ids) {
  let known = 0, learning = 0, due = 0;
  for (const id of ids) { const s = statusOf(id); if (s === "known") known++; else if (s === "later") learning++; else if (s === "due") { learning++; due++; } }
  return { known, learning, due, total: ids.length };
}
const barHTML = c => `<div class="bar"><span class="k" style="width:${c.known / Math.max(1, c.total) * 100}%"></span><span class="l" style="width:${c.learning / Math.max(1, c.total) * 100}%"></span></div>`;
const dueIds = (pool = ORDER) => pool.filter(id => statusOf(id) === "due").sort((a, b) => st[a].d - st[b].d);
function refreshCounts() {
  if (!UNITS.length) return;
  const due = dueIds().length, deck = ORDER.filter(starred).length;
  const db = $("#due-badge"); db.textContent = due; db.classList.toggle("zero", !due);
  const kb = $("#deck-badge"); kb.textContent = deck; kb.classList.toggle("zero", !deck);
  document.querySelectorAll("[data-prog]").forEach(el => {
    const n = el.dataset.prog, ids = n === "all" ? ORDER : UNIT_IDS[n] || [];
    el.innerHTML = progHTML(counts(ids), n === "all");
  });
  if ("setAppBadge" in navigator) { try { due ? navigator.setAppBadge(due) : navigator.clearAppBadge(); } catch (e) {} }
}
function progHTML(c, big, label) {
  return `<div style="display:flex;justify-content:space-between;align-items:baseline;font-variant-numeric:tabular-nums;gap:8px">
      <span class="eyebrow">${label || (big ? "Course progress" : "Unit progress")}</span><span><strong style="font-family:var(--display);font-size:${big ? 22 : 20}px">${c.known}</strong> / ${c.total} known</span></div>
    ${barHTML(c)}
    <div class="legend"><span><i style="background:var(--accent)"></i>Known ${c.known}</span><span><i style="background:var(--mark)"></i>Learning ${c.learning}</span><span><i style="background:var(--line)"></i>New ${c.total - c.known - c.learning}</span></div>`;
}

/* ================= Router (hash-based, so Back works) ================= */
let view = { name: "course" }, prevView = null;
let timers = [];
function parseHash() {
  const p = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (p[0] === "unit" && unitByN(+p[1])) return { name: "unit", u: +p[1], tab: ["words", "verbs", "phrases", "quiz"].includes(p[2]) ? p[2] : "words" };
  if (p[0] === "review") return { name: "review", src: ["due", "unit", "deck"].includes(p[1]) ? p[1] : "due", u: p[2] ? +p[2] : undefined };
  if (p[0] === "deck") return { name: "deck" };
  if (p[0] === "account") return { name: "account" };
  return { name: "course" };
}
function hashFor(v) {
  if (v.name === "unit") return `#/unit/${v.u}/${v.tab || "words"}`;
  if (v.name === "review") return `#/review/${v.src || "due"}${v.src === "unit" && v.u ? "/" + v.u : ""}`;
  if (v.name === "deck") return "#/deck";
  if (v.name === "account") return "#/account";
  return "#/";
}
function go(name, params = {}) {
  const h = hashFor(Object.assign({ name }, params));
  if (location.hash !== h) location.hash = h; else render();
}
function render() {
  if (!UNITS.length) return;
  timers.forEach(clearInterval); timers = [];
  openMenu = null;
  prevView = view; view = parseHash();
  document.querySelectorAll(".nav button").forEach(b => {
    if (b.dataset.go === view.name || (view.name === "unit" && b.dataset.go === "course")) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  ({ course: viewCourse, unit: viewUnit, review: viewPractice, deck: viewDeck, account: viewAccount })[view.name]();
  const sameUnit = prevView && prevView.name === "unit" && view.name === "unit" && prevView.u === view.u;
  if (!sameUnit) window.scrollTo(0, 0);
  setSync();
}
window.addEventListener("hashchange", render);

/* ================= Course view ================= */
let courseQuery = "";
function viewCourse() {
  const c = counts(ORDER), due = dueIds().length;
  const levels = [...new Set(UNITS.map(u => u.level))];
  app.innerHTML = `
    <section class="hero">
      <div>
        <div class="eyebrow">Corso completo · A1 → B2</div>
        <h1>Parlo <em>italiano</em></h1>
        <p class="lede">${UNITS.length} units, ${ORDER.filter(i => ITEMS[i].type === "w").length.toLocaleString("en")} words, ${ORDER.filter(i => ITEMS[i].type === "v").length} verbs and ${ORDER.filter(i => ITEMS[i].type === "p").length} phrases, from your first <i>ciao</i> to fluent conversation. Star anything to add it to your own deck.</p>
      </div>
      <div class="sheet today">
        <div data-prog="all">${progHTML(c, true)}</div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:4px">
          <button class="btn primary inline" data-go="review">${due ? `Review ${due} due` : "Start reviewing"}</button>
          <span style="font-size:13px;color:var(--muted)">${due ? "cards are waiting" : nextDueText()}</span>
        </div>
      </div>
    </section>
    ${bannerHTML()}
    <div class="search-wrap">
      <input class="search" id="course-search" type="search" placeholder="Search the whole course in Italian or English" aria-label="Search the whole course" value="${esc(courseQuery)}">
      <div id="search-results"></div>
    </div>
    ${levels.map(l => `<section class="level"><div class="level-head"><h2>${l}</h2><span>${LEVELS[l] || ""}</span></div>
      <div class="units">${UNITS.filter(u => u.level === l).map(unitCardHTML).join("")}</div></section>`).join("")}`;
  $("#course-search").addEventListener("input", e => { courseQuery = e.target.value; drawSearch(); });
  drawSearch();
}
function bannerHTML() {
  if (supabase && !user && !lsGet("parlo.hide.signin", false))
    return `<div class="sheet banner"><span>Sign in to keep your progress and deck in sync on every device.</span><span class="btn-row"><button class="btn primary inline" data-go="account">Sign in</button><button class="btn inline" data-hide-banner="signin">Not now</button></span></div>`;
  if (canInstall() && !lsGet("parlo.hide.install", false))
    return `<div class="sheet banner"><span>Install Parlo on this device. It opens like an app and works offline.</span><span class="btn-row"><button class="btn primary inline" data-install>Install</button><button class="btn inline" data-hide-banner="install">Not now</button></span></div>`;
  return "";
}
function nextDueText() {
  const later = ORDER.filter(id => statusOf(id) === "later");
  if (!later.length) return "New cards are ready.";
  return "Next card due in " + fmtIn(Math.min(...later.map(id => st[id].d)) - Date.now()) + ".";
}
function unitCardHTML(u) {
  const c = counts(UNIT_IDS[u.n]);
  const pct = Math.round(c.known / Math.max(1, c.total) * 100);
  return `<button class="unit-card ${pct === 100 ? "done" : ""}" data-unit="${u.n}">
    <span class="num"><span>Unità ${pad(u.n)}</span><span>${c.due ? c.due + " due" : pct ? pct + "%" : ""}</span></span>
    <span class="t">${esc(u.title)}</span><span class="e">${esc(u.en)}</span>${barHTML(c)}</button>`;
}
function drawSearch() {
  const box = $("#search-results"); if (!box) return;
  const q = courseQuery.trim().toLowerCase();
  if (q.length < 2) { box.innerHTML = ""; return; }
  const hits = ORDER.filter(id => say(id).toLowerCase().includes(q) || ITEMS[id].d.en.toLowerCase().includes(q));
  hits.sort((a, b) => (say(a).toLowerCase().startsWith(q) ? 0 : 1) - (say(b).toLowerCase().startsWith(q) ? 0 : 1));
  box.innerHTML = hits.length
    ? `<div class="eyebrow" style="margin-bottom:8px">${hits.length} result${hits.length === 1 ? "" : "s"}${hits.length > 40 ? " · showing 40" : ""}</div><div class="sheet list">${hits.slice(0, 40).map(id => rowHTML(id, "global")).join("")}</div>`
    : `<div class="sheet empty">Nothing in the course matches “${esc(courseQuery)}”.</div>`;
}

/* ================= Unit view ================= */
let wordCat = "all", wordStatus = "all", wordQuery = "", verbIdx = 0, tenseK = "pres", lastUnit = 0;
function viewUnit() {
  const u = unitByN(view.u);
  if (u.n !== lastUnit) { wordCat = "all"; wordStatus = "all"; wordQuery = ""; verbIdx = view.verbIdx ?? 0; lastUnit = u.n; }
  const tab = view.tab;
  const c = counts(UNIT_IDS[u.n]);
  app.innerHTML = `
    <a class="back" href="#/">← All units</a>
    <div class="unit-head">
      <div>
        <div class="eyebrow">Unità ${u.n} · ${u.level}</div>
        <h1>${esc(u.title)}</h1>
        <p class="lede">${esc(u.en)}. ${esc(u.intro || "")}</p>
      </div>
      <div class="unit-prog">
        <div data-prog="${u.n}">${progHTML(c)}</div>
        <button class="btn primary inline" data-practice-unit="${u.n}" style="justify-self:start">Practise this unit</button>
      </div>
    </div>
    <nav class="tabs" role="tablist" aria-label="Unit sections">
      ${[["words", "Parole", (UNIT_IDS[u.n] || []).filter(id => ITEMS[id].type === "w").length], ["verbs", "Verbi", u.verbs.length], ["phrases", "Frasi", u.phrases.length], ["quiz", "Quiz", 10]].map(([k, l, n]) =>
        `<button class="tab" role="tab" data-utab="${k}" aria-selected="${k === tab}">${l} <span class="n">${n}</span></button>`).join("")}
    </nav>
    <section class="panel" id="unit-panel"></section>
    <div style="display:flex;justify-content:space-between;margin-top:28px;gap:10px;flex-wrap:wrap">
      ${unitByN(u.n - 1) ? `<button class="back" data-unit="${u.n - 1}">← Unità ${u.n - 1}: ${esc(unitByN(u.n - 1).title)}</button>` : "<span></span>"}
      ${unitByN(u.n + 1) ? `<button class="back" data-unit="${u.n + 1}">Unità ${u.n + 1}: ${esc(unitByN(u.n + 1).title)} →</button>` : ""}
    </div>`;
  ({ words: drawWords, verbs: drawVerbs, phrases: drawPhrases, quiz: startQuiz })[tab](u);
}
function drawWords(u) {
  $("#unit-panel").innerHTML = `<div class="toolbar">
      <button class="chip" data-cat="all" aria-pressed="${wordCat === "all"}">All</button>
      ${Object.entries(u.cats).map(([k, v]) => `<button class="chip" data-cat="${esc(k)}" aria-pressed="${wordCat === k}">${esc(v)}</button>`).join("")}
    </div>
    <div class="toolbar">
      ${[["all", "Any status"], ["new", "New"], ["due", "Due"], ["later", "Learning"], ["known", "Known"], ["star", "★ In my deck"]].map(([k, l]) => `<button class="chip" data-wstatus="${k}" aria-pressed="${wordStatus === k}">${l}</button>`).join("")}
      <input class="search small" id="word-search" type="search" placeholder="Search this unit" aria-label="Search this unit" value="${esc(wordQuery)}">
    </div>
    <div class="sheet list" id="word-list"></div>`;
  $("#word-search").addEventListener("input", e => { wordQuery = e.target.value.trim().toLowerCase(); drawWordList(u); });
  drawWordList(u);
}
function drawWordList(u) {
  if (wordCat !== "all" && !u.cats[wordCat]) wordCat = "all";
  const ids = (UNIT_IDS[u.n] || []).filter(id => ITEMS[id].type === "w").filter(id => {
    const w = ITEMS[id].d;
    if (wordCat !== "all" && w.c !== wordCat) return false;
    if (wordStatus === "star" ? !starred(id) : wordStatus !== "all" && statusOf(id) !== wordStatus) return false;
    return !wordQuery || full(w).toLowerCase().includes(wordQuery) || w.en.toLowerCase().includes(wordQuery);
  });
  $("#word-list").innerHTML = ids.length ? ids.map(id => rowHTML(id, "unit")).join("") : `<div class="empty">No words match these filters.</div>`;
}
function vheadHTML(id) {
  const v = ITEMS[id].d;
  return `<div><h2>${esc(v.inf)}</h2><div style="font-size:18px;font-weight:500">${esc(v.en)}</div></div>
    <div class="actions">${actionsHTML(id)}</div>${menuHTML(id)}`;
}
function drawVerbs(u) {
  if (verbIdx >= u.verbs.length) verbIdx = 0;
  const v = u.verbs[verbIdx], id = "v:" + v.inf;
  const tense = TENSES.find(t => t.k === tenseK);
  const pron = tenseK === "cong" ? PRON.map(p => "che " + p) : PRON;
  $("#unit-panel").innerHTML = `<div class="verbs">
    <div class="verb-list" role="tablist" aria-label="Verbs">
      ${u.verbs.map((x, i) => `<button class="verb-pick" role="tab" data-verb="${i}" aria-selected="${i === verbIdx}"><span class="it">${esc(x.inf)}</span><span class="dot ${statusOf("v:" + x.inf)}" data-vdot="v:${esc(x.inf)}"></span></button>`).join("")}
    </div>
    <div class="sheet verb-card">
      <div class="vhead" data-vhead="${esc(id)}">${vheadHTML(id)}</div>
      <div class="verb-meta"><span class="tag">${esc(v.kind)}</span><span class="tag ${v.aux === "essere" ? "f" : "m"}">past with ${esc(v.aux)}</span></div>
      <div class="tense-tabs">${TENSES.map(t => `<button class="chip" data-tense="${t.k}" aria-pressed="${t.k === tenseK}">${t.it}</button>`).join("")}</div>
      <p class="tense-hint">${tense.it}: ${esc(tense.en)}</p>
      <table class="conj"><tbody>${v.t[tenseK].map((f, i) => `<tr><td>${pron[i]}</td><td class="form">${esc(f)}</td><td style="text-align:right">${canSpeak && f !== "—" ? `<button class="icon-btn" data-say-text="${esc(f.replace(/\/[aie]+/g, ""))}" aria-label="Listen to ${esc(f)}">${ICON.speak}</button>` : ""}</td></tr>`).join("")}</tbody></table>
      <div class="examples">${v.ex.map(([it, en]) => `<div class="ex"><span class="it">${esc(it)}</span><br>${esc(en)}</div>`).join("")}</div>
      <div class="callout">${rich(v.note)}</div>
    </div></div>`;
}
function drawPhrases(u) {
  const ids = (UNIT_IDS[u.n] || []).filter(id => ITEMS[id].type === "p");
  const groups = [...new Set(ids.map(id => ITEMS[id].d.fn))];
  $("#unit-panel").innerHTML = groups.map(g => `<div class="group"><h3 class="group-title">${esc(g)}</h3><div class="sheet">
    ${ids.filter(id => ITEMS[id].d.fn === g).map(id => rowHTML(id, "unit")).join("")}</div></div>`).join("");
}

/* ================= Quiz ================= */
let quiz = [], qi = 0, results = [], answered = false;
const makeOptions = (answer, pool, n = 4) => shuffle([answer, ...shuffle([...new Set(pool)].filter(x => x && x !== answer && x !== "—")).slice(0, n - 1)]);
function startQuiz(u) {
  const words = (UNIT_IDS[u.n] || []).filter(id => ITEMS[id].type === "w").map(id => ITEMS[id].d);
  const phrases = (UNIT_IDS[u.n] || []).filter(id => ITEMS[id].type === "p").map(id => ITEMS[id].d);
  const nouns = words.filter(w => ["il", "lo", "la", "l'"].includes(w.art));
  const kinds = shuffle(["meaning", "meaning", "meaning", "article", "article", "conj", "conj", "conj", "phrase", "phrase"]);
  const usedW = new Set(), usedP = new Set();
  const fresh = (pool, used, key) => { const left = pool.filter(x => !used.has(key(x))); const x = pick(left.length ? left : pool); used.add(key(x)); return x; };
  quiz = kinds.map(k => {
    if (k === "article" && nouns.length >= 2) {
      const w = fresh(nouns, usedW, x => x.it);
      return { kind: "Gender", prompt: `Which article? <span class="blank"></span> <span class="it">${esc(w.it)}</span>`, answer: w.art, opts: ["il", "lo", "la", "l'"], it: true, explain: `<b>${esc(full(w))}</b> is ${w.g === "m" ? "masculine" : "feminine"}.` };
    }
    if (k === "conj") {
      const v = pick(u.verbs), t = pick(TENSES.filter(t => ["pres", "fut", "pp", "imp"].includes(t.k)));
      const p = pick([0, 1, 2, 3, 4, 5].filter(i => v.t[t.k][i] !== "—"));
      const ans = v.t[t.k][p];
      return { kind: "Verbs · " + t.it, prompt: `<span class="it">${PRON[p]} <span class="blank"></span></span> &nbsp;(${esc(v.inf)})`, answer: ans, opts: makeOptions(ans, v.t[t.k]), it: true, explain: `${t.it} of <b>${esc(v.inf)}</b>: ${v.t[t.k].filter(f => f !== "—").map(esc).join(", ")}` };
    }
    if (k === "phrase" && phrases.length >= 4) {
      const ph = fresh(phrases, usedP, x => x.it);
      return { kind: "Phrases", prompt: `When would you say <span class="it">“${esc(ph.it)}”</span>?`, answer: ph.en, opts: makeOptions(ph.en, phrases.map(x => x.en)), explain: `<span class="it">${esc(ph.ex)}</span> · ${esc(ph.exEn)}` };
    }
    const w = fresh(words, usedW, x => x.it);
    const same = words.filter(x => x.c === w.c).map(x => x.en);
    return { kind: "Vocabulary", prompt: `What does <span class="it">${esc(full(w))}</span> mean?`, answer: w.en, opts: makeOptions(w.en, same.length >= 4 ? same : words.map(x => x.en)), explain: `<span class="it">${esc(w.ex)}</span> · ${esc(w.exEn)}` };
  });
  qi = 0; results = []; answered = false; drawQuiz();
}
function drawQuiz() {
  const p = $("#unit-panel"); if (!p) return;
  if (qi >= quiz.length) {
    const score = results.filter(Boolean).length;
    const msg = score >= 9 ? "Ottimo! You're ready for the next unit." : score >= 6 ? "Bene! Review what you missed, then try again." : "Keep going. A practice session first will help.";
    p.innerHTML = `<div class="quiz"><div class="sheet result"><div class="eyebrow">Your score</div><div class="score">${score}<span> / ${quiz.length}</span></div><p>${msg}</p><button class="btn primary inline" data-quiz-retry>New quiz</button></div></div>`;
    return;
  }
  const q = quiz[qi];
  p.innerHTML = `<div class="quiz">
    <div class="qhead"><span>Question ${qi + 1} of ${quiz.length}</span><span class="dots">${quiz.map((_, i) => `<i class="${i < results.length ? (results[i] ? "ok" : "no") : i === qi ? "cur" : ""}"></i>`).join("")}</span></div>
    <div class="sheet qcard"><div class="qkind">${q.kind}</div><div class="qprompt">${q.prompt}</div>
      <div class="opts">${q.opts.map((o, i) => `<button class="opt ${q.it ? "itf" : ""}" data-opt="${i}">${esc(o)}</button>`).join("")}</div>
      <div class="feedback" id="fb"></div></div></div>`;
  answered = false;
}
function answerQuiz(btn) {
  if (answered) return; answered = true;
  const q = quiz[qi], ok = q.opts[+btn.dataset.opt] === q.answer;
  results.push(ok);
  document.querySelectorAll(".opt").forEach(b => { b.disabled = true; if (q.opts[+b.dataset.opt] === q.answer) b.classList.add("right"); else if (b === btn) b.classList.add("wrong"); });
  $("#fb").innerHTML = `<div style="color:var(${ok ? "--ok" : "--bad"});font-weight:600">${ok ? "Giusto!" : "Not quite."}</div><div style="margin-top:4px">${q.explain}</div>
    <div style="margin-top:14px"><button class="btn primary inline" data-quiz-next>${qi + 1 < quiz.length ? "Next question" : "See score"}</button></div>`;
  $("[data-quiz-next]").focus();
}

/* ================= Practice (spaced repetition) ================= */
let session = null;
function poolFor(src, u) {
  if (src === "unit") return UNIT_IDS[u] || [];
  if (src === "deck") return ORDER.filter(starred);
  return ORDER;
}
function buildSession() {
  const pool = poolFor(view.src, view.u);
  const due = dueIds(pool);
  const fresh = pool.filter(id => statusOf(id) === "new").slice(0, pref.newN);
  let queue = [...due, ...fresh];
  const cram = view.src === "deck" && !queue.length;
  if (cram) queue = pool.filter(id => statusOf(id) === "later").slice(0, 30);
  session = { queue: queue.slice(0, 60), done: 0, flipped: false, cram };
}
function viewPractice() {
  const srcs = [["due", "All units"], ...(view.src === "unit" && view.u ? [["unit", "Unità " + view.u]] : []), ["deck", "★ My deck"]];
  app.innerHTML = `<div class="practice">
    <div><div class="eyebrow">Ripasso · spaced repetition</div><h1 style="font-size:clamp(32px,6vw,46px)">Review</h1></div>
    <div class="p-opts">
      <div class="seg" role="group" aria-label="What to review">${srcs.map(([k, l]) => `<button data-src="${k}" aria-pressed="${view.src === k}">${l}</button>`).join("")}</div>
      <div class="seg" role="group" aria-label="Direction"><button data-dir="it" aria-pressed="${pref.dir === "it"}">IT → EN</button><button data-dir="en" aria-pressed="${pref.dir === "en"}">EN → IT</button></div>
    </div>
    <div class="p-opts" style="justify-content:flex-start;font-size:13px;color:var(--muted)">New cards per session
      <div class="seg" role="group" aria-label="New cards per session">${[0, 10, 20, 30].map(n => `<button data-newn="${n}" aria-pressed="${pref.newN === n}">${n}</button>`).join("")}</div>
    </div>
    <div id="flash-area"></div>
    <p class="p-foot"><kbd>Space</kbd> flips · <kbd>1</kbd> 10 min · <kbd>2</kbd> 1 day · <kbd>3</kbd> 3 days · <kbd>4</kbd> 7 days · <kbd>5</kbd> I know this</p>
  </div>`;
  buildSession(); drawCard();
}
const nextIndex = () => session.queue.findIndex(id => { const s = statusOf(id); return s === "new" || s === "due" || session.cram; });
function drawCard() {
  const area = $("#flash-area"); if (!area) return;
  timers.forEach(clearInterval); timers = [];
  if (!session.queue.length) {
    const pool = poolFor(view.src, view.u);
    const msg = view.src === "deck" && !pool.length
      ? `Your deck is empty. Tap the <span style="color:var(--mark)">★</span> next to any word, verb or phrase to add it here.`
      : session.done ? `Session done: ${session.done} card${session.done === 1 ? "" : "s"} reviewed.` : "Nothing due right now.";
    const later = pool.filter(id => statusOf(id) === "later");
    const next = later.length ? Math.min(...later.map(id => st[id].d)) : 0;
    const newLeft = pool.filter(id => statusOf(id) === "new").length;
    area.innerHTML = `<div class="flash"><div><span style="font-family:var(--display);font-size:40px;font-style:italic">${session.done ? "Bravo!" : "Tutto fatto"}</span>
      <p style="color:var(--muted);max-width:40ch;margin:10px auto 0">${msg}${next ? ` Next card due in ${fmtIn(next - Date.now())}.` : ""}</p>
      ${newLeft && pref.newN === 0 ? `<p style="font-size:13px;color:var(--muted)">New cards are switched off. Choose 10, 20 or 30 above to learn new ones.</p>` : ""}
      ${newLeft && pref.newN ? `<div style="margin-top:16px"><button class="btn primary inline" data-again>Learn ${Math.min(pref.newN, newLeft)} new cards</button></div>` : ""}</div></div>`;
    return;
  }
  const i = nextIndex();
  if (i < 0) {
    const next = Math.min(...session.queue.map(id => st[id]?.d || Infinity));
    area.innerHTML = `<div class="flash"><div><span style="font-family:var(--display);font-size:34px;font-style:italic">Una pausa</span>
      <p style="color:var(--muted);margin:10px auto 0;max-width:40ch">${session.queue.length} card${session.queue.length === 1 ? "" : "s"} set to “10 min” will be back in <b id="wait">${fmtIn(next - Date.now())}</b>.</p>
      <div style="margin-top:16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="btn primary inline" data-review-now>Review them now</button><button class="btn inline" data-end>End session</button></div></div></div>`;
    timers.push(setInterval(() => { if (Date.now() >= next) drawCard(); else { const w = $("#wait"); if (w) w.textContent = fmtIn(next - Date.now()); } }, 5000));
    return;
  }
  if (i > 0) { const [id] = session.queue.splice(i, 1); session.queue.unshift(id); }
  const id = session.queue[0], it = ITEMS[id], d = it.d;
  const front = pref.dir === "it" ? say(id) : meaning(id), back = pref.dir === "it" ? meaning(id) : say(id);
  const ex = it.type === "v" ? [d.ex[0][0], d.ex[0][1]] : [d.ex, d.exEn];
  area.innerHTML = `<div class="flash" id="card" role="button" tabindex="0" aria-label="${session.flipped ? "Card" : "Flip card"}">
      <span class="count">${session.done + 1} / ${session.done + session.queue.length} · U${it.u} · ${it.type === "w" ? "word" : it.type === "v" ? "verb" : "phrase"}${statusOf(id) === "new" ? " · new" : ""}</span>
      <span class="corner"><button class="icon-btn star" data-star="${esc(id)}" aria-pressed="${starred(id)}" aria-label="${starred(id) ? "Remove from" : "Add to"} my deck">${ICON.star}</button>${canSpeak ? `<button class="icon-btn" data-say="${esc(id)}" aria-label="Listen">${ICON.speak}</button>` : ""}</span>
      <span style="display:block">
        <span class="front ${pref.dir === "en" ? "en" : ""}" style="display:block">${esc(front)}</span>
        ${session.flipped ? `<span class="back" style="display:grid">
            <span class="ans ${pref.dir === "en" ? "it" : ""}">${esc(back)}</span>
            ${it.type === "v" ? `<span class="vline">${d.t.pres.map(esc).join(" · ")}</span>` : ""}
            <span class="ex"><span class="it">${esc(ex[0])}</span><br>${esc(ex[1])}</span></span>`
          : `<span class="hint" style="display:block">Tap or press Space to reveal</span>`}
      </span>
    </div>
    ${session.flipped ? `<div class="rate" style="margin-top:12px">
      <button class="btn again" data-rate="10m">10 min<small>again soon</small></button>
      <button class="btn" data-rate="1d">1 day<small>hard</small></button>
      <button class="btn" data-rate="3d">3 days<small>good</small></button>
      <button class="btn" data-rate="7d">7 days<small>easy</small></button>
      <button class="btn know" data-rate="known">I know this<small>stop reviewing</small></button></div>` : ""}`;
}
function flip() {
  if (!session || session.flipped || !session.queue.length || nextIndex() < 0) return;
  session.flipped = true; speak(say(session.queue[0])); drawCard();
}
function rate(key) {
  if (!session || !session.flipped) return;
  const id = session.queue.shift();
  schedule(id, key);
  if (key === "10m") session.queue.push(id); else session.done++;
  session.flipped = false; drawCard();
}

/* ================= Deck view ================= */
let deckType = "all";
function viewDeck() {
  const ids = ORDER.filter(starred);
  const shown = ids.filter(id => deckType === "all" || ITEMS[id].type === deckType);
  const n = t => ids.filter(id => ITEMS[id].type === t).length;
  app.innerHTML = `<div class="unit-head" style="margin-top:0">
      <div><div class="eyebrow">Il mio mazzo · my deck</div><h1>★ My deck</h1>
        <p class="lede">Everything you've starred, from any unit. Practise it on its own whenever you like.</p></div>
      <div class="unit-prog">${ids.length ? `<div>${progHTML(counts(ids), false, "Deck progress")}</div><button class="btn primary inline" data-go="review" data-src-go="deck" style="justify-self:start">Practise my deck</button>` : ""}</div>
    </div>
    <div class="toolbar" style="margin-top:22px">
      ${[["all", "All", ids.length], ["w", "Words", n("w")], ["v", "Verbs", n("v")], ["p", "Phrases", n("p")]].map(([k, l, x]) => `<button class="chip" data-dtype="${k}" aria-pressed="${deckType === k}">${l} ${x}</button>`).join("")}
    </div>
    ${shown.length ? `<div class="sheet list">${shown.map(id => rowHTML(id, "global")).join("")}</div>`
      : `<div class="sheet empty"><span class="it">Ancora vuoto</span>Your deck is empty. Tap the ☆ next to any word, verb or phrase in a unit to add it here.</div>`}`;
}

/* ================= Account view ================= */
let authMode = "signin", recovery = false, authMsg = null, deleteArmed = false;
const msgHTML = () => authMsg ? `<div class="msg ${authMsg.ok ? "ok" : "err"}" role="${authMsg.ok ? "status" : "alert"}">${esc(authMsg.text)}</div>` : "";
function setMsg(text, ok = false) { authMsg = text ? { text, ok } : null; const m = $("#auth-msg"); if (m) m.innerHTML = msgHTML(); }
const friendly = e => {
  const m = (e && e.message) || String(e);
  if (/invalid login credentials/i.test(m)) return "That email and password don't match. Check them, or use “Forgot password?”.";
  if (/email not confirmed/i.test(m)) return "Confirm your email first: open the link we sent you, then sign in.";
  if (/already registered/i.test(m)) return "There's already an account with this email. Sign in instead.";
  if (/password should be at least/i.test(m)) return "Choose a password with at least 8 characters.";
  if (/rate limit|too many/i.test(m)) return "Too many attempts. Wait a minute and try again.";
  if (/fetch|network/i.test(m)) return "You seem to be offline. Connect to the internet and try again.";
  return m;
};
function installHTML() {
  if (isStandalone()) return `<p>Parlo is installed on this device.</p>`;
  if (deferredPrompt) return `<p>Add Parlo to this device. It opens like an app and works offline.</p><div><button class="btn primary inline" data-install>Install Parlo</button></div>`;
  if (isIOS) return `<p>On iPhone or iPad: open this page in Safari, tap the Share button, then <b>Add to Home Screen</b>.</p>`;
  return `<p>In Chrome or Edge, use the install icon in the address bar, or the browser menu → <b>Install Parlo</b>. On Android: menu → <b>Add to Home screen</b>.</p>`;
}
function viewAccount() {
  const install = `<div class="sheet card"><h2>Install the app</h2>${installHTML()}</div>`;
  const prefs = `<div class="sheet card"><h2>Study settings</h2>
      <div class="field"><label>New cards per review session</label><div class="seg" role="group" aria-label="New cards per session">${[0, 10, 20, 30].map(n => `<button data-newn="${n}" aria-pressed="${pref.newN === n}">${n}</button>`).join("")}</div></div>
      <div class="field"><label>Flashcard direction</label><div class="seg" role="group" aria-label="Direction"><button data-dir="it" aria-pressed="${pref.dir === "it"}">Italian → English</button><button data-dir="en" aria-pressed="${pref.dir === "en"}">English → Italian</button></div></div>
    </div>`;
  const data = `<div class="sheet card"><h2>Your data</h2>
      <p>${Object.values(st).filter(e => e.k || e.d || e.s).length} items with progress or a star.</p>
      <div class="btn-row"><button class="btn inline" data-export>Download a backup</button><label class="btn inline" style="cursor:pointer">Restore a backup<input type="file" id="import-file" accept="application/json,.json" hidden></label></div>
      <button class="text-btn" data-reset-progress style="color:var(--bad)">${deleteArmed === "reset" ? "Tap again to erase all progress and your deck" : "Reset all progress"}</button>
    </div>`;
  if (!supabase) {
    app.innerHTML = `<div class="account"><div><div class="eyebrow">Impostazioni</div><h1>Settings</h1>
      <p class="lede">Accounts aren't set up for this copy of Parlo, so your progress is saved on this device only.</p></div>${prefs}${install}${data}</div>`;
    return;
  }
  if (recovery) {
    app.innerHTML = `<div class="account"><div><div class="eyebrow">Account</div><h1>New password</h1></div>
      <form class="sheet card" id="recovery-form"><div class="field"><label for="new-pass">New password</label><input class="input" id="new-pass" type="password" autocomplete="new-password" minlength="8" required></div>
      <div id="auth-msg">${msgHTML()}</div><button class="btn primary wide">Save new password</button></form></div>`;
    $("#recovery-form").addEventListener("submit", async e => {
      e.preventDefault();
      const { error } = await supabase.auth.updateUser({ password: $("#new-pass").value });
      if (error) return setMsg(friendly(error));
      recovery = false; authMsg = null; showToast("Password updated. You're signed in."); go("course");
    });
    return;
  }
  if (!user) {
    const up = authMode === "signup";
    app.innerHTML = `<div class="account">
      <div><div class="eyebrow">Account</div><h1>${up ? "Create your account" : "Sign in"}</h1>
        <p class="lede">An account keeps your progress and deck in sync on your phone, tablet and computer. You can also keep using Parlo without one; progress then stays on this device.</p></div>
      <div class="sheet card">
        <button class="btn wide google" data-google>${ICON.google} Continue with Google</button>
        <div class="divider">or with email</div>
        <form id="auth-form" style="display:grid;gap:12px">
          ${up ? `<div class="field"><label for="auth-name">Your name</label><input class="input" id="auth-name" autocomplete="name" required></div>` : ""}
          <div class="field"><label for="auth-email">Email</label><input class="input" id="auth-email" type="email" autocomplete="email" required></div>
          <div class="field"><label for="auth-pass">Password${up ? " (at least 8 characters)" : ""}</label><input class="input" id="auth-pass" type="password" autocomplete="${up ? "new-password" : "current-password"}" ${up ? 'minlength="8"' : ""} required></div>
          <div id="auth-msg">${msgHTML()}</div>
          <button class="btn primary wide" id="auth-submit">${up ? "Create account" : "Sign in"}</button>
        </form>
        ${up ? "" : `<div class="btn-row" style="justify-content:space-between"><button class="text-btn" data-magic>Email me a sign-in link</button><button class="text-btn" data-forgot>Forgot password?</button></div>`}
        <p style="font-size:14px">${up ? `Already have an account? <button class="text-btn" data-auth-mode="signin">Sign in</button>` : `New to Parlo? <button class="text-btn" data-auth-mode="signup">Create an account</button>`}</p>
      </div>${prefs}${install}</div>`;
    $("#auth-form").addEventListener("submit", async e => {
      e.preventDefault();
      const email = $("#auth-email").value.trim(), password = $("#auth-pass").value;
      const btn = $("#auth-submit"); btn.disabled = true; setMsg("");
      try {
        if (up) {
          const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: appUrl(), data: { full_name: $("#auth-name").value.trim() } } });
          if (error) throw error;
          if (!data.session) setMsg(`Almost there: we sent a confirmation link to ${email}. Open it on this device to finish.`, true);
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        }
      } catch (err) { setMsg(friendly(err)); }
      finally { btn.disabled = false; }
    });
    return;
  }
  const provider = user.app_metadata?.provider === "google" ? "Google" : "Email";
  app.innerHTML = `<div class="account">
    <div><div class="eyebrow">Account</div><h1>Ciao, ${esc(displayName().split(" ")[0])}</h1></div>
    <div class="sheet card"><h2>Profile</h2>
      <form id="profile-form" style="display:grid;gap:12px">
        <div class="field"><label for="p-name">Name</label><input class="input" id="p-name" value="${esc(displayName())}" autocomplete="name" required></div>
        <dl class="kv"><dt>Email</dt><dd>${esc(user.email || "")}</dd><dt>Signed in with</dt><dd>${provider}</dd><dt>Last synced</dt><dd id="last-sync">${lastSync ? new Date(lastSync).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</dd></dl>
        <div id="auth-msg">${msgHTML()}</div>
        <div class="btn-row"><button class="btn primary inline">Save name</button><button type="button" class="btn inline" data-sync-now>Sync now</button></div>
      </form>
      ${provider === "Email" ? `<form id="pass-form" style="display:grid;gap:8px;margin-top:6px"><div class="field"><label for="p-pass">Change password</label><input class="input" id="p-pass" type="password" autocomplete="new-password" minlength="8" placeholder="New password" required></div><button class="btn inline" style="justify-self:start">Update password</button></form>` : ""}
    </div>
    ${prefs}${install}${data}
    <div class="sheet card"><h2>Sign out or delete</h2>
      <p>Signing out keeps your progress safe in your account. Deleting your account erases it for good.</p>
      <div class="btn-row"><button class="btn inline" data-signout>Sign out</button>
        ${deleteArmed === "delete" ? `<input class="input" id="del-confirm" placeholder="Type DELETE" style="max-width:150px" aria-label="Type DELETE to confirm"><button class="btn danger solid inline" data-delete-confirm>Delete my account</button><button class="btn inline" data-delete-cancel>Cancel</button>`
          : `<button class="btn danger inline" data-delete>Delete account…</button>`}</div>
    </div></div>`;
  $("#profile-form").addEventListener("submit", async e => {
    e.preventDefault();
    const name = $("#p-name").value.trim(); if (!name) return;
    const { error } = await supabase.from("profiles").update({ display_name: name, updated_at: new Date().toISOString() }).eq("id", user.id);
    if (error) return setMsg(friendly(error));
    profile = Object.assign(profile || {}, { display_name: name }); renderAccountButton(); setMsg("Name saved.", true);
  });
  $("#pass-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: $("#p-pass").value });
    if (error) return setMsg(friendly(error));
    $("#p-pass").value = ""; setMsg("Password updated.", true);
  });
}
function exportData() {
  const blob = new Blob([JSON.stringify({ app: "parlo-italiano", v: 1, exportedAt: new Date().toISOString(), pref, items: st }, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = `parlo-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
async function importData(file) {
  try {
    const j = JSON.parse(await file.text());
    if (j.app !== "parlo-italiano" || !j.items) throw new Error("bad");
    const changed = mergeEntries(j.items);
    changed.forEach(id => dirty.add(unitOf(id))); lsSet(dirtyKey(), [...dirty]); applyChanged(changed); pushSoon();
    showToast(`Backup restored: ${changed.length} item${changed.length === 1 ? "" : "s"} updated.`);
    render();
  } catch (e) { showToast("That file isn't a Parlo backup."); }
}

/* ================= Install (PWA) ================= */
let deferredPrompt = null;
const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const canInstall = () => !!deferredPrompt && !isStandalone();
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredPrompt = e; if (["course", "account"].includes(view.name)) render(); });
window.addEventListener("appinstalled", () => { deferredPrompt = null; showToast("Parlo is installed. Find it on your home screen or app list."); });
async function install() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice.catch(() => {});
  deferredPrompt = null; render();
}

/* ================= Events ================= */
document.addEventListener("click", async e => {
  const t = e.target.closest("button, #card"); if (!t) return;
  const ds = t.dataset;
  if (ds.srcGo) { go("review", { src: ds.srcGo }); return; }
  if (ds.go) { go(ds.go, ds.go === "review" ? { src: "due" } : {}); return; }
  if (ds.unit) { go("unit", { u: +ds.unit, tab: "words" }); return; }
  if (ds.say) { speak(say(ds.say)); return; }
  if (ds.sayText) { speak(ds.sayText); return; }
  if (ds.star) { e.stopPropagation(); toggleStar(ds.star); if (view.name === "deck") viewDeck(); return; }
  if (ds.menu) { const prev = openMenu; openMenu = openMenu === ds.menu ? null : ds.menu; refreshItem(prev); refreshItem(ds.menu); return; }
  if (ds.sched) { openMenu = null; schedule(ds.id, ds.sched); if (view.name === "unit" && view.tab === "words" && wordStatus !== "all") drawWordList(unitByN(view.u)); return; }
  if (ds.openVerb) { const it = ITEMS[ds.openVerb]; const u = unitByN(it.u); lastUnit = it.u; verbIdx = u.verbs.findIndex(v => "v:" + v.inf === it.id); go("unit", { u: it.u, tab: "verbs" }); return; }
  if (ds.utab) { go("unit", { u: view.u, tab: ds.utab }); return; }
  if (ds.cat) { wordCat = ds.cat; drawWords(unitByN(view.u)); return; }
  if (ds.wstatus) { wordStatus = ds.wstatus; drawWords(unitByN(view.u)); return; }
  if (ds.verb) { verbIdx = +ds.verb; drawVerbs(unitByN(view.u)); return; }
  if (ds.tense) { tenseK = ds.tense; drawVerbs(unitByN(view.u)); return; }
  if (ds.opt !== undefined) { answerQuiz(t); return; }
  if (ds.quizNext !== undefined) { qi++; drawQuiz(); return; }
  if (ds.quizRetry !== undefined) { startQuiz(unitByN(view.u)); return; }
  if (ds.practiceUnit) { go("review", { src: "unit", u: +ds.practiceUnit }); return; }
  if (ds.dtype) { deckType = ds.dtype; viewDeck(); return; }
  if (ds.src) { go("review", { src: ds.src, u: view.u }); return; }
  if (ds.dir) { savePref({ dir: ds.dir }); render(); return; }
  if (ds.newn) { savePref({ newN: +ds.newn }); render(); return; }
  if (ds.rate) { rate(ds.rate); return; }
  if (ds.again !== undefined) { buildSession(); drawCard(); return; }
  if (ds.reviewNow !== undefined) { session.cram = true; drawCard(); return; }
  if (ds.end !== undefined) { session.queue = []; drawCard(); return; }
  if (ds.hideBanner) { lsSet("parlo.hide." + ds.hideBanner, true); render(); return; }
  if (ds.install !== undefined) { install(); return; }
  // Account
  if (ds.authMode) { authMode = ds.authMode; authMsg = null; viewAccount(); return; }
  if (ds.google !== undefined) {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: appUrl() } });
    if (error) setMsg(friendly(error)); return;
  }
  if (ds.magic !== undefined || ds.forgot !== undefined) {
    const email = $("#auth-email").value.trim();
    if (!email) { setMsg("Enter your email above first."); $("#auth-email").focus(); return; }
    t.disabled = true;
    const { error } = ds.magic !== undefined
      ? await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: appUrl(), shouldCreateUser: false } })
      : await supabase.auth.resetPasswordForEmail(email, { redirectTo: appUrl() });
    t.disabled = false;
    if (error) setMsg(friendly(error));
    else setMsg(ds.magic !== undefined ? `Check ${email}: we sent you a sign-in link.` : `Check ${email}: we sent you a link to choose a new password.`, true);
    return;
  }
  if (ds.syncNow !== undefined) { await pull(); setMsg(syncError ? "Couldn't reach the server. Try again when you're online." : "Everything is in sync.", !syncError); return; }
  if (ds.signout !== undefined) { if (dirty.size) await push(); await supabase.auth.signOut(); showToast("Signed out. Your progress is saved in your account."); go("course"); return; }
  if (ds.delete !== undefined) { deleteArmed = "delete"; viewAccount(); $("#del-confirm")?.focus(); return; }
  if (ds.deleteCancel !== undefined) { deleteArmed = false; viewAccount(); return; }
  if (ds.deleteConfirm !== undefined) {
    if ($("#del-confirm").value.trim() !== "DELETE") { $("#del-confirm").focus(); return; }
    t.disabled = true;
    const uid = user.id;
    const { error } = await supabase.rpc("delete_own_account");
    if (error) { t.disabled = false; setMsg(friendly(error)); return; }
    lsDel("parlo.items." + uid); lsDel("parlo.dirty." + uid);
    deleteArmed = false; await supabase.auth.signOut({ scope: "local" });
    showToast("Your account and its data have been deleted."); go("course"); return;
  }
  if (ds.export !== undefined) { exportData(); return; }
  if (ds.resetProgress !== undefined) {
    if (deleteArmed !== "reset") { deleteArmed = "reset"; viewAccount(); setTimeout(() => { if (deleteArmed === "reset") { deleteArmed = false; if (view.name === "account") viewAccount(); } }, 5000); return; }
    deleteArmed = false;
    const now = Date.now();
    for (const id of Object.keys(st)) { st[id] = { t: now }; dirty.add(unitOf(id)); }
    lsSet(dirtyKey(), [...dirty]); saveLocal(); pushSoon(); refreshCounts(); showToast("All progress has been reset."); render(); return;
  }
  if (t.id === "card") flip();
});
document.addEventListener("change", e => { if (e.target.id === "import-file" && e.target.files[0]) importData(e.target.files[0]); });
document.addEventListener("keydown", e => {
  if (view.name !== "review" || e.target.matches("input, textarea") || e.metaKey || e.ctrlKey || e.altKey) return;
  if ((e.code === "Space" || e.key === "Enter") && session && !session.flipped && !e.target.closest(".icon-btn, .seg, .nav, .acct-btn")) { e.preventDefault(); flip(); }
  else if (session?.flipped && /^[1-5]$/.test(e.key)) rate(RATE_KEYS[+e.key - 1]);
});
setInterval(refreshCounts, 60000);

/* ================= Boot ================= */
const updateSW = registerSW({
  onNeedRefresh() { showToast("A new version of Parlo is ready.", "Update", () => updateSW(true), 0); },
  onOfflineReady() { showToast("Parlo is ready to work offline.", null, null, 4000); }
});
if (canSpeak) { try { speechSynthesis.getVoices(); } catch (e) {} }
renderAccountButton(); setSync();

(async () => {
  try {
    const { default: course } = await import("./data/course.json");
    indexCourse(course);
  } catch (e) {
    app.innerHTML = `<div class="sheet empty"><span class="it">Ops</span>The course didn't load. Check your connection and reload the page.</div>`;
    return;
  }
  if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") { recovery = true; authMsg = null; }
      // Defer: Supabase recommends not awaiting other calls inside this callback.
      setTimeout(() => {
        const wasSignedOut = !user;
        switchUser(session?.user || null);
        if (event === "PASSWORD_RECOVERY") go("account");
        else if (event === "SIGNED_IN" && wasSignedOut && view.name === "account") { authMsg = null; go("course"); showToast("Signed in. Your progress now syncs to your account."); }
      }, 0);
    });
    const { data } = await supabase.auth.getSession();
    switchUser(data.session?.user || null);
  }
  refreshCounts();
  render();
})();
