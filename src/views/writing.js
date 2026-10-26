import { S, esc, ICON, LEVELS, setEntry, debounce, remember, TOPICS, on } from "../core.js";
import { ensure } from "../data.js";
import { blocksHTML, plainLines, sentHTML } from "./texts.js";
import { readerTools, wireReader } from "./reading.js";

const TARGET = { A1: [60, 90], A2: [110, 160], B1: [180, 250], B2: [260, 350] };
let flushDraft = null;
on("leave", () => { if (flushDraft) { flushDraft(); flushDraft = null; } });
const countWords = s => (s.trim().match(/\S+/g) || []).length;

// Shared by writing and speaking: level tabs + model text.
export function modelsHTML(x, level, showEn, src) {
  const m = x.models[level];
  return `<div class="seg small" role="group" aria-label="Example level">${LEVELS.map(l => `<button data-model="${l}" aria-pressed="${l === level}">${l}</button>`).join("")}</div>
    ${m.speaker ? `<p class="muted small">${esc(m.speaker)}</p>` : ""}
    <article class="reader">${blocksHTML(m.body, src, x.title, showEn)}</article>`;
}

export async function viewWriting(app, v, alive) {
  const all = await ensure("writing");
  if (!alive()) return;
  const w = all.find(x => x.id === v.id);
  if (!w) { location.hash = "#/learn/writing"; return; }
  remember("writing", w.title, `#/write/${w.id}`, w.en);
  let level = S.pref.level, showModels = false;
  const id = "wr:" + w.id;
  let pending = null;
  const save = debounce(() => { if (pending != null && pending !== (S.st[id]?.text || "")) setEntry(id, { text: pending }); pending = null; }, 800);
  flushDraft = () => save.flush();
  const draw = () => {
    save.flush();
    const showEn = !!S.pref.showEn;
    const text = S.st[id]?.text || "";
    const [lo, hi] = TARGET[level];
    const wide = matchMedia("(min-width: 1024px)").matches;
    app.innerHTML = `<div class="layout">
      <div class="l-head"><a class="back-link" href="#/learn/writing">${ICON.back} Scrittura</a>
        <header class="page-head"><p class="eyebrow">${esc(w.format || "Writing")} · ${esc(TOPICS[w.topic] || "")}</p><h1 class="it">${esc(w.title)}</h1><p class="muted">${esc(w.en)}</p></header></div>
      <div class="l-main">
        <section><div class="panel-head"><h2>Your text</h2>
          <div class="seg small" role="group" aria-label="Your level">${LEVELS.map(l => `<button data-lvl="${l}" aria-pressed="${l === level}">${l}</button>`).join("")}</div></div>
          <textarea class="input write-area it" id="draft" rows="12" placeholder="Scrivi qui…" aria-label="Your text">${esc(text)}</textarea>
          <p class="muted small" id="wc"></p></section>
        <section class="g-sec">
          ${showModels ? `<h2>Model answers</h2>${readerTools(showEn)}${modelsHTML(w, level, showEn, `#/write/${w.id}`)}`
            : `<div class="panel note-card"><p>Write your own version first. Then compare it with a model answer for your level.</p><button class="btn primary" data-show-models>Show model answers</button></div>`}
        </section>
      </div>
      <aside class="l-aside">
        <div class="l-side"><section class="panel prose"><p>${esc(w.task)}</p>
          <p class="eyebrow">Cover these points</p><ul class="notes">${w.guide.map(g => `<li>${esc(g)}</li>`).join("")}</ul></section></div>
        <div class="l-side2"><details class="group" ${wide ? "open" : ""}><summary><span class="group-title">Useful phrases</span><span class="group-meta">${w.phrases.length}</span></summary>
          <div class="panel flush reader">${w.phrases.map(p => `<div class="gloss">${sentHTML(p, `#/write/${w.id}`, w.title)}<span class="muted">${esc(p.en)}</span></div>`).join("")}</div></details></div>
      </aside></div>`;
    const ta = app.querySelector("#draft"), wc = app.querySelector("#wc");
    const upd = () => { const n = countWords(ta.value); wc.textContent = `${n} words · aim for ${lo}–${hi} at ${level}${n ? (n < lo ? " · keep going" : n > hi ? " · a bit long" : " · good length") : ""}. Saved automatically.`; };
    upd();
    ta.addEventListener("input", () => { upd(); pending = ta.value; save(); });
    ta.addEventListener("blur", () => save.flush());
    app.querySelectorAll("[data-lvl]").forEach(b => b.onclick = () => { level = b.dataset.lvl; draw(); });
    app.querySelector("[data-show-models]")?.addEventListener("click", () => { showModels = true; draw(); app.querySelector(".reader-tools")?.scrollIntoView({ block: "start", behavior: "smooth" }); });
    app.querySelectorAll("[data-model]").forEach(b => b.onclick = () => { level = b.dataset.model; draw(); });
    if (showModels) wireReader(app, plainLines(w.models[level].body), draw);
  };
  draw();
}
