import { S, esc, ICON, LEVELS, setEntry, debounce, remember, TOPICS, on } from "../core.js";
import { ensure } from "../data.js";
import { blocksHTML, plainLines, sentHTML, starHTML } from "./texts.js";
import { readerTools, wireReader } from "./reading.js";
import { voiceForName } from "../voice.js";
export const MODEL_VOICE = { A1: "f", A2: "m", B1: "f", B2: "m" };
export const modelVoice = (x, level) => x.models[level].speaker ? voiceForName(x.models[level].speaker) : MODEL_VOICE[level];

const TARGET = { A1: [60, 90], A2: [110, 160], B1: [180, 250], B2: [260, 350] };
let flushDraft = null;
on("leave", () => { if (flushDraft) { flushDraft(); flushDraft = null; } });
const countWords = s => (s.trim().match(/\S+/g) || []).length;

// Shared by writing and speaking: level tabs + model text.
export function modelsHTML(x, level, showEn, src) {
  const m = x.models[level];
  return `<div class="seg small" role="group" aria-label="Example level">${LEVELS.map(l => `<button data-model="${l}" aria-pressed="${l === level}">${l}</button>`).join("")}</div>
    ${m.speaker ? `<p class="muted small">${esc(m.speaker)}</p>` : ""}
    <article class="reader">${blocksHTML(m.body, src, x.title, showEn, () => modelVoice(x, level))}</article>`;
}

// Common slips worth a second look. These are hints, not corrections: the learner decides.
const it = t => `<span class="it">${esc(t)}</span>`;
const SLIPS = [
  [/\bho (andat|venut|stat|partit|arrivat|uscit|tornat|entrat|rimast|cadut|nat|mort)\w*/i, m => `${it(m[0])}: verbs of moving and changing take essere. ${it("Sono andato/a")}, not ${it("ho andato")}.`],
  [/\b(perche|piu|citta|puo|gia|cosi|pero|universita|caffe|lunedi|martedi|mercoledi|giovedi|venerdi)\b/i, m => `${it(m[0])} needs an accent on the last letter.`],
  [/\be (molto|bello|bella|brutto|bravo|vero|facile|difficile|caro|cara|veloce|lontano|vicino|importante|possibile)\b/i, m => `${it(m[0])}: do you mean ${it("è")} (is) rather than ${it("e")} (and)?`],
  [/\b(al|del|nel|sul|dal) ([aeiou]\w+)/i, m => `${it(m[0])}: before a vowel use the apostrophe form, like ${it(`${m[1]}l'${m[2]}`)}.`],
  [/\b(persone|ragazzi|ragazze|amici|amiche|colleghi|colleghe|italiani|italiane) (sono|erano|sembrano) (gentile|felice|simpatico|simpatica|aperto|aperta|cordiale|socievole)\b/i, m => `${it(m[0])}: the adjective agrees with a plural noun.`]
];
function selfCheck(text) { return SLIPS.map(([re, f]) => { const m = text.match(re); return m ? f(m) : null; }).filter(Boolean); }

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
          <p class="muted small" id="wc"></p>
          <div class="panel checks" id="checks" hidden></div></section>
        <section class="g-sec">
          ${showModels ? `<h2>Model answers</h2>${readerTools(showEn)}${modelsHTML(w, level, showEn, `#/write/${w.id}`)}`
            : `<div class="panel note-card"><p>Write your own version first. Then compare it with a model answer for your level.</p><button class="btn primary" data-show-models>Show model answers</button></div>`}
        </section>
      </div>
      <aside class="l-aside">
        <div class="l-side"><section class="panel prose"><p>${esc(w.task)}</p>
          <p class="eyebrow">Cover these points</p><ul class="notes">${w.guide.map(g => `<li>${esc(g)}</li>`).join("")}</ul></section></div>
        <div class="l-side2"><details class="group" ${wide ? "open" : ""}><summary><span class="group-title">Useful phrases</span><span class="group-meta">${w.phrases.length}</span></summary>
          <div class="panel flush reader">${w.phrases.map(p => `<div class="gloss"><div class="gloss-main">${sentHTML(p, `#/write/${w.id}`, w.title)}<span class="muted">${esc(p.en)}</span></div>${starHTML(p, `#/write/${w.id}`, w.title)}</div>`).join("")}</div></details></div>
      </aside></div>`;
    const ta = app.querySelector("#draft"), wc = app.querySelector("#wc");
    const checks = app.querySelector("#checks");
    const upd = () => {
      const n = countWords(ta.value); wc.textContent = `${n} words · aim for ${lo}–${hi} at ${level}${n ? (n < lo ? " · keep going" : n > hi ? " · a bit long" : " · good length") : ""}. Saved automatically.`;
      const found = selfCheck(ta.value);
      checks.hidden = n < 15;
      checks.innerHTML = `<p class="eyebrow">Check before you compare</p>${found.length ? `<ul class="notes">${found.map(f => `<li>${f}</li>`).join("")}</ul>` : `<p class="muted small">No common slips found. Still check: accents (è, perché, più), adjective endings, and essere or avere in the past.</p>`}`;
    };
    upd();
    ta.addEventListener("input", () => { upd(); pending = ta.value; save(); });
    ta.addEventListener("blur", () => save.flush());
    app.querySelectorAll("[data-lvl]").forEach(b => b.onclick = () => { level = b.dataset.lvl; draw(); });
    app.querySelector("[data-show-models]")?.addEventListener("click", () => { showModels = true; draw(); app.querySelector(".reader-tools")?.scrollIntoView({ block: "start", behavior: "smooth" }); });
    app.querySelectorAll("[data-model]").forEach(b => b.onclick = () => { level = b.dataset.model; draw(); });
    if (showModels) wireReader(app, plainLines(w.models[level].body, () => modelVoice(w, level)), draw);
  };
  draw();
}
