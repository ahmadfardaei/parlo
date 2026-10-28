// Printable PDFs of the course: node content/pdf/build.mjs  →  ~/Desktop/parlo-media/pdf/…
// Plain, print-first layout: A4, Literata for Italian, Figtree for headings, page numbers in the footer.
import fs from "fs";
import os from "os";
import { chromium } from "playwright-core";

const D = f => JSON.parse(fs.readFileSync(new URL(`../../src/data/${f}.json`, import.meta.url)));
const course = D("course"), grammar = D("grammar"), reading = D("reading");
const OUT = `${os.homedir()}/Desktop/parlo-media/pdf`;
fs.mkdirSync(OUT, { recursive: true });
const LV = ["A1", "A2", "B1", "B2"];
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const rich = s => esc(s).replace(/&lt;(\/?)(b|i)&gt;/g, "<$1$2>");
const full = w => !w.art ? w.it : (w.art.endsWith("'") ? w.art + w.it : w.art + " " + w.it);
const PRON = ["io", "tu", "lui/lei", "noi", "voi", "loro"];
const TENSES = [["pres", "Presente"], ["pp", "Passato prossimo"], ["imp", "Imperfetto"], ["fut", "Futuro"], ["cond", "Condizionale"], ["cong", "Congiuntivo"]];

const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Figtree:wght@400;600;700&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&display=block");
@page { size: A4; margin: 18mm 16mm 20mm; }
* { box-sizing: border-box; }
body { font: 10.5pt/1.5 "Figtree", sans-serif; color: #17201c; margin: 0; }
.it { font-family: "Literata", serif; }
h1 { font-family: "Literata", serif; font-weight: 600; font-size: 24pt; margin: 0 0 2mm; }
h2 { font-size: 12.5pt; margin: 8mm 0 3mm; padding-bottom: 1.5mm; border-bottom: 0.4pt solid #cfd8d3; break-after: avoid; }
h3 { font-size: 10.5pt; margin: 5mm 0 2mm; break-after: avoid; }
.eyebrow { font-size: 8pt; letter-spacing: .08em; text-transform: uppercase; color: #5d6963; font-weight: 600; margin: 0; }
.lede { color: #5d6963; margin: 0 0 6mm; }
.muted { color: #5d6963; }
p { margin: 0 0 2mm; }
.word { break-inside: avoid; padding: 2mm 0; border-bottom: 0.3pt solid #e6ebe8; display: grid; grid-template-columns: 52mm 1fr; gap: 0 5mm; }
.word .term { font-family: "Literata", serif; font-size: 11.5pt; }
.word .term small { color: #5d6963; font-family: "Figtree"; font-size: 8pt; display: block; }
.word .ex { font-family: "Literata", serif; font-style: italic; }
.word .exen { color: #5d6963; font-size: 9pt; }
.note { font-size: 9pt; color: #3b4a43; border-left: 1.5pt solid #e0b520; padding-left: 2.5mm; margin-top: 1mm; }
.verb { break-inside: avoid; margin: 0 0 6mm; }
.verb h3 { font-family: "Literata", serif; font-size: 13pt; font-weight: 600; margin: 0 0 1mm; }
table.conj { width: 100%; border-collapse: collapse; font-size: 8.6pt; }
table.conj th { text-align: left; font-weight: 600; color: #1d6b52; padding: 1mm 1.5mm; border-bottom: 0.4pt solid #cfd8d3; }
table.conj td { padding: 0.8mm 1.5mm; border-bottom: 0.2pt solid #eef1ef; font-family: "Literata", serif; }
table.conj td:first-child { font-family: "Figtree"; color: #5d6963; }
table.grid { width: 100%; border-collapse: collapse; margin: 2mm 0 4mm; break-inside: avoid; }
table.grid td { padding: 1.2mm 2mm; border-bottom: 0.3pt solid #e6ebe8; vertical-align: top; }
table.grid td:last-child { font-family: "Literata", serif; }
.use { break-inside: avoid; margin-bottom: 3.5mm; }
.mistake { break-inside: avoid; margin-bottom: 3mm; }
.para { margin-bottom: 3mm; font-family: "Literata", serif; font-size: 11.5pt; line-height: 1.65; }
.para .who { font-family: "Figtree"; font-weight: 700; font-size: 8.5pt; color: #1d6b52; display: block; }
.en .para { font-family: "Figtree"; font-size: 10pt; color: #3b4a43; }
.qs li, .key li { margin-bottom: 2mm; break-inside: avoid; }
.qs ol { padding-left: 5mm; }
.opts { list-style: lower-alpha; padding-left: 6mm; margin: 1mm 0; }
.break { break-before: page; }
.cover { height: 240mm; display: flex; flex-direction: column; justify-content: center; }
.cover h1 { font-size: 40pt; }
`;
const doc = (title, body) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body>${body}</body></html>`;

/* ---------- Templates ---------- */
function unitHTML(u) {
  const cats = Object.keys(u.cats);
  const words = cats.map(c => { const list = u.words.filter(w => w.c === c); return list.length ? `<h2>${esc(u.cats[c])}</h2>${list.map(w => `<div class="word">
      <div class="term">${esc(full(w))}<small>${w.pos === "noun" ? (w.g === "m" ? "masculine" : "feminine") + (w.pl ? " · plural " + esc(w.pl) : "") : esc(w.pos)}</small></div>
      <div><b>${esc(w.en)}</b><p class="ex">${esc(w.ex)}</p><p class="exen">${esc(w.exEn)}</p>${w.note ? `<p class="note">${rich(w.note)}</p>` : ""}</div></div>`).join("")}` : ""; }).join("");
  const verbs = u.verbs.map(v => `<div class="verb"><h3>${esc(v.inf)} <span class="muted" style="font:400 9.5pt Figtree">· ${esc(v.en)} · ${esc(v.kind)} · past with ${esc(v.aux)}</span></h3>
      <table class="conj"><tr><th></th>${TENSES.map(([, t]) => `<th>${t}</th>`).join("")}</tr>
      ${PRON.map((p, i) => `<tr><td>${p}</td>${TENSES.map(([k]) => `<td>${esc(v.t[k][i])}</td>`).join("")}</tr>`).join("")}</table>
      ${v.ex.map(([a, b]) => `<p style="margin-top:1.5mm"><span class="it" style="font-style:italic">${esc(a)}</span> <span class="muted">· ${esc(b)}</span></p>`).join("")}
      <p class="note">${rich(v.note)}</p></div>`).join("");
  const phrases = [...new Set(u.phrases.map(p => p.fn))].map(fn => `<h3>${esc(fn)}</h3>${u.phrases.filter(p => p.fn === fn).map(p => `<div class="word">
      <div class="term">${esc(p.it)}<small>${esc(p.reg)}</small></div><div><b>${esc(p.en)}</b> <span class="muted">· literally “${esc(p.lit)}”</span><p class="ex">${esc(p.ex)}</p><p class="exen">${esc(p.exEn)}</p></div></div>`).join("")}`).join("");
  return `<p class="eyebrow">Parlo · Unità ${u.n} · ${u.level}</p><h1>${esc(u.title)}</h1><p class="lede">${esc(u.en)}. ${esc(u.intro || "")}</p>
    ${words}<h2 class="break">Verbi</h2>${verbs}<h2>Frasi</h2>${phrases}`;
}
function lessonHTML(g, withKey = true) {
  const table = t => {
    const rows = t.rows ? t.rows.map((r, i) => typeof r === "string" ? [PRON[i], esc(r)] : [rich(r[0]), rich(r[1])]) : t.end.map((e, i) => [(t.che ? "che " : "") + PRON[i], `${esc(t.stem)}<b>${esc(e)}</b>`]);
    return `<h3>${esc(t.h)}</h3><table class="grid">${rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</table>`;
  };
  const ex = g.ex.map((e, i) => `<li><span class="it">${esc(e.q).replace("___", "________")}</span>${e.h || e.v ? ` <span class="muted">(${esc(e.h || e.v + (e.p ? " · " + e.p : ""))})</span>` : ""}${e.k === "mc" ? `<ol class="opts">${e.o.map(o => `<li class="it">${esc(o)}</li>`).join("")}</ol>` : ""}</li>`).join("");
  const key = g.ex.map(e => `<li><span class="it"><b>${esc(e.k === "mc" ? e.a : e.a[0])}</b></span> <span class="muted">· ${rich(e.why)}</span></li>`).join("");
  return `<p class="eyebrow">Parlo · Grammatica · ${g.level}</p><h1>${esc(g.title)}</h1><p class="lede">${esc(g.en)}. ${esc(g.summary)}</p>
    <h2>The idea</h2><p>${rich(g.meaning)}</p>
    <h2>When to use it</h2>${g.uses.map(u => `<div class="use"><b>${esc(u.h)}</b><p>${rich(u.t)}</p><p><span class="it" style="font-style:italic">${esc(u.ex[0])}</span> <span class="muted">· ${esc(u.ex[1])}</span></p></div>`).join("")}
    <h2>How it works</h2><p>${rich(g.form.intro)}</p>${(g.form.tables || []).map(table).join("")}
    ${g.form.compare ? `<table class="grid">${g.form.compare.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join("")}</table>` : ""}
    ${g.form.notes ? `<ul>${g.form.notes.map(n => `<li>${rich(n)}</li>`).join("")}</ul>` : ""}
    ${g.irregular ? `<h2>${esc(g.irregularTitle || "Irregular forms")}</h2><table class="grid">${g.irregular.map(([a, b]) => `<tr><td>${rich(a)}</td><td>${rich(b)}</td></tr>`).join("")}</table>` : ""}
    <h2>Common mistakes</h2>${g.mistakes.map(m => `<div class="mistake">✗ <s class="it">${esc(m.wrong)}</s><br>✓ <b class="it">${esc(m.right)}</b><br><span class="muted">${rich(m.why)}</span></div>`).join("")}
    <h2>Exercises</h2><ol class="qs">${ex}</ol>
    ${withKey ? `<h2>Answers</h2><ol class="key">${key}</ol>` : ""}`;
}
function readingHTML(r) {
  const blocks = (lang) => r.body.map(b => `<div class="para">${b.who ? `<span class="who">${esc(b.who)}</span>` : ""}${b.s.map(s => esc(s[lang])).join(" ")}</div>`).join("");
  return `<p class="eyebrow">Parlo · Lettura · ${r.level} · ${esc(r.genre)} · ${r.minutes} min</p><h1>${esc(r.title)}</h1><p class="lede">${esc(r.blurb)}</p>
    ${blocks("it")}
    <h2>Glossary</h2><table class="grid">${r.glossary.map(g => `<tr><td class="it">${esc(g.it)}</td><td style="font-family:Figtree">${esc(g.en)}</td></tr>`).join("")}</table>
    <h2>Domande</h2><ol class="qs">${r.questions.map(q => `<li class="it">${esc(q.q)}<ol class="opts">${q.o.map(o => `<li>${esc(o)}</li>`).join("")}</ol></li>`).join("")}</ol>
    <h2 class="break">English translation</h2><div class="en">${blocks("en")}</div>
    <h2>Answers</h2><ol class="key">${r.questions.map(q => `<li class="it">${esc(q.a)}</li>`).join("")}</ol>`;
}
const cover = (title, sub) => `<div class="cover"><p class="eyebrow">Parlo Italiano</p><h1>${esc(title)}</h1><p class="lede">${esc(sub)}</p></div><div class="break"></div>`;

/* ---------- Render ---------- */
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const page = await browser.newPage();
const footer = `<div style="font:8px -apple-system,Helvetica,Arial,sans-serif;color:#8a958f;width:100%;padding:0 16mm;display:flex;justify-content:space-between"><span>Parlo Italiano</span><span class="pageNumber"></span></div>`;
async function pdf(path, title, body) {
  await page.setContent(doc(title, body), { waitUntil: "networkidle" });
  await page.pdf({ path, format: "A4", printBackground: true, displayHeaderFooter: true, headerTemplate: "<span></span>", footerTemplate: footer, margin: { top: "18mm", bottom: "20mm", left: "16mm", right: "16mm" } });
}
let n = 0;
if (process.env.SAMPLE) {
  await pdf(`${OUT}/sample-unit.pdf`, "sample", unitHTML(course.units[2]));
  await pdf(`${OUT}/sample-grammar.pdf`, "sample", lessonHTML(grammar.find(g => g.id === "pp")));
  await pdf(`${OUT}/sample-reading.pdf`, "sample", readingHTML(reading.find(r => r.id === "r-a1-07")));
  await browser.close(); process.exit(0);
}
// One PDF per section and level: vocab-A1, grammar-A1, reading-A1, …
const book = (items, html) => items.map((x, i) => (i ? `<div class="break"></div>` : "") + html(x)).join("");
for (const L of LV) {
  const units = course.units.filter(u => u.level === L), gs = grammar.filter(g => g.level === L), rs = reading.filter(r => r.level === L);
  await pdf(`${OUT}/vocab-${L}.pdf`, `Vocabolario ${L}`, cover(`Vocabolario ${L}`, `${units.length} units`) + book(units, unitHTML));
  await pdf(`${OUT}/grammar-${L}.pdf`, `Grammatica ${L}`, cover(`Grammatica ${L}`, `${gs.length} lessons with exercises and answers`) + book(gs, lessonHTML));
  await pdf(`${OUT}/reading-${L}.pdf`, `Lettura ${L}`, cover(`Lettura ${L}`, `${rs.length} texts with translations and answers`) + book(rs, readingHTML));
  n += 3;
}
await browser.close();
console.log(`${n} PDFs written to ${OUT}`);
