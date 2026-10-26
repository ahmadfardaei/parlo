import { S, D, esc, rich, ICON, canSpeak, setEntry, shuffle, pick, say, lsGet, lsSet, remember } from "../core.js";
import { ensure } from "../data.js";
import { PRON, TENSES } from "./unit.js";
import { GTOPICS } from "./learn.js";
import { sentHTML } from "./texts.js";

const ACCENTS = ["à", "è", "é", "ì", "ò", "ù"];
const score = id => S.st["g:" + id] || null;

export async function viewGrammar(app, v, alive) {
  const all = await ensure("grammar");
  if (!alive()) return;
  const g = all.find(x => x.id === v.id);
  if (!g) { location.hash = "#/learn/grammar"; return; }
  if (v.mode === "practice" || v.mode === "drill") return practice(app, g, v.mode, all);
  remember("grammar", g.title, `#/grammar/${g.id}`, g.en);
  const sorted = all;
  const idx = sorted.indexOf(g);
  const sc = score(g.id);
  const table = t => {
    const rows = t.rows ? t.rows : t.end.map((e, i) => [(t.che ? "che " : "") + PRON[i], `${esc(t.stem)}<b>${esc(e)}</b>`, true]);
    return `<div class="panel g-table"><p class="g-table-h">${esc(t.h)}</p><table class="conj"><tbody>${rows.map(r => `<tr><td>${r[2] ? r[0] : rich(r[0])}</td><td class="it">${r[2] ? r[1] : rich(r[1])}</td></tr>`).join("")}</tbody></table></div>`;
  };
  const cta = `<div class="btn-row"><a class="btn primary" href="#/grammar/${g.id}/practice">Practise (${g.ex.length})</a>${g.tense ? `<a class="btn" href="#/grammar/${g.id}/drill">Verb drill</a>` : ""}</div>`;
  app.innerHTML = `<div class="layout"><div class="l-head"><a class="back-link" href="#/learn/grammar">${ICON.back} Grammatica</a>
    <header class="page-head"><p class="eyebrow">${g.level} · ${esc(GTOPICS[g.topic] || "")}</p><h1 class="it">${esc(g.title)}</h1><p class="muted">${esc(g.en)}. ${esc(g.summary)}</p></header></div>
    <div class="l-main">

    <section class="g-sec"><h2>The idea</h2><div class="panel prose"><p>${g.meaning}</p></div></section>
    <section class="g-sec"><h2>When to use it</h2><div class="panel flush">${g.uses.map(u => `<div class="use">
      <p class="use-h">${esc(u.h)}</p><p class="small">${u.t}</p>
      <p class="ex-it">${sentHTML({ it: u.ex[0], en: u.ex[1] }, `#/grammar/${g.id}`, g.title)}</p><p class="ex-en">${esc(u.ex[1])}</p></div>`).join("")}</div>
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
const norm = s => String(s).toLowerCase().replace(/[’‘`´]/g, "'").replace(/\s+/g, " ").trim().replace(/[.!?,;]+$/, "");
const plain = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const forms = f => /[oi]\/[ae]\b/.test(f) ? [f.replace(/([oi])\/([ae])\b/, "$1"), f.replace(/([oi])\/([ae])\b/, "$2")] : [f];
function judge(input, answers) {
  const n = norm(input), all = answers.flatMap(forms).map(norm);
  if (!n) return "empty";
  if (all.includes(n)) return "ok";
  if (all.some(a => plain(a) === plain(n))) return "accent";
  return "no";
}
let drillLevel = lsGet("parlo.drillLevel", "A2");

function practice(app, g, mode) {
  let items;
  if (mode === "drill") {
    if (!g.tense) { location.hash = `#/grammar/${g.id}`; return; }
    const levels = { A1: ["A1"], A2: ["A1", "A2"], B1: ["A1", "A2", "B1"], ALL: ["A1", "A2", "B1", "B2"] }[drillLevel] || ["A1", "A2"];
    const pool = D.units.filter(u => levels.includes(u.level)).flatMap(u => u.verbs).filter(vb => vb.t[g.tense].some(f => f !== "—"));
    const tname = TENSES.find(t => t.k === g.tense).it;
    items = shuffle(pool).slice(0, 10).map(vb => {
      const p = pick([0, 1, 2, 3, 4, 5].filter(i => vb.t[g.tense][i] !== "—"));
      return { k: "type", q: `${g.tense === "cong" ? "che " : ""}${PRON[p]} ___`, hint: `${vb.inf} · ${vb.en.split(";")[0]} · ${tname}`, a: [vb.t[g.tense][p]], why: `${tname} of <b>${esc(vb.inf)}</b>: ${vb.t[g.tense].filter(f => f !== "—").map(esc).join(", ")}` };
    });
  } else items = shuffle(g.ex).map(x => ({ ...x, hint: x.h || (x.v ? x.v + (x.p ? " · " + x.p : "") : "") }));
  let i = 0, right = 0, answered = false;
  const log = [];
  const shell = inner => `<div class="focus-top"><a class="icon-btn" href="#/grammar/${g.id}" aria-label="Exit">${ICON.close}</a>
      <div class="progress-track" aria-hidden="true"><span style="width:${(i / items.length) * 100}%"></span></div><span class="muted small">${Math.min(i + 1, items.length)}/${items.length}</span></div>
    <p class="eyebrow center">${mode === "drill" ? "Verb drill" : "Exercises"} · ${esc(g.title)}</p>${inner}`;
  const draw = () => {
    if (i >= items.length) {
      if (mode === "practice") { const prev = score(g.id); if (!prev || prev.best == null || right > prev.best) setEntry("g:" + g.id, { best: right, total: items.length }); }
      app.innerHTML = shell(`<div class="panel result"><p class="eyebrow">Your score</p><p class="score">${right}<span>/${items.length}</span></p>
        <p>${right === items.length ? "Perfetto!" : right >= items.length * 0.75 ? "Molto bene!" : right >= items.length / 2 ? "Bene. Keep going." : "Read the lesson again, then try once more."}</p>
        ${mode === "drill" ? `<div class="seg small" role="group" aria-label="Verbs from">${[["A1", "A1 verbs"], ["A2", "A1–A2"], ["B1", "A1–B1"], ["ALL", "All"]].map(([k, l]) => `<button data-dl="${k}" aria-pressed="${drillLevel === k}">${l}</button>`).join("")}</div>` : ""}
        <div class="btn-row center"><button class="btn primary" data-again>${mode === "drill" ? "10 more verbs" : "Try again"}</button><a class="btn" href="#/grammar/${g.id}">Back to the lesson</a></div></div>`);
      app.querySelector("[data-again]").onclick = () => practice(app, g, mode);
      app.querySelectorAll("[data-dl]").forEach(b => b.onclick = () => { drillLevel = b.dataset.dl; lsSet("parlo.drillLevel", drillLevel); practice(app, g, mode); });
      return;
    }
    const it = items[i];
    answered = false;
    app.innerHTML = shell(`<div class="panel quiz">
      <p class="q-prompt it">${esc(it.q).replace("___", '<span class="blank"></span>')}</p>
      ${it.hint ? `<p class="muted small">(${esc(it.hint)})</p>` : ""}
      ${it.k === "mc" ? `<div class="opts">${it.o.map((o, j) => `<button class="opt it" data-o="${j}">${esc(o)}</button>`).join("")}</div>`
        : `<form class="answer-form" autocomplete="off"><input class="input it answer" id="ans" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Your answer" placeholder="Type your answer"><button class="btn primary" type="submit">Check</button></form>
           <div class="accents" aria-label="Accented letters">${ACCENTS.map(a => `<button type="button" class="chip" data-acc="${a}">${a}</button>`).join("")}</div>`}
      <div class="fb" aria-live="polite"></div></div>`);
    const fb = app.querySelector(".fb");
    const finish = (ok, note) => {
      answered = true; log.push(ok); if (ok) right++;
      fb.innerHTML = `<p class="${ok ? "ok-text" : "bad-text"}">${ok ? "Giusto!" : "Not quite."}${note ? ` <span class="warn-text">${note}</span>` : ""}</p>
        ${!ok || note ? `<p>Answer: <span class="it strong">${esc(it.k === "mc" ? it.a : it.a[0])}</span></p>` : ""}<p class="muted small">${rich(it.why)}</p>
        <button class="btn primary" data-next>${i + 1 < items.length ? "Next" : "See score"}</button>`;
      const nx = fb.querySelector("[data-next]"); nx.onclick = () => { i++; draw(); }; nx.focus();
    };
    if (it.k === "mc") {
      app.querySelectorAll("[data-o]").forEach(b => b.onclick = () => {
        if (answered) return;
        const ok = it.o[+b.dataset.o] === it.a;
        app.querySelectorAll("[data-o]").forEach(x => { x.disabled = true; if (it.o[+x.dataset.o] === it.a) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
        finish(ok);
      });
    } else {
      const inp = app.querySelector("#ans");
      inp.focus({ preventScroll: true });
      app.querySelector(".answer-form").onsubmit = e => {
        e.preventDefault();
        if (answered) { i++; draw(); return; }
        const r = judge(inp.value, it.a);
        if (r === "empty") { inp.focus(); return; }
        const ok = r !== "no";
        inp.disabled = true; inp.classList.add(ok ? "right" : "wrong");
        app.querySelectorAll(".answer-form button, [data-acc]").forEach(b => b.disabled = true);
        if (ok) say(it.a[0]);
        finish(ok, r === "accent" ? "Watch the accent." : "");
      };
      app.querySelectorAll("[data-acc]").forEach(b => b.onclick = () => {
        const a = inp.selectionStart ?? inp.value.length, z = inp.selectionEnd ?? a;
        inp.value = inp.value.slice(0, a) + b.dataset.acc + inp.value.slice(z); inp.focus(); inp.setSelectionRange(a + 1, a + 1);
      });
    }
  };
  draw();
}
