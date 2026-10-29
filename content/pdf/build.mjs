// Printable PDFs of the course: node content/pdf/build.mjs  →  ~/Desktop/parlo-media/pdf/…
// Brand layout: A4, Manrope for headings, Inter for text, Literata for Italian; forest, paper and coral.
// Each book: a cover with a short explanation, a table of contents with page numbers, then one item per section.
import fs from "fs";
import os from "os";
import { execSync } from "child_process";
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

const LOGO = fs.readFileSync(new URL("../../public/brand/logo-line.svg", import.meta.url), "utf8").replace(/role="img"/, 'role="img" class="logo"');
const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Manrope:wght@700;800&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&display=block");
@page { size: A4; margin: 18mm 16mm 20mm; }
* { box-sizing: border-box; }
body { font: 10pt/1.55 "Inter", sans-serif; color: #1c2420; margin: 0; }
.it { font-family: "Literata", serif; }
h1 { font-family: "Manrope", sans-serif; font-weight: 800; font-size: 24pt; line-height: 1.15; color: #294B3D; margin: 0 0 2mm; letter-spacing: -0.01em; }
h1.it { font-family: "Literata", serif; font-weight: 600; }
h2 { font-family: "Manrope", sans-serif; font-weight: 800; font-size: 12.5pt; color: #294B3D; margin: 8mm 0 3mm; padding-bottom: 1.5mm; border-bottom: 0.6pt solid #DDE8D9; break-after: avoid; }
h3 { font-family: "Manrope", sans-serif; font-weight: 700; font-size: 10.5pt; color: #294B3D; margin: 5mm 0 2mm; break-after: avoid; }
.eyebrow { font-size: 7.5pt; letter-spacing: .1em; text-transform: uppercase; color: #C24F36; font-weight: 700; margin: 0 0 1mm; }
.lede { color: #56625c; margin: 0 0 6mm; font-size: 11pt; }
.muted { color: #56625c; }
p { margin: 0 0 2mm; }
b { font-weight: 600; }
.word { break-inside: avoid; padding: 2mm 0; border-bottom: 0.3pt solid #e4e9e3; display: grid; grid-template-columns: 52mm 1fr; gap: 0 5mm; }
.word .term { font-family: "Literata", serif; font-size: 11.5pt; }
.word .term small { color: #56625c; font-family: "Inter"; font-size: 7.5pt; display: block; }
.word .ex { font-family: "Literata", serif; font-style: italic; }
.word .exen { color: #56625c; font-size: 9pt; }
.note { font-size: 9pt; color: #33423b; border-left: 1.5pt solid #D85C41; padding-left: 2.5mm; margin-top: 1mm; }
.verb { break-inside: avoid; margin: 0 0 6mm; }
.verb h3 { font-family: "Literata", serif; font-size: 13pt; font-weight: 600; margin: 0 0 1mm; }
table.conj { width: 100%; border-collapse: collapse; font-size: 8.4pt; }
table.conj th { text-align: left; font-weight: 600; color: #294B3D; padding: 1mm 1.5mm; border-bottom: 0.5pt solid #DDE8D9; background: #F4F0E7; }
table.conj td { padding: 0.8mm 1.5mm; border-bottom: 0.2pt solid #eef1ec; font-family: "Literata", serif; }
table.conj td:first-child { font-family: "Inter"; color: #56625c; }
table.grid { width: 100%; border-collapse: collapse; margin: 2mm 0 4mm; break-inside: avoid; }
table.grid td { padding: 1.3mm 2mm; border-bottom: 0.3pt solid #e4e9e3; vertical-align: top; }
table.grid td.it { font-size: 10.5pt; }
table.grid td.en { color: #3c4a43; }
table.grid td:first-child { font-weight: 600; }
table.grid tr.head td { font-family: "Inter"; font-size: 8pt; font-weight: 700; color: #56625c; text-transform: uppercase; letter-spacing: .05em; }
table.persons { width: auto; min-width: 60mm; }
.idea { background: #F4F0E7; border-left: 2pt solid #D85C41; padding: 3mm 4mm; margin: 0 0 4mm; break-inside: avoid; }
.idea .sum { font-family: "Manrope"; font-weight: 700; color: #294B3D; }
.use { break-inside: avoid; margin-bottom: 3.5mm; }
.mistake { break-inside: avoid; margin-bottom: 3mm; }
.bad { color: #b3261e; font-weight: 700; } .ok { color: #2e7d4f; font-weight: 700; }
.para { margin-bottom: 3mm; font-family: "Literata", serif; font-size: 11.5pt; line-height: 1.65; }
.para .who { font-family: "Inter"; font-weight: 700; font-size: 8.5pt; color: #294B3D; display: block; }
.en .para { font-family: "Inter"; font-size: 10pt; color: #33423b; }
.qs li, .key li { margin-bottom: 2mm; break-inside: avoid; }
.qs ol { padding-left: 5mm; }
.opts { list-style: lower-alpha; padding-left: 6mm; margin: 1mm 0; }
.break { break-before: page; }
/* Cover and contents */
.cover { height: 256mm; margin: 0; padding: 22mm 18mm 16mm; background: #F4F0E7; border-radius: 5mm; display: flex; flex-direction: column; }
.cover .logo { width: 82mm; height: auto; }
.cover .mid { margin-top: auto; }
.cover h1 { font-size: 44pt; margin-bottom: 4mm; }
.cover .level { display: inline-block; font-family: "Manrope"; font-weight: 800; font-size: 11pt; color: #fff; background: #294B3D; border-radius: 99px; padding: 1.2mm 4mm; margin-bottom: 6mm; }
.cover .about { font-size: 11.5pt; line-height: 1.6; max-width: 135mm; color: #33423b; }
.cover .about p { margin: 0 0 2.5mm; }
.cover .foot { margin-top: auto; font-size: 9pt; color: #56625c; border-top: 0.6pt solid #DDE8D9; padding-top: 4mm; }
.toc h2 { margin-top: 0; }
.toc ol { list-style: none; padding: 0; margin: 0; }
.toc li { break-inside: avoid; }
.toc a { display: flex; align-items: baseline; gap: 2mm; padding: 1.6mm 0; border-bottom: 0.3pt solid #e4e9e3; color: inherit; text-decoration: none; }
.toc .n { font-family: "Manrope"; font-weight: 800; color: #C24F36; width: 9mm; flex: none; }
.toc .t { font-family: "Literata", serif; font-size: 11pt; }
.toc .e { color: #56625c; font-size: 9pt; flex: 1; }
.toc .p { font-family: "Manrope"; font-weight: 700; color: #294B3D; }
`;
const doc = (title, body) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body>${body}</body></html>`;

/* ---------- Templates ---------- */
function unitHTML(u) {
  const cats = Object.keys(u.cats);
  const words = cats.map(c => { const list = u.words.filter(w => w.c === c); return list.length ? `<h2>${esc(u.cats[c])}</h2>${list.map(w => `<div class="word">
      <div class="term">${esc(full(w))}<small>${w.pos === "noun" ? (w.g === "m" ? "masculine" : "feminine") + (w.pl ? " · plural " + esc(w.pl) : "") : esc(w.pos)}</small></div>
      <div><b>${esc(w.en)}</b><p class="ex">${esc(w.ex)}</p><p class="exen">${esc(w.exEn)}</p>${w.note ? `<p class="note">${rich(w.note)}</p>` : ""}</div></div>`).join("")}` : ""; }).join("");
  const verbs = u.verbs.map(v => `<div class="verb"><h3>${esc(v.inf)} <span class="muted" style="font:400 9pt Inter">· ${esc(v.en)} · ${esc(v.kind)} · past with ${esc(v.aux)}</span></h3>
      <table class="conj"><tr><th></th>${TENSES.map(([, t]) => `<th>${t}</th>`).join("")}</tr>
      ${PRON.map((p, i) => `<tr><td>${p}</td>${TENSES.map(([k]) => `<td>${esc(v.t[k][i])}</td>`).join("")}</tr>`).join("")}</table>
      ${v.ex.map(([a, b]) => `<p style="margin-top:1.5mm"><span class="it" style="font-style:italic">${esc(a)}</span> <span class="muted">· ${esc(b)}</span></p>`).join("")}
      <p class="note">${rich(v.note)}</p></div>`).join("");
  const phrases = [...new Set(u.phrases.map(p => p.fn))].map(fn => `<h3>${esc(fn)}</h3>${u.phrases.filter(p => p.fn === fn).map(p => `<div class="word">
      <div class="term">${esc(p.it)}<small>${esc(p.reg)}</small></div><div><b>${esc(p.en)}</b> <span class="muted">· word for word: “${esc(p.lit)}”</span><p class="ex">${esc(p.ex)}</p><p class="exen">${esc(p.exEn)}</p></div></div>`).join("")}`).join("");
  return `<p class="eyebrow" id="i${u.n}">Unità ${u.n} · ${u.level}</p><h1 class="it">${esc(u.title)}</h1><p class="lede">${esc(u.en)}. ${esc(u.intro || "")}</p>
    ${words}<h2>Verbi</h2>${verbs}<h2>Frasi</h2>${phrases}`;
}
function lessonHTML(g, withKey = true) {
  const table = t => {
    if (!t.rows || t.rows.every(r => typeof r === "string")) {
      const rows = t.rows ? t.rows.map((r, i) => [(t.che ? "che " : "") + PRON[i], esc(r)]) : t.end.map((e, i) => [(t.che ? "che " : "") + PRON[i], `${esc(t.stem)}<b>${esc(e)}</b>`]);
      return `<h3>${esc(t.h)}</h3><table class="grid persons">${rows.map(r => `<tr><td class="en">${r[0]}</td><td class="it">${r[1]}</td></tr>`).join("")}</table>`;
    }
    const cols = t.cols || ["it", "en", "it"];
    return `<h3>${esc(t.h)}</h3><table class="grid">${t.rows.map(r => `<tr>${r.map((c, j) => `<td class="${cols[j] === "it" ? "it" : "en"}">${rich(c)}</td>`).join("")}</tr>`).join("")}</table>`;
  };
  const ex = g.ex.map((e, i) => `<li><span class="it">${esc(e.q).replace("___", "________")}</span>${e.h || e.v ? ` <span class="muted">(${esc(e.h || e.v + (e.p ? " · " + e.p : ""))})</span>` : ""}${e.k === "mc" ? `<ol class="opts">${e.o.map(o => `<li class="it">${esc(o)}</li>`).join("")}</ol>` : ""}</li>`).join("");
  const key = g.ex.map(e => `<li><span class="it"><b>${esc(e.k === "mc" ? e.a : e.a[0])}</b></span> <span class="muted">· ${rich(e.why)}</span></li>`).join("");
  return `<p class="eyebrow" id="i${esc(g.id)}">Grammatica · ${g.level}</p><h1 class="it">${esc(g.title)}</h1><p class="lede">${esc(g.en)}</p>
    <div class="idea"><p class="sum">${esc(g.summary)}</p><p>${rich(g.meaning)}</p></div>
    <h2>When to use it</h2>${g.uses.map(u => `<div class="use"><b>${esc(u.h)}</b><p>${rich(u.t)}</p><p><span class="it" style="font-style:italic">${esc(u.ex[0])}</span> <span class="muted">· ${esc(u.ex[1])}</span></p></div>`).join("")}
    <h2>How it works</h2>${g.form.intro ? `<p>${rich(g.form.intro)}</p>` : ""}${(g.form.tables || []).map(table).join("")}
    ${g.form.compare ? `<table class="grid"><tr class="head">${g.form.compare[0].map(c => `<td>${esc(c)}</td>`).join("")}</tr>${g.form.compare.slice(1).map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join("")}</table>` : ""}
    ${g.form.notes ? `<ul>${g.form.notes.map(n => `<li>${rich(n)}</li>`).join("")}</ul>` : ""}
    ${g.irregular ? `<h2>${esc(g.irregularTitle || "Irregular forms")}</h2><table class="grid">${g.irregular.map(([a, b]) => `<tr><td class="it">${rich(a)}</td><td>${rich(b)}</td></tr>`).join("")}</table>` : ""}
    <h2>Common mistakes</h2>${g.mistakes.map(m => `<div class="mistake"><span class="bad">✗</span> <s class="it">${esc(m.wrong)}</s><br><span class="ok">✓</span> <b class="it">${esc(m.right)}</b><br><span class="muted">${rich(m.why)}</span></div>`).join("")}
    <h2>Exercises</h2><ol class="qs">${ex}</ol>
    ${withKey ? `<h2>Answers</h2><ol class="key">${key}</ol>` : ""}`;
}
function readingHTML(r) {
  const blocks = (lang) => r.body.map(b => `<div class="para">${b.who ? `<span class="who">${esc(b.who)}</span>` : ""}${b.s.map(s => esc(s[lang])).join(" ")}</div>`).join("");
  return `<p class="eyebrow" id="i${esc(r.id)}">Lettura · ${r.level} · ${esc(r.genre)}</p><h1 class="it">${esc(r.title)}</h1><p class="lede">${esc(r.blurb)}</p>
    ${blocks("it")}
    <h2>Glossary</h2><table class="grid">${r.glossary.map(g => `<tr><td class="it">${esc(g.it)}</td><td class="en">${esc(g.en)}</td></tr>`).join("")}</table>
    <h2>Domande</h2><ol class="qs">${r.questions.map(q => `<li class="it">${esc(q.q)}<ol class="opts">${q.o.map(o => `<li>${esc(o)}</li>`).join("")}</ol></li>`).join("")}</ol>
    <h2 class="break">English translation</h2><div class="en">${blocks("en")}</div>
    <h2>Answers</h2><ol class="key">${r.questions.map(q => `<li class="it">${esc(q.a)}</li>`).join("")}</ol>`;
}
// Cover: the logo, the book title, and a very short explanation (ASD-STE100 English).
const cover = (title, L, about) => `<div class="cover">${LOGO}<div class="mid"><span class="level">${L}</span><h1>${esc(title)}</h1>
  <div class="about">${about.map(p => `<p>${p}</p>`).join("")}</div></div>
  <p class="foot">Understand more. Say what you mean. · iunderstandbut.com</p></div>`;
// Contents: one line per item, with a link and its page number.
const toc = (items, pages) => `<div class="break toc"><h2>Contents</h2><ol>${items.map((x, i) => `<li><a href="#i${esc(x.id)}"><span class="n">${i + 1}</span><span class="t">${esc(x.title)}</span><span class="e">${esc(x.en)}</span><span class="p">${pages ? pages[i] : "00"}</span></a></li>`).join("")}</ol></div>`;
const ABOUT = {
  vocab: n => [`This book has the ${n} vocabulary units of this level.`, "Each unit gives the words, the verbs and the phrases of one topic. Each word has an example sentence and its English translation.", "Read a unit, then say the examples out loud. Practise the same words in the app."],
  grammar: n => [`This book has the ${n} grammar lessons of this level.`, "Each lesson tells you what the grammar does, when to use it and how to make it. Then it shows the mistakes that learners often make.", "Each lesson ends with exercises. The answers are after the exercises."],
  reading: n => [`This book has the ${n} texts of this level.`, "Each text has a glossary and questions. The English translation and the answers come after the questions.", "Read the Italian first. Use the translation only to check."]
};

/* ---------- Render ---------- */
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const page = await browser.newPage();
const footer = `<div style="font:7.5px Helvetica,Arial,sans-serif;color:#56625c;width:100%;padding:0 16mm;display:flex;justify-content:space-between"><span><b style="color:#294B3D">i understand, but</b><b style="color:#D85C41">…</b></span><span class="pageNumber"></span></div>`;
const OPTS = { format: "A4", printBackground: true, displayHeaderFooter: true, headerTemplate: "<span></span>", footerTemplate: footer, margin: { top: "18mm", bottom: "20mm", left: "16mm", right: "16mm" } };
async function render(title, body, path) {
  await page.setContent(doc(title, body), { waitUntil: "networkidle" });
  return page.pdf({ ...OPTS, ...(path ? { path } : {}) });
}
// Page numbers: render once with a hidden marker at the start of each item, read the pages with PDFKit (macOS), render again.
const MARKERS = `${os.tmpdir()}/pdf-markers`;
if (!fs.existsSync(MARKERS)) execSync(`swiftc -O "${new URL("./tools/markers.swift", import.meta.url).pathname}" -o "${MARKERS}"`);
const mark = id => `<span style="position:absolute;z-index:-1;font:6pt Helvetica;color:#fff;white-space:nowrap">MRK${String(id).replace(/[^A-Za-z0-9-]/g, "")}END</span>`;
async function book(path, title, L, kind, items, html) {
  const head = cover(title, L, ABOUT[kind](items.length));
  const body = items.map(x => `<div class="break"></div>` + mark(x.id) + html(x.src)).join("");
  const tmp = `${os.tmpdir()}/pdf-pass1.pdf`;
  await render(title, head + toc(items) + body, tmp);
  const at = Object.fromEntries(execSync(`"${MARKERS}" "${tmp}"`).toString().trim().split("\n").map(l => l.split(" ")));
  const pages = items.map(x => at[String(x.id).replace(/[^A-Za-z0-9-]/g, "")] || "");
  if (pages.some(p => !p)) throw new Error(`${path}: page number missing`);
  await render(title, head + toc(items, pages) + body, path);
}
let n = 0;
const only = process.env.ONLY; // e.g. ONLY=grammar-A1
for (const L of LV) {
  const units = course.units.filter(u => u.level === L), gs = grammar.filter(g => g.level === L), rs = reading.filter(r => r.level === L);
  const jobs = [
    ["vocab", `Vocabolario ${L}`, units.map(u => ({ id: u.n, title: u.title, en: u.en, src: u })), unitHTML],
    ["grammar", `Grammatica ${L}`, gs.map(g => ({ id: g.id, title: g.title, en: g.en, src: g })), lessonHTML],
    ["reading", `Lettura ${L}`, rs.map(r => ({ id: r.id, title: r.title, en: r.genre, src: r })), readingHTML]
  ];
  for (const [kind, title, items, html] of jobs) {
    if (only && only !== `${kind}-${L}`) continue;
    await book(`${OUT}/${kind}-${L}.pdf`, title, L, kind, items, html); n++;
  }
}
await browser.close();
console.log(`${n} PDFs written to ${OUT}`);
