import { S, D, esc, ICON, gf, pickEx, exVoice, inDeck, canSpeak, say, full, statusOf, statusLabel, setEntry, schedule, dueIds, deckIds, allReviewable, fmtIn, on, schedHTML, lsGet } from "../core.js";
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
export function viewDeck(app) {
  const ids = deckIds();
  const shown = ids.filter(id => deckFilter === "all" || (deckFilter === "texts" ? id.startsWith("s:") : !id.startsWith("s:")));
  const ready = dueIds(ids).length + ids.filter(id => statusOf(id) === "new").length;
  app.innerHTML = `<header class="page-head"><h1>Mazzo</h1><p class="muted">Sentences you saved, with the words in context. Tap ★ on any word, or tap a sentence in a text, to add it here.</p></header>
    ${ids.length ? `<section class="panel deck-head">
        <div><p class="big-line">${ids.length} sentence${ids.length === 1 ? "" : "s"}</p><p class="muted small">${ready ? `${ready} ready to practise` : "Nothing due. You can still go through them."}</p></div>
        <div class="btn-row"><a class="btn primary" href="#/session/deck">Practise my deck</a><a class="btn" href="#/quiz/deck">Quiz</a></div></section>
      <div class="list-tools"><div class="seg small" role="group" aria-label="Show">${[["all", "All"], ["units", "From units"], ["texts", "From texts"]].map(([k, l]) => `<button data-df="${k}" aria-pressed="${deckFilter === k}">${l}</button>`).join("")}</div></div>` : ""}
    ${shown.length ? `<div class="deck-grid">${shown.map(id => { const c = cardData(id); return `<div class="panel deck-item">
        <p class="ex-it">${c.sentIt}</p><p class="ex-en">${esc(c.sentEn)}</p>
        <p class="muted small">${c.target ? `<span class="it">${esc(c.target)}</span> = ${esc(c.meaning)} · ` : ""}${c.fromHref ? `<a href="${esc(c.fromHref)}">${esc(c.from)}</a>` : esc(c.from)}</p>
        <div class="item-actions">${canSpeak ? `<button class="btn quiet small" data-say-text="${esc(c.say)}" data-voice="${c.sv || "f"}">${ICON.speak}<span>Listen</span></button>` : ""}
          <button class="status ${statusOf(id)}" data-status="${esc(id)}" data-toggle-sched>${statusLabel(id)}</button>
          <button class="btn quiet small" data-remove="${esc(id)}">Remove</button></div>
        <div class="sched-wrap" hidden>${schedHTML(id)}</div></div>`; }).join("")}</div>`
      : `<div class="empty-state"><h2>${ids.length ? "Nothing here" : "Your deck is empty"}</h2><p class="muted">Save sentences while you read, or tap ★ Save on any word or phrase.</p><a class="btn" href="#/learn/reading">Find something to read</a></div>`}`;
  app.querySelectorAll("[data-df]").forEach(b => b.onclick = () => { deckFilter = b.dataset.df; viewDeck(app); });
  app.querySelectorAll("[data-remove]").forEach(b => b.onclick = () => { setEntry(b.dataset.remove, { s: 0 }); viewDeck(app); });
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
  const nNew = v.src === "due" ? S.pref.newN : Math.max(S.pref.newN, 10);
  let fresh = newPool.filter(id => statusOf(id) === "new").slice(0, nNew);
  // Sentences the learner saved themselves are introduced first in the daily session.
  if (v.src === "due") fresh = [...deckIds().filter(id => id.startsWith("s:") && statusOf(id) === "new").slice(0, 20), ...fresh];
  let queue = [...due, ...fresh], cram = false;
  if (!queue.length && v.src !== "due") { queue = pool.filter(id => statusOf(id) === "later").slice(0, 30); cram = queue.length > 0; }
  queue = queue.slice(0, 60);
  return { queue, done: 0, flipped: false, intro: false, history: [], cram, deckMode: v.src === "deck", stats: { learned: 0, again: 0, known: 0 } };
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
  const id = ses.queue[0], c = cardData(id), en = false;
  // A card you've never seen is introduced in full, not tested.
  if (statusOf(id) === "new" && !ses.flipped) { ses.flipped = true; ses.intro = true; setTimeout(() => { if (ses && ses.queue[0] === id) say(c.say, c.sv); }, 150); }
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
      <p class="card-meta">${ses.intro ? `<span class="pill new">New</span> ` : ""}${esc(c.kind)} · ${esc(c.from)}</p>
      ${front}
      ${ses.flipped ? `<hr class="card-rule">${back}` : `<p class="tap-hint">Try to remember, then tap</p>`}
      <span class="card-corner">
        <button class="icon-btn star-card" data-deck="${esc(id)}" aria-pressed="${inDeck(id)}" aria-label="${inDeck(id) ? "Remove from" : "Add to"} your deck" title="Your deck">${ICON.star}</button>
        ${ses.flipped && canSpeak ? `<button class="icon-btn" data-say-text="${esc(c.say)}" data-voice="${c.sv || "f"}" aria-label="Listen">${ICON.speak}</button>` : ""}
      </span>
    </div>
    <div class="card-actions">
    ${ses.flipped ? `<p class="muted small center">${ses.intro ? "Read it and listen. When should you see it again?" : "When should you see this again?"}</p><div class="rate">
      <button class="btn rate-again" data-rate="10m">10 min</button><button class="btn" data-rate="1d">1 day</button><button class="btn" data-rate="3d">3 days</button><button class="btn" data-rate="7d">7 days</button>
      <button class="btn rate-know" data-rate="known">I already know it</button></div>`
      : `<button class="btn primary large wide" data-flip>Show answer</button>`}
</div>
  </div>`;
  wire(app, v);
}
function drawEnd(app, v, top) {
  const s = ses.stats;
  const later = allReviewable().filter(id => statusOf(id) === "later");
  const next = later.length ? Math.min(...later.map(id => S.st[id].d)) : 0;
  const last = lsGet("parlo.last", null), nu = nextUnit();
  const keep = v.src !== "due" ? null : last ? { href: last.href, label: `Continue: ${last.title}` } : nu ? { href: `#/unit/${nu.n}/words`, label: `Explore Unità ${nu.n}` } : null;
  app.innerHTML = `${top}<div class="card-stage"><div class="flash done-card">
      <p class="big-line it">${ses.done ? "Bravo!" : "Tutto fatto"}</p>
      ${ses.done ? `<div class="end-stats">${s.learned ? `<span><b>${s.learned}</b> new ${s.learned === 1 ? "word" : "words"}</span>` : ""}${ses.done - s.learned > 0 ? `<span><b>${ses.done - s.learned}</b> reviewed</span>` : ""}${s.known ? `<span><b>${s.known}</b> already known</span>` : ""}</div>` : ""}
      <p class="muted">${ses.done ? "" : v.src === "deck" ? "Your deck has nothing to practise yet. " : "Nothing to review right now. "}${next ? `Next review in ${fmtIn(next - Date.now())}.` : ""}</p></div>
    <div class="card-actions">${keep ? `<a class="btn primary large wide" href="${esc(keep.href)}">${esc(keep.label)}</a><a class="btn wide" href="${exitHref(v)}">Done</a>` : `<a class="btn primary large wide" href="${exitHref(v)}">Done</a>`}</div></div>`;
  wire(app, v);
}
function wire(app, v) {
  app.querySelector("[data-undo]")?.addEventListener("click", () => undo(app, v));
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
  if (statusOf(id) === "new") ses.stats.learned++;
  ses.queue.shift();
  schedule(id, key);
  if (key === "known") ses.stats.known++;
  if (key === "10m") { ses.queue.push(id); ses.stats.again++; } else ses.done++;
  ses.flipped = false; ses.intro = false; draw(app, v);
}
function undo(app, v) {
  const h = ses?.history.pop(); if (!h) return;
  setEntry(h.id, h.prev ? Object.fromEntries(Object.entries(h.prev).filter(([k]) => k !== "t")) : { d: 0, k: 0, iv: "" }, true);
  ses.queue = h.queue; ses.done = h.done; ses.stats = h.stats; ses.flipped = true; ses.intro = !h.prev;
  draw(app, v);
}
document.addEventListener("keydown", e => {
  if (!ses || S.view.name !== "session" || e.target.matches("input, textarea") || e.metaKey || e.ctrlKey || e.altKey) return;
  const app = document.getElementById("app");
  if ((e.code === "Space" || e.key === "Enter") && !ses.flipped && !e.target.closest("a, .icon-btn")) { e.preventDefault(); flip(app, S.view); }
  else if (ses.flipped && /^[1-5]$/.test(e.key)) rate(app, S.view, ["10m", "1d", "3d", "7d", "known"][+e.key - 1]);
  else if (e.key === "ArrowLeft" || e.key === "Backspace") { e.preventDefault(); undo(app, S.view); }
});
