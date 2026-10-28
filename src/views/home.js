import { S, D, esc, lsGet, lsSet, counts, dueIds, statusOf, fmtIn, LEVELS, LEVEL_NAMES, barHTML, pct, displayName, savePref, allReviewable, ICON, learned, deckIds } from "../core.js";
import { supabase } from "../supabase.js";
import META from "../data/meta.json";
import ROADMAP from "../data/roadmap.json";
import { pathProgress, stepHref, paceText } from "./path.js";

export const SECTIONS = [
  { key: "vocab", it: "Vocabolario", en: "Words, verbs and phrases", count: () => `${D.units.length} units` },
  { key: "grammar", it: "Grammatica", en: "How the language works", count: () => `${META.grammar.length} lessons` },
  { key: "reading", it: "Lettura", en: "Stories, chats and reportage", count: () => `${META.reading.length} texts` },
  { key: "listening", it: "Ascolto", en: "Calls, announcements and radio", count: () => `${META.listening.length} exercises` },
  { key: "writing", it: "Scrittura", en: "Write, then compare with models", count: () => `${META.writing.length} tasks` },
  { key: "speaking", it: "Parlato", en: "Talk about real topics", count: () => `${META.speaking.length} topics` }
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
// Most learners understand more than they can say, so we ask about both.
const LEVEL_UNDERSTAND = {
  A1: "A few words, signs and very simple questions.",
  A2: "Simple conversations, messages and menus, if people speak slowly.",
  B1: "Most everyday talk, and the news when it's clear.",
  B2: "Films, radio and articles, with some effort."
};
const LEVEL_SPEAK = {
  A1: "A few words, or I freeze.",
  A2: "Short sentences about me, my day and my past.",
  B1: "I get by, but I often search for words.",
  B2: "I can discuss most topics, with some mistakes."
};
export const GENDER_OPTS = [["m", "-o", "Masculine forms: sono stanco"], ["f", "-a", "Feminine forms: sono stanca"], ["x", "-o/a", "Show both: sono stanco/a"]];
const hasHistory = () => Object.values(S.st).some(e => e && (e.d || e.k || e.s || e.best != null || e.done || e.text));

export function viewHome(app) {
  // First run: what you understand, then how well you speak. The path follows how you speak.
  if (!lsGet("parlo.onboarded", false) && !hasHistory()) {
    const und = lsGet("parlo.ask.und", null);
    if (!und) {
      app.innerHTML = `<header class="page-head"><p class="eyebrow">Benvenuto</p><h1>How much Italian do you understand?</h1>
        <p class="muted">Understand more. Say what you mean. Most people understand more than they can say, so we ask about both.</p></header>
        <div class="level-pick">${LEVELS.map(l => `<button class="panel level-opt" data-und="${l}"><span class="level-badge">${l}</span><span><span class="row-title">${LEVEL_NAMES[l]}</span><span class="muted small">${LEVEL_UNDERSTAND[l]}</span></span>${ICON.chev}</button>`).join("")}</div>`;
      app.querySelectorAll("[data-und]").forEach(b => b.onclick = () => { lsSet("parlo.ask.und", b.dataset.und); viewHome(app); });
      return;
    }
    const upTo = LEVELS.slice(0, LEVELS.indexOf(und) + 1);
    app.innerHTML = `<header class="page-head"><p class="eyebrow">Step 2 of 2</p><h1>And when you speak?</h1>
      <p class="muted">You understand ${und}. Your path follows how well you speak, so it trains what you need most. <button class="text-btn" data-und-back>Change</button></p></header>
      <div class="level-pick">${upTo.map(l => `<button class="panel level-opt" data-pick="${l}"><span class="level-badge">${l}</span><span><span class="row-title">${LEVEL_NAMES[l]}</span><span class="muted small">${LEVEL_SPEAK[l]}</span></span>${ICON.chev}</button>`).join("")}</div>`;
    app.querySelector("[data-und-back]").onclick = () => { lsSet("parlo.ask.und", null); viewHome(app); };
    app.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => { savePref({ level: b.dataset.pick, understand: und }); lsSet("parlo.onboarded", true); lsSet("parlo.ask.mode", true); viewHome(app); });
    return;
  }
  // First run, step 2: guided path or free study.
  if (lsGet("parlo.ask.mode", false)) {
    const [lo, hi] = ROADMAP[S.pref.level].hours;
    app.innerHTML = `<header class="page-head"><p class="eyebrow">How do you want to learn?</p><h1>Choose your way</h1>
      <p class="muted">You can switch any time in your profile.</p></header>
      <div class="level-pick">
        <button class="panel level-opt" data-mode="path"><span class="level-badge">◆</span><span><span class="row-title">Follow a path <span class="pill new">Recommended</span></span><span class="muted small">A guided route through ${S.pref.level}: words, grammar, reading, listening, writing and speaking in a sensible order, with checkpoints. About ${lo}–${hi} hours.${LEVELS.indexOf(S.pref.understand) > LEVELS.indexOf(S.pref.level) ? ` Words you probably understand are checked first, so you move faster.` : ""}</span></span>${ICON.chev}</button>
        <button class="panel level-opt" data-mode="self"><span class="level-badge">≡</span><span><span class="row-title">Study freely</span><span class="muted small">Pick what you want from the library, in any order.</span></span>${ICON.chev}</button>
      </div>`;
    app.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => { savePref({ mode: b.dataset.mode }); lsSet("parlo.ask.mode", false); lsSet("parlo.ask.gender", true); viewHome(app); });
    return;
  }
  // First run, step 3 (optional): which gendered forms to show for sentences about the learner.
  if (lsGet("parlo.ask.gender", false)) {
    const done = g => { if (g) savePref({ gender: g }); lsSet("parlo.ask.gender", false); viewHome(app); };
    app.innerHTML = `<header class="page-head"><p class="eyebrow">One more thing · optional</p><h1>Sono stanco o sono stanca?</h1>
      <p class="muted">In Italian, words about yourself change with your gender: <span class="it">sono stanc<b>o</b></span> or <span class="it">sono stanc<b>a</b></span>, <span class="it">sono andat<b>o</b></span> or <span class="it">sono andat<b>a</b></span>. Choose the forms you want to learn, so the sentences you practise sound like you.</p></header>
      <div class="level-pick">${GENDER_OPTS.map(([k, ex, label]) => `<button class="panel level-opt" data-g="${k}"><span class="level-badge it">${ex}</span><span><span class="row-title">${label}</span></span>${ICON.chev}</button>`).join("")}</div>
      <p class="muted small">This only decides which forms you see. You can change it any time in your profile. <button class="text-btn" data-g-skip>Skip</button></p>`;
    app.querySelectorAll("[data-g]").forEach(b => b.onclick = () => done(b.dataset.g));
    app.querySelector("[data-g-skip]").onclick = () => done(null);
    return;
  }
  const due = dueIds().length;
  const later = allReviewable().filter(id => statusOf(id) === "later");
  const nextDue = later.length ? Math.min(...later.map(id => S.st[id].d)) : 0;
  const newN = Math.min(S.pref.newN, newAvailable());
  const first = !hasHistory();
  const last = lsGet("parlo.last", null);
  const lvIds = D.units.filter(u => u.level === S.pref.level).flatMap(u => D.unitIds[u.n]);
  const lc = { total: lvIds.length, learned: lvIds.filter(learned).length, started: lvIds.filter(id => statusOf(id) !== "new").length };
  const nu = nextUnit();
  const name = displayName().split(" ")[0];
  // "Continue" only points to a unit of the level you're on now.
  const lastUnit = last?.kind === "unit" ? D.units.find(u => u.n === +String(last.href).split("/")[2]) : null;
  const cont = last && !(lastUnit && lastUnit.level !== S.pref.level) ? { eyebrow: "Continue", title: last.title, sub: last.sub, href: last.href }
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
      ${S.pref.mode === "path" && !due ? "" : `<section class="panel hero-card">
        <div class="hero-main"><p class="eyebrow">Oggi</p><p class="big-line">${title}</p><p class="muted">${sub}</p></div>
        ${cta ? `<a class="btn primary large" href="#/session/due">${cta}</a>` : ""}
      </section>`}
      ${S.pref.mode === "path" ? pathCardHTML() : cont ? `<a class="panel row-link continue" href="${esc(cont.href)}">
        <span><span class="eyebrow">${cont.eyebrow}</span><span class="row-title">${esc(cont.title)}</span>${cont.sub ? `<span class="muted small">${esc(cont.sub)}</span>` : ""}</span>${ICON.chev}</a>` : ""}
    </div>
    ${sayCardHTML()}
    ${S.pref.mode === "path" ? "" : `<section class="panel quiz-card">
      <div><p class="eyebrow">Quiz rapido</p><p class="row-title">Test yourself</p><p class="muted small">10 questions on words, verbs and grammar you've studied.</p></div>
      <div class="btn-row"><a class="btn" href="#/quiz/mix">Start quiz</a><a class="text-btn" href="#/quiz">More quizzes</a></div></section>`}
    ${S.pref.mode === "path" ? "" : `<section class="panel progress-panel" id="overview"><div class="panel-head"><h2>Your progress · ${S.pref.level}</h2><a class="small" href="#/account/settings">change level</a></div><div class="ov-rows"></div></section>`}
    ${supabase && !S.user && !lsGet("parlo.hide.signin", false) ? `<p class="signin-line small muted"><a href="#/account/data">Sign in</a> to keep your progress on every device. <button class="text-btn quiet-link" data-hide-signin>Hide</button></p>` : ""}
  `;
  app.querySelector("[data-hide-signin]")?.addEventListener("click", () => { lsSet("parlo.hide.signin", true); viewHome(app); });
  const ov = app.querySelector("#overview .ov-rows"); if (ov) drawOverview(ov, lc);
}

// A short daily speaking round, once there's something to say.
function sayCardHTML() {
  const n = D.order.filter(learned).length + deckIds().length;
  if (n < 5) return "";
  return `<section class="panel quiz-card say-card-home">
      <div><p class="eyebrow">Dillo in italiano</p><p class="row-title">Say it out loud</p><p class="muted small">5 sentences you've met, from English to Italian. About 3 min.</p></div>
      <div class="btn-row"><a class="btn" href="#/say/daily">Start</a></div></section>`;
}
// Roadmap mode: the next step on the path, with the level's progress.
function pathCardHTML() {
  const dueNow = dueIds().length;
  const L = S.pref.level, { steps, states, done, current } = pathProgress(L);
  const s = steps[current];
  if (!s) return `<a class="panel row-link continue" href="#/path/${L}"><span><span class="eyebrow">Percorso ${L}</span><span class="row-title">Level complete. Complimenti!</span><span class="muted small">Move on to the next level in your profile.</span></span>${ICON.chev}</a>`;
  return `<section class="panel path-card">
      <div class="panel-head"><span class="eyebrow">Percorso ${L} · step ${current + 1} of ${steps.length}</span><a class="small" href="#/path/${L}">See the path</a></div>
      <p class="row-title it">${esc(s.title)}</p><p class="muted small">${esc(s.en)}${states[current].note ? ` · ${esc(states[current].note)}` : ""}</p>
      <div class="level-prog"><span class="bar"><span class="k" style="width:${done / steps.length * 100}%"></span></span><span class="small">${done}/${steps.length}</span></div>
      <a class="btn ${dueNow ? "" : "primary large"}" href="${s.type === "unit" && !states[current].done ? `#/session/unit/${s.ref}` : stepHref(L, s)}">${done || current ? "Continue" : "Start"}</a></section>`;
}
// One bar per section. Vocabulary, grammar and reading are counted at the learner's level.
function drawOverview(box, lc) {
  const L = S.pref.level;
  const row = (key, label, done, total, part = 0) => `<a class="ov-row" href="#/learn/${key}">
      <span class="ov-label">${label}</span>
      <span class="bar" aria-hidden="true"><span class="k" style="width:${done / Math.max(1, total) * 100}%"></span><span class="l" style="width:${part / Math.max(1, total) * 100}%"></span></span>
      <span class="ov-val">${done + part} of ${total}</span>${ICON.chev}</a>`;
  const gl = META.grammar.filter(([, l]) => l === L), rl = META.reading.filter(([, l]) => l === L), ll = META.listening.filter(([, l]) => l === L);
  box.innerHTML = [
    row("vocab", "Vocabolario", lc.learned, lc.total, lc.started - lc.learned),
    row("grammar", "Grammatica", gl.filter(([id]) => S.st["g:" + id]?.best != null).length, gl.length),
    row("reading", "Lettura", rl.filter(([id]) => S.st["r:" + id]?.done).length, rl.length),
    row("listening", "Ascolto", ll.filter(([id]) => S.st["l:" + id]?.done).length, ll.length),
    row("writing", "Scrittura", META.writing.filter(id => (S.st["wr:" + id]?.text || "").trim()).length, META.writing.length),
    row("speaking", "Parlato", META.speaking.filter(id => S.st["sp:" + id]?.done).length, META.speaking.length)
  ].join("") + `<p class="legend small"><span><i class="lg-k"></i>Learned / done</span><span><i class="lg-l"></i>Started</span></p>`;
}
