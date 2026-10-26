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

export function viewHome(app) {
  const due = dueIds().length;
  const later = allReviewable().filter(id => statusOf(id) === "later");
  const nextDue = later.length ? Math.min(...later.map(id => S.st[id].d)) : 0;
  const newN = Math.min(S.pref.newN, newAvailable());
  const last = lsGet("parlo.last", null);
  const lvlIds = D.units.filter(u => u.level === S.pref.level).flatMap(u => D.unitIds[u.n]);
  const lc = counts(lvlIds);
  const nu = nextUnit();
  const name = displayName().split(" ")[0];

  app.innerHTML = `
    <header class="page-head">
      <p class="eyebrow">${new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</p>
      <h1>${greeting()}${name ? ", " + esc(name) : ""}</h1>
    </header>

    <section class="panel hero-card">
      <div class="hero-main">
        <p class="eyebrow">Ripasso di oggi · today's review</p>
        ${due ? `<p class="big-num">${due}</p><p class="muted">${due === 1 ? "card is" : "cards are"} due${newN ? `, plus ${newN} new` : ""}.</p>`
          : newN ? `<p class="big-line">You're up to date.</p><p class="muted">${newN} new cards are ready to learn${nextDue ? `. Next review in ${fmtIn(nextDue - Date.now())}` : ""}.</p>`
          : `<p class="big-line">All done for now.</p><p class="muted">${nextDue ? `Next review in ${fmtIn(nextDue - Date.now())}.` : "Open a unit to add new words."}</p>`}
      </div>
      ${due || newN ? `<a class="btn primary large" href="#/session/due">${due ? "Start review" : "Learn new cards"}</a>` : ""}
    </section>

    ${last ? `<a class="panel row-link continue" href="${esc(last.href)}">
      <span><span class="eyebrow">Continue</span><span class="row-title">${esc(last.title)}</span>${last.sub ? `<span class="muted small">${esc(last.sub)}</span>` : ""}</span>${ICON.chev}</a>` : ""}

    <section class="panel">
      <div class="panel-head"><h2>Your level</h2>
        <div class="seg" role="group" aria-label="Your level">${LEVELS.map(l => `<button data-level="${l}" aria-pressed="${S.pref.level === l}">${l}</button>`).join("")}</div></div>
      <p class="muted small">${LEVEL_NAMES[S.pref.level]}. New cards and examples are picked for this level.</p>
      <div class="level-prog">${barHTML(lc)}<span class="small">${lc.known} of ${lc.total} known</span></div>
      ${nu ? `<a class="row-link inset" href="#/unit/${nu.n}/words"><span><span class="eyebrow">Next unit</span><span class="row-title">${nu.n}. ${esc(nu.title)}</span><span class="muted small">${esc(nu.en)}</span></span>${ICON.chev}</a>` : ""}
    </section>

    <section class="panel">
      <h2>Learn</h2>
      <div class="link-list">${SECTIONS.map(s => `<a class="row-link" href="#/learn/${s.key}"><span><span class="row-title it">${s.it}</span><span class="muted small">${s.en}</span></span><span class="row-meta">${s.count()}</span>${ICON.chev}</a>`).join("")}</div>
    </section>

    ${supabase && !S.user && !lsGet("parlo.hide.signin", false) ? `<section class="panel note-card"><p>Sign in to keep your progress and deck on every device.</p>
      <div class="btn-row"><a class="btn primary" href="#/account">Sign in</a><button class="btn quiet" data-hide-signin>Not now</button></div></section>` : ""}
  `;
  app.querySelectorAll("[data-level]").forEach(b => b.onclick = () => { savePref({ level: b.dataset.level }); viewHome(app); });
  app.querySelector("[data-hide-signin]")?.addEventListener("click", () => { lsSet("parlo.hide.signin", true); viewHome(app); });
}
