import { S, esc, ICON, setEntry, remember, TOPICS, on, showToast } from "../core.js";
import { ensure } from "../data.js";
import { plainLines, sentHTML } from "./texts.js";
import { readerTools, wireReader } from "./reading.js";
import { modelsHTML } from "./writing.js";

let cleanup = [];
on("leave", () => { cleanup.forEach(f => { try { f(); } catch (e) {} }); cleanup = []; });
const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export async function viewSpeaking(app, v, alive) {
  const all = await ensure("speaking");
  if (!alive()) return;
  const t = all.find(x => x.id === v.id);
  if (!t) { location.hash = "#/learn/speaking"; return; }
  remember("speaking", t.title, `#/speak/${t.id}`, t.en);
  let level = S.pref.level, showModels = false, minutes = 5;
  let rec = null, chunks = [], audioUrl = null, timer = null, left = 0, stream = null;
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
        <section class="panel prose"><p>${esc(t.task)}</p></section>
        <section class="g-sec"><h2>Talk about…</h2><div class="panel flush reader">${t.questions.map(q => `<div class="gloss">${sentHTML(q, `#/speak/${t.id}`, t.title)}<span class="muted">${esc(q.en)}</span></div>`).join("")}</div></section>
        <section class="g-sec">
          ${showModels ? `<h2>Example talks</h2>${readerTools(showEn)}${modelsHTML(t, level, showEn, `#/speak/${t.id}`)}`
            : `<div class="panel note-card"><p>Try it yourself first. Then listen to how someone at each level talks about it.</p><button class="btn primary" data-show-models>Show example talks</button></div>`}
        </section>
      </div>
      <aside class="l-aside">
        <div class="l-side"><section class="panel speak-box"><h2>Practise out loud</h2>
          <div class="seg small" role="group" aria-label="How long"><button data-min="5" aria-pressed="${minutes === 5}">5 min</button><button data-min="10" aria-pressed="${minutes === 10}">10 min</button></div>
          <p class="timer" id="timer" aria-live="off">${mmss(left || minutes * 60)}</p>
          <button class="btn primary" data-start>${timer ? `${ICON.stop} Stop` : canRecord ? `${ICON.mic} Start and record` : `${ICON.play} Start timer`}</button>
          ${audioUrl ? `<p class="muted small">Listen back to yourself:</p><audio controls src="${audioUrl}"></audio>` : canRecord ? `<p class="muted small">Your recording stays on this device.</p>` : ""}
          ${done ? `<p class="ok-text">${ICON.check} Practised</p>` : `<button class="btn quiet small" data-sp-done>Mark as practised</button>`}
        </section></div>
        <div class="l-side2"><details class="group" ${wide ? "open" : ""}><summary><span class="group-title">Useful phrases</span><span class="group-meta">${t.phrases.length}</span></summary>
          <div class="panel flush reader">${t.phrases.map(p => `<div class="gloss">${sentHTML(p, `#/speak/${t.id}`, t.title)}<span class="muted">${esc(p.en)}</span></div>`).join("")}</div></details></div>
      </aside></div>`;
    app.querySelectorAll("[data-min]").forEach(b => b.onclick = () => { if (timer) return; minutes = +b.dataset.min; left = 0; draw(); });
    app.querySelector("[data-start]").onclick = start;
    app.querySelector("[data-sp-done]")?.addEventListener("click", () => { setEntry("sp:" + t.id, { done: 1 }); draw(); });
    app.querySelector("[data-show-models]")?.addEventListener("click", () => { showModels = true; draw(); app.querySelector(".reader-tools")?.scrollIntoView({ block: "start", behavior: "smooth" }); });
    app.querySelectorAll("[data-model]").forEach(b => b.onclick = () => { level = b.dataset.model; draw(); });
    if (showModels) wireReader(app, plainLines(t.models[level].body), draw);
  };
  const tick = () => {
    left--; const el = document.getElementById("timer"); if (el) el.textContent = mmss(Math.max(0, left));
    if (left <= 0) { stopAll(); showToast("Time's up. Bravo!"); setEntry("sp:" + t.id, { done: 1 }); }
  };
  async function start() {
    if (timer) { stopAll(); draw(); return; }
    left = minutes * 60;
    if (canRecord) {
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
        showToast("Microphone not available. The timer will still run.");
      }
    }
    timer = setInterval(tick, 1000);
    draw();
  }
  draw();
}
