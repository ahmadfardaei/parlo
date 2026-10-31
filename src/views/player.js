// One audio player for listening and reading: play and pause, back one line, speed, and Repeat.
// While it plays, a tap on a sentence jumps there. While it is paused, the sentence card offers "Play from here".
import { ICON, speakAll, stopSpeaking, lsGet, lsSet } from "../core.js";
import { setPlayFrom } from "./texts.js";
import { clipUrl } from "../voice.js";

const RATES = [1, 0.75, 0.5];
const rateLabel = r => r + "×";

// idle: what the player says before it starts (e.g. "About 4 min").
export function playerHTML(idle) {
  return `<section class="panel player" aria-label="Audio player">
    <div class="player-row">
      <button class="play-btn" data-play aria-label="Play">${ICON.play}</button>
      <div class="player-main">
        <span class="small player-pos" data-pos aria-live="polite">${idle}</span>
        <input type="range" class="seek" data-seek min="0" max="1" step="1" value="0" aria-label="Position in the text">
      </div>
      <button class="icon-btn" data-back aria-label="Back one sentence" title="Back one sentence">${ICON.replay}</button>
    </div>
    <div class="player-opts">
      <div class="seg small" role="group" aria-label="Speed">${RATES.map(r => `<button data-rate="${r}" aria-pressed="false">${rateLabel(r)}</button>`).join("")}</div>
      <button class="btn quiet small" data-shadow aria-pressed="false" title="Stop after each sentence so you can say it">Say after me</button>
    </div>
  </section>`;
}

// lines: [{ t, v }] in the same order as the sentences in article.reader.
// opts: key (to keep the place), who(i) (speaker of line i, or ""), idle, onStart (first play).
export function wirePlayer(root, lines, opts = {}) {
  const el = root.querySelector(".player");
  const playBtn = el.querySelector("[data-play]"), pos = el.querySelector("[data-pos]"), seek = el.querySelector("[data-seek]");
  seek.max = Math.max(1, lines.length - 1);
  // The bar moves sentence by sentence: the audio is one clip per sentence.
  const setSeek = i => { seek.value = i; seek.style.setProperty("--p", `${i / Math.max(1, lines.length - 1) * 100}%`); seek.setAttribute("aria-valuetext", lines[i]?.t || ""); };
  let dragging = false;
  const sents = () => [...root.querySelectorAll("article.reader .sent")];
  let at = opts.key ? Math.min(lsGet(opts.key, 0) || 0, lines.length - 1) : 0;
  let started = at > 0, playing = false, shadow = false, stop = null, rate = RATES.includes(lsGet("parlo.rate", 1)) ? lsGet("parlo.rate", 1) : 1;

  const label = () => {
    if (playing) return opts.who?.(at) || "Playing";
    return started ? "Paused" : opts.idle || "";
  };
  const show = (scroll) => {
    playBtn.innerHTML = playing ? ICON.pause : ICON.play;
    playBtn.setAttribute("aria-label", playing ? "Pause" : started ? "Continue" : "Play");
    if (!dragging) setSeek(at);
    pos.textContent = label();
    const list = sents();
    list.forEach((s, i) => s.classList.toggle("speaking", started && i === at));
    // Keep the sentence that is spoken in view, but only scroll when it has left the screen.
    const cur = list[at];
    if (scroll && cur) { const r = cur.getBoundingClientRect(); if (r.top < 140 || r.bottom > innerHeight - 90) cur.scrollIntoView({ block: "center", behavior: "smooth" }); }
    if (opts.key) lsSet(opts.key, at);
  };
  const halt = () => { if (stop) { const s = stop; stop = null; s(); } };
  const start = async () => {
    // Offline, only clips played before are kept. Say so instead of looking as if it plays.
    if (!navigator.onLine && "caches" in window && lines[at] && !(await caches.match(clipUrl(lines[at].t, lines[at].v)))) {
      halt(); playing = false; show(); pos.textContent = "Audio needs a connection.";
      return;
    }
    opts.onStart?.();
    halt(); playing = started = true; const from = at;
    // Say after me: after each sentence, a pause as long as the sentence, for the learner to say it.
    const gap = shadow ? (i, ms) => { pos.textContent = "Your turn: say it"; return Math.round(ms * 1.1 + 700); } : null;
    stop = speakAll(lines.slice(from), i => { at = from + i; show(true); },
      () => { if (!stop) return; stop = null; playing = started = false; at = 0; show(); pos.textContent = "Finished. Play again?"; }, rate, gap);
    show(true);
  };
  const pause = () => { playing = false; halt(); stopSpeaking(); show(); };

  playBtn.onclick = () => playing ? pause() : start();
  // Drag the bar: show where you will land; on release, play from there (or just move there when paused).
  seek.addEventListener("pointerdown", () => { dragging = true; });
  seek.addEventListener("input", () => { dragging = true; const i = +seek.value; setSeek(i); const t = lines[i]?.t || ""; pos.textContent = t.length > 48 ? t.slice(0, 46) + "…" : t; });
  seek.addEventListener("change", () => { dragging = false; at = +seek.value; started = true; playing ? start() : show(true); });
  el.querySelector("[data-back]").onclick = () => { at = Math.max(0, at - 1); playing ? start() : show(true); };
  const rateBtns = el.querySelectorAll("[data-rate]");
  const showRate = () => rateBtns.forEach(b => b.setAttribute("aria-pressed", +b.dataset.rate === rate));
  rateBtns.forEach(b => b.onclick = () => { rate = +b.dataset.rate; lsSet("parlo.rate", rate); showRate(); if (playing) start(); });
  showRate();
  const shBtn = el.querySelector("[data-shadow]");
  shBtn.onclick = () => { shadow = !shadow; shBtn.setAttribute("aria-pressed", shadow); if (playing) start(); };

  // A sentence in the text: jump there while playing; otherwise its card shows "Play from here".
  setPlayFrom({
    playing: () => playing,
    index: s => sents().indexOf(s),
    from: i => { if (i < 0 || i >= lines.length) return; at = i; start(); }
  });
  if (at) show();
  return { pause };
}
