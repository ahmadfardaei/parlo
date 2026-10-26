import { S, D, esc, ICON, canSpeak, say, full, unitByN, statusOf, statusLabel, inDeck, setEntry, schedule, dueIds, deckIds, allReviewable, counts, fmtIn, savePref, on, schedHTML } from "../core.js";
import { highlight } from "./unit.js";
import { newAvailable } from "./home.js";

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
    return { kind: "Saved sentence", from: e.st || "", fromHref: e.src || "", target: "", sentIt: e.ctx ? boldIn(e.ctx, e.it) : esc(e.it), sentEn: e.en || "", meaning: "", say: e.ctx || e.it };
  }
  const d = it.d, unit = `Unità ${it.u}`;
  if (it.type === "w") return { kind: "Word", from: unit, fromHref: `#/unit/${it.u}/words`, target: full(d), sentIt: highlight(d.ex, d.it), sentEn: d.exEn, meaning: d.en, say: d.ex };
  if (it.type === "v") return { kind: "Verb", from: unit, fromHref: `#/unit/${it.u}/verbs`, target: d.inf, sentIt: esc(d.ex[0][0]), sentEn: d.ex[0][1], meaning: d.en, extra: d.t.pres.join(" · "), say: d.ex[0][0] };
  return { kind: "Phrase", from: unit, fromHref: `#/unit/${it.u}/phrases`, target: d.it, sentIt: highlight(d.ex, d.it.split(" ")[0]), sentEn: d.exEn, meaning: d.en, say: d.ex };
}

/* ---------- Review hub ---------- */
export function viewReview(app) {
  const due = dueIds().length, newN = Math.min(S.pref.newN, newAvailable());
  const deck = deckIds(), deckDue = dueIds(deck).length;
  const all = counts(allReviewable());
  app.innerHTML = `<header class="page-head"><h1>Ripasso</h1><p class="muted">Short daily reviews. Each card comes back when you're about to forget it.</p></header>
    <section class="panel hero-card">
      <div class="hero-main"><p class="eyebrow">Today</p>
        ${due ? `<p class="big-num">${due}</p><p class="muted">due${newN ? ` · ${newN} new` : ""}</p>` : `<p class="big-line">${newN ? "Nothing due." : "All done."}</p><p class="muted">${newN ? `${newN} new cards ready.` : "Come back later."}</p>`}</div>
      ${due || newN ? `<a class="btn primary large" href="#/session/due">${due ? "Start review" : "Learn new cards"}</a>` : ""}
    </section>
    <section class="panel">
      <div class="panel-head"><h2>★ My deck</h2><a class="text-btn" href="#/deck">See all</a></div>
      <p class="muted small">${deck.length ? `${deck.length} sentence${deck.length === 1 ? "" : "s"} you saved${deckDue ? ` · ${deckDue} due` : ""}.` : "Save sentences from units, texts and examples with ★. They'll appear here."}</p>
      ${deck.length ? `<a class="btn" href="#/session/deck">Practise my deck</a>` : ""}
    </section>
    <section class="panel">
      <h2>Settings</h2>
      <div class="setting"><span>New cards per session</span><div class="seg small" role="group" aria-label="New cards per session">${[0, 10, 20, 30].map(n => `<button data-newn="${n}" aria-pressed="${S.pref.newN === n}">${n}</button>`).join("")}</div></div>
      <div class="setting"><span>Card front</span><div class="seg small" role="group" aria-label="Card direction"><button data-dir="it" aria-pressed="${S.pref.dir === "it"}">Italian</button><button data-dir="en" aria-pressed="${S.pref.dir === "en"}">English</button></div></div>
      <p class="muted small">${all.known} known · ${all.learning} learning across the course.</p>
    </section>`;
  app.querySelectorAll("[data-newn]").forEach(b => b.onclick = () => { savePref({ newN: +b.dataset.newn }); viewReview(app); });
  app.querySelectorAll("[data-dir]").forEach(b => b.onclick = () => { savePref({ dir: b.dataset.dir }); viewReview(app); });
}

/* ---------- Deck list ---------- */
let deckFilter = "all";
export function viewDeck(app) {
  const ids = deckIds();
  const shown = ids.filter(id => deckFilter === "all" || (deckFilter === "texts" ? id.startsWith("s:") : !id.startsWith("s:")));
  app.innerHTML = `<a class="back-link" href="#/review">${ICON.back} Ripasso</a>
    <header class="page-head"><h1>★ My deck</h1><p class="muted">Sentences you saved, with the words in context.</p></header>
    ${ids.length ? `<div class="list-tools"><div class="seg small" role="group" aria-label="Show">${[["all", "All"], ["units", "From units"], ["texts", "From texts"]].map(([k, l]) => `<button data-df="${k}" aria-pressed="${deckFilter === k}">${l}</button>`).join("")}</div>
      <a class="btn primary" href="#/session/deck">Practise</a></div>` : ""}
    ${shown.length ? `<div class="panel flush">${shown.map(id => { const c = cardData(id); return `<div class="deck-item">
        <p class="ex-it">${c.sentIt}</p><p class="ex-en">${esc(c.sentEn)}</p>
        <p class="muted small">${c.target ? `<span class="it">${esc(c.target)}</span> = ${esc(c.meaning)} · ` : ""}${c.fromHref ? `<a href="${esc(c.fromHref)}">${esc(c.from)}</a>` : esc(c.from)}</p>
        <div class="item-actions">${canSpeak ? `<button class="btn quiet small" data-say-text="${esc(c.say)}">${ICON.speak}<span>Listen</span></button>` : ""}
          <button class="status ${statusOf(id)}" data-status="${esc(id)}" data-toggle-sched>${statusLabel(id)}</button>
          <button class="btn quiet small" data-remove="${esc(id)}">Remove</button></div>
        <div class="sched-wrap" hidden>${schedHTML(id)}</div></div>`; }).join("")}</div>`
      : `<div class="empty-state"><h2>${ids.length ? "Nothing here" : "Your deck is empty"}</h2><p>Tap ★ Save on any word or phrase, or tap a sentence in a text and choose “Save to deck”.</p><a class="btn" href="#/learn/reading">Find something to read</a></div>`}`;
  app.querySelectorAll("[data-df]").forEach(b => b.onclick = () => { deckFilter = b.dataset.df; viewDeck(app); });
  app.querySelectorAll("[data-remove]").forEach(b => b.onclick = () => {
    const id = b.dataset.remove; setEntry(id, { s: 0 }); viewDeck(app);
  });
}

/* ---------- Session (focus mode) ---------- */
let ses = null;
on("leave", () => { ses = null; });
function build(v) {
  let pool, newPool, cap = 60;
  if (v.src === "unit") { pool = D.unitIds[v.u] || []; newPool = pool; }
  else if (v.src === "deck") { pool = deckIds(); newPool = pool; }
  else {
    pool = allReviewable();
    const startAt = Math.max(0, D.units.findIndex(u => u.level === S.pref.level));
    newPool = D.units.slice(startAt).flatMap(u => D.unitIds[u.n]);
  }
  const due = dueIds(pool);
  const nNew = v.src === "due" ? S.pref.newN : Math.max(S.pref.newN, 10);
  let fresh = newPool.filter(id => statusOf(id) === "new").slice(0, nNew);
  // Sentences the learner saved themselves are introduced first in the daily review.
  if (v.src === "due") fresh = [...deckIds().filter(id => id.startsWith("s:") && statusOf(id) === "new").slice(0, 20), ...fresh];
  let queue = [...due, ...fresh], cram = false;
  if (!queue.length && v.src !== "due") { queue = pool.filter(id => statusOf(id) === "later").slice(0, 30); cram = queue.length > 0; }
  return { queue: queue.slice(0, cap), done: 0, total: Math.min(cap, queue.length), flipped: false, history: [], cram, deckMode: v.src === "deck" };
}
const nextIndex = () => ses.queue.findIndex(id => ses.cram || ["new", "due"].includes(statusOf(id)));
const exitHref = v => v.src === "unit" ? `#/unit/${v.u}/words` : v.src === "deck" ? "#/deck" : "#/review";

export function viewSession(app, v) {
  ses = build(v);
  draw(app, v);
}
function draw(app, v) {
  if (!ses) return;
  const total = ses.done + ses.queue.length;
  const top = `<div class="focus-top">
      <a class="icon-btn" href="${exitHref(v)}" aria-label="End session">${ICON.close}</a>
      <div class="progress-track" aria-hidden="true"><span style="width:${total ? (ses.done / total) * 100 : 100}%"></span></div>
      <button class="icon-btn" data-undo ${ses.history.length ? "" : "disabled"} aria-label="Back to the previous card" title="Back">${ICON.back}</button>
    </div>`;
  if (!ses.queue.length) {
    const later = allReviewable().filter(id => statusOf(id) === "later");
    const next = later.length ? Math.min(...later.map(id => S.st[id].d)) : 0;
    app.innerHTML = `${top}<div class="card-stage"><div class="flash done-card"><p class="big-line it">${ses.done ? "Bravo!" : "Tutto fatto"}</p>
      <p class="muted">${ses.done ? `${ses.done} card${ses.done === 1 ? "" : "s"} reviewed.` : v.src === "deck" ? "Your deck has nothing to practise yet." : "Nothing to review right now."}${next ? ` Next card due in ${fmtIn(next - Date.now())}.` : ""}</p>
      <div class="btn-row center"><a class="btn primary" href="${exitHref(v)}">Done</a></div></div></div>`;
    wire(app, v); return;
  }
  const i = nextIndex();
  if (i < 0) {
    const next = Math.min(...ses.queue.map(id => S.st[id]?.d || Infinity));
    app.innerHTML = `${top}<div class="card-stage"><div class="flash done-card"><p class="big-line it">Una pausa</p>
      <p class="muted">${ses.queue.length} card${ses.queue.length === 1 ? "" : "s"} will come back in ${fmtIn(next - Date.now())}.</p>
      <div class="btn-row center"><button class="btn primary" data-now>Review them now</button><a class="btn" href="${exitHref(v)}">Finish</a></div></div></div>`;
    wire(app, v); return;
  }
  if (i > 0) { const [id] = ses.queue.splice(i, 1); ses.queue.unshift(id); }
  const id = ses.queue[0], c = cardData(id), en = S.pref.dir === "en";
  const sentenceFirst = ses.deckMode || !c.target;
  const front = en
    ? `${c.meaning ? `<p class="card-target en">${esc(c.meaning)}</p>` : ""}<p class="card-sent en">${esc(c.sentEn)}</p>`
    : sentenceFirst ? `<p class="card-sent big it">${c.sentIt}</p>`
    : `<p class="card-target it">${esc(c.target)}</p><p class="card-sent it">${c.sentIt}</p>`;
  const back = en
    ? `${c.target ? `<p class="card-answer it">${esc(c.target)}</p>` : ""}<p class="card-sent it">${c.sentIt}</p>`
    : `${c.meaning ? `<p class="card-answer">${esc(c.meaning)}</p>` : ""}<p class="card-sent en">${esc(c.sentEn)}</p>${sentenceFirst && c.target ? `<p class="muted small it">${esc(c.target)}</p>` : ""}${c.extra ? `<p class="muted small it">${esc(c.extra)}</p>` : ""}`;
  app.innerHTML = `${top}<div class="card-stage">
    <div class="flash" id="card" ${ses.flipped ? "" : 'role="button" tabindex="0" aria-label="Show the answer"'}>
      <p class="card-meta">${esc(c.kind)} · ${esc(c.from)}${statusOf(id) === "new" ? " · new" : ""}</p>
      ${front}
      ${ses.flipped ? `<hr class="card-rule">${back}` : `<p class="tap-hint">Tap to see the answer</p>`}
      ${ses.flipped && canSpeak ? `<button class="icon-btn listen" data-say-text="${esc(c.say)}" aria-label="Listen">${ICON.speak}</button>` : ""}
    </div>
    ${ses.flipped ? `<p class="muted small center">When should you see this again?</p><div class="rate">
      <button class="btn rate-again" data-rate="10m">10 min</button><button class="btn" data-rate="1d">1 day</button><button class="btn" data-rate="3d">3 days</button><button class="btn" data-rate="7d">7 days</button>
      <button class="btn rate-know" data-rate="known">I know it</button></div>`
      : `<button class="btn primary large wide" data-flip>Show answer</button>`}
    <p class="muted small center keys">Space: show · 1–5: rate · ←: back</p>
  </div>`;
  wire(app, v);
}
function wire(app, v) {
  app.querySelector("[data-undo]")?.addEventListener("click", () => undo(app, v));
  app.querySelector("[data-now]")?.addEventListener("click", () => { ses.cram = true; draw(app, v); });
  app.querySelector("#card")?.addEventListener("click", e => { if (!e.target.closest("button")) flip(app, v); });
  app.querySelector("[data-flip]")?.addEventListener("click", () => flip(app, v));
  app.querySelectorAll("[data-rate]").forEach(b => b.onclick = () => rate(app, v, b.dataset.rate));
}
function flip(app, v) {
  if (!ses || ses.flipped || !ses.queue.length || nextIndex() < 0) return;
  ses.flipped = true; draw(app, v);
  if (S.pref.dir === "it") say(cardData(ses.queue[0]).say);
}
function rate(app, v, key) {
  if (!ses || !ses.flipped) return;
  const id = ses.queue[0];
  ses.history.push({ id, prev: S.st[id] ? { ...S.st[id] } : null, queue: [...ses.queue], done: ses.done });
  if (ses.history.length > 30) ses.history.shift();
  ses.queue.shift();
  schedule(id, key);
  if (key === "10m") ses.queue.push(id); else ses.done++;
  ses.flipped = false; draw(app, v);
}
function undo(app, v) {
  const h = ses?.history.pop(); if (!h) return;
  setEntry(h.id, h.prev ? Object.fromEntries(Object.entries(h.prev).filter(([k]) => k !== "t")) : { d: 0, k: 0, iv: "" }, true);
  ses.queue = h.queue; ses.done = h.done; ses.flipped = true;
  draw(app, v);
}
document.addEventListener("keydown", e => {
  if (!ses || S.view.name !== "session" || e.target.matches("input, textarea") || e.metaKey || e.ctrlKey || e.altKey) return;
  const app = document.getElementById("app");
  if ((e.code === "Space" || e.key === "Enter") && !ses.flipped && !e.target.closest("a, .icon-btn")) { e.preventDefault(); flip(app, S.view); }
  else if (ses.flipped && /^[1-5]$/.test(e.key)) rate(app, S.view, ["10m", "1d", "3d", "7d", "known"][+e.key - 1]);
  else if (e.key === "ArrowLeft" || e.key === "Backspace") { e.preventDefault(); undo(app, S.view); }
});
