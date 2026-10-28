// Roadmap mode: a guided path per level. Steps unlock one after another; each shows 0–3 stars.
import { S, D, esc, ICON, LEVELS, LEVEL_NAMES, statusOf, openSheet, savePref, remember } from "../core.js";
import ROADMAP from "../data/roadmap.json";
import { pdfUrl } from "../voice.js";

const TYPE = {
  unit: { label: "Vocabulary", icon: "Aa" }, grammar: { label: "Grammar", icon: "§" }, reading: { label: "Reading", icon: "¶" }, listening: { label: "Listening", icon: "♪" },
  writing: { label: "Writing", icon: "✎" }, speaking: { label: "Speaking", icon: "◌" }, checkpoint: { label: "Checkpoint", icon: "◆" }, test: { label: "Level test", icon: "★" }
};
const WRITE_TARGET = { A1: 60, A2: 110, B1: 180, B2: 260 };
const words = s => (String(s || "").trim().match(/\S+/g) || []).length;
const ratioStars = r => r >= 1 ? 3 : r >= 0.85 ? 2 : r >= 0.7 ? 1 : 0;

// How far a step is: { done, stars, note }.
export function stepState(L, s) {
  if (S.st["to:" + s.id]?.done) return { done: true, stars: 1, note: "Tested out" };
  switch (s.type) {
    case "unit": {
      const ids = D.unitIds[s.ref] || [], n = Math.max(1, ids.length);
      const seen = ids.filter(id => statusOf(id) !== "new").length;
      // "Solid" = known, or scheduled 3+ days ahead.
      const solid = ids.filter(id => statusOf(id) === "known" || ["3d", "7d"].includes(S.st[id]?.iv)).length;
      const done = seen / n >= 0.8;
      return { done, stars: done ? 1 + (solid / n >= 0.5) + (solid / n >= 0.8) : 0, note: `${seen} of ${ids.length} learned` };
    }
    case "grammar": { const e = S.st["g:" + s.ref]; const r = e?.best != null ? e.best / e.total : 0; return { done: r >= 0.7, stars: ratioStars(r), note: e?.best != null ? `Best ${e.best}/${e.total}` : "" }; }
    case "reading": { const e = S.st["r:" + s.ref]; if (!e?.done) return { done: false, stars: 0, note: "" }; const r = e.total ? e.score / e.total : 0; return { done: true, stars: r >= 1 ? 3 : r >= 0.6 ? 2 : 1, note: e.total ? `${e.score}/${e.total} correct` : "Read" }; }
    case "listening": { const e = S.st["l:" + s.ref]; if (!e?.done) return { done: false, stars: 0, note: "" }; const r = e.score / e.total; return { done: true, stars: r >= 1 ? 3 : r >= 0.6 ? 2 : 1, note: `${e.score}/${e.total} correct` }; }
    case "writing": { const n = words(S.st["wr:" + s.ref]?.text); const done = n >= WRITE_TARGET[L]; return { done, stars: done ? 3 : 0, note: n ? `${n} words` : "" }; }
    case "speaking": { const done = !!S.st["sp:" + s.ref]?.done; return { done, stars: done ? 3 : 0, note: "" }; }
    default: { const e = S.st[`cp:${L}:${s.ref}`]; const r = e?.best != null ? e.best / e.total : 0; return { done: r >= 0.7, stars: ratioStars(r), note: e?.best != null ? `Best ${e.best}/${e.total}` : "" }; }
  }
}
export function stepHref(L, s) {
  return { unit: `#/unit/${s.ref}/words`, grammar: `#/grammar/${s.ref}`, reading: `#/read/${s.ref}`, listening: `#/listen/${s.ref}`, writing: `#/write/${s.ref}`, speaking: `#/speak/${s.ref}`, checkpoint: `#/quiz/cp/${L}/${s.ref}`, test: `#/quiz/test/${L}` }[s.type];
}
export function pathProgress(L) {
  const steps = ROADMAP[L].steps, states = steps.map(s => stepState(L, s));
  const current = states.findIndex(x => !x.done);
  return { steps, states, done: states.filter(x => x.done).length, current: current < 0 ? steps.length : current };
}
// "36–71 h" → weeks/months at the learner's daily pace.
export function paceText(L) {
  const [lo, hi] = ROADMAP[L].hours, pace = S.pref.pace || 20;
  const span = h => h * 60 / pace / 7; // weeks
  const fmt = w => w < 8 ? `${Math.round(w)} weeks` : `${Math.round(w / 4.3)} months`;
  const a = span(lo), b = span(hi);
  return `${fmt(a)}–${fmt(b)}`.replace(/ weeks–(\d+) weeks/, "–$1 weeks").replace(/ months–(\d+) months/, "–$1 months");
}
const stars = n => `<span class="stars" aria-label="${n} of 3 stars">${[1, 2, 3].map(i => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
const mins = m => m[1] < 90 ? `${m[0]}–${m[1]} min` : `${Math.round(m[0] / 60 * 2) / 2}–${Math.round(m[1] / 60 * 2) / 2} h`;

export function viewPath(app, v) {
  const L = LEVELS.includes(v.level) ? v.level : S.pref.level;
  const { steps, states, done, current } = pathProgress(L);
  const [lo, hi] = ROADMAP[L].hours;
  remember("path", `Percorso ${L}`, `#/path/${L}`, `${done} of ${steps.length} steps`);
  app.innerHTML = `<header class="page-head path-head">
      <div class="seg small" role="group" aria-label="Level">${LEVELS.map(l => `<a href="#/path/${l}" ${l === L ? 'aria-current="page"' : ""}>${l}</a>`).join("")}</div>
      <h1>Percorso ${L}</h1>
      <p class="muted">${LEVEL_NAMES[L]} · ${steps.length} steps · ${lo}–${hi} hours of study</p>
    </header>
    <section class="panel path-summary">
      <div class="level-prog"><span class="bar"><span class="k" style="width:${done / steps.length * 100}%"></span></span><span class="small">${done} of ${steps.length}</span></div>
      <div class="pdf-row">${[["vocab", "Vocabulary"], ["grammar", "Grammar"], ["reading", "Reading"]].map(([k, t]) => `<a class="btn quiet small pdf-link" href="${pdfUrl(`${k}-${L}`)}" target="_blank" rel="noopener">${ICON.download}<span>${t} PDF</span></a>`).join("")}</div>
      <p class="muted small">At <select class="pace" aria-label="Minutes per day">${[10, 20, 30, 45, 60].map(m => `<option value="${m}" ${m === (S.pref.pace || 20) ? "selected" : ""}>${m} min</option>`).join("")}</select> a day, this level takes about <b>${paceText(L)}</b>.</p>
    </section>
    <ol class="path">${steps.map((s, i) => {
      const st = states[i], state = st.done ? "done" : i === current ? "current" : "locked";
      const wave = Math.round(Math.sin(i * 0.8) * 8);
      return `<li class="step ${state} t-${s.type}" style="--x:${wave}px">
        <button class="node" data-step="${i}" aria-label="${esc(s.title)}, ${TYPE[s.type].label}, ${state}">${st.done ? ICON.check : `<span>${TYPE[s.type].icon}</span>`}</button>
        <button class="step-text" data-step="${i}">
          <span class="step-title ${s.type === "checkpoint" || s.type === "test" ? "" : "it"}">${esc(s.title)}</span>
          <span class="step-meta">${TYPE[s.type].label} · ${mins(s.min)}${st.done ? " · " + stars(st.stars) : ""}</span>
        </button>
        ${state === "current" ? `<a class="btn primary small" href="${stepHref(L, s)}">Start</a>` : ""}
      </li>`;
    }).join("")}</ol>`;
  app.querySelector(".pace").onchange = e => { savePref({ pace: +e.target.value }); viewPath(app, v); };
  app.querySelectorAll("[data-step]").forEach(b => b.onclick = () => stepSheet(L, steps, states, +b.dataset.step, current));
  const cur = app.querySelector(".step.current");
  if (cur && !v.keepScroll) setTimeout(() => cur.scrollIntoView({ block: "center" }), 50);
}

function stepSheet(L, steps, states, i, current) {
  const s = steps[i], st = states[i], locked = !st.done && i > current;
  const href = stepHref(L, s);
  const how = {
    unit: "Done when you've learned 80% of its words in practice. More stars as they stick.",
    grammar: "Done at 70% or more in its exercises.", reading: "Done when you've read it and answered the questions.", listening: "Done when you've answered the questions.",
    writing: `Done when your text reaches ${WRITE_TARGET[L]} words.`, speaking: "Done when you've practised out loud.",
    checkpoint: "Pass with 7 out of 10.", test: "Pass with 70% or more."
  }[s.type];
  openSheet(`<div class="sheet-body">
      <p class="eyebrow">${TYPE[s.type].label} · step ${i + 1} of ${steps.length}</p>
      <p class="s-it">${esc(s.title)}</p><p class="s-en">${esc(s.en)}</p>
      <p class="muted small">${how} About ${mins(s.min)}.${st.note ? ` <b>${esc(st.note)}</b>.` : ""}${st.done ? ` ${stars(st.stars)}` : ""}</p>
      ${locked ? `<p class="muted small">This step opens when you finish the ones before it.</p>` : ""}
      <div class="btn-row">
        ${s.type === "unit" && !st.done ? `<a class="btn primary" href="#/session/unit/${s.ref}">Learn the words</a>` : ""}
        <a class="btn ${s.type === "unit" && !st.done ? "" : "primary"}" href="${href}">${st.done ? "Open again" : locked ? "Have a look" : s.type === "checkpoint" || s.type === "test" ? "Start" : "Open"}</a>
        ${s.type === "unit" && !st.done ? `<a class="btn quiet" href="#/quiz/to/${L}/${i}">Test out</a>` : ""}
      </div></div>`);
}
