// "Say it": five short speaking prompts after a step, or as a daily round.
//  tr  = an English sentence to say in Italian, then check against the model
//  use = a phrase to use in a sentence about yourself
//  sh  = a line to hear and repeat (shadowing)
// Sentences you couldn't say yet go to your deck, so they come back in reviews.
import { S, D, esc, ICON, canSpeak, say, shuffle, setEntry, inDeck, deckIds, learned, saveSentence, sentenceId, pickEx, exVoice, dayKey } from "../core.js";
import { ensure } from "../data.js";
import { cardData } from "./review.js";
import { nextUnit } from "./home.js";
import { voiceForName, narratorVoice } from "../voice.js";

const N = 5;
const words = s => String(s).split(/\s+/).length;
const sayable = s => { const n = words(s.it); return n >= 3 && n <= 14; };

// Example sentences of the words in a unit (learned words first).
function unitSentences(u, onlyLearned) {
  return (D.unitIds[u] || []).filter(id => !onlyLearned || learned(id)).flatMap(id => {
    const it = D.items[id], d = it.d;
    if (it.type === "w" || it.type === "p") { const ex = pickEx(d.ex, d.exAlt); return ex ? [{ it: ex, en: d.exEn, v: exVoice(ex, d.exAlt), src: `#/unit/${u}/words`, title: `Unità ${u}` }] : []; }
    if (it.type === "v" && d.ex?.[0]) { const ex = pickEx(d.ex[0][0], d.exAlt?.[0]); return [{ it: ex, en: d.ex[0][1], v: exVoice(ex, d.exAlt?.[0]), src: `#/unit/${u}/verbs`, title: `Unità ${u}` }]; }
    return [];
  }).filter(sayable);
}
const phraseUses = (ids, u) => ids.map(id => D.items[id]).filter(it => it?.type === "p").map(it => {
  const ex = pickEx(it.d.ex, it.d.exAlt);
  return { k: "use", it: it.d.it, en: it.d.en, ex, exEn: it.d.exEn, v: exVoice(ex, it.d.exAlt), src: `#/unit/${it.u}/phrases`, title: `Unità ${it.u}` };
});
const tr = list => list.map(s => ({ k: "tr", ...s }));

async function build(v) {
  const src = v.src, id = v.id;
  if (src === "unit" || src === "phrases") {
    const u = +id, ids = D.unitIds[u] || [];
    const uses = shuffle(phraseUses(ids, u));
    if (src === "phrases") return { items: uses.slice(0, N), exit: `#/unit/${u}/phrases`, title: `Unità ${u} · Frasi` };
    const known = unitSentences(u, true);
    return { items: shuffle([...shuffle(known.length >= 3 ? known : unitSentences(u)).slice(0, 3).map(s => ({ k: "tr", ...s })), ...uses.slice(0, 2)]), exit: `#/unit/${u}/words`, title: `Unità ${u}` };
  }
  if (src === "read") {
    const r = (await ensure("reading")).find(x => x.id === id); if (!r) return null;
    const lines = r.body.flatMap(b => b.s.map(s => ({ it: s.it, en: s.en, v: b.who ? voiceForName(b.who) : narratorVoice(r.id), src: `#/read/${r.id}`, title: r.title })));
    return { items: tr(shuffle(lines.filter(sayable)).slice(0, N)), exit: `#/read/${r.id}`, title: r.title };
  }
  if (src === "listen") {
    const l = (await ensure("listening")).find(x => x.id === id); if (!l) return null;
    const lines = l.body.flatMap(b => b.s.map(s => ({ it: s.it, en: s.en, v: l.speakers[b.who] || "f", src: `#/listen/${l.id}`, title: l.title }))).filter(sayable);
    const pick = shuffle(lines).slice(0, N);
    return { items: pick.map((s, i) => ({ k: i < 3 ? "sh" : "tr", ...s })), exit: `#/listen/${l.id}`, title: l.title };
  }
  if (src === "grammar") {
    const g = (await ensure("grammar")).find(x => x.id === id); if (!g) return null;
    const lines = g.uses.map(u => ({ it: u.ex[0], en: u.ex[1], v: "f", src: `#/grammar/${g.id}`, title: g.title })).filter(sayable);
    return { items: tr(shuffle(lines).slice(0, N)), exit: `#/grammar/${g.id}`, title: g.title };
  }
  // Daily: sentences from your deck first, then phrases and words you have learned.
  const deck = shuffle(deckIds()).map(cardData).filter(c => c.sentEn).map(c => ({ it: (c.say || "").trim(), en: c.sentEn, v: c.sv || "f" })).filter(sayable);
  const learnedIds = D.order.filter(learned);
  const uses = shuffle(phraseUses(learnedIds));
  const units = [...new Set(learnedIds.map(x => D.items[x].u))];
  const ex = shuffle(units.flatMap(u => unitSentences(u, true)));
  let items = [...tr(deck.slice(0, 3)), ...uses.slice(0, 1)];
  items.push(...tr(ex.filter(s => !items.some(x => x.it === s.it))).slice(0, N - items.length));
  if (items.length < N) items.push(...tr(deck.slice(3)).slice(0, N - items.length));
  if (items.length < 3) { const nu = nextUnit(); if (nu) return build({ src: "unit", id: nu.n }); }
  return { items: shuffle(items).slice(0, N), exit: "#/", title: "Today" };
}

export async function viewSay(app, v, alive) {
  const b = await build(v);
  if (!alive()) return;
  if (!b || !b.items.length) { app.innerHTML = `<div class="empty-state"><h2>Nothing to say yet</h2><p class="muted">Learn a few words first, then come back.</p><a class="btn" href="#/">Back to Oggi</a></div>`; return; }
  const { items, exit, title } = b;
  let i = 0, shown = false, said = 0, saved = 0, example = false;
  const top = () => `<div class="focus-top"><span class="prev-word"></span>
      <div class="progress-track" aria-hidden="true"><span style="width:${i / items.length * 100}%"></span></div>
      <span class="count small" aria-live="polite">${Math.min(i + 1, items.length)} / ${items.length}</span>
      <a class="icon-btn" href="${exit}" aria-label="End">${ICON.close}</a></div>
    <p class="eyebrow center">Say it · ${esc(title)}</p>`;
  const listen = x => canSpeak ? `<button class="icon-btn" data-say-text="${esc(x.it)}" data-voice="${x.v || "f"}" aria-label="Listen">${ICON.speak}</button>` : "";
  const next = () => { i++; shown = false; example = false; draw(); };
  const draw = () => {
    if (i >= items.length) {
      setEntry("sp:say", { n: (S.st["sp:say"]?.n || 0) + said, day: dayKey() });
      app.innerHTML = `${top()}<div class="card-stage"><div class="flash done-card"><p class="big-line it">Fatto!</p>
        <p class="muted">You said ${said} ${said === 1 ? "sentence" : "sentences"} out loud.${saved ? ` ${saved} ${saved === 1 ? "is" : "are"} now in your deck, to practise again.` : ""}</p></div>
        <div class="card-actions"><button class="btn primary large wide" data-more>Five more</button><a class="btn wide" href="${exit}">Done</a></div></div>`;
      app.querySelector("[data-more]").onclick = () => viewSay(app, v, alive);
      return;
    }
    const x = items[i];
    let body, actions;
    if (x.k === "tr") {
      body = `<p class="card-meta">Say it in Italian</p><p class="card-sent big en">${esc(x.en)}</p>
        ${shown ? `<hr class="card-rule"><p class="card-sent big it">${esc(x.it)}</p>` : `<p class="tap-hint">Say it out loud first. Then check.</p>`}`;
      actions = shown ? `<p class="muted small center">Did you say it (more or less)?</p><div class="rate two"><button class="btn" data-res="0">Not yet</button><button class="btn primary" data-res="1">Got it</button></div>`
        : `<button class="btn primary large wide" data-show>Show the Italian</button>`;
    } else if (x.k === "use") {
      body = `<p class="card-meta">Use it about you</p><p class="card-target it">${esc(x.it)}</p><p class="card-sent en">${esc(x.en)}</p>
        <p class="tap-hint">Say a sentence about your own life with it, out loud.</p>
        ${example ? `<hr class="card-rule"><p class="muted small">For example</p><p class="card-sent it">${esc(x.ex)}</p><p class="card-sent en">${esc(x.exEn)}</p>` : ""}`;
      actions = `<div class="rate two">${example ? "" : `<button class="btn" data-example>Show an example</button>`}<button class="btn primary" data-res="1">I said one</button></div>`;
    } else {
      body = `<p class="card-meta">Repeat after the speaker</p><p class="tap-hint">Listen, then say it the same way: same speed, same melody.</p>
        ${shown ? `<hr class="card-rule"><p class="card-sent big it">${esc(x.it)}</p><p class="card-sent en">${esc(x.en)}</p>` : ""}`;
      actions = `<div class="rate two"><button class="btn" data-replay>${ICON.replay}<span>Again</span></button>${shown ? "" : `<button class="btn" data-show>Show the words</button>`}</div><button class="btn primary large wide" data-res="1">I said it</button>`;
    }
    app.innerHTML = `${top()}<div class="card-stage"><div class="flash say-card">${body}
        <span class="card-corner">${shown || example || x.k === "sh" ? listen(x.k === "use" ? { it: x.ex, v: x.v } : x) : ""}</span></div>
      <div class="card-actions">${actions}</div></div>`;
    if (x.k === "sh" && !shown) setTimeout(() => { if (items[i] === x) say(x.it, x.v); }, 200);
    app.querySelector("[data-show]")?.addEventListener("click", () => { shown = true; draw(); say(x.it, x.v); });
    app.querySelector("[data-example]")?.addEventListener("click", () => { example = true; draw(); say(x.ex, x.v); });
    app.querySelector("[data-replay]")?.addEventListener("click", () => say(x.it, x.v));
    app.querySelectorAll("[data-res]").forEach(btn => btn.onclick = () => {
      if (btn.dataset.res === "1") said++;
      else if (!inDeck(sentenceId(x.it))) { saveSentence({ it: x.it, en: x.en, src: x.src || exit, srcTitle: x.title || title, voice: x.v }); saved++; }
      next();
    });
  };
  draw();
}
