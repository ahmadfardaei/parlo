import { starHTML } from "./texts.js";
import { answerHTML, wireAnswer, feedbackHTML } from "./check.js";
import { exVoice } from "../core.js";
import { tipHTML, S, D, esc, rich, ICON, full, unitByN, counts, barHTML, statusOf, statusLabel, inDeck, schedHTML, hideHTML, canSpeak, TOPICS, remember, shuffle, pick, say, openSheet, gf, pickEx, adjForms, schedule, learned } from "../core.js";

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
      <span class="status ${statusOf(id)}" data-status="${esc(id)}">${statusLabel(id)}</span>
      ${schedHTML(id)}
      ${hideHTML(id)}
    </div>`;
}
function itemHTML(id) {
  const it = D.items[id], d = it.d;
  const term = it.type === "w" && d.art ? `<span class="art ${d.g}">${esc(d.art)}</span>${d.art.endsWith("'") ? "" : " "}${esc(d.it)}` : esc(d.it);
  return `<div class="item" data-item="${esc(id)}">
    <button class="item-main" data-expand aria-haspopup="dialog">
      <span class="dot ${statusOf(id)}" data-dot="${esc(id)}"></span>
      <span class="item-term it">${term}</span><span class="item-en">${esc(d.en)}</span>${ICON.chev}
    </button>
  </div>`;
}
// The details of a word or phrase, built only when the learner opens it (a long list stays light).
function moreHTML(id) {
  const it = D.items[id], d = it.d;
  if (it.type === "v") return verbMoreHTML(id);
  let sub, more;
  if (it.type === "w") {
    sub = d.g ? `<span class="tag ${d.g}">${d.g === "m" ? "masculine" : "feminine"}${d.pl ? " · plural " + esc(d.pl) : ""}</span>` : `<span class="tag">${POS[d.pos] || esc(d.pos)}</span>`;
    const ex = pickEx(d.ex, d.exAlt);
    more = `<div class="ex-row"><p class="ex-it">${highlight(ex, d.it)}</p>${starHTML({ it: ex, en: d.exEn }, `#/unit/${it.u}/words`, `Unità ${it.u}`, exVoice(ex, d.exAlt))}</div><p class="ex-en">${esc(d.exEn)}</p>${d.note ? `<p class="note">${rich(d.note)}</p>` : ""}`;
  } else {
    sub = `<span class="tag">${esc(d.reg)}</span>`;
    const ex = pickEx(d.ex, d.exAlt);
    more = `<p class="muted small">Literally: “${esc(d.lit)}”</p><div class="ex-row"><p class="ex-it">${esc(ex)}</p>${starHTML({ it: ex, en: d.exEn }, `#/unit/${it.u}/phrases`, `Unità ${it.u}`, exVoice(ex, d.exAlt))}</div><p class="ex-en">${esc(d.exEn)}</p>${d.note ? `<p class="note">${rich(d.note)}</p>` : ""}`;
  }
  return `<div class="item-tags">${sub}</div>${more}${actionsHTML(id)}`;
}
function verbHTML(id) {
  const v = D.items[id].d;
  return `<div class="item" data-item="${esc(id)}" data-verb="${esc(id)}">
    <button class="item-main" data-expand aria-haspopup="dialog">
      <span class="dot ${statusOf(id)}" data-dot="${esc(id)}"></span>
      <span class="item-term it">${esc(v.inf)}</span><span class="item-en">${esc(v.en)}</span>${ICON.chev}
    </button>
  </div>`;
}
function verbMoreHTML(id) {
  const v = D.items[id].d;
  return `
      <div class="item-tags"><span class="tag">${esc(v.kind)}</span><span class="tag">past with ${esc(v.aux)}</span></div>
      <div class="seg small scroll" role="group" aria-label="Tense">${TENSES.map((t, i) => `<button data-tense="${t.k}" aria-pressed="${i === 0}">${t.it}</button>`).join("")}</div>
      <div class="conj-wrap">${conjHTML(v, "pres")}</div>
      ${v.ex.map(([a, b], i) => { const ex = pickEx(a, v.exAlt?.[i]); return `<div class="ex-row"><p class="ex-it">${esc(ex)}</p>${starHTML({ it: ex, en: b }, `#/unit/${D.items[id].u}/verbs`, `Unità ${D.items[id].u}`, exVoice(ex, v.exAlt?.[i]))}</div><p class="ex-en">${esc(b)}</p>`; }).join("")}
      <p class="note">${rich(v.note)}</p>
      ${actionsHTML(id)}`;
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
  const nHidden = D.allUnitIds[u.n].length - ids.length;
  app.innerHTML = `<a class="back-link" href="#/learn/vocab">${ICON.back} Vocabolario</a>
    <header class="page-head">
      <p class="eyebrow">Unità ${u.n} · ${u.level} · ${esc(TOPICS[u.topic])}</p>
      <h1 class="it">${esc(u.title)}</h1>
      <p class="muted">${esc(u.en)}. ${esc(u.intro || "")}</p>
    </header>
    <section class="panel unit-cta">
      <div class="level-prog">${barHTML({ known: ids.filter(learned).length, learning: ids.filter(id => statusOf(id) !== "new" && !learned(id)).length, total: c.total })}<span class="small">${ids.filter(learned).length} of ${c.total} learned</span></div>
      <a class="btn primary" href="#/session/unit/${u.n}">${c.due ? `Review ${c.due} due` : fresh ? `Learn ${Math.min(fresh, Math.max(S.pref.newN, 10))} new` : "Practise again"}</a>
    </section>
    <nav class="seg tabs-seg" aria-label="Unit sections">
      ${[["words", "Parole", n.words], ["verbs", "Verbi", n.verbs], ["phrases", "Frasi", n.phrases], ["quiz", "Quiz", ""]].map(([k, l, x]) => `<a href="#/unit/${u.n}/${k}" ${k === v.tab ? 'aria-current="page"' : ""}>${l}${x ? ` <span class="n">${x}</span>` : ""}</a>`).join("")}
    </nav>
    ${nHidden ? `<p class="muted small hidden-note">${nHidden} hidden ${nHidden === 1 ? "item" : "items"} not shown. <a href="#/deck/hidden">See them in Mazzo</a></p>` : ""}
    <div id="unit-body"></div>
    <nav class="pager">
      ${unitByN(u.n - 1) ? `<a href="#/unit/${u.n - 1}/words">${ICON.back} ${esc(unitByN(u.n - 1).title)}</a>` : "<span></span>"}
      ${unitByN(u.n + 1) ? `<a href="#/unit/${u.n + 1}/words">${esc(unitByN(u.n + 1).title)} ${ICON.chev}</a>` : ""}
    </nav>`;
  const body = app.querySelector("#unit-body");
  if (v.tab === "words") {
    const words = ids.filter(id => D.items[id].type === "w");
    const cats = Object.keys(u.cats).filter(k => words.some(id => D.items[id].d.c === k));
    body.innerHTML = tipHTML("words", "<p>Tap a word to hear it and see an example. Tap <b>★ Save</b> to keep it in Mazzo, or <b>Hide</b> if you do not want to learn it.</p>") + `<p class="small unit-legend"><span><i class="dot"></i>New</span><span><i class="dot later"></i>Learning</span><span><i class="dot due"></i>Due</span><span><i class="dot known"></i>Known</span><span><span class="art f">la</span> feminine · <span class="art m">il</span> masculine</span></p>` + cats.map(k => `<section class="item-group"><h2 class="group-label">${esc(u.cats[k])}</h2><div class="panel flush cols">${words.filter(id => D.items[id].d.c === k).map(itemHTML).join("")}</div></section>`).join("");
  } else if (v.tab === "verbs") {
    body.innerHTML = `<div class="panel flush cols">${ids.filter(id => D.items[id].type === "v").map(verbHTML).join("")}</div>`;
  } else if (v.tab === "phrases") {
    const ph = ids.filter(id => D.items[id].type === "p");
    const groups = [...new Set(ph.map(id => D.items[id].d.fn))];
    body.innerHTML = `<section class="panel note-card say-cta"><p><b>Your turn.</b> Use these phrases in sentences about you, out loud.</p><a class="btn speak" href="#/say/phrases/${u.n}">Use them about you</a></section>` + groups.map(g => `<section class="item-group"><h2 class="group-label">${esc(g)}</h2><div class="panel flush cols">${ph.filter(id => D.items[id].d.fn === g).map(itemHTML).join("")}</div></section>`).join("");
  } else startQuiz(body, u);
  // Tapping an item opens its details in a sheet, so the list itself never jumps around.
  body.addEventListener("click", e => {
    const ex = e.target.closest("[data-expand]"); if (!ex) return;
    const item = ex.closest(".item"), more = { innerHTML: moreHTML(item.dataset.item) };
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

/* ---------- Unit quiz ---------- */
// Mostly from English: say (type) the word in Italian. Plus articles, verb forms and phrases.
function startQuiz(body, u, only) {
  const ids = D.unitIds[u.n];
  const wordIds = ids.filter(id => D.items[id].type === "w");
  const words = wordIds.map(id => D.items[id].d);
  const phrases = ids.filter(id => D.items[id].type === "p").map(id => D.items[id].d);
  const nouns = words.filter(w => ["il", "lo", "la", "l'"].includes(w.art));
  const opts = (answer, pool) => shuffle([answer, ...shuffle([...new Set(pool)].filter(x => x && x !== answer && x !== "—")).slice(0, 3)]);
  const used = new Set();
  const fresh = (pool, key) => { const left = pool.filter(x => !used.has(key(x))); const x = pick(left.length ? left : pool); used.add(key(x)); return x; };
  const quiz = only || shuffle(["s", "s", "s", "s", "m", "a", "c", "c", "p", "p"]).map(k => {
    if (k === "a" && nouns.length > 3) { const w = fresh(nouns, x => x.it); return { kind: "Which article?", q: `<span class="blank"></span> ${esc(w.it)}`, a: w.art, o: ["il", "lo", "la", "l'"], it: 1, say: full(w), why: `<b>${esc(full(w))}</b> is ${w.g === "m" ? "masculine" : "feminine"}.` }; }
    if (k === "c") { const vb = pick(u.verbs), t = pick(TENSES.slice(0, 4)); const p = pick([0, 1, 2, 3, 4, 5].filter(i => vb.t[t.k][i] !== "—")); const a = vb.t[t.k][p]; return { kind: `${t.it} of ${vb.inf}`, ctx: `${vb.inf}, ${t.it.toLowerCase()}`, q: `${PRON[p]} <span class="blank"></span>`, k: "type", a: [a], io: p === 0, it: 1, why: `${esc(vb.t[t.k].filter(f => f !== "—").join(", "))}` }; }
    // Phrases: which Italian phrase says this?
    if (k === "p" && phrases.length > 3) { const p = fresh(phrases, x => x.it); return { kind: "How do you say it?", q: `“${esc(p.en)}”`, a: p.it, o: opts(p.it, phrases.map(x => x.it)), it: 1, opt: 1, why: `${esc(p.ex)} · ${esc(p.exEn)}` }; }
    const w = fresh(words, x => x.it);
    if (k === "m") { const sense = en => en.split(";")[0].trim(); const same = words.filter(x => x.c === w.c).map(x => sense(x.en)); return { kind: "What does it mean?", q: esc(full(w)), it: 1, say: full(w), a: sense(w.en), o: opts(sense(w.en), same.length > 3 ? same : words.map(x => sense(x.en))), why: `${esc(w.ex)} · ${esc(w.exEn)}` }; }
    return { kind: "Write it in Italian", q: esc(w.en), k: "type", a: w.art ? [full(w), w.it] : [w.it], alt: adjForms(w), typo: true, id: "w:" + w.it, why: `${esc(w.ex)} · ${esc(w.exEn)}` };
  });
  let i = 0, score = 0;
  const missed = [];
  const answerOf = q => q.k === "type" ? gf(q.a[0], q.io) : q.a;
  const draw = () => {
    if (i >= quiz.length) {
      // Missed words you've already started come back in your next review.
      missed.forEach(q => { if (q.id && statusOf(q.id) !== "new") schedule(q.id, "10m"); });
      body.innerHTML = `<div class="panel result"><p class="eyebrow">${only ? "Second try" : "Your score"}</p><p class="score">${score}<span>/${quiz.length}</span></p>
        <p>${score === quiz.length ? "Perfetto!" : score >= quiz.length * 0.8 ? "Ottimo! Ready for the next unit." : score >= quiz.length * 0.6 ? "Bene. Go over what you missed, then try again." : "Practise the unit first, then try again."}</p>
        ${missed.length ? `<div class="missed"><p class="eyebrow">You missed</p><ul>${missed.map(q => `<li><span${q.it && !q.opt ? ' class="it"' : ""}>${q.q.replace('<span class="blank"></span>', "…")}</span>${q.ctx ? ` <span class="muted">(${esc(q.ctx)})</span>` : ""} → <span class="it strong">${esc(answerOf(q))}</span></li>`).join("")}</ul></div>` : ""}
        <div class="btn-row center">${missed.length ? `<button class="btn primary" data-q-retry>Practise these ${missed.length}</button>` : ""}<button class="btn ${missed.length ? "" : "primary"}" data-q-again>New quiz</button><a class="btn quiet" href="#/session/unit/${u.n}">Practise this unit</a></div></div>`;
      body.querySelector("[data-q-again]").onclick = () => startQuiz(body, u);
      body.querySelector("[data-q-retry]")?.addEventListener("click", () => startQuiz(body, u, shuffle(missed)));
      return;
    }
    const q = quiz[i];
    body.innerHTML = `<div class="panel quiz"><div class="quiz-top"><span class="eyebrow">${esc(q.kind)}</span><span class="muted small">${i + 1} / ${quiz.length}</span></div>
      <p class="q-prompt ${q.it && !q.opt ? "it" : ""}">${q.q}</p>${answerHTML(q)}<div class="fb" aria-live="polite"></div></div>`;
    wireAnswer(body, q, (ok, note) => {
      if (ok) score++; else missed.push(q);
      const fb = body.querySelector(".fb");
      fb.innerHTML = feedbackHTML({ ok, note, answer: answerOf(q), why: q.why, last: i + 1 >= quiz.length });
      // Always the Italian: the word itself for meaning and article questions.
      if (q.it || q.k === "type") say(q.say || answerOf(q));
      const nx = fb.querySelector("[data-next]"); nx.onclick = () => { i++; draw(); }; nx.focus();
    });
  };
  draw();
}
