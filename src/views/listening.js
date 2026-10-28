// Listening: hear it first, answer, then read the transcript.
import { S, esc, ICON, setEntry, remember, speakAll, stopSpeaking, TOPICS, shuffle, lsGet, lsSet } from "../core.js";
import { ensure } from "../data.js";
import { blocksHTML, plainLines } from "./texts.js";
import { wireReader } from "./reading.js";

const SLOW = 0.8;

export async function viewListening(app, v, alive) {
  const all = await ensure("listening");
  if (!alive()) return;
  const l = all.find(x => x.id === v.id);
  if (!l) { location.hash = "#/learn/listening"; return; }
  remember("listening", l.title, `#/listen/${l.id}`, `${l.level} · ${l.minutes} min`);
  const st = S.st["l:" + l.id] || {};
  const voiceOf = b => l.speakers[b.who] || "f";
  const lines = plainLines(l.body, voiceOf);
  const whoOf = l.body.flatMap(b => b.s.map(() => b.who));
  const qs = l.questions.map(q => ({ ...q, o: shuffle(q.o) }));

  app.innerHTML = `<div class="layout">
    <div class="l-head"><a class="back-link" href="#/learn/listening">${ICON.back} Ascolto</a>
      <header class="page-head"><p class="eyebrow">${l.level} · ${esc(l.genre)} · ${l.minutes} min · ${esc(TOPICS[l.topic] || "")}</p>
      <h1 class="it">${esc(l.title)}</h1><p class="muted">${esc(l.situation)}</p></header></div>
    <div class="l-main">
      <section class="g-sec"><h2>Questions</h2>
        <p class="muted small" id="qhint">Read them first, then listen. ${st.done || lsGet("parlo.listen." + l.id, 0) ? "You can answer while it plays." : "The answers open when you press play."}</p>
        <div class="panel flush">${qs.map((q, i) => `<div class="rq" data-q="${i}"><p class="it strong">${i + 1}. ${esc(q.q)}</p><div class="opts">${q.o.map((o, j) => `<button class="opt it" data-qo="${j}">${esc(o)}</button>`).join("")}</div></div>`).join("")}</div>
        <div class="panel finish" id="finish">${st.done ? `<p class="ok-text">${ICON.check} Last time: ${st.score}/${st.total} correct.</p><div class="btn-row"><a class="btn speak" href="#/say/listen/${l.id}">Say it: 5 lines</a></div>` : `<p class="muted small">Answer every question to finish.</p>`}</div>
      </section>
      <details class="group transcript" id="tr" ${st.done ? "open" : ""}><summary><span class="group-title">Transcript</span><span class="group-meta">${st.done ? "" : "Best after you answer"}</span></summary>
        <div class="reader-tools"><div class="seg small" role="group" aria-label="Translation"><button data-en="0">Italiano</button><button data-en="1">+ English</button></div></div>
        <article class="reader">${blocksHTML(l.body, `#/listen/${l.id}`, l.title, !!S.pref.showEn, voiceOf)}</article>
      </details>
    </div>
    <aside class="l-aside"><div class="l-side player-side">
      <section class="panel player" aria-label="Audio player">
        <button class="play-btn" data-play aria-label="Play">${ICON.play}</button>
        <div class="player-main">
          <span class="small player-pos" data-pos aria-live="polite">${lines.length} lines · about ${l.minutes} min</span>
          <span class="bar" aria-hidden="true"><span class="k" data-prog style="width:0"></span></span>
        </div>
        <button class="icon-btn" data-back aria-label="Back one line" title="Back one line">${ICON.replay}</button>
        <button class="btn quiet small" data-slow aria-pressed="false" title="Play slower">${SLOW}×</button>
        <button class="btn quiet small" data-shadow aria-pressed="false" title="Pause after each line so you can repeat it">Repeat</button>
      </section>
    </div></aside></div>`;

  wireReader(app, lines, () => {});

  // Player: plays line by line from `at`; pausing keeps the place.
  // The place in the audio is kept per exercise, so a long piece can be finished later.
  const posKey = "parlo.listen." + l.id;
  let at = Math.min(lsGet(posKey, 0) || 0, lines.length - 1), playing = false, slow = false, shadow = false, stop = null;
  const playBtn = app.querySelector("[data-play]"), pos = app.querySelector("[data-pos]"), prog = app.querySelector("[data-prog]");
  const sents = () => [...app.querySelectorAll(".transcript .sent")];
  const show = () => {
    playBtn.innerHTML = playing ? ICON.pause : ICON.play;
    playBtn.setAttribute("aria-label", playing ? "Pause" : at ? "Resume" : "Play");
    prog.style.width = `${at / lines.length * 100}%`;
    if (playing || at) pos.textContent = `${Math.min(at + 1, lines.length)} of ${lines.length}${Object.keys(l.speakers).length > 1 ? " · " + whoOf[Math.min(at, lines.length - 1)] : ""}`;
    sents().forEach((s, i) => s.classList.toggle("speaking", playing && i === at));
    lsSet(posKey, at);
  };
  const halt = () => { if (stop) { const s = stop; stop = null; s(); } };
  // Answers open once listening has started, so a stray tap before playing can't lock in an answer.
  const unlock = () => { app.querySelectorAll(".rq [data-lock]").forEach(b => { if (b.dataset.lock) { b.disabled = false; delete b.dataset.lock; } }); const h = app.querySelector("#qhint"); if (h) h.textContent = "Read them first, then listen. You can answer while it plays."; };
  const start = () => {
    unlock();
    halt(); playing = true; const from = at;
    // Repeat mode: after each line, a pause as long as the line, for the learner to say it.
    const gap = shadow ? (i, ms) => { pos.textContent = "Your turn: say it"; return Math.round(ms * 1.1 + 700); } : null;
    stop = speakAll(lines.slice(from), i => { at = from + i; show(); },
      () => { if (!stop) return; stop = null; playing = false; at = 0; show(); pos.textContent = "Finished · play again?"; }, slow ? SLOW : 1, gap);
    show();
  };
  const pause = () => { playing = false; halt(); stopSpeaking(); show(); };
  if (at) show();
  playBtn.onclick = () => playing ? pause() : start();
  app.querySelector("[data-back]").onclick = () => { at = Math.max(0, at - 1); playing ? start() : show(); };
  const slowBtn = app.querySelector("[data-slow]");
  slowBtn.onclick = () => { slow = !slow; slowBtn.setAttribute("aria-pressed", slow); if (playing) start(); };
  const shBtn = app.querySelector("[data-shadow]");
  shBtn.onclick = () => { shadow = !shadow; shBtn.setAttribute("aria-pressed", shadow); if (playing) start(); };

  // Questions
  if (!st.done && !at) app.querySelectorAll(".rq [data-qo]").forEach(b => { b.disabled = true; b.dataset.lock = "1"; });
  let answered = 0, correct = 0;
  app.querySelectorAll(".rq").forEach(div => {
    const q = qs[+div.dataset.q];
    div.querySelectorAll("[data-qo]").forEach(b => b.onclick = () => {
      const ok = q.o[+b.dataset.qo] === q.a; answered++; if (ok) correct++;
      div.querySelectorAll("[data-qo]").forEach(x => { x.disabled = true; if (q.o[+x.dataset.qo] === q.a) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
        // Say the result in words too, not only in colour.
        div.insertAdjacentHTML("beforeend", ok ? `<p class="q-fb ok-text">${ICON.check} Right</p>` : `<p class="q-fb bad-text">Not quite. The answer: <span class="it strong">${esc(q.a)}</span></p>`);
      if (answered === qs.length) {
        setEntry("l:" + l.id, { done: 1, score: correct, total: qs.length });
        app.querySelector("#finish").innerHTML = `<p class="ok-text">${ICON.check} ${correct}/${qs.length} correct.</p><p class="muted small">Now read the transcript, then listen again with Repeat on: say each line after the speaker.</p><div class="btn-row"><a class="btn speak" href="#/say/listen/${l.id}">Say it: 5 lines</a><a class="btn" href="#/learn/listening">More listening</a></div>`;
        const tr = app.querySelector("#tr"); tr.open = true; tr.querySelector(".group-meta").textContent = "";
      }
    });
  });
}
