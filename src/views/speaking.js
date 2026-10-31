import { bravo, markPathWork, S, esc, ICON, setEntry, remember, TOPICS, on, showToast, gq } from "../core.js";
import { ensure } from "../data.js";
import { plainLines, sentHTML, starHTML } from "./texts.js";
import { readerTools, wireReader } from "./reading.js";
import { playerHTML, wirePlayer } from "./player.js";
import { modelsHTML, modelVoice } from "./writing.js";

let cleanup = [];
on("leave", () => { cleanup.forEach(f => { try { f(); } catch (e) {} }); cleanup = []; });
const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
// Talk time per level: short at the start, longer as you grow.
const TALK = { A1: 2, A2: 3, B1: 5, B2: 7 };
// Counts as practised after this much talking (or when the timer runs out).
const ENOUGH = 60;

export async function viewSpeaking(app, v, alive) {
  const all = await ensure("speaking");
  if (!alive()) return;
  const t = all.find(x => x.id === v.id);
  if (!t) { location.hash = "#/learn/speaking"; return; }
  remember("speaking", t.title, `#/speak/${t.id}`, t.en);
  let level = S.pref.level, showModels = false;
  const minutes = TALK[S.pref.level] || TALK.A2;
  let rec = null, chunks = [], audioUrl = null, timer = null, left = 0, stream = null, talked = 0;
  // The task text names a length for B1–B2 talks; the timer below sets it for the learner's level instead.
  const task = t.task.replace(/\s*(Talk|Speak|Aim) for [^.]*minutes\.?/i, "");
  const canRecord = !!(navigator.mediaDevices && window.MediaRecorder);
  const stopAll = () => {
    clearInterval(timer); timer = null;
    if (rec && rec.state !== "inactive") rec.stop();
    if (stream) { stream.getTracks().forEach(tr => tr.stop()); stream = null; }
  };
  cleanup.push(stopAll, () => audioUrl && URL.revokeObjectURL(audioUrl));

  const draw = () => {
    const showEn = !!S.pref.showEn;
    const done = S.st["sp:" + t.id]?.done;
    const wide = matchMedia("(min-width: 1024px)").matches;
    app.innerHTML = `<div class="layout side-after">
      <div class="l-head"><a class="back-link" href="#/learn/speaking">${ICON.back} Parlato</a>
        <header class="page-head"><p class="eyebrow">${esc(TOPICS[t.topic] || "")}</p><h1 class="it">${esc(t.title)}</h1><p class="muted">${esc(t.en)}</p></header></div>
      <div class="l-main">
        <section class="panel prose"><p>${esc(task)} Talk for about ${minutes} minute${minutes === 1 ? "" : "s"}.</p></section>
        <section class="g-sec"><h2>Talk about…</h2><div class="panel flush reader">${t.questions.map(q => { const x = { ...q, it: gq(q.it) }; return `<div class="gloss"><div class="gloss-main">${sentHTML(x, `#/speak/${t.id}`, t.title)}<span class="muted">${esc(q.en)}</span></div>${starHTML(x, `#/speak/${t.id}`, t.title)}</div>`; }).join("")}</div></section>
        <section class="g-sec">
          ${showModels ? `<h2>Example talks</h2>${playerHTML("Listen to the talk")}${readerTools(showEn)}${modelsHTML(t, level, showEn, `#/speak/${t.id}`)}`
            : `<div class="panel note-card"><p>Try it yourself first. Then listen to how someone at each level talks about it.</p><button class="btn" data-show-models>Show example talks</button></div>`}
        </section>
      </div>
      <aside class="l-aside">
        <div class="l-side"><section class="panel speak-box"><h2>Practise out loud</h2>
          <p class="timer" id="timer" aria-live="off">${mmss(left || minutes * 60)}</p>
          <button class="btn ${timer ? "" : "speak"}" data-start>${timer ? `${ICON.stop} Stop` : canRecord ? `${ICON.mic} Start and record` : `${ICON.play} Start timer`}</button>
          ${audioUrl ? `<p class="muted small">Listen back to yourself:</p><audio controls src="${audioUrl}"></audio>` : canRecord ? `<p class="muted small">Your recording stays on this device.</p>` : ""}
          ${done ? `<p class="ok-text">${ICON.check} Practised</p>` : `<p class="muted small">Done once you've talked for a minute.</p>`}
        </section></div>
        <div class="l-side2"><details class="group" ${wide ? "open" : ""}><summary><span class="group-title">Useful phrases</span><span class="group-meta">${t.phrases.length}</span></summary>
          <div class="panel flush reader">${t.phrases.map(p => `<div class="gloss"><div class="gloss-main">${sentHTML(p, `#/speak/${t.id}`, t.title)}<span class="muted">${esc(p.en)}</span></div>${starHTML(p, `#/speak/${t.id}`, t.title)}</div>`).join("")}</div></details></div>
      </aside></div>`;
    app.querySelector("[data-start]").onclick = start;
    app.querySelector("[data-show-models]")?.addEventListener("click", () => { showModels = true; draw(); app.querySelector(".reader-tools")?.scrollIntoView({ block: "start", behavior: "smooth" }); });
    app.querySelectorAll("[data-model]").forEach(b => b.onclick = () => { level = b.dataset.model; draw(); });
    if (showModels) { wireReader(app); wirePlayer(app, plainLines(t.models[level].body, () => modelVoice(t, level)), { idle: "Listen to the talk" }); }
  };
  const tick = () => {
    left--; talked++;
    if (talked === ENOUGH) { if (!S.st["sp:" + t.id]?.done) setEntry("sp:" + t.id, { done: 1 }); markPathWork(); } const el = document.getElementById("timer"); if (el) el.textContent = mmss(Math.max(0, left));
    if (left <= 0) { stopAll(); showToast("Time's up. " + bravo()); setEntry("sp:" + t.id, { done: 1 }); }
  };
  async function start() {
    if (timer) { stopAll(); draw(); return; }
    left = minutes * 60; talked = 0;
    if (canRecord) {
      // The browser asks for the microphone first: say so, so the button does not look broken.
      const b = app.querySelector("[data-start]");
      if (b) { b.disabled = true; b.textContent = "Allow the microphone in your browser…"; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        chunks = []; rec = new MediaRecorder(stream);
        rec.ondataavailable = e => e.data.size && chunks.push(e.data);
        rec.onstop = () => {
          if (audioUrl) URL.revokeObjectURL(audioUrl);
          audioUrl = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
          if (stream) { stream.getTracks().forEach(tr => tr.stop()); stream = null; }
          if (S.view.name === "speaking") draw();
        };
        rec.start();
      } catch (e) {
        showToast(e?.name === "NotAllowedError" ? "The microphone is blocked. You can allow it in your browser settings. The timer still runs." : "Microphone not available. The timer still runs.", null, null, 6000);
      }
    }
    timer = setInterval(tick, 1000);
    draw();
  }
  draw();
}
