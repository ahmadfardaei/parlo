// Quizzes: "Quiz me" (a mix of what you've studied) and the path's checkpoints, level tests and test-outs.
// Words are asked from English: you say (type) the Italian. Wrong answers come back in your next review.
import { S, D, esc, rich, ICON, full, statusOf, schedule, shuffle, pick, say, gf, adjForms, setEntry } from "../core.js";
import { ensure } from "../data.js";
import { PRON, TENSES } from "./unit.js";
import { answerHTML, wireAnswer, feedbackHTML } from "./check.js";
import ROADMAP from "../data/roadmap.json";

/* ---------- Building questions ---------- */
const levelUnits = () => D.units.filter(u => u.level === S.pref.level);
function vocabPool(types) {
  const studied = D.order.filter(id => types.includes(D.items[id].type) && statusOf(id) !== "new");
  if (studied.length >= 12) return { ids: studied, studied: true };
  return { ids: levelUnits().flatMap(u => D.unitIds[u.n]).filter(id => types.includes(D.items[id].type)), studied: false };
}
const sense = en => String(en).split(";")[0].trim();
const opts = (answer, pool) => shuffle([answer, ...shuffle([...new Set(pool)].filter(x => x && x !== answer)).slice(0, 3)]);
// mode "it": Italian shown, choose the meaning (only in checkpoints, for half the words). "en": say it in Italian.
function vocabQ(id, mode, poolIds) {
  const it = D.items[id], d = it.d, term = it.type === "w" ? full(d) : d.it;
  const why = `<span class="it">${esc(d.ex)}</span><br>${esc(d.exEn)}`;
  if (mode === "it") {
    // Only the first meaning of each option, so the answer doesn't stand out by its length.
    const same = poolIds.filter(x => D.items[x].type === it.type && D.items[x].u === it.u).map(x => sense(D.items[x].d.en));
    return { id, kind: it.type === "w" ? "Word" : "Phrase", prompt: `<span class="it">${esc(term)}</span>`, ask: "What does it mean?", k: "mc", a: sense(d.en), o: opts(sense(d.en), same.length > 3 ? same : poolIds.map(x => sense(D.items[x].d.en))), say: term, why };
  }
  // Accept the word with or without its article, and other endings of an adjective.
  return { id, kind: it.type === "w" ? "Word" : "Phrase", prompt: esc(d.en), ask: "Say it in Italian", k: "type", a: it.type === "w" && d.art ? [full(d), d.it] : [term], alt: it.type === "w" ? adjForms(d) : [], typo: true, say: term, why, loose: it.type === "p" };
}
function verbQ(id) {
  const v = D.items[id].d, t = pick(TENSES.slice(0, 4));
  const p = pick([0, 1, 2, 3, 4, 5].filter(i => v.t[t.k][i] !== "—"));
  const a = v.t[t.k][p];
  return { id, kind: "Verb", prompt: `<span class="it">${PRON[p]} <span class="blank"></span></span>`, ask: `${v.inf} (${v.en.split(";")[0]}) · ${t.it}`, k: "type", a: [a], say: gf(a, p === 0), why: `${t.it}: ${v.t[t.k].filter(f => f !== "—").map(esc).join(", ")}`, io: p === 0 };
}
const grammarQ = e => ({
  kind: "Grammar · " + e.lesson, prompt: `<span class="it">${esc(e.q).replace("___", '<span class="blank"></span>')}</span>`,
  ask: e.h || (e.v ? e.v + (e.p ? " · " + e.p : "") : ""), k: e.k, a: e.a, o: e.k === "mc" ? shuffle(e.o) : null, why: rich(e.why), it: true, io: e.p === "io"
});
// Quiz me: 5 words or phrases, 3 verb forms and 2 grammar items from what you've studied.
async function buildMix() {
  const { ids, studied } = vocabPool(["w", "p"]);
  const qs = shuffle(ids).slice(0, 5).map(id => vocabQ(id, "en", ids));
  qs.push(...shuffle(vocabPool(["v"]).ids).slice(0, 3).map(verbQ));
  const lessons = (await ensure("grammar")).filter(g => g.level === S.pref.level);
  const practised = lessons.filter(g => S.st["g:" + g.id]?.best != null);
  qs.push(...shuffle((practised.length >= 2 ? practised : lessons).flatMap(g => g.ex.map(e => ({ ...e, lesson: g.title })))).slice(0, 2).map(grammarQ));
  return { qs: shuffle(qs), note: studied ? "" : `You haven't studied many words yet, so this uses ${S.pref.level} vocabulary.`, label: "Quiz me" };
}
// Questions for a path checkpoint, the level test, or testing out of a unit.
async function buildPath(v) {
  const L = v.a, steps = ROADMAP[L]?.steps || [];
  let seg = steps;
  if (v.scope === "cp") { const at = steps.findIndex(s => s.type === "checkpoint" && String(s.ref) === String(v.b)); let from = at - 1; while (from >= 0 && steps[from].type !== "checkpoint") from--; seg = steps.slice(from + 1, at); }
  if (v.scope === "to") seg = [steps[+v.b]].filter(Boolean);
  const unitIds = seg.filter(s => s.type === "unit").flatMap(s => (D.unitIds[s.ref] || []).filter(id => D.items[id].type !== "v"));
  const lessons = seg.filter(s => s.type === "grammar").map(s => s.ref);
  const total = v.scope === "test" ? 20 : 10;
  const nGram = !unitIds.length ? total : !lessons.length || v.scope === "to" ? 0 : Math.round(total * 0.4);
  // Half the words are asked from English; testing out is all from English.
  const qs = shuffle(unitIds).slice(0, total - nGram).map((id, k) => vocabQ(id, v.scope === "to" || k % 2 ? "en" : "it", unitIds));
  if (nGram) qs.push(...shuffle((await ensure("grammar")).filter(g => lessons.includes(g.id)).flatMap(g => g.ex.map(e => ({ ...e, lesson: g.title })))).slice(0, nGram).map(grammarQ));
  return { qs: shuffle(qs), note: "", save: v.scope === "to" ? { key: "to:" + (steps[+v.b]?.id), pass: 0.8 } : { key: `cp:${L}:${v.scope === "test" ? L : v.b}`, pass: 0.7 }, back: `#/path/${L}`,
    label: v.scope === "test" ? `Test ${L}` : v.scope === "to" ? `Test out · ${steps[+v.b]?.title || ""}` : `Checkpoint ${v.b}` };
}

/* ---------- Running a quiz ---------- */
export async function viewQuiz(app, v, alive) {
  const built = ["cp", "test", "to"].includes(v.scope) ? await buildPath(v) : await buildMix();
  if (!alive()) return;
  run(app, v, alive, built, built.qs, false);
}
const answerOf = q => q.k !== "type" ? q.a : gf(q.a[0], q.io);
// What the learner missed, with the right answer.
const missedHTML = list => !list.length ? "" : `<div class="missed"><p class="eyebrow">You missed</p><ul>${list.map(q => `<li><span>${q.prompt}</span> → <span class="it strong">${esc(answerOf(q))}</span></li>`).join("")}</ul></div>`;

// retry: a second round on the questions missed, which does not change scores.
function run(app, v, alive, built, qs, retry) {
  const { note } = built, exit = built.back || "#/", label = retry ? "Practise what you missed" : built.label;
  let i = 0, right = 0;
  const missed = [], missedQs = [];
  const top = () => `<div class="focus-top"><a class="icon-btn" href="${exit}" aria-label="End quiz">${ICON.close}</a>
      <div class="progress-track" aria-hidden="true"><span style="width:${qs.length ? i / qs.length * 100 : 0}%"></span></div>
      <span class="count small">${Math.min(i + 1, qs.length)} / ${qs.length}</span></div>
    <p class="eyebrow center">${esc(label)}</p>`;
  const again = () => missedQs.length ? `<button class="btn primary" data-retry>Practise these ${missedQs.length}</button>` : "";
  const end = html => {
    app.innerHTML = `${top()}<div class="panel result">${html}</div>`;
    app.querySelector("[data-retry]")?.addEventListener("click", () => run(app, v, alive, built, shuffle(missedQs), true));
    app.querySelector("[data-again]")?.addEventListener("click", () => viewQuiz(app, v, alive));
  };
  const draw = () => {
    if (!qs.length) { app.innerHTML = `${top()}<div class="panel result"><p>${esc(note || "Nothing to quiz yet.")}</p><a class="btn primary" href="#/">Back to Oggi</a></div>`; return; }
    if (i >= qs.length) {
      // Missed words and verbs come back in the next review.
      missed.forEach(id => schedule(id, "10m"));
      const back = missed.length ? `<p class="muted small">${missed.length === 1 ? "The word you missed comes" : "The words you missed come"} back in your next review.</p>` : "";
      const score = `<p class="eyebrow">${retry ? "Second try" : esc(label)}</p><p class="score">${right}<span>/${qs.length}</span></p>`;
      if (built.save && !retry) {
        const prev = S.st[built.save.key], to = built.save.key.startsWith("to:");
        if (to) { if (right / qs.length >= built.save.pass) setEntry(built.save.key, { done: 1 }); }
        else if (!prev || prev.best == null || right > prev.best) setEntry(built.save.key, { best: right, total: qs.length });
        const passed = right / qs.length >= built.save.pass;
        return end(`${score}<p>${passed ? (to ? "Passed. This step is done." : "Passed. The next steps are open.") : `Not yet: you need ${Math.ceil(built.save.pass * qs.length)} to pass.`}</p>${missedHTML(missedQs)}${back}
          <div class="btn-row center">${passed ? `<a class="btn primary" href="${exit}">Back to the path</a>${again().replace("btn primary", "btn")}` : `${again()}<button class="btn" data-again>Try again</button><a class="btn quiet" href="${exit}">Back to the path</a>`}</div>`);
      }
      return end(`${score}<p>${right === qs.length ? "Perfetto!" : right >= qs.length * 0.7 ? "Molto bene!" : "Keep at it."}</p>${missedHTML(missedQs)}${back}
        <div class="btn-row center">${again()}${retry ? `<a class="btn ${missedQs.length ? "" : "primary"}" href="${exit}">Done</a>` : `<button class="btn ${missedQs.length ? "" : "primary"}" data-again>Another quiz</button>`}</div>`);
    }
    const q = qs[i];
    app.innerHTML = `${top()}<div class="panel quiz">
      ${i === 0 && note && !retry ? `<p class="hint-line">${esc(note)}</p>` : ""}
      <p class="eyebrow">${esc(q.kind)}</p>
      <p class="q-prompt">${q.prompt}</p>${q.ask ? `<p class="muted small">${esc(q.ask)}</p>` : ""}
      ${answerHTML(q)}<div class="fb" aria-live="polite"></div></div>`;
    wireAnswer(app, q, (ok, note) => {
      if (ok) right++; else { missedQs.push(q); if (q.id) missed.push(q.id); }
      const fb = app.querySelector(".fb");
      fb.innerHTML = feedbackHTML({ ok, note, answer: answerOf(q), why: q.why, last: i + 1 >= qs.length });
      if (q.say) say(q.say, q.sv);
      const nx = fb.querySelector("[data-next]"); nx.onclick = () => { i++; draw(); }; nx.focus();
    });
  };
  draw();
}
