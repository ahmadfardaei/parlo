import { S, D, esc, lsGet, lsSet, counts, dueIds, statusOf, fmtIn, LEVELS, LEVEL_NAMES, barHTML, pct, displayName, savePref, allReviewable, ICON } from "../core.js";
import { supabase } from "../supabase.js";
import META from "../data/meta.json";

export const SECTIONS = [
  { key: "vocab", it: "Vocabolario", en: "Words, verbs and phrases", count: () => `${D.units.length} units` },
  { key: "grammar", it: "Grammatica", en: "How the language works", count: () => `${META.grammar} lessons` },
  { key: "reading", it: "Lettura", en: "Stories, chats and reportage", count: () => `${META.reading} texts` },
  { key: "writing", it: "Scrittura", en: "Write, then compare with models", count: () => `${META.writing} tasks` },
  { key: "speaking", it: "Parlato", en: "Talk about real topics", count: () => `${META.speaking} topics` }
];

export function nextUnit() {
  const inLevel = D.units.filter(u => u.level === S.pref.level);
  return inLevel.find(u => pct(counts(D.unitIds[u.n])) < 100 && D.unitIds[u.n].some(id => statusOf(id) === "new")) || inLevel[0];
}
export function newAvailable() {
  const startAt = D.units.findIndex(u => u.level === S.pref.level);
  return D.units.slice(Math.max(0, startAt)).flatMap(u => D.unitIds[u.n]).filter(id => statusOf(id) === "new").length;
}
function greeting() {
  const h = new Date().getHours();
  return h < 5 ? "Buonanotte" : h < 13 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";
}
const LEVEL_CAN = {
  A1: "Brand new, or you know a few words. Greetings, ordering, simple questions.",
  A2: "You get by in simple situations. Talking about your day and your past.",
  B1: "You can hold a conversation. Opinions, plans, stories.",
  B2: "You're comfortable. Nuance, idioms, news and debate."
};
const hasHistory = () => Object.values(S.st).some(e => e && (e.d || e.k || e.s || e.best != null || e.done || e.text));

export function viewHome(app) {
  // First run: ask for the level once, before anything else.
  if (!lsGet("parlo.onboarded", false) && !hasHistory()) {
    app.innerHTML = `<header class="page-head"><p class="eyebrow">Benvenuto</p><h1>Where are you with Italian?</h1>
      <p class="muted">Pick the level that sounds most like you. You can change it any time in your profile.</p></header>
      <div class="level-pick">${LEVELS.map(l => `<button class="panel level-opt" data-pick="${l}"><span class="level-badge">${l}</span><span><span class="row-title">${LEVEL_NAMES[l]}</span><span class="muted small">${LEVEL_CAN[l]}</span></span>${ICON.chev}</button>`).join("")}</div>`;
    app.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => { savePref({ level: b.dataset.pick }); lsSet("parlo.onboarded", true); viewHome(app); });
    return;
  }
  const due = dueIds().length;
  const later = allReviewable().filter(id => statusOf(id) === "later");
  const nextDue = later.length ? Math.min(...later.map(id => S.st[id].d)) : 0;
  const newN = Math.min(S.pref.newN, newAvailable());
  const first = !hasHistory();
  const last = lsGet("parlo.last", null);
  const lc = counts(D.units.filter(u => u.level === S.pref.level).flatMap(u => D.unitIds[u.n]));
  const nu = nextUnit();
  const name = displayName().split(" ")[0];
  const cont = last ? { eyebrow: "Continue", title: last.title, sub: last.sub, href: last.href }
    : nu ? { eyebrow: "Explore the unit", title: `Unità ${nu.n}: ${nu.title}`, sub: nu.en, href: `#/unit/${nu.n}/words` } : null;
  let title, sub, cta;
  if (due) { title = `${due} ${due === 1 ? "card" : "cards"} to review`; sub = newN ? `Plus ${newN} new ${newN === 1 ? "word" : "words"}. About ${Math.max(1, Math.round((due + newN) / 4))} min.` : `About ${Math.max(1, Math.round(due / 4))} min.`; cta = "Start today's session"; }
  else if (first && newN) { title = "Your first session"; sub = `${newN} words and phrases from Unità ${nu ? nu.n : 1}. About ${Math.max(2, Math.round(newN / 4))} min.`; cta = "Start"; }
  else if (newN) { title = "Nothing to review"; sub = `${nextDue ? `Next review in ${fmtIn(nextDue - Date.now())}. ` : ""}Learn ${newN} new words now?`; cta = `Learn ${newN} new words`; }
  else { title = "All done for today"; sub = nextDue ? `Next review in ${fmtIn(nextDue - Date.now())}.` : "Open a unit to add new words."; cta = null; }

  app.innerHTML = `
    <header class="page-head">
      <p class="eyebrow">${new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</p>
      <h1>${greeting()}${name ? ", " + esc(name) : ""}</h1>
    </header>
    <div class="home-grid">
      <section class="panel hero-card">
        <div class="hero-main"><p class="eyebrow">Oggi</p><p class="big-line">${title}</p><p class="muted">${sub}</p></div>
        ${cta ? `<a class="btn primary large" href="#/session/due">${cta}</a>` : ""}
        <p class="level-line small muted">${S.pref.level} · ${pct(lc)}% of ${S.pref.level} vocabulary known · <a href="#/account">change level</a></p>
      </section>
      ${cont ? `<a class="panel row-link continue" href="${esc(cont.href)}">
        <span><span class="eyebrow">${cont.eyebrow}</span><span class="row-title">${esc(cont.title)}</span>${cont.sub ? `<span class="muted small">${esc(cont.sub)}</span>` : ""}</span>${ICON.chev}</a>` : ""}
    </div>
    ${supabase && !S.user && !lsGet("parlo.hide.signin", false) ? `<p class="signin-line small muted"><a href="#/account">Sign in</a> to keep your progress on every device. <button class="text-btn quiet-link" data-hide-signin>Hide</button></p>` : ""}
  `;
  app.querySelector("[data-hide-signin]")?.addEventListener("click", () => { lsSet("parlo.hide.signin", true); viewHome(app); });
}
