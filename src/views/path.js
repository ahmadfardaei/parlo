// The path: a suggested order through each level. Every step is open; each shows 0–3 stars.
import { S, D, esc, ICON, LEVELS, LEVEL_NAMES, statusOf, openSheet, remember, learned } from "../core.js";
import ROADMAP from "../data/roadmap.json";
import { learnNav } from "./learn.js";

// One line icon per kind of step: cards, a puzzle piece, a book, headphones, a pen, a microphone, a flag, a medal.
const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const TYPE = {
  unit: { label: "Vocabolario", icon: svg('<rect x="3" y="7" width="13" height="13" rx="2"/><path d="M8 4h11a2 2 0 0 1 2 2v11"/>') },
  grammar: { label: "Grammatica", icon: svg('<path d="M10 4a2 2 0 1 1 4 0v2h4v4h-2a2 2 0 1 0 0 4h2v4h-4v-2a2 2 0 1 0-4 0v2H6v-4h2a2 2 0 1 0 0-4H6V6h4z"/>') },
  reading: { label: "Lettura", icon: svg('<path d="M3 5.5c3-1 6-1 9 1 3-2 6-2 9-1V19c-3-1-6-1-9 1-3-2-6-2-9-1z"/><path d="M12 6.5V20"/>') },
  listening: { label: "Ascolto", icon: svg('<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>') },
  writing: { label: "Scrittura", icon: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>') },
  speaking: { label: "Parlato", icon: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>') },
  checkpoint: { label: "Checkpoint", icon: svg('<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>') },
  test: { label: "Test di livello", icon: svg('<circle cx="12" cy="9" r="5"/><path d="M8.5 13 7 21l5-3 5 3-1.5-8"/>') }
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
      // Learned = recalled at least once. "Solid" = known, or recalled at least twice.
      const got = ids.filter(learned).length;
      const solid = ids.filter(id => statusOf(id) === "known" || ["3d", "7d", "14d", "30d"].includes(S.st[id]?.iv)).length;
      const done = got / n >= 0.8;
      return { done, stars: done ? 1 + (solid / n >= 0.5) + (solid / n >= 0.8) : 0, note: `${got} of ${ids.length} learned` };
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
const stars = n => `<span class="stars" aria-label="${n} of 3 stars">${[1, 2, 3].map(i => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;

export function viewPath(app, v) {
  const L = LEVELS.includes(v.level) ? v.level : S.pref.level;
  const { steps, states, done, current } = pathProgress(L);
  remember("path", `Percorso ${L}`, `#/path/${L}`, `${done} of ${steps.length} steps`);
  // The path lives in Impara, as its first tab.
  app.innerHTML = `${learnNav("path")}<header class="path-head sub-head">
      <div class="seg small" role="group" aria-label="Level">${LEVELS.map(l => `<a href="#/path/${l}" ${l === L ? 'aria-current="page"' : ""}>${l}</a>`).join("")}</div>
      <h2 class="path-title">Percorso ${L}</h2>
      <p class="muted">${LEVEL_NAMES[L]} · ${steps.length} steps. Follow the order, or open any step you like.</p>
      <div class="level-prog"><span class="bar"><span class="k" style="width:${done / steps.length * 100}%"></span></span><span class="small">${done} of ${steps.length}</span></div>
    </header>
    <ol class="path">${steps.map((s, i) => {
      const st = states[i], state = st.done ? "done" : i === current ? "current" : "todo";
      const wave = Math.round(Math.sin(i * 0.8) * 8);
      return `<li class="step ${state} t-${s.type}" style="--x:${wave}px">
        <button class="node" data-step="${i}" aria-label="${esc(s.title)}, ${TYPE[s.type].label}, ${state}">${st.done ? ICON.check : TYPE[s.type].icon}</button>
        <button class="step-text" data-step="${i}">
          <span class="step-title ${s.type === "checkpoint" || s.type === "test" ? "" : "it"}">${esc(s.title)}</span>
          <span class="step-meta">${TYPE[s.type].label}${st.done ? " · " + stars(st.stars) : ""}</span>
        </button>
        ${state === "current" ? `<a class="btn primary small" href="${stepHref(L, s)}">Start</a>` : ""}
      </li>`;
    }).join("")}</ol>`;
  app.querySelectorAll("[data-step]").forEach(b => b.onclick = () => stepSheet(L, steps, states, +b.dataset.step, current));
  const cur = app.querySelector(".step.current");
  if (cur && !v.keepScroll) setTimeout(() => cur.scrollIntoView({ block: "center" }), 50);
}

function stepSheet(L, steps, states, i, current) {
  const s = steps[i], st = states[i];
  const href = stepHref(L, s);
  const how = {
    unit: "Done when you can say 80% of its words from English. More stars as they stick.",
    grammar: "Done at 70% or more in its exercises.", reading: "Done when you've read it and answered the questions.", listening: "Done when you've answered the questions.",
    writing: `Done when your text reaches ${WRITE_TARGET[L]} words.`, speaking: "Done when you've practised out loud.",
    checkpoint: "Pass with 7 out of 10.", test: "Pass with 70% or more."
  }[s.type];
  openSheet(`<div class="sheet-body">
      <p class="eyebrow">${TYPE[s.type].label} · step ${i + 1} of ${steps.length}</p>
      <p class="s-it">${esc(s.title)}</p><p class="s-en">${esc(s.en)}</p>
      <p class="muted small">${how}${st.note ? ` <b>${esc(st.note)}</b>.` : ""}${st.done ? ` ${stars(st.stars)}` : ""}</p>
      ${!st.done && i > current ? `<p class="muted small">Your path suggests ${esc(steps[current].title)} first, but you can start here.</p>` : ""}
      <div class="btn-row">
        ${s.type === "unit" && !st.done ? `<a class="btn primary" href="#/session/unit/${s.ref}">Learn the words</a>` : ""}
        <a class="btn ${s.type === "unit" && !st.done ? "" : "primary"}" href="${href}">${st.done ? "Open again" : s.type === "unit" ? "See the words" : "Start"}</a>
        ${s.type === "unit" && !st.done ? `<a class="btn quiet" href="#/quiz/to/${L}/${i}">Test out</a>` : ""}
        ${st.done && ["unit", "grammar", "reading", "listening"].includes(s.type) ? `<a class="btn speak" href="#/say/${{ unit: "unit", grammar: "grammar", reading: "read", listening: "listen" }[s.type]}/${s.ref}">Say it: 5 sentences</a>` : ""}
      </div></div>`);
}
