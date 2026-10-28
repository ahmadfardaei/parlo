import { S, D, esc, rich, ICON, setEntry, shuffle, pick, say, lsGet, lsSet, remember, gf } from "../core.js";
import { ensure } from "../data.js";
import { PRON, TENSES } from "./unit.js";
import { GTOPICS } from "./learn.js";
import { sentHTML, starHTML } from "./texts.js";
import { answerHTML, wireAnswer, feedbackHTML } from "./check.js";

const score = id => S.st["g:" + id] || null;

export async function viewGrammar(app, v, alive) {
  const all = await ensure("grammar");
  if (!alive()) return;
  const g = all.find(x => x.id === v.id);
  if (!g) { location.hash = "#/learn/grammar"; return; }
  if (v.mode === "practice" || v.mode === "drill") return practice(app, g, v.mode);
  remember("grammar", g.title, `#/grammar/${g.id}`, g.en);
  const sorted = all;
  const idx = sorted.indexOf(g);
  const sc = score(g.id);
  const table = t => {
    // rows: [left, right] pairs, or plain strings (one per person: io, tu, …); stem+end: endings in bold.
    const rows = t.rows ? t.rows.map((r, i) => typeof r === "string" ? [(t.che ? "che " : "") + PRON[i], esc(gf(r, i === 0)), true] : r)
      : t.end.map((e, i) => [(t.che ? "che " : "") + PRON[i], `${esc(t.stem)}<b>${esc(e)}</b>`, true]);
    return `<div class="panel g-table"><p class="g-table-h">${esc(t.h)}</p><table class="conj"><tbody>${rows.map(r => `<tr><td>${r[2] ? r[0] : rich(r[0])}</td><td class="it">${r[2] ? r[1] : rich(r[1])}</td></tr>`).join("")}</tbody></table></div>`;
  };
  const cta = `<div class="btn-row"><a class="btn primary" href="#/grammar/${g.id}/practice">Practise (${g.ex.length})</a>${g.tense ? `<a class="btn" href="#/grammar/${g.id}/drill">Verb drill</a>` : ""}</div>`;
  app.innerHTML = `<div class="layout"><div class="l-head"><a class="back-link" href="#/learn/grammar">${ICON.back} Grammatica</a>
    <header class="page-head"><p class="eyebrow">${g.level} · ${esc(GTOPICS[g.topic] || "")}</p><h1 class="it">${esc(g.title)}</h1><p class="muted">${esc(g.en)}. ${esc(g.summary)}</p></header></div>
    <div class="l-main">

    <section class="g-sec"><h2>The idea</h2><div class="panel prose"><p>${g.meaning}</p></div></section>
    <section class="g-sec"><h2>When to use it</h2><div class="panel flush">${g.uses.map(u => `<div class="use">
      <p class="use-h">${esc(u.h)}</p><p class="small">${u.t}</p>
      <div class="ex-row"><p class="ex-it">${sentHTML({ it: u.ex[0], en: u.ex[1] }, `#/grammar/${g.id}`, g.title)}</p>${starHTML({ it: u.ex[0], en: u.ex[1] }, `#/grammar/${g.id}`, g.title)}</div><p class="ex-en">${esc(u.ex[1])}</p></div>`).join("")}</div>
      <p class="muted small">Tap any example to hear it or save it to your deck.</p></section>
    <section class="g-sec"><h2>How it works</h2>
      <div class="panel prose"><p>${g.form.intro}</p></div>
      ${g.form.tables ? `<div class="g-tables">${g.form.tables.map(table).join("")}</div>` : ""}
      ${g.form.compare ? `<div class="panel flush scroll-x"><table class="g-compare"><thead><tr><th>${esc(g.form.compare[0][0])}</th><th>${esc(g.form.compare[0][1])}</th></tr></thead><tbody>${g.form.compare.slice(1).map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join("")}</tbody></table></div>` : ""}
      ${g.form.notes ? `<ul class="notes">${g.form.notes.map(n => `<li>${rich(n)}</li>`).join("")}</ul>` : ""}
    </section>
    ${g.irregular ? `<details class="g-sec group"><summary><span class="group-title">${esc(g.irregularTitle || (g.id === "pp" ? "Irregular past participles" : "Irregular forms"))}</span><span class="group-meta">${g.irregular.length}</span></summary>
      <div class="panel flush">${g.irregular.map(([a, b]) => `<div class="irr"><span class="it">${rich(a)}</span><span>${rich(b)}</span></div>`).join("")}</div></details>` : ""}
    <section class="g-sec"><h2>Common mistakes</h2><div class="panel flush">${g.mistakes.map(m => `<div class="mistake">
      <p><span class="bad-text" aria-label="Wrong">✗</span> <s class="it">${esc(m.wrong)}</s></p><p><span class="ok-text" aria-label="Right">✓</span> <span class="it strong">${esc(m.right)}</span></p><p class="muted small">${rich(m.why)}</p></div>`).join("")}</div></section>
    <section class="panel g-end"><h2>Your turn</h2>${cta}</section>
    </div>
    <aside class="l-aside"><div class="l-side"><section class="panel">${sc && sc.best != null ? `<p class="muted small">Your best: ${sc.best} of ${sc.total}</p>` : ""}${cta}</section>
      ${g.signals ? `<section class="panel"><h2>Clues to look for</h2><div class="chips">${g.signals.map(s => `<span class="chip it">${esc(s)}</span>`).join("")}</div></section>` : ""}</div></aside></div>
    <nav class="pager">${sorted[idx - 1] ? `<a href="#/grammar/${sorted[idx - 1].id}">${ICON.back} ${esc(sorted[idx - 1].title)}</a>` : "<span></span>"}${sorted[idx + 1] ? `<a href="#/grammar/${sorted[idx + 1].id}">${esc(sorted[idx + 1].title)} ${ICON.chev}</a>` : ""}</nav>`;
}

/* ---------- Exercises ---------- */
let drillLevel = lsGet("parlo.drillLevel", "A2");

// What the learner got wrong, with the right answer.
function missedHTML(items, log) {
  const miss = items.filter((_, k) => log[k] === false);
  if (!miss.length) return "";
  return `<div class="missed"><p class="eyebrow">To look at again</p><ul>${miss.map(it => `<li><span class="it">${esc(it.q).replace("___", `<b>${esc(it.k === "mc" ? it.a : gf(it.a[0], it.io))}</b>`)}</span></li>`).join("")}</ul></div>`;
}
// Practice keeps its place, so leaving halfway and coming back picks up where you were.
const posKey = id => "parlo.gp." + id;
function practice(app, g, mode, fresh) {
  let items, order, resumed = null;
  if (mode === "drill") {
    if (!g.tense) { location.hash = `#/grammar/${g.id}`; return; }
    const levels = { A1: ["A1"], A2: ["A1", "A2"], B1: ["A1", "A2", "B1"], ALL: ["A1", "A2", "B1", "B2"] }[drillLevel] || ["A1", "A2"];
    const pool = D.units.filter(u => levels.includes(u.level)).flatMap(u => u.verbs).filter(vb => vb.t[g.tense].some(f => f !== "—"));
    const tname = TENSES.find(t => t.k === g.tense).it;
    items = shuffle(pool).slice(0, 10).map(vb => {
      const p = pick([0, 1, 2, 3, 4, 5].filter(i => vb.t[g.tense][i] !== "—"));
      return { k: "type", io: p === 0, q: `${g.tense === "cong" ? "che " : ""}${PRON[p]} ___`, hint: `${vb.inf} · ${vb.en.split(";")[0]} · ${tname}`, a: [vb.t[g.tense][p]], why: `${tname} of <b>${esc(vb.inf)}</b>: ${vb.t[g.tense].filter(f => f !== "—").map(esc).join(", ")}` };
    });
  } else {
    const saved = !fresh && lsGet(posKey(g.id), null);
    if (saved && saved.order?.length === g.ex.length && saved.i > 0 && saved.i < g.ex.length) resumed = saved;
    order = resumed ? resumed.order : shuffle(g.ex.map((_, k) => k));
    items = order.map(k => g.ex[k]).map(x => ({ ...x, io: x.p === "io", hint: x.h || (x.v ? x.v + (x.p ? " · " + x.p : "") : "") }));
  }
  let i = resumed?.i || 0, right = resumed?.right || 0;
  const log = resumed?.log || [];
  const keep = () => { if (mode === "practice") lsSet(posKey(g.id), { order, i, right, log }); };
  const shell = inner => `<div class="focus-top"><a class="icon-btn" href="#/grammar/${g.id}" aria-label="Exit">${ICON.close}</a>
      <div class="progress-track" aria-hidden="true"><span style="width:${(i / items.length) * 100}%"></span></div><span class="muted small">${Math.min(i + 1, items.length)}/${items.length}</span></div>
    <p class="eyebrow center">${mode === "drill" ? "Verb drill" : "Exercises"} · ${esc(g.title)}</p>${inner}`;
  const draw = () => {
    if (i >= items.length) {
      if (mode === "practice") lsSet(posKey(g.id), null);
      if (mode === "practice") { const prev = score(g.id); if (!prev || prev.best == null || right > prev.best) setEntry("g:" + g.id, { best: right, total: items.length }); }
      app.innerHTML = shell(`<div class="panel result"><p class="eyebrow">Your score</p><p class="score">${right}<span>/${items.length}</span></p>
        <p>${right === items.length ? "Perfetto!" : right >= items.length * 0.75 ? "Molto bene!" : right >= items.length / 2 ? "Bene. Keep going." : "Read the lesson again, then try once more."}</p>
        ${mode === "drill" ? `<div class="seg small" role="group" aria-label="Verbs from">${[["A1", "A1 verbs"], ["A2", "A1–A2"], ["B1", "A1–B1"], ["ALL", "All"]].map(([k, l]) => `<button data-dl="${k}" aria-pressed="${drillLevel === k}">${l}</button>`).join("")}</div>` : ""}
        ${missedHTML(items, log)}
        <div class="btn-row center"><button class="btn primary" data-again>${mode === "drill" ? "10 more verbs" : "Try again"}</button>${mode === "practice" ? `<a class="btn" href="#/say/grammar/${g.id}">Say it: 5 sentences</a>` : ""}<a class="btn quiet" href="#/grammar/${g.id}">Back to the lesson</a></div></div>`);
      app.querySelector("[data-again]").onclick = () => practice(app, g, mode, true);
      app.querySelectorAll("[data-dl]").forEach(b => b.onclick = () => { drillLevel = b.dataset.dl; lsSet("parlo.drillLevel", drillLevel); practice(app, g, mode); });
      return;
    }
    const it = items[i];
    app.innerHTML = shell(`${resumed && i === resumed.i ? `<p class="hint-line center">Picking up where you left off. <button class="text-btn" data-restart>Start over</button></p>` : ""}<div class="panel quiz">
      <p class="q-prompt it">${esc(it.q).replace("___", '<span class="blank"></span>')}</p>
      ${it.hint ? `<p class="muted small">(${esc(it.hint)})</p>` : ""}
      ${answerHTML({ ...it, it: true })}<div class="fb" aria-live="polite"></div></div>`);
    app.querySelector("[data-restart]")?.addEventListener("click", () => practice(app, g, mode, true));
    wireAnswer(app, it, (ok, note) => {
      log.push(ok); if (ok) right++;
      const answer = it.k === "mc" ? it.a : gf(it.a[0], it.io);
      if (ok && it.k !== "mc") say(it.a[0]);
      const fb = app.querySelector(".fb");
      fb.innerHTML = feedbackHTML({ ok, note, answer, why: rich(it.why), last: i + 1 >= items.length });
      const nx = fb.querySelector("[data-next]"); nx.onclick = () => { i++; keep(); draw(); }; nx.focus();
    });
  };
  draw();
}
