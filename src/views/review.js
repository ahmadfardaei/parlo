import { tipHTML, feedbackHTML, isHidden, hideHTML, setHidden, S, D, esc, ICON, pickEx, exVoice, inDeck, canSpeak, say, full, statusOf, statusLabel, setEntry, schedule, dueIds, deckIds, allReviewable, fmtIn, on, lsGet, learned, LEVELS, unitByN, showToast, sayOf, meaningOf } from "../core.js";
import { highlight } from "./unit.js";
import { nextUnit } from "./home.js";

/* ---------- What a card shows ---------- */
function boldIn(ctx, part) {
  const i = ctx.toLowerCase().indexOf(part.toLowerCase());
  if (i < 0) return esc(ctx);
  return esc(ctx.slice(0, i)) + "<b>" + esc(ctx.slice(i, i + part.length)) + "</b>" + esc(ctx.slice(i + part.length));
}
export function cardData(id) {
  const it = D.items[id];
  if (!it) {
    const e = S.st[id] || {};
    return { kind: "Saved sentence", from: e.st || "", fromHref: e.src || "", target: "", sentIt: e.ctx ? boldIn(e.ctx, e.it) : esc(e.it), sentEn: e.en || "", meaning: "", say: e.ctx || e.it, sv: e.vo || "f" };
  }
  const d = it.d, unit = `Unità ${it.u}`;
  if (it.type === "w") { const ex = pickEx(d.ex, d.exAlt); return { kind: "Word", from: unit, fromHref: `#/unit/${it.u}/words`, target: full(d), sentIt: highlight(ex, d.it), sentEn: d.exEn, meaning: d.en, say: ex, sv: exVoice(ex, d.exAlt) }; }
  if (it.type === "v") { const ex = pickEx(d.ex[0][0], d.exAlt?.[0]); return { kind: "Verb", from: unit, fromHref: `#/unit/${it.u}/verbs`, target: d.inf, sentIt: esc(ex), sentEn: d.ex[0][1], meaning: d.en, extra: d.t.pres.join(" · "), say: ex, sv: exVoice(ex, d.exAlt?.[0]) }; }
  const ex = pickEx(d.ex, d.exAlt);
  return { kind: "Phrase", from: unit, fromHref: `#/unit/${it.u}/phrases`, target: d.it, sentIt: highlight(ex, d.it.split(" ")[0]), sentEn: d.exEn, meaning: d.en, say: ex, sv: exVoice(ex, d.exAlt) };
}

/* ---------- Mazzo (my deck) ---------- */
let deckFilter = "all";
export function viewDeck(app, v = {}) {
  if (v.filter === "hidden") deckFilter = "hidden";
  const ids = deckIds();
  // Words the learner hid: kept here so they can bring them back.
  const hidden = D.allOrder.filter(isHidden);
  // Every word, verb and phrase you've started, newest first.
  const words = D.order.filter(id => statusOf(id) !== "new").sort((a, b) => (S.st[b].t || 0) - (S.st[a].t || 0));
  if (!["words", "hidden"].includes(deckFilter) || (deckFilter === "hidden" && !hidden.length && v.filter !== "hidden")) deckFilter = "all";
  const shown = deckFilter === "all" ? ids : [];
  const ready = dueIds(ids).length + ids.filter(id => statusOf(id) === "new").length;
  const filters = [["all", `Saved · ${ids.length}`], ["words", `Your words · ${words.length}`], ...(hidden.length || deckFilter === "hidden" ? [["hidden", `Hidden · ${hidden.length}`]] : [])];
  app.innerHTML = `<header class="page-head"><h1>Mazzo</h1><p class="muted">Sentences you saved, and every word you've started learning. Tap ★ on any word, or tap a sentence in a text, to save it here.</p></header>
    ${ids.length ? `<section class="panel deck-head">
        <div><p class="big-line">${ids.length} saved</p><p class="muted small">${ready ? `${ready} ready to practise` : "Nothing due. You can still go through them."}</p></div>
        <div class="btn-row"><a class="btn primary" href="#/session/deck">Practise my deck</a><button class="btn quiet" data-print-deck>${ICON.download}<span>Print / PDF</span></button></div></section>` : ""}
    ${ids.length || words.length || hidden.length ? `<div class="list-tools"><div class="seg small" role="group" aria-label="Show">${filters.map(([k, l]) => `<button data-df="${k}" aria-pressed="${deckFilter === k}">${l}</button>`).join("")}</div></div>` : ""}
    ${deckFilter === "hidden" ? (hidden.length ? `<p class="muted small">You chose not to learn these. They do not come up in sessions, quizzes or your path. Bring one back to learn it again.</p>
        <div class="panel flush cols">${hidden.map(id => { const it = D.items[id]; return `<div class="row-link hidden-row"><span><span class="row-title it">${esc(sayOf(id))}</span><span class="muted small">${esc(meaningOf(id))} · Unità ${it.u}</span></span>${hideHTML(id)}</div>`; }).join("")}</div>`
        : `<div class="empty-state"><h2>No hidden words</h2><p class="muted">Tap a word in a unit and choose Hide to keep it out of your practice.</p></div>`)
    : deckFilter === "words" ? (words.length ? `<div class="link-list panel flush cols">${words.map(id => { const it = D.items[id]; return `<a class="row-link" href="#/unit/${it.u}/${it.type === "w" ? "words" : it.type === "v" ? "verbs" : "phrases"}"><span><span class="row-title it">${esc(sayOf(id))}</span><span class="muted small">${esc(meaningOf(id))}</span></span><span class="row-meta"><span class="status ${statusOf(id)}">${statusLabel(id)}</span></span>${ICON.chev}</a>`; }).join("")}</div>`
        : `<div class="empty-state"><h2>No words yet</h2><p class="muted">Words appear here once you start learning them.</p><a class="btn" href="#/">Start today's session</a></div>`)
    : shown.length ? `<div class="deck-grid">${shown.map(id => { const c = cardData(id); return `<div class="panel deck-item">
        <p class="ex-it">${c.sentIt}</p><p class="ex-en">${esc(c.sentEn)}</p>
        <p class="muted small">${c.target ? `<span class="it">${esc(c.target)}</span> = ${esc(c.meaning)} · ` : ""}${c.fromHref ? `<a href="${esc(c.fromHref)}">${esc(c.from)}</a>` : esc(c.from)}</p>
        <div class="item-actions">${canSpeak ? `<button class="btn quiet small" data-say-text="${esc(c.say)}" data-voice="${c.sv || "f"}">${ICON.speak}<span>Listen</span></button>` : ""}
          <span class="status ${statusOf(id)}" data-status="${esc(id)}">${statusLabel(id)}</span>
          <button class="btn quiet small" data-remove="${esc(id)}">Remove</button></div></div>`; }).join("")}</div>`
      : `<div class="empty-state"><h2>${ids.length ? "Nothing here" : "Nothing saved yet"}</h2><p class="muted">Save sentences while you read, or tap ★ Save on any word or phrase.</p><a class="btn" href="#/learn/reading">Find something to read</a></div>`}`;
  app.querySelectorAll("[data-df]").forEach(b => b.onclick = () => { deckFilter = b.dataset.df; viewDeck(app); });
  // Bringing a word back removes it from this list at once.
  app.querySelectorAll(".hidden-row [data-hide]").forEach(b => b.addEventListener("click", () => setTimeout(() => viewDeck(app), 0)));
  app.querySelectorAll("[data-remove]").forEach(b => b.onclick = () => { setEntry(b.dataset.remove, { s: 0 }); viewDeck(app); });
  app.querySelector("[data-print-deck]")?.addEventListener("click", () => printDeck(ids));
}

// A clean printable page of the deck; the browser's print dialog can save it as PDF.
function printDeck(ids) {
  const el = document.createElement("div");
  el.id = "print-root";
  el.innerHTML = `<p class="eyebrow">i understand, but… · Il mio mazzo · ${new Date().toLocaleDateString("it-IT")}</p><h1>Il mio mazzo</h1>
    ${ids.map(id => { const c = cardData(id); return `<div class="print-item"><p class="it">${c.sentIt}</p><p class="muted">${esc(c.sentEn)}${c.target ? ` · <span class="it">${esc(c.target)}</span> = ${esc(c.meaning)}` : ""}</p></div>`; }).join("")}`;
  document.body.appendChild(el);
  document.body.classList.add("printing");
  const done = () => { document.body.classList.remove("printing"); el.remove(); window.removeEventListener("afterprint", done); };
  window.addEventListener("afterprint", done);
  setTimeout(() => { window.print(); setTimeout(() => { if (document.body.classList.contains("printing") && !matchMedia("print").matches) done(); }, 1000); }, 50);
}

/* ---------- Session (focus mode) ---------- */
let ses = null;
on("leave", () => { ses = null; });
function build(v) {
  let pool, newPool;
  if (v.src === "unit") { pool = D.unitIds[v.u] || []; newPool = pool; }
  else if (v.src === "deck") { pool = deckIds(); newPool = pool; }
  else {
    pool = allReviewable();
    const startAt = Math.max(0, D.units.findIndex(u => u.level === S.pref.level));
    newPool = D.units.slice(startAt).flatMap(u => D.unitIds[u.n]);
  }
  const due = dueIds(pool);
  // New words come from your path (unit sessions); the daily review only brings back what's due, plus sentences you saved.
  const nNew = v.src === "due" ? 0 : S.pref.newN || 10;
  let fresh = newPool.filter(id => statusOf(id) === "new").slice(0, nNew);
  // Sentences the learner saved themselves are introduced first in the daily session.
  if (v.src === "due") fresh = [...deckIds().filter(id => id.startsWith("s:") && statusOf(id) === "new").slice(0, 20), ...fresh];
  let queue = [...due, ...fresh], cram = false;
  if (!queue.length && v.src !== "due") { queue = pool.filter(id => statusOf(id) === "later").slice(0, 30); cram = queue.length > 0; }
  queue = queue.slice(0, 60);
  return { queue, done: 0, flipped: false, intro: false, check: false, history: [], cram, deckMode: v.src === "deck", stats: { learned: 0, seen: 0, again: 0, known: 0, sents: 0 } };
}
const nextIndex = () => ses.queue.findIndex(id => ses.cram || ["new", "due"].includes(statusOf(id)));
const exitHref = v => v.src === "unit" ? `#/unit/${v.u}/words` : v.src === "deck" ? "#/deck" : "#/";

export function viewSession(app, v) { ses = build(v); draw(app, v); }

function draw(app, v) {
  if (!ses) return;
  const total = ses.done + ses.queue.length;
  // Top row: Previous word (top left) · progress · count · end session (top right).
  const top = `<div class="focus-top">
      ${ses.history.length ? `<button class="btn small prev-word" data-undo>${ICON.back}<span>Previous word</span></button>` : `<span class="prev-word"></span>`}
      <div class="progress-track" aria-hidden="true"><span style="width:${total ? (ses.done / total) * 100 : 100}%"></span></div>
      <span class="count small" aria-live="polite">${ses.queue.length ? `${ses.done + 1} / ${total}` : ""}</span>
      <a class="icon-btn" href="${exitHref(v)}" aria-label="End session">${ICON.close}</a>
    </div>`;
  if (!ses.queue.length) return drawEnd(app, v, top);
  const i = nextIndex();
  if (i < 0) {
    const next = Math.min(...ses.queue.map(id => S.st[id]?.d || Infinity));
    app.innerHTML = `${top}<div class="card-stage"><div class="flash done-card"><p class="big-line it">Una pausa</p>
      <p class="muted">${ses.queue.length} card${ses.queue.length === 1 ? "" : "s"} will come back in ${fmtIn(next - Date.now())}.</p></div>
      <div class="card-actions"><button class="btn primary large wide" data-now>Review them now</button><button class="btn wide" data-finish>Finish</button></div></div>`;
    return wire(app, v);
  }
  if (i > 0) { const [id] = ses.queue.splice(i, 1); ses.queue.unshift(id); }
  const id = ses.queue[0], c = cardData(id), isNew = statusOf(id) === "new";
  // A new card is introduced in full and comes back a few cards later to be recalled.
  // Learners who understand more than this level are asked first: they may already know how to say it.
  if (isNew && !ses.flipped && !ses.check) {
    if (quickCheck(id)) ses.check = true;
    else { ses.flipped = true; ses.intro = true; setTimeout(() => { if (ses && ses.queue[0] === id) say(c.say, c.sv); }, 150); }
  }
  // Recall goes from English to Italian unless the learner chose otherwise.
  const en = !ses.intro;
  const sentenceFirst = ses.deckMode || !c.target;
  const front = en
    ? `${c.meaning ? `<p class="card-target en">${esc(c.meaning)}</p>` : ""}<p class="card-sent en">${esc(c.sentEn)}</p>`
    : sentenceFirst ? `<p class="card-sent big it">${c.sentIt}</p>`
    : `<p class="card-target it">${esc(c.target)}</p><p class="card-sent it">${c.sentIt}</p>`;
  const back = en
    ? `${c.target ? `<p class="card-answer it">${esc(c.target)}</p>` : ""}<p class="card-sent it">${c.sentIt}</p>${c.extra ? `<p class="muted small it">${esc(c.extra)}</p>` : ""}`
    : `${c.meaning ? `<p class="card-answer">${esc(c.meaning)}</p>` : ""}<p class="card-sent en">${esc(c.sentEn)}</p>${sentenceFirst && c.target ? `<p class="muted small it">${esc(c.target)}</p>` : ""}${c.extra ? `<p class="muted small it">${esc(c.extra)}</p>` : ""}`;
  const hint = en ? (c.target ? "Say it in Italian, out loud. Then tap." : "Say the sentence in Italian, out loud. Then tap.") : "Try to remember, then tap";
  const actions = !ses.flipped ? `<button class="btn primary large wide" data-flip>Show answer</button>`
    : ses.intro ? `<p class="muted small center">Read it and listen. It comes back in a moment for you to say.</p><div class="rate">
        <button class="btn primary large wide" data-rate="seen">Next</button><button class="btn rate-know" data-rate="known">I already know it</button></div>`
    : ses.check ? `<p class="muted small center">Did you know how to say it?</p><div class="rate two">
        <button class="btn" data-rate="seen">New to me</button><button class="btn primary" data-rate="3d">I knew it</button></div>`
    : `<p class="muted small center">Did you say it?</p><div class="rate two">
        <button class="btn rate-again" data-rate="10m">Not yet</button><button class="btn primary" data-rate="got">Got it</button>
        <button class="btn rate-know wide" data-rate="known">I already know it</button></div>`;
  app.innerHTML = `${top}<div class="card-stage">
    <div class="flash" id="card" ${ses.flipped ? "" : 'role="button" tabindex="0" aria-label="Show the answer"'}>
      <p class="card-meta">${ses.intro || ses.check ? `<span class="pill new">New</span> ` : ""}${esc(c.kind)} · ${esc(c.from)}</p>
      ${front}
      ${ses.flipped ? `<hr class="card-rule">${back}` : `<p class="tap-hint">${hint}</p>`}
      <span class="card-corner">
        <button class="icon-btn star-card" data-deck="${esc(id)}" aria-pressed="${inDeck(id)}" aria-label="${inDeck(id) ? "Remove from" : "Add to"} your deck" title="Your deck">${ICON.star}</button>
        ${ses.flipped && canSpeak ? `<button class="icon-btn" data-say-text="${esc(c.say)}" data-voice="${c.sv || "f"}" aria-label="Listen">${ICON.speak}</button>` : ""}
        ${D.items[id] ? `<button class="icon-btn" data-hide-card aria-label="Hide this ${c.kind.toLowerCase()}: do not learn it" title="Hide: do not learn it">${ICON.hide}</button>` : ""}
      </span>
    </div>
    <div class="card-actions">${actions}</div>
    ${D.items[id] ? tipHTML("card", `<p>The icons on the card: ★ saves it to Mazzo. ${ICON.hide} hides a word you do not want to learn.</p>`) : ""}
  </div>`;
  wire(app, v);
}
// Words at or below the level the learner understands, when that is above the level they speak.
function quickCheck(id) {
  const it = D.items[id]; if (!it) return false;
  const und = LEVELS.indexOf(S.pref.understand || S.pref.level), sp = LEVELS.indexOf(S.pref.level);
  const lv = LEVELS.indexOf(unitByN(it.u)?.level);
  return und > sp && lv >= 0 && lv <= und;
}
function drawEnd(app, v, top) {
  const s = ses.stats;
  const later = allReviewable().filter(id => statusOf(id) === "later");
  const next = later.length ? Math.min(...later.map(id => S.st[id].d)) : 0;
  const last = lsGet("parlo.last", null), nu = nextUnit();
  const keep = v.src === "unit" ? { href: `#/say/unit/${v.u}`, label: "Say it: 5 sentences" } : v.src !== "due" ? null : last ? { href: last.href, label: `Continue: ${last.title}` } : nu ? { href: `#/unit/${nu.n}/words`, label: `Explore Unità ${nu.n}` } : null;
  app.innerHTML = `${top}<div class="card-stage"><div class="flash done-card">
      <p class="big-line it">${ses.done ? "Bravo!" : "Tutto fatto"}</p>
      ${ses.done ? `<div class="end-stats">${s.learned ? `<span><b>${s.learned}</b> ${s.learned === 1 ? "word" : "words"} you can now say</span>` : ""}${s.sents ? `<span><b>${s.sents}</b> saved ${s.sents === 1 ? "sentence" : "sentences"}</span>` : ""}${ses.done - s.learned - s.known - s.sents > 0 ? `<span><b>${ses.done - s.learned - s.known - s.sents}</b> reviewed</span>` : ""}${s.known ? `<span><b>${s.known}</b> already known</span>` : ""}</div>` : ""}
      <p class="muted">${ses.done ? "" : v.src === "deck" ? "Your deck has nothing to practise yet. " : "Nothing to review right now. "}${next ? `Next review in ${fmtIn(next - Date.now())}.` : ""}</p></div>
    <div class="card-actions">${keep ? `<a class="btn ${keep.href.startsWith("#/say") ? "speak" : "primary"} large wide" href="${esc(keep.href)}">${esc(keep.label)}</a><a class="btn wide" href="${exitHref(v)}">Done</a>` : `<a class="btn primary large wide" href="${exitHref(v)}">Done</a>`}</div>${feedbackHTML()}</div>`;
  wire(app, v);
}
function wire(app, v) {
  app.querySelector("[data-undo]")?.addEventListener("click", () => undo(app, v));
  // Hide: the word leaves this session and all practice; it waits in Mazzo → Hidden.
  app.querySelector("[data-hide-card]")?.addEventListener("click", e => {
    e.stopPropagation();
    const id = ses.queue.shift(); ses.flipped = ses.intro = ses.check = false;
    setHidden(id, true); draw(app, v);
  });
  app.querySelector("[data-now]")?.addEventListener("click", () => { ses.cram = true; draw(app, v); });
  app.querySelector("[data-finish]")?.addEventListener("click", () => { ses.queue = []; draw(app, v); });
  app.querySelector("#card")?.addEventListener("click", e => { if (!e.target.closest("button")) flip(app, v); });
  app.querySelector("[data-flip]")?.addEventListener("click", () => flip(app, v));
  app.querySelectorAll("[data-rate]").forEach(b => b.onclick = () => rate(app, v, b.dataset.rate));
}
function flip(app, v) {
  if (!ses || ses.flipped || !ses.queue.length || nextIndex() < 0) return;
  ses.flipped = true; draw(app, v);
  { const c = cardData(ses.queue[0]); say(c.say, c.sv); }
}
function rate(app, v, key) {
  if (!ses || !ses.flipped) return;
  const id = ses.queue[0];
  ses.history.push({ id, key, prev: S.st[id] ? { ...S.st[id] } : null, queue: [...ses.queue], done: ses.done, stats: { ...ses.stats } });
  if (ses.history.length > 30) ses.history.shift();
  const was = learned(id);
  ses.queue.shift();
  schedule(id, key);
  if (key === "seen") {
    // Back in a few cards, to be recalled.
    ses.stats.seen++; ses.queue.splice(Math.min(3, ses.queue.length), 0, id);
  } else {
    if (key === "known") { ses.stats.known++; showToast("Marked as known. It won't come up in reviews.", null, null, 2500); }
    else if (!was && learned(id)) id.startsWith("s:") ? ses.stats.sents++ : ses.stats.learned++;
    if (key === "10m") { ses.queue.push(id); ses.stats.again++; } else ses.done++;
  }
  ses.flipped = false; ses.intro = false; ses.check = false; draw(app, v);
}
function undo(app, v) {
  const h = ses?.history.pop(); if (!h) return;
  setEntry(h.id, h.prev ? Object.fromEntries(Object.entries(h.prev).filter(([k]) => k !== "t")) : { d: 0, k: 0, iv: "" }, true);
  ses.queue = h.queue; ses.done = h.done; ses.stats = h.stats; ses.flipped = true; ses.intro = !h.prev && !quickCheck(h.id); ses.check = !h.prev && quickCheck(h.id);
  draw(app, v);
}
document.addEventListener("keydown", e => {
  if (!ses || S.view.name !== "session" || e.target.matches("input, textarea") || e.metaKey || e.ctrlKey || e.altKey) return;
  const app = document.getElementById("app");
  if ((e.code === "Space" || e.key === "Enter") && !ses.flipped && !e.target.closest("a, .icon-btn")) { e.preventDefault(); flip(app, S.view); }
  else if (ses.flipped && ses.intro && e.key === "Enter") { e.preventDefault(); rate(app, S.view, "seen"); }
  else if (ses.flipped && !ses.intro && !ses.check && /^[1-3]$/.test(e.key)) rate(app, S.view, ["10m", "got", "known"][+e.key - 1]);
  else if (e.key === "ArrowLeft" || e.key === "Backspace") { e.preventDefault(); undo(app, S.view); }
});
