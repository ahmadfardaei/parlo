// Interactive text: every sentence can be tapped (translation + save), and any selection can be saved.
import { $, $$, esc, ICON, canSpeak, openSheet, closeSheet, say, inDeck, sentenceId, saveSentence, setEntry, on, S, savePref } from "../core.js";

const SENT = new Map();
let seq = 0;
export function resetSentences() { SENT.clear(); }

export function sentHTML(s, src, title) {
  const k = "s" + (++seq);
  SENT.set(k, { it: s.it, en: s.en, src, title });
  return `<span class="sent${inDeck(sentenceId(s.it)) ? " saved" : ""}" data-sent="${k}" role="button" tabindex="0">${esc(s.it)}</span>`;
}
// body: [{ who?, s: [{it,en}] }]. Shows English under each paragraph when showEn is true.
export function blocksHTML(body, src, title, showEn) {
  return body.map(b => `<div class="para${b.who ? " turn" : ""}">${b.who ? `<span class="who">${esc(b.who)}</span>` : ""}
    <p class="it-text">${b.s.map(s => sentHTML(s, src, title)).join(" ")}</p>
    <p class="en-text">${b.s.map(s => esc(s.en)).join(" ")}</p></div>`).join("");
}
export const plainLines = body => body.flatMap(b => b.s.map(s => s.it));

function sentenceSheet(k) {
  const x = SENT.get(k); if (!x) return;
  const id = sentenceId(x.it), saved = inDeck(id);
  openSheet(`<div class="sheet-body">
      <p class="s-it">${esc(x.it)}</p>
      <p class="s-en">${esc(x.en)}</p>
      <div class="btn-row">
        ${canSpeak ? `<button class="btn" data-say-text="${esc(x.it)}">${ICON.speak} Listen</button>` : ""}
        <button class="btn ${saved ? "" : "primary"}" data-sent-save="${k}">${saved ? `${ICON.check} In your deck` : `${ICON.star} Save to deck`}</button>
      </div></div>`);
}
function markSaved() { $$(".sent").forEach(el => { const x = SENT.get(el.dataset.sent); if (x) el.classList.toggle("saved", inDeck(sentenceId(x.it))); }); }
on("change", markSaved);

document.addEventListener("click", e => {
  const b = e.target.closest("[data-sent-save]");
  if (b) {
    const x = SENT.get(b.dataset.sentSave); if (!x) return;
    const id = sentenceId(x.it);
    if (inDeck(id)) setEntry(id, { s: 0 }); else saveSentence({ it: x.it, en: x.en, src: x.src, srcTitle: x.title });
    closeSheet(); return;
  }
  const s = e.target.closest(".sent");
  if (s) {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 1) return; // the learner is selecting text, not tapping
    sentenceSheet(s.dataset.sent);
  }
});
document.addEventListener("keydown", e => {
  const s = e.target.closest && e.target.closest(".sent");
  if (s && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); sentenceSheet(s.dataset.sent); }
});

/* ---------- Saving a selection ---------- */
let selBar = null, selTimer = null;
function hideSelBar() { if (selBar) { selBar.remove(); selBar = null; } }
function selectionInfo() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return null;
  const text = sel.toString().replace(/\s+/g, " ").trim();
  if (text.length < 2 || text.length > 400) return null;
  const range = sel.getRangeAt(0);
  const root = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
  if (!root.closest(".reader")) return null;
  const sents = $$(".reader .sent").filter(el => range.intersectsNode(el)).map(el => SENT.get(el.dataset.sent)).filter(Boolean);
  if (!sents.length) return null;
  return { text, sents };
}
function updateSelBar() {
  const info = selectionInfo();
  if (!info) return hideSelBar();
  if (!selBar) {
    selBar = document.createElement("div");
    selBar.className = "selbar";
    selBar.addEventListener("pointerdown", e => e.preventDefault()); // don't let the tap clear the selection
    selBar.addEventListener("mousedown", e => e.preventDefault());
    document.body.appendChild(selBar);
  }
  selBar.innerHTML = `<span class="selbar-text">“${esc(info.text.length > 60 ? info.text.slice(0, 57) + "…" : info.text)}”</span><button class="btn primary" data-save-selection>${ICON.star} Save to deck</button>`;
  selBar._info = info;
}
document.addEventListener("selectionchange", () => { clearTimeout(selTimer); selTimer = setTimeout(updateSelBar, 250); });
document.addEventListener("click", e => {
  if (!e.target.closest("[data-save-selection]") || !selBar) return;
  const { text, sents } = selBar._info;
  const ctx = sents.map(s => s.it).join(" "), en = sents.map(s => s.en).join(" ");
  saveSentence({ it: text, en, ctx, src: sents[0].src, srcTitle: sents[0].title });
  window.getSelection().removeAllRanges(); hideSelBar();
});
on("leave", () => { hideSelBar(); resetSentences(); });

/* ---------- Reader text size ---------- */
export function sizeControlHTML() {
  return `<div class="seg small" role="group" aria-label="Text size"><button data-size="-1" aria-label="Smaller text">A−</button><button data-size="1" aria-label="Larger text">A+</button></div>`;
}
export function applySize() { document.documentElement.style.setProperty("--reader-size", (S.pref.size || 19) + "px"); }
applySize();
document.addEventListener("click", e => {
  const b = e.target.closest("[data-size]"); if (!b) return;
  savePref({ size: Math.max(15, Math.min(26, (S.pref.size || 19) + (+b.dataset.size) * 1.5)) }); applySize();
});
