import { S, esc, ICON, canSpeak, setEntry, savePref, remember, speakAll, lsGet, lsSet, TOPICS, shuffle, openSheet } from "../core.js";
import { ensure } from "../data.js";
import { blocksHTML, plainLines, sentHTML, sizeControlHTML, starHTML } from "./texts.js";
import { voiceForName, narratorVoice } from "../voice.js";

export function readerTools(showEn) {
  return `<div class="reader-tools">
    <div class="seg small" role="group" aria-label="Translation"><button data-en="0" aria-pressed="${!showEn}">Italiano</button><button data-en="1" aria-pressed="${showEn}">+ English</button></div>
    <button class="icon-btn" data-textsize aria-label="Text size" title="Text size"><span class="aa">Aa</span></button>
    ${canSpeak ? `<button class="icon-btn" data-playall aria-label="Listen to the whole text" title="Listen">${ICON.play}</button>` : ""}
  </div>
  ${lsGet("parlo.hint.reader", true) ? `<p class="hint-line">Tap a sentence for its translation, or select words to save them. <button class="text-btn" data-hide-hint>OK</button></p>` : ""}`;
}
// Wires the tools above for a text whose sentences are `lines`; `redraw` re-renders with the new translation setting.
export function wireReader(root, lines, redraw) {
  const apply = () => { root.querySelectorAll("article.reader").forEach(a => a.classList.toggle("hide-en", !S.pref.showEn)); root.querySelectorAll("[data-en]").forEach(x => x.setAttribute("aria-pressed", (x.dataset.en === "1") === !!S.pref.showEn)); };
  apply();
  root.querySelectorAll("[data-en]").forEach(b => b.onclick = () => { savePref({ showEn: b.dataset.en === "1" }); apply(); });
  root.querySelector("[data-hide-hint]")?.addEventListener("click", e => { lsSet("parlo.hint.reader", false); e.target.closest(".hint-line").remove(); });
  root.querySelector("[data-textsize]")?.addEventListener("click", () => openSheet(`<div class="sheet-body"><h2>Text size</h2>
    <p class="it size-sample">Ogni mattina bevo un caffè al bar sotto casa.</p>${sizeControlHTML()}</div>`));
  const play = root.querySelector("[data-playall]");
  if (!play) return;
  let stop = null;
  play.onclick = () => {
    if (stop) { stop(); return; }
    const sents = [...root.querySelectorAll(".reader .sent")];
    play.innerHTML = ICON.stop; play.setAttribute("aria-label", "Stop listening");
    stop = speakAll(lines,
      i => { sents.forEach(s => s.classList.remove("speaking")); sents[i]?.classList.add("speaking"); sents[i]?.scrollIntoView({ block: "center", behavior: "smooth" }); },
      () => { stop = null; sents.forEach(s => s.classList.remove("speaking")); play.innerHTML = ICON.play; play.setAttribute("aria-label", "Listen to the whole text"); });
  };
}

export async function viewReading(app, v, alive) {
  const all = await ensure("reading");
  if (!alive()) return;
  const r = all.find(x => x.id === v.id);
  if (!r) { location.hash = "#/learn/reading"; return; }
  remember("reading", r.title, `#/read/${r.id}`, `${r.level} · ${r.minutes} min`);
  const st = S.st["r:" + r.id] || {};
  const voiceOf = b => b.who ? voiceForName(b.who) : narratorVoice(r.id);
  const draw = () => {
    const showEn = !!S.pref.showEn;
    const qs = r.questions.map(q => ({ ...q, o: shuffle(q.o) }));
    const wide = matchMedia("(min-width: 1024px)").matches;
    app.innerHTML = `<div class="layout">
      <div class="l-head"><a class="back-link" href="#/learn/reading">${ICON.back} Lettura</a>
        <header class="page-head"><p class="eyebrow">${r.level} · ${esc(r.genre)} · ${esc(TOPICS[r.topic] || "")}</p>
        <h1 class="it">${esc(r.title)}</h1><p class="muted">${esc(r.blurb)}</p></header></div>
      <div class="l-main">
        <article class="reader">${blocksHTML(r.body, `#/read/${r.id}`, r.title, showEn, voiceOf)}</article>
        <section class="g-sec"><h2>Did you get it?</h2>
          <div class="panel flush" id="qs">${qs.map((q, i) => `<div class="rq" data-q="${i}"><p class="it strong">${i + 1}. ${esc(q.q)}</p><div class="opts">${q.o.map((o, j) => `<button class="opt it" data-qo="${j}">${esc(o)}</button>`).join("")}</div></div>`).join("")}</div>
          <div class="panel finish" id="finish">${st.done ? `<p class="ok-text">${ICON.check} You've read this${st.score != null ? ` · ${st.score}/${r.questions.length} correct` : ""}.</p>` : `<p class="muted small">Answer the questions, or simply mark it as read.</p>`}
            <div class="btn-row">${st.done ? `<a class="btn speak" href="#/say/read/${r.id}">Say it: 5 sentences</a>` : `<button class="btn primary" data-done>Mark as read</button>`}<a class="btn" href="#/learn/reading">More texts</a></div></div>
        </section>
      </div>
      <aside class="l-aside">
        <div class="l-side">${readerTools(showEn)}</div>
        <div class="l-side2"><details class="group" ${wide ? "open" : ""}><summary><span class="group-title">Glossary</span><span class="group-meta">${r.glossary.length} words</span></summary>
          <div class="panel flush reader">${r.glossary.map(g => `<div class="gloss"><div class="gloss-main">${sentHTML({ it: g.it, en: g.en }, `#/read/${r.id}`, r.title)}<span class="muted">${esc(g.en)}</span></div>${starHTML({ it: g.it, en: g.en }, `#/read/${r.id}`, r.title)}</div>`).join("")}</div></details></div>
      </aside></div>`;
    wireReader(app, plainLines(r.body, voiceOf), draw);
    let answered = 0, correct = 0;
    app.querySelectorAll(".rq").forEach(div => {
      const q = qs[+div.dataset.q];
      div.querySelectorAll("[data-qo]").forEach(b => b.onclick = () => {
        const ok = q.o[+b.dataset.qo] === q.a; answered++; if (ok) correct++;
        div.querySelectorAll("[data-qo]").forEach(x => { x.disabled = true; if (q.o[+x.dataset.qo] === q.a) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
        // Say the result in words too, not only in colour.
        div.insertAdjacentHTML("beforeend", ok ? `<p class="q-fb ok-text">${ICON.check} Right</p>` : `<p class="q-fb bad-text">Not quite. The answer: <span class="it strong">${esc(q.a)}</span></p>`);
        if (answered === qs.length) {
          setEntry("r:" + r.id, { done: 1, score: correct, total: qs.length });
          app.querySelector("#finish").innerHTML = `<p class="ok-text">${ICON.check} ${correct}/${qs.length} correct. Marked as read.</p><p class="muted small">Now say a few of its sentences yourself, from English.</p><div class="btn-row"><a class="btn speak" href="#/say/read/${r.id}">Say it: 5 sentences</a><a class="btn" href="#/learn/reading">More texts</a></div>`;
        }
      });
    });
    app.querySelector("[data-done]")?.addEventListener("click", () => { setEntry("r:" + r.id, { done: 1 }); draw(); });
  };
  draw();
}
