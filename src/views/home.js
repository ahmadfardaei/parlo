import { S, D, esc, lsGet, lsSet, counts, dueIds, statusOf, LEVELS, LEVEL_NAMES, pct, displayName, savePref, ICON, learned, deckIds, dayKey } from "../core.js";
import { supabase } from "../supabase.js";
import META from "../data/meta.json";
import { pathProgress, stepHref, TYPE } from "./path.js";

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
    app.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => { savePref({ level: b.dataset.pick, understand: und }); lsSet("parlo.onboarded", true); lsSet("parlo.ask.gender", true); viewHome(app); });
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
  // Oggi: one card with today's plan (reviews, the next step, a short speaking round) and one button.
  const name = displayName().split(" ")[0];
  const plan = todayPlan(), next = plan.find(x => !x.done);
  app.innerHTML = `
    <header class="page-head">
      <p class="eyebrow">${new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</p>
      <h1>${greeting()}${name ? ", " + esc(name) : ""}</h1>
    </header>
    <section class="panel today" aria-label="Today">
      <ol class="plan">${plan.map(x => `<li class="${x.done ? "done" : x === next ? "next" : ""}"><a href="${x.href}">
        <span class="plan-mark" aria-hidden="true">${x.done ? ICON.check : ""}</span>
        <span><span class="row-title ${x.it ? "it" : ""}">${esc(x.title)}</span><span class="muted small">${esc(x.sub)}</span></span>${ICON.chev}</a></li>`).join("")}</ol>
      ${next ? `<a class="btn primary large wide" href="${next.href}">${esc(next.cta)}</a>` : `<p class="muted center">All done for today. A domani!</p>`}
    </section>
    ${supabase && !S.user && !lsGet("parlo.hide.signin", false) ? `<p class="signin-line small muted"><a href="#/account/data">Sign in</a> to keep your progress on every device. <button class="text-btn quiet-link" data-hide-signin>Hide</button></p>` : ""}
  `;
  app.querySelector("[data-hide-signin]")?.addEventListener("click", () => { lsSet("parlo.hide.signin", true); viewHome(app); });
}

// Today's plan, in order: reviews (when due), the next step on your path, and "Say it" once there's something to say.
function todayPlan() {
  const plan = [], due = dueIds().length;
  if (due) plan.push({ title: `Review ${due} ${due === 1 ? "card" : "cards"}`, sub: `About ${Math.max(1, Math.round(due / 4))} min. Say each one in Italian.`, href: "#/session/due", cta: "Start the review" });
  const L = S.pref.level, { steps, states, done, current } = pathProgress(L), s = steps[current];
  if (s) plan.push({ title: s.title, it: true, sub: `${TYPE[s.type]?.label || ""} · step ${current + 1} of ${steps.length}${states[current].note ? " · " + states[current].note : ""}`, href: s.type === "unit" && !states[current].done ? `#/session/unit/${s.ref}` : stepHref(L, s), cta: done || current ? "Continue the path" : "Start" });
  else plan.push({ title: `Percorso ${L} complete`, sub: "Complimenti! Choose the next level in your profile.", href: `#/path/${L}`, cta: "See the path", done: true });
  if (D.order.filter(learned).length + deckIds().length >= 5) plan.push({ title: "Say it out loud", sub: "5 sentences you've met, from English to Italian. 3 min.", href: "#/say/daily", cta: "Say it", done: S.st["sp:say"]?.day === dayKey() });
  return plan;
}
