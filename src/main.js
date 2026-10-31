// Fonts are served from this site, not from Google: no visitor data goes to a third party.
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "@fontsource-variable/literata/opsz.css";
import "@fontsource-variable/literata/opsz-italic.css";
import "./styles.css";
import { registerSW } from "virtual:pwa-register";
import { supabase } from "./supabase.js";
import { $, $$, S, D, esc, on, emit, ICON, FEEDBACK_EMAIL, isDark, setTheme, showToast, closeSheet, indexCourse, switchUser, setSync, displayName, dueIds, schedule, setHidden, toggleDeck, say, sayOf, stopSpeaking, go } from "./core.js";
import { viewHome } from "./views/home.js";
import { viewLearn } from "./views/learn.js";
import { viewUnit } from "./views/unit.js";
import { viewGrammar } from "./views/grammar.js";
import { viewReading } from "./views/reading.js";
import { viewListening } from "./views/listening.js";
import { viewWriting } from "./views/writing.js";
import { viewSpeaking } from "./views/speaking.js";
import { viewDeck, viewSession } from "./views/review.js";
import { viewAccount, onAuthEvent } from "./views/account.js";
import { viewQuiz } from "./views/quiz.js";
import { viewPath } from "./views/path.js";
import { viewSay } from "./views/say.js";
import { ensure } from "./data.js";

const app = $("#app");

/* ---------- Router ---------- */
export function parseHash() {
  const p = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  switch (p[0]) {
    case "learn": if (p[1] === "path") return { name: "path", level: S.pref.level };
      return { name: "learn", section: ["vocab", "grammar", "reading", "listening", "writing", "speaking"].includes(p[1]) ? p[1] : "vocab" };
    case "unit": return { name: "unit", u: +p[1], tab: ["words", "verbs", "phrases", "quiz"].includes(p[2]) ? p[2] : "words" };
    case "grammar": return { name: "grammar", id: p[1], mode: ["practice", "drill"].includes(p[2]) ? p[2] : "learn", focus: ["practice", "drill"].includes(p[2]) };
    case "read": return { name: "reading", id: p[1] };
    case "listen": return { name: "listening", id: p[1] };
    case "write": return { name: "writing", id: p[1] };
    case "speak": return { name: "speaking", id: p[1] };
    case "review": return { name: "home" }; // the review hub now lives on the home screen
    case "deck": return { name: "deck", filter: p[1] };
    case "session": return { name: "session", src: p[1] || "due", u: p[2] ? +p[2] : undefined, focus: true };
    case "quiz": return { name: "quiz", scope: p[1] || "mix", a: p[2], b: p[3], focus: true };
    case "path": return { name: "path", level: p[1] };
    case "say": return { name: "say", src: p[1] || "daily", id: p[2], focus: true };
    case "account": return { name: "account", tab: ["stats", "settings", "data"].includes(p[1]) ? p[1] : "stats" };
    default: return { name: "home" };
  }
}
const TAB_OF = { home: "home", learn: "learn", unit: "learn", grammar: "learn", reading: "learn", listening: "learn", writing: "learn", speaking: "learn", review: "home", deck: "deck", session: "home", account: "account", quiz: "home", path: "learn", say: "home" };
const VIEWS = { home: viewHome, learn: viewLearn, unit: viewUnit, grammar: viewGrammar, reading: viewReading, listening: viewListening, writing: viewWriting, speaking: viewSpeaking, deck: viewDeck, quiz: viewQuiz, path: viewPath, say: viewSay, session: viewSession, account: viewAccount };
let renderToken = 0, prevPath = "";
export async function render() {
  if (!D.units.length) return;
  const token = ++renderToken;
  const v = parseHash();
  // Switching tabs inside the same screen (e.g. unit words → verbs) keeps the scroll position.
  const path = [v.name, v.u, v.id, v.mode, v.src].join("|");
  S.view = v;
  stopSpeaking(); closeSheet(true); emit("leave");
  document.body.classList.toggle("focus", !!v.focus);
  const tab = v.name === "session" && v.src === "deck" ? "deck" : TAB_OF[v.name];
  $$(".tabbar [data-tab]").forEach(b => { if (b.dataset.tab === tab) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  try {
    await VIEWS[v.name](app, v, () => token === renderToken);
  } catch (e) {
    console.error(e);
    if (token === renderToken) app.innerHTML = `<div class="empty-state"><h2>Something went wrong</h2><p>${esc(e.message || "This page couldn't load.")}</p><a class="btn" href="#/">Go home</a></div>`;
  }
  if (token !== renderToken) return;
  if (path !== prevPath) window.scrollTo(0, 0);
  // Section tabs that don't fit: show the current one, and fade the edge that has more.
  app.querySelectorAll(".tabs-seg").forEach(nav => {
    const cur = nav.querySelector("[aria-current]");
    if (cur) nav.scrollLeft = cur.offsetLeft - (nav.clientWidth - cur.offsetWidth) / 2;
    const edge = () => { nav.classList.toggle("more-r", nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 4); nav.classList.toggle("more-l", nav.scrollLeft > 4); };
    edge(); nav.addEventListener("scroll", edge, { passive: true });
  });
  prevPath = path;
  const h = app.querySelector("h1"); document.title = h && v.name !== "home" ? `${h.textContent} · i understand, but…` : "i understand, but…";
  setSync(); updateBadges();
}
window.addEventListener("hashchange", render);

// Light or dark: one button in the top bar (wide screens); Profile → Studio also has "System".
const themeBtn = $("[data-theme-btn]");
const showThemeBtn = () => { const d = isDark(); themeBtn.innerHTML = d ? ICON.sun : ICON.moon; themeBtn.setAttribute("aria-label", d ? "Light mode" : "Dark mode"); themeBtn.title = d ? "Light mode" : "Dark mode"; };
themeBtn.onclick = () => setTheme(isDark() ? "light" : "dark");
on("theme", showThemeBtn);
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", showThemeBtn);
showThemeBtn();
on("rerender", () => render());

/* ---------- Shell ---------- */
function updateBadges() {
  const due = D.units.length ? dueIds().length : 0;
  $$("[data-due-badge]").forEach(b => { b.textContent = due > 99 ? "99+" : due; b.hidden = !due; });
  if ("setAppBadge" in navigator) { try { due ? navigator.setAppBadge(due) : navigator.clearAppBadge(); } catch (e) {} }
  const acct = $("[data-tab=account] .lbl");
  if (acct) acct.textContent = S.user ? (displayName().split(" ")[0] || "Profilo") : "Profilo";
}
on("change", () => updateBadges());
const offline = () => { $("#offline").hidden = navigator.onLine; };
window.addEventListener("online", offline); window.addEventListener("offline", offline); offline();
on("account", () => { updateBadges(); if (["account", "home"].includes(S.view.name)) render(); });
setInterval(updateBadges, 60000);

/* ---------- Errors ---------- */
// No error service: when something breaks, the learner can send the details by email with one tap (once per visit).
let errorShown = false;
function onError(err) {
  if (errorShown) return; errorShown = true;
  const msg = String(err?.message || err || "Unknown error"), stack = String(err?.stack || "").split("\n").slice(0, 6).join("\n");
  const body = `What were you doing when it happened?\n\n\n---\nError: ${msg}\n${stack}\nPage: ${location.pathname}${location.hash}\nDevice: ${navigator.userAgent}`;
  showToast("Something went wrong on this page.", "Report", () => { location.href = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent("Error report: i understand, but…")}&body=${encodeURIComponent(body)}`; }, 12000);
}
window.addEventListener("error", e => { if (e.error) onError(e.error); });
window.addEventListener("unhandledrejection", e => { const r = e.reason; if (r && !/network|fetch|load failed|abort/i.test(String(r.message || r))) onError(r); });

/* ---------- Interactions shared by every screen ---------- */
document.addEventListener("click", e => {
  const t = e.target.closest("button, [data-say-text]"); if (!t || t.disabled) return;
  const ds = t.dataset;
  if (ds.sayText !== undefined) { e.preventDefault(); say(ds.sayText, ds.voice); return; }
  if (ds.sayId) { say(sayOf(ds.sayId)); return; }
  if (ds.deck) { e.stopPropagation(); toggleDeck(ds.deck); return; }
  if (ds.sched) { schedule(ds.id, ds.sched); return; }
  if (ds.hide) { setHidden(ds.id, ds.hide === "1"); if (ds.hide === "1") closeSheet(); return; }
  if (ds.go) { go(ds.go); return; }
});

/* ---------- Service worker ---------- */
const updateSW = registerSW({
  onNeedRefresh() { showToast("A new version is ready.", "Update", () => updateSW(true), 0); },
  onOfflineReady() { showToast("The app now works offline.", null, null, 3500); }
});

/* ---------- Boot ---------- */
(async () => {
  try {
    indexCourse(await ensure("course"));
  } catch (e) {
    app.innerHTML = `<div class="empty-state"><h2>The course didn't load</h2><p>Check your connection and reload the page.</p></div>`;
    return;
  }
  if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => setTimeout(() => onAuthEvent(event, session), 0));
    const { data } = await supabase.auth.getSession();
    switchUser(data.session?.user || null);
  }
  render();
})();
