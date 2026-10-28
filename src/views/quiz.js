// Quizzes: quick checks on what the learner has studied. Two directions:
//  "it" = recognise (Italian shown, choose the meaning) · "en" = produce (English shown, type or say the Italian).
// Wrong answers are scheduled to come back in the next review.
import { S, D, esc, rich, ICON, full, statusOf, schedule, shuffle, pick, say, deckIds, LEVEL_NAMES, gf, judge, adjForms } from "../core.js";
import { ensure } from "../data.js";
import { PRON, TENSES } from "./unit.js";
import { cardData } from "./review.js";
import { setEntry } from "../core.js";
import ROADMAP from "../data/roadmap.json";

export const SCOPES = {
  mix: { it: "Mix", en: "Words, verbs and grammar you've studied" },
  vocab: { it: "Vocabolario", en: "Words and phrases" },
  verbs: { it: "Verbi", en: "Conjugations" },
  grammar: { it: "Grammatica", en: "Exercises from the lessons at your level" },
  deck: { it: "Il mio mazzo", en: "Sentences you saved" }
};
const MODES = { en: "English → Italiano", it: "Italiano → English" };
const ACCENTS = ["à", "è", "é", "ì", "ò", "ù"];

/* ---------- Hub ---------- */
export function viewQuizHub(app) {
  const mode = S.pref.quizMode || "en";
  app.innerHTML = `<a class="back-link" href="#/">${ICON.back} Oggi</a>
    <header class="page-head"><h1>Quiz</h1><p class="muted">Ten quick questions. Anything you miss comes back in your next review.</p></header>
    <section class="panel"><h2>Direction</h2>
      <div class="seg" role="group" aria-label="Direction">${Object.entries(MODES).map(([k, l]) => `<button data-qmode="${k}" aria-pressed="${mode === k}">${l}</button>`).join("")}</div>
      <p class="muted small">${mode === "it" ? "Recognise: you see Italian and choose what it means. Easier, but it trains understanding, not speaking." : "Produce: you see English and type or say the Italian. Harder, and the way to make words your own."}</p>
    </section>
    <div class="link-list panel flush">${Object.entries(SCOPES).map(([k, s]) => `<a class="row-link" href="#/quiz/${k}"><span><span class="row-title it">${s.it}</span><span class="muted small">${s.en}</span></span>${ICON.chev}</a>`).join("")}</div>`;
  app.querySelectorAll("[data-qmode]").forEach(b => b.onclick = () => { S.pref.quizMode = b.dataset.qmode; try { localStorage.setItem("parlo.pref", JSON.stringify(S.pref)); } catch (e) {} viewQuizHub(app); });
}

/* ---------- Building questions ---------- */
const levelUnits = () => D.units.filter(u => u.level === S.pref.level);
function vocabPool(types) {
  const studied = D.order.filter(id => types.includes(D.items[id].type) && statusOf(id) !== "new");
  if (studied.length >= 12) return { ids: studied, studied: true };
  return { ids: levelUnits().flatMap(u => D.unitIds[u.n]).filter(id => types.includes(D.items[id].type)), studied: false };
}
const sense = en => String(en).split(";")[0].trim();
const opts = (answer, pool) => shuffle([answer, ...shuffle([...new Set(pool)].filter(x => x && x !== answer)).slice(0, 3)]);
function vocabQ(id, mode, poolIds) {
  const it = D.items[id], d = it.d, term = it.type === "w" ? full(d) : d.it;
  if (mode === "it") {
    // Only the first meaning of each option, so the answer doesn't stand out by its length.
    const same = poolIds.filter(x => D.items[x].type === it.type && D.items[x].u === it.u).map(x => sense(D.items[x].d.en));
    return { id, kind: it.type === "w" ? "Word" : "Phrase", prompt: `<span class="it">${esc(term)}</span>`, ask: "What does it mean?", k: "mc", a: sense(d.en), o: opts(sense(d.en), same.length > 3 ? same : poolIds.map(x => sense(D.items[x].d.en))), say: term, why: `<span class="it">${esc(d.ex)}</span><br>${esc(d.exEn)}` };
  }
  // Producing: accept the word with or without its article.
  const answers = it.type === "w" && d.art ? [full(d), d.it] : [term];
  return { id, kind: it.type === "w" ? "Word" : "Phrase", prompt: esc(d.en), ask: "Say it in Italian", k: "type", a: answers, alt: it.type === "w" ? adjForms(d) : [], say: term, why: `<span class="it">${esc(d.ex)}</span><br>${esc(d.exEn)}`, loose: it.type === "p" };
}
function verbQ(id, mode) {
  const v = D.items[id].d, t = pick(TENSES.slice(0, 4));
  const p = pick([0, 1, 2, 3, 4, 5].filter(i => v.t[t.k][i] !== "—"));
  const a = v.t[t.k][p];
  const prompt = `<span class="it">${PRON[p]} <span class="blank"></span></span>`;
  const ask = `${v.inf} (${v.en.split(";")[0]}) · ${t.it}`;
  const why = `${t.it}: ${v.t[t.k].filter(f => f !== "—").map(esc).join(", ")}`;
  return mode === "it"
    ? { id, kind: "Verb", prompt, ask, k: "mc", a, o: opts(a, v.t[t.k].filter(f => f !== "—")), say: a, why, it: true }
    : { id, kind: "Verb", prompt, ask, k: "type", a: [a], say: gf(a, p === 0), why, io: p === 0 };
}
async function grammarQs(n) {
  const all = await ensure("grammar");
  const lessons = all.filter(g => g.level === S.pref.level);
  const practised = lessons.filter(g => S.st["g:" + g.id]?.best != null);
  const src = practised.length >= 2 ? practised : lessons;
  return shuffle(src.flatMap(g => g.ex.map(e => ({ ...e, lesson: g.title })))).slice(0, n).map(e => ({
    kind: "Grammar · " + e.lesson, prompt: `<span class="it">${esc(e.q).replace("___", '<span class="blank"></span>')}</span>`,
    ask: e.h || (e.v ? e.v + (e.p ? " · " + e.p : "") : ""), k: e.k, a: e.a, o: e.k === "mc" ? shuffle(e.o) : null, why: rich(e.why), it: true, io: e.p === "io"
  }));
}
function deckQ(id, mode, ids) {
  const c = cardData(id);
  if (mode === "it" && ids.length >= 4) return { id, kind: "Saved sentence", prompt: `<span class="it">${c.sentIt}</span>`, ask: "What does it mean?", k: "mc", a: c.sentEn, o: opts(c.sentEn, ids.map(x => cardData(x).sentEn)), say: c.say, sv: c.sv };
  // Whole sentences are too long to type exactly: say or write it, then check yourself.
  return { id, kind: "Saved sentence", prompt: mode === "it" ? `<span class="it">${c.sentIt}</span>` : esc(c.sentEn), ask: mode === "it" ? "What does it mean?" : "Say it in Italian, then check", k: "self", a: mode === "it" ? c.sentEn : c.sentIt, aHtml: true, say: c.say, sv: c.sv };
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
  // Half the words are asked from English (say it in Italian); testing out is all from English.
  const qs = shuffle(unitIds).slice(0, total - nGram).map((id, k) => vocabQ(id, v.scope === "to" || k % 2 ? "en" : "it", unitIds));
  if (nGram) {
    const all = await ensure("grammar");
    qs.push(...shuffle(all.filter(g => lessons.includes(g.id)).flatMap(g => g.ex.map(e => ({ ...e, lesson: g.title })))).slice(0, nGram).map(e => ({
      kind: "Grammar · " + e.lesson, prompt: `<span class="it">${esc(e.q).replace("___", '<span class="blank"></span>')}</span>`,
      ask: e.h || (e.v ? e.v + (e.p ? " · " + e.p : "") : ""), k: e.k, a: e.a, o: e.k === "mc" ? shuffle(e.o) : null, why: rich(e.why), it: true, io: e.p === "io" })));
  }
  return { qs: shuffle(qs), note: "", save: v.scope === "to" ? { key: "to:" + (steps[+v.b]?.id), pass: 0.8 } : { key: `cp:${L}:${v.scope === "test" ? L : v.b}`, pass: 0.7 }, back: `#/path/${L}`,
    title: v.scope === "test" ? `Test ${L}` : v.scope === "to" ? `Test out · ${steps[+v.b]?.title || ""}` : `Checkpoint ${v.b}` };
}
async function build(scope, mode) {
  let qs = [], note = "";
  if (scope === "vocab" || scope === "mix") {
    const { ids, studied } = vocabPool(["w", "p"]);
    if (!studied) note = `You haven't studied many words yet, so this uses ${S.pref.level} vocabulary.`;
    qs.push(...shuffle(ids).slice(0, scope === "mix" ? 4 : 10).map(id => vocabQ(id, mode, ids)));
  }
  if (scope === "verbs" || scope === "mix") {
    const { ids } = vocabPool(["v"]);
    qs.push(...shuffle(ids).slice(0, scope === "mix" ? 3 : 10).map(id => verbQ(id, mode)));
  }
  if (scope === "grammar" || scope === "mix") qs.push(...await grammarQs(scope === "mix" ? 3 : 10));
  if (scope === "deck") {
    const ids = deckIds();
    if (!ids.length) return { qs: [], note: "Your deck is empty. Save some sentences first." };
    qs = shuffle(ids).slice(0, 10).map(id => deckQ(id, mode, ids));
  }
  return { qs: scope === "mix" ? shuffle(qs) : qs, note };
}

/* ---------- Running a quiz ---------- */
export async function viewQuiz(app, v, alive) {
  const pathQuiz = ["cp", "test", "to"].includes(v.scope);
  const scope = pathQuiz ? v.scope : SCOPES[v.scope] ? v.scope : "mix", mode = pathQuiz ? "en" : (S.pref.quizMode || "en");
  const built = pathQuiz ? await buildPath(v) : await build(scope, mode);
  if (!alive()) return;
  built.label = built.title || `Quiz · ${SCOPES[scope].it}`;
  run(app, v, alive, built, built.qs, false);
}
// What the learner missed, with the right answer.
const missedHTML = list => !list.length ? "" : `<div class="missed"><p class="eyebrow">You missed</p><ul>${list.map(q => `<li><span>${q.prompt}</span> → <span class="it strong">${q.k === "mc" ? esc(q.a) : q.k === "self" ? (q.aHtml ? q.a : esc(q.a)) : esc(gf(q.a[0], q.io))}</span></li>`).join("")}</ul></div>`;

// retry: a second round on the questions missed, which does not change scores.
function run(app, v, alive, built, qs, retry) {
  const { note } = built, exit = built.back || "#/quiz", label = retry ? "Practise what you missed" : built.label;
  let i = 0, right = 0, answered = false;
  const missed = [], missedQs = [];
  const top = () => `<div class="focus-top"><a class="icon-btn" href="${exit}" aria-label="End quiz">${ICON.close}</a>
      <div class="progress-track" aria-hidden="true"><span style="width:${qs.length ? i / qs.length * 100 : 0}%"></span></div>
      <span class="count small">${Math.min(i + 1, qs.length)} / ${qs.length}</span></div>
    <p class="eyebrow center">${esc(label)}</p>`;
  const again = () => missedQs.length ? `<button class="btn primary" data-retry>Practise these ${missedQs.length}</button>` : "";
  const wireEnd = () => {
    app.querySelector("[data-retry]")?.addEventListener("click", () => run(app, v, alive, built, shuffle(missedQs), true));
  };
  const draw = () => {
    if (!qs.length) { app.innerHTML = `${top()}<div class="panel result"><p>${esc(note || "Nothing to quiz yet.")}</p><a class="btn primary" href="#/">Back to Oggi</a></div>`; return; }
    if (i >= qs.length) {
      // Missed words, verbs and sentences come back in the next review.
      missed.forEach(id => schedule(id, "10m"));
      const back = missed.length ? `<p class="muted small">${missed.length === 1 ? "The word you missed comes" : "The words you missed come"} back in your next review.</p>` : "";
      if (built.save && !retry) {
        const prev = S.st[built.save.key];
        if (built.save.key.startsWith("to:")) { if (right / qs.length >= built.save.pass) setEntry(built.save.key, { done: 1 }); }
        else if (!prev || prev.best == null || right > prev.best) setEntry(built.save.key, { best: right, total: qs.length });
        const passed = right / qs.length >= built.save.pass;
        app.innerHTML = `${top()}<div class="panel result"><p class="eyebrow">${esc(label)}</p><p class="score">${right}<span>/${qs.length}</span></p>
          <p>${passed ? (built.save.key.startsWith("to:") ? "Passed. This step is done." : "Passed. The next steps are open.") : `Not yet: you need ${Math.ceil(built.save.pass * qs.length)} to pass.`}</p>
          ${missedHTML(missedQs)}${back}
          <div class="btn-row center">${passed ? `<a class="btn primary" href="${exit}">Back to the path</a>${again().replace("btn primary", "btn")}` : `${again()}<button class="btn" data-again>Try again</button><a class="btn quiet" href="${exit}">Back to the path</a>`}</div></div>`;
        app.querySelector("[data-again]")?.addEventListener("click", () => viewQuiz(app, v, alive));
        return wireEnd();
      }
      app.innerHTML = `${top()}<div class="panel result"><p class="eyebrow">${retry ? "Second try" : "Your score"}</p><p class="score">${right}<span>/${qs.length}</span></p>
        <p>${right === qs.length ? "Perfetto!" : right >= qs.length * 0.7 ? "Molto bene!" : "Keep at it."}</p>
        ${missedHTML(missedQs)}${back}
        <div class="btn-row center">${again()}${retry ? `<a class="btn ${missedQs.length ? "" : "primary"}" href="${exit}">Done</a>` : `<button class="btn ${missedQs.length ? "" : "primary"}" data-again>Another quiz</button><a class="btn quiet" href="#/quiz">Choose another</a>`}</div></div>`;
      app.querySelector("[data-again]")?.addEventListener("click", () => viewQuiz(app, v, alive));
      return wireEnd();
    }
    const q = qs[i]; answered = false; let retried = false;
    app.innerHTML = `${top()}<div class="panel quiz">
      ${i === 0 && note && !retry ? `<p class="hint-line">${esc(note)}</p>` : ""}
      <p class="eyebrow">${esc(q.kind)}</p>
      <p class="q-prompt">${q.prompt}</p>${q.ask ? `<p class="muted small">${esc(q.ask)}</p>` : ""}
      ${q.k === "mc" ? `<div class="opts">${q.o.map((o, j) => `<button class="opt ${q.it ? "it" : ""}" data-o="${j}">${esc(o)}</button>`).join("")}</div>`
        : q.k === "type" ? `<form class="answer-form" autocomplete="off"><input class="input it answer" id="ans" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Your answer" placeholder="Scrivi in italiano"><button class="btn primary" type="submit">Check</button></form>
           <div class="accents" aria-label="Accented letters">${ACCENTS.map(a => `<button type="button" class="chip" data-acc="${a}">${a}</button>`).join("")}</div>`
        : `<button class="btn primary wide" data-reveal>Show the answer</button>`}
      <div class="fb" aria-live="polite"></div></div>`;
    const fb = app.querySelector(".fb");
    const finish = (ok, extra) => {
      answered = true; if (ok) right++; else { missedQs.push(q); if (q.id) missed.push(q.id); }
      const shown = q.k === "mc" ? esc(q.a) : q.k === "self" ? (q.aHtml ? q.a : esc(q.a)) : esc(gf(q.a[0], q.io));
      fb.innerHTML = `${q.k === "self" ? "" : `<p class="${ok ? "ok-text" : "bad-text"}">${ok ? "Giusto!" : "Not quite."}${extra ? ` <span class="warn-text">${extra}</span>` : ""}</p>`}
        ${!ok || extra || q.k !== "mc" ? `<p>${q.k === "self" ? "" : "Answer: "}<span class="it strong">${shown}</span></p>` : ""}
        ${q.why ? `<p class="muted small">${q.why}</p>` : ""}
        <button class="btn primary" data-next>${i + 1 < qs.length ? "Next" : "See score"}</button>`;
      if (q.say) say(q.say, q.sv);
      const nx = fb.querySelector("[data-next]"); nx.onclick = () => { i++; draw(); }; nx.focus();
    };
    if (q.k === "mc") app.querySelectorAll("[data-o]").forEach(b => b.onclick = () => {
      if (answered) return; const ok = q.o[+b.dataset.o] === q.a;
      app.querySelectorAll("[data-o]").forEach(x => { x.disabled = true; if (q.o[+x.dataset.o] === q.a) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
      finish(ok);
    });
    if (q.k === "type") {
      const inp = app.querySelector("#ans"); inp.focus({ preventScroll: true });
      app.querySelector(".answer-form").onsubmit = e => {
        e.preventDefault(); if (answered) { i++; draw(); return; }
        const val = q.loose ? inp.value.replace(/[!?.…,]/g, "") : inp.value;
        let r = judge(val, q.loose ? q.a.map(a => a.replace(/[!?.…,]/g, "")) : q.a, q.kind === "Word" || q.kind === "Phrase");
        if (r === "empty") return inp.focus();
        // Another ending of the same adjective is also right.
        if (r === "no" && q.alt?.length && judge(val, q.alt) === "ok") r = "alt";
        // One letter off: say so and allow one more try.
        if (r === "close" && !retried) { retried = true; fb.innerHTML = `<p class="warn-text">Almost: check the spelling and try again.</p>`; inp.focus(); return; }
        const ok = ["ok", "accent", "alt"].includes(r);
        inp.disabled = true; inp.classList.add(ok ? "right" : "wrong");
        app.querySelectorAll(".answer-form button, [data-acc]").forEach(b => b.disabled = true);
        finish(ok, r === "accent" ? "Watch the accent." : r === "alt" ? `Also right. The dictionary form is ${q.a[0]}.` : "");
      };
      app.querySelectorAll("[data-acc]").forEach(b => b.onclick = () => { const a = inp.selectionStart ?? inp.value.length; inp.value = inp.value.slice(0, a) + b.dataset.acc + inp.value.slice(inp.selectionEnd ?? a); inp.focus(); inp.setSelectionRange(a + 1, a + 1); });
    }
    if (q.k === "self") app.querySelector("[data-reveal]").onclick = () => {
      app.querySelector("[data-reveal]").remove();
      fb.innerHTML = `<p class="it strong">${q.aHtml ? q.a : esc(q.a)}</p><p class="muted small">Did you get it?</p><div class="btn-row"><button class="btn" data-self="0">Not yet</button><button class="btn primary" data-self="1">Got it</button></div>`;
      if (q.say) say(q.say, q.sv);
      fb.querySelectorAll("[data-self]").forEach(b => b.onclick = () => { const ok = b.dataset.self === "1"; if (ok) right++; else { missedQs.push(q); missed.push(q.id); } i++; draw(); });
    };
  };
  draw();
}
