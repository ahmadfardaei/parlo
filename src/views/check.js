// One way to answer and get feedback, used by every quiz and exercise.
//  Typed: accent buttons, "Almost" retry for typos in words, other adjective endings accepted.
//  Choice: tap one option; the right one turns green.
import { esc, ICON, judge } from "../core.js";

const ACCENTS = ["à", "è", "é", "ì", "ò", "ù"];

// q: { k: "type" for a typed answer, otherwise options in q.o; it: Italian options }
export function answerHTML(q) {
  if (q.k !== "type") return `<div class="opts">${q.o.map((o, j) => `<button class="opt ${q.it ? "it" : ""}" data-o="${j}">${esc(o)}</button>`).join("")}</div>`;
  return `<form class="answer-form" autocomplete="off"><input class="input it answer" id="ans" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Your answer" placeholder="Scrivi in italiano"><button class="btn primary" type="submit">Check</button></form>
    <div class="accents" aria-label="Accented letters">${ACCENTS.map(a => `<button type="button" class="chip" data-acc="${a}">${a}</button>`).join("")}</div>`;
}

// q.a: the answer (mc) or accepted answers (type); q.alt: other accepted forms; q.typo: allow one retry for a typo.
// done(ok, note) is called once.
export function wireAnswer(root, q, done) {
  const fb = root.querySelector(".fb");
  let over = false;
  if (q.k !== "type") {
    root.querySelectorAll("[data-o]").forEach(b => b.onclick = () => {
      if (over) return; over = true;
      const ok = q.o[+b.dataset.o] === q.a;
      root.querySelectorAll("[data-o]").forEach(x => { x.disabled = true; if (q.o[+x.dataset.o] === q.a) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
      done(ok, "");
    });
    return;
  }
  const inp = root.querySelector("#ans"); inp.focus({ preventScroll: true });
  let retried = false;
  root.querySelector(".answer-form").onsubmit = e => {
    e.preventDefault(); if (over) return;
    const clean = s => q.loose ? s.replace(/[!?.…,]/g, "") : s;
    let r = judge(clean(inp.value), q.a.map(clean), !!q.typo);
    if (r === "empty") return inp.focus();
    if (r === "no" && q.alt?.length && judge(inp.value, q.alt) === "ok") r = "alt";
    if (r === "close" && !retried) { retried = true; fb.innerHTML = `<p class="warn-text">Almost: check the spelling and try again.</p>`; inp.focus(); return; }
    over = true;
    const ok = ["ok", "accent", "alt"].includes(r);
    inp.disabled = true; inp.classList.add(ok ? "right" : "wrong");
    root.querySelectorAll(".answer-form button, [data-acc]").forEach(b => b.disabled = true);
    done(ok, r === "accent" ? "Watch the accent." : r === "alt" ? `Also right. The dictionary form is ${q.a[0]}.` : "");
  };
  root.querySelectorAll("[data-acc]").forEach(b => b.onclick = () => {
    const a = inp.selectionStart ?? inp.value.length, z = inp.selectionEnd ?? a;
    inp.value = inp.value.slice(0, a) + b.dataset.acc + inp.value.slice(z); inp.focus(); inp.setSelectionRange(a + 1, a + 1);
  });
}

// The same feedback everywhere: result, the answer when needed, why, and Next.
export function feedbackHTML({ ok, note, answer, why, last }) {
  return `<p class="${ok ? "ok-text" : "bad-text"}">${ok ? `${ICON.check} Giusto!` : "Not quite."}${note ? ` <span class="warn-text">${esc(note)}</span>` : ""}</p>
    ${!ok || note ? `<p>Answer: <span class="it strong">${esc(answer)}</span></p>` : ""}
    ${why ? `<p class="muted small">${why}</p>` : ""}
    <button class="btn primary" data-next>${last ? "See score" : "Next"}</button>`;
}
