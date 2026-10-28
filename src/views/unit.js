import { starHTML } from "./texts.js";
import { pdfUrl } from "../voice.js";
import { exVoice } from "../core.js";
import { S, D, esc, rich, ICON, full, unitByN, counts, barHTML, statusOf, statusLabel, inDeck, schedHTML, canSpeak, TOPICS, remember, shuffle, pick, say, openSheet, gf, pickEx } from "../core.js";

export const PRON = ["io", "tu", "lui / lei", "noi", "voi", "loro"];
export const TENSES = [
  { k: "pres", it: "Presente", en: "I do / I'm doing" },
  { k: "pp", it: "Passato prossimo", en: "I did / I have done" },
  { k: "imp", it: "Imperfetto", en: "I used to / I was doing" },
  { k: "fut", it: "Futuro", en: "I will do" },
  { k: "cond", it: "Condizionale", en: "I would do" },
  { k: "cong", it: "Congiuntivo", en: "that I do (after “penso che”…)" }
];
const POS = { adj: "adjective", adv: "adverb", q: "question word", prep: "preposition", conj: "conjunction", pron: "pronoun", num: "number", expr: "expression" };

// Highlight the target word inside its example sentence (matches agreeing / plural forms by stem).
export function highlight(sentence, word) {
  const w = String(word).replace(/^(il|lo|la|l'|i|gli|le|un|uno|una|un')\s*/i, "").split(/[\s;,(]/)[0];
  if (!w || w.length < 2) return esc(sentence);
  const stem = w.length > 4 ? w.slice(0, -1) : w;
  const re = new RegExp(`(^|[^\\p{L}])(${stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\p{L}*)`, "iu");
  const m = sentence.match(re);
  if (!m) return esc(sentence);
  const i = m.index + m[1].length;
  return esc(sentence.slice(0, i)) + "<b>" + esc(m[2]) + "</b>" + esc(sentence.slice(i + m[2].length));
}

export function actionsHTML(id) {
  return `<div class="item-actions">
      ${canSpeak ? `<button class="btn quiet small" data-say-id="${esc(id)}">${ICON.speak}<span>Listen</span></button>` : ""}
      <button class="btn quiet small deck-btn" data-deck="${esc(id)}" aria-pressed="${inDeck(id)}">${ICON.star}<span class="lbl">${inDeck(id) ? "In deck" : "Save"}</span></button>
      <button class="status ${statusOf(id)}" data-status="${esc(id)}" data-toggle-sched="${esc(id)}" aria-label="Review schedule">${statusLabel(id)}</button>
    </div>
    <div class="sched-wrap" hidden><p class="muted small">Review this again in…</p>${schedHTML(id)}</div>`;
}
function itemHTML(id) {
  const it = D.items[id], d = it.d;
  let term, sub = "", more = "";
  if (it.type === "w") {
    term = d.art ? `<span class="art ${d.g}">${esc(d.art)}</span>${d.art.endsWith("'") ? "" : " "}${esc(d.it)}` : esc(d.it);
    sub = d.g ? `<span class="tag ${d.g}">${d.g === "m" ? "masculine" : "feminine"}${d.pl ? " · plural " + esc(d.pl) : ""}</span>` : `<span class="tag">${POS[d.pos] || esc(d.pos)}</span>`;
    const ex = pickEx(d.ex, d.exAlt);
    more = `<div class="ex-row"><p class="ex-it">${highlight(ex, d.it)}</p>${starHTML({ it: ex, en: d.exEn }, `#/unit/${it.u}/words`, `Unità ${it.u}`, exVoice(ex, d.exAlt))}</div><p class="ex-en">${esc(d.exEn)}</p>${d.note ? `<p class="note">${rich(d.note)}</p>` : ""}`;
  } else {
    term = esc(d.it);
    sub = `<span class="tag">${esc(d.reg)}</span>`;
    const ex = pickEx(d.ex, d.exAlt);
    more = `<p class="muted small">Literally: “${esc(d.lit)}”</p><div class="ex-row"><p class="ex-it">${esc(ex)}</p>${starHTML({ it: ex, en: d.exEn }, `#/unit/${it.u}/phrases`, `Unità ${it.u}`, exVoice(ex, d.exAlt))}</div><p class="ex-en">${esc(d.exEn)}</p>${d.note ? `<p class="note">${rich(d.note)}</p>` : ""}`;
  }
  return `<div class="item">
    <button class="item-main" data-expand aria-haspopup="dialog">
      <span class="dot ${statusOf(id)}" data-dot="${esc(id)}"></span>
      <span class="item-term it">${term}</span><span class="item-en">${esc(d.en)}</span>${ICON.chev}
    </button>
    <div class="item-more" hidden><div class="item-tags">${sub}</div>${more}${actionsHTML(id)}</div></div>`;
}
function verbHTML(id) {
  const v = D.items[id].d;
  return `<div class="item" data-verb="${esc(id)}">
    <button class="item-main" data-expand aria-haspopup="dialog">
      <span class="dot ${statusOf(id)}" data-dot="${esc(id)}"></span>
      <span class="item-term it">${esc(v.inf)}</span><span class="item-en">${esc(v.en)}</span>${ICON.chev}
    </button>
    <div class="item-more" hidden>
      <div class="item-tags"><span class="tag">${esc(v.kind)}</span><span class="tag">past with ${esc(v.aux)}</span></div>
      <div class="seg small scroll" role="group" aria-label="Tense">${TENSES.map((t, i) => `<button data-tense="${t.k}" aria-pressed="${i === 0}">${t.it}</button>`).join("")}</div>
      <div class="conj-wrap">${conjHTML(v, "pres")}</div>
      ${v.ex.map(([a, b], i) => { const ex = pickEx(a, v.exAlt?.[i]); return `<div class="ex-row"><p class="ex-it">${esc(ex)}</p>${starHTML({ it: ex, en: b }, `#/unit/${D.items[id].u}/verbs`, `Unità ${D.items[id].u}`, exVoice(ex, v.exAlt?.[i]))}</div><p class="ex-en">${esc(b)}</p>`; }).join("")}
      <p class="note">${rich(v.note)}</p>
      ${actionsHTML(id)}
    </div></div>`;
}
export function conjHTML(v, k) {
  const t = TENSES.find(x => x.k === k);
  const pron = k === "cong" ? PRON.map(p => "che " + p) : PRON;
  return `<p class="muted small">${t.en}</p><table class="conj"><tbody>${v.t[k].map((f, i) => `<tr><td>${pron[i]}</td><td class="it">${esc(gf(f, i === 0))}</td><td>${canSpeak && f !== "—" ? `<button class="icon-btn small" data-say-text="${esc(gf(f, i === 0))}" aria-label="Listen to ${esc(gf(f, i === 0))}">${ICON.speak}</button>` : ""}</td></tr>`).join("")}</tbody></table>`;
}

export function viewUnit(app, v) {
  const u = unitByN(v.u);
  if (!u) { app.innerHTML = `<div class="empty-state"><h2>Unit not found</h2><a class="btn" href="#/learn/vocab">All units</a></div>`; return; }
  remember("unit", `Unità ${u.n}: ${u.title}`, `#/unit/${u.n}/${v.tab}`, u.en);
  const ids = D.unitIds[u.n], c = counts(ids);
  const n = { words: ids.filter(id => D.items[id].type === "w").length, verbs: u.verbs.length, phrases: ids.filter(id => D.items[id].type === "p").length };
  const fresh = ids.filter(id => statusOf(id) === "new").length;
  app.innerHTML = `<a class="back-link" href="#/learn/vocab">${ICON.back} Vocabolario</a>
    <header class="page-head">
      <p class="eyebrow">Unità ${u.n} · ${u.level} · ${esc(TOPICS[u.topic])}</p>
      <h1 class="it">${esc(u.title)}</h1>
      <p class="muted">${esc(u.en)}. ${esc(u.intro || "")}</p>
    </header>
    <section class="panel unit-cta">
      <div class="level-prog">${barHTML(c)}<span class="small">${Math.round(c.known / Math.max(1, c.total) * 100)}% known</span></div>
      <a class="btn quiet small pdf-link" href="${pdfUrl(`vocab/u${String(u.n).padStart(2, "0")}`)}" target="_blank" rel="noopener">${ICON.download}<span>PDF</span></a>
      <a class="btn primary" href="#/session/unit/${u.n}">${c.due ? `Review ${c.due} due` : fresh ? `Learn ${Math.min(fresh, Math.max(S.pref.newN, 10))} new` : "Practise again"}</a>
    </section>
    <nav class="seg tabs-seg" aria-label="Unit sections">
      ${[["words", "Parole", n.words], ["verbs", "Verbi", n.verbs], ["phrases", "Frasi", n.phrases], ["quiz", "Quiz", ""]].map(([k, l, x]) => `<a href="#/unit/${u.n}/${k}" ${k === v.tab ? 'aria-current="page"' : ""}>${l}${x ? ` <span class="n">${x}</span>` : ""}</a>`).join("")}
    </nav>
    <div id="unit-body"></div>
    <nav class="pager">
      ${unitByN(u.n - 1) ? `<a href="#/unit/${u.n - 1}/words">${ICON.back} ${esc(unitByN(u.n - 1).title)}</a>` : "<span></span>"}
      ${unitByN(u.n + 1) ? `<a href="#/unit/${u.n + 1}/words">${esc(unitByN(u.n + 1).title)} ${ICON.chev}</a>` : ""}
    </nav>`;
  const body = app.querySelector("#unit-body");
  if (v.tab === "words") {
    const words = ids.filter(id => D.items[id].type === "w");
    const cats = Object.keys(u.cats).filter(k => words.some(id => D.items[id].d.c === k));
    body.innerHTML = cats.map(k => `<section class="item-group"><h2 class="group-label">${esc(u.cats[k])}</h2><div class="panel flush cols">${words.filter(id => D.items[id].d.c === k).map(itemHTML).join("")}</div></section>`).join("");
  } else if (v.tab === "verbs") {
    body.innerHTML = `<div class="panel flush cols">${ids.filter(id => D.items[id].type === "v").map(verbHTML).join("")}</div>`;
  } else if (v.tab === "phrases") {
    const ph = ids.filter(id => D.items[id].type === "p");
    const groups = [...new Set(ph.map(id => D.items[id].d.fn))];
    body.innerHTML = groups.map(g => `<section class="item-group"><h2 class="group-label">${esc(g)}</h2><div class="panel flush cols">${ph.filter(id => D.items[id].d.fn === g).map(itemHTML).join("")}</div></section>`).join("");
  } else startQuiz(body, u);
  // Tapping an item opens its details in a sheet, so the list itself never jumps around.
  body.addEventListener("click", e => {
    const ex = e.target.closest("[data-expand]"); if (!ex) return;
    const item = ex.closest(".item"), more = item.querySelector(".item-more");
    const term = ex.querySelector(".item-term").innerHTML, en = ex.querySelector(".item-en").textContent;
    openSheet(`<div class="sheet-body item-sheet ${item.dataset.verb ? "" : ""}" ${item.dataset.verb ? `data-verb="${esc(item.dataset.verb)}"` : ""}>
      <p class="s-it item-term it">${term}</p><p class="s-en">${esc(en)}</p><div class="item-more">${more.innerHTML}</div></div>`);
  });
}
document.addEventListener("click", e => {
  const tb = e.target.closest("[data-tense]"); if (!tb) return;
  const item = tb.closest("[data-verb]"); if (!item) return;
  item.querySelectorAll("[data-tense]").forEach(b => b.setAttribute("aria-pressed", b === tb));
  item.querySelector(".conj-wrap").innerHTML = conjHTML(D.items[item.dataset.verb].d, tb.dataset.tense);
});
// Schedule picker toggle (shared by every item list).
document.addEventListener("click", e => {
  const b = e.target.closest("[data-toggle-sched]");
  if (b) { const w = b.closest(".item-more, .card-actions, .deck-item")?.querySelector(".sched-wrap"); if (w) w.hidden = !w.hidden; return; }
  const s = e.target.closest("[data-sched]");
  if (s) { const w = s.closest(".sched-wrap"); if (w) setTimeout(() => { w.hidden = true; }, 250); }
});

/* ---------- Unit quiz ---------- */
function startQuiz(body, u) {
  const ids = D.unitIds[u.n];
  const words = ids.filter(id => D.items[id].type === "w").map(id => D.items[id].d);
  const phrases = ids.filter(id => D.items[id].type === "p").map(id => D.items[id].d);
  const nouns = words.filter(w => ["il", "lo", "la", "l'"].includes(w.art));
  const opts = (answer, pool) => shuffle([answer, ...shuffle([...new Set(pool)].filter(x => x && x !== answer && x !== "—")).slice(0, 3)]);
  const used = new Set();
  const fresh = (pool, key) => { const left = pool.filter(x => !used.has(key(x))); const x = pick(left.length ? left : pool); used.add(key(x)); return x; };
  const quiz = shuffle(["m", "m", "m", "a", "a", "c", "c", "c", "p", "p"]).map(k => {
    if (k === "a" && nouns.length > 3) { const w = fresh(nouns, x => x.it); return { kind: "Which article?", q: `<span class="blank"></span> ${esc(w.it)}`, a: w.art, o: ["il", "lo", "la", "l'"], it: 1, why: `<b>${esc(full(w))}</b> is ${w.g === "m" ? "masculine" : "feminine"}.` }; }
    if (k === "c") { const vb = pick(u.verbs), t = pick(TENSES.slice(0, 4)); const p = pick([0, 1, 2, 3, 4, 5].filter(i => vb.t[t.k][i] !== "—")); const a = vb.t[t.k][p]; return { kind: `${t.it} of ${vb.inf}`, q: `${PRON[p]} <span class="blank"></span>`, a, o: opts(a, vb.t[t.k]), it: 1, why: `${esc(vb.t[t.k].filter(f => f !== "—").join(", "))}` }; }
    if (k === "p" && phrases.length > 3) { const p = fresh(phrases, x => x.it); return { kind: "What does it mean?", q: `“${esc(p.it)}”`, a: p.en, o: opts(p.en, phrases.map(x => x.en)), why: `${esc(p.ex)} · ${esc(p.exEn)}` }; }
    const w = fresh(words, x => x.it); const same = words.filter(x => x.c === w.c).map(x => x.en);
    return { kind: "What does it mean?", q: esc(full(w)), a: w.en, o: opts(w.en, same.length > 3 ? same : words.map(x => x.en)), why: `${esc(w.ex)} · ${esc(w.exEn)}` };
  });
  let i = 0, score = 0;
  const draw = () => {
    if (i >= quiz.length) {
      body.innerHTML = `<div class="panel result"><p class="eyebrow">Your score</p><p class="score">${score}<span>/${quiz.length}</span></p><p>${score >= 9 ? "Ottimo! Ready for the next unit." : score >= 6 ? "Bene. Review what you missed, then try again." : "Practise the unit first, then try again."}</p><div class="btn-row center"><button class="btn primary" data-q-again>New quiz</button><a class="btn" href="#/session/unit/${u.n}">Practise this unit</a></div></div>`;
      body.querySelector("[data-q-again]").onclick = () => startQuiz(body, u); return;
    }
    const q = quiz[i];
    body.innerHTML = `<div class="panel quiz"><div class="quiz-top"><span class="eyebrow">${esc(q.kind)}</span><span class="muted small">${i + 1} / ${quiz.length}</span></div>
      <p class="q-prompt it">${q.q}</p><div class="opts">${q.o.map((o, j) => `<button class="opt ${q.it ? "it" : ""}" data-o="${j}">${esc(o)}</button>`).join("")}</div><div class="fb" aria-live="polite"></div></div>`;
    body.querySelectorAll("[data-o]").forEach(b => b.onclick = () => {
      const ok = q.o[+b.dataset.o] === q.a; if (ok) score++;
      body.querySelectorAll("[data-o]").forEach(x => { x.disabled = true; if (q.o[+x.dataset.o] === q.a) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
      if (ok && q.it) say(q.a);
      body.querySelector(".fb").innerHTML = `<p class="${ok ? "ok-text" : "bad-text"}">${ok ? "Giusto!" : "Not quite."}</p><p class="muted small">${q.why}</p><button class="btn primary" data-q-next>${i + 1 < quiz.length ? "Next" : "See score"}</button>`;
      const nx = body.querySelector("[data-q-next]"); nx.onclick = () => { i++; draw(); }; nx.focus();
    });
  };
  draw();
}
