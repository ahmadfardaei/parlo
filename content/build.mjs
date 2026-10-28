// Merge the content files into the app's data chunks: node content/build.mjs
import fs from "fs";
const C = f => JSON.parse(fs.readFileSync(new URL(f, import.meta.url), "utf8"));
const has = f => fs.existsSync(new URL(f, import.meta.url));
const out = (name, data) => { fs.writeFileSync(new URL(`../src/data/${name}.json`, import.meta.url), JSON.stringify(data)); console.log(`${name}: ${data.length}`); };
const LV = ["A1", "A2", "B1", "B2"];
const TOPIC_ORDER = ["nouns", "adjectives", "prepositions", "pronouns", "verbtypes", "tenses", "sentences", "functions"];

const { GRAMMAR } = await import(new URL("./grammar-existing.js", import.meta.url));
let grammar = GRAMMAR.map(g => ({ ...g, topic: "tenses" }));
for (let i = 1; i <= 12; i++) if (has(`grammar-${i}.json`)) grammar.push(...C(`grammar-${i}.json`));
const ids = new Set(); grammar = grammar.filter(g => !ids.has(g.id) && ids.add(g.id));
grammar.sort((a, b) => TOPIC_ORDER.indexOf(a.topic) - TOPIC_ORDER.indexOf(b.topic) || LV.indexOf(a.level) - LV.indexOf(b.level));
out("grammar", grammar);

const reading = ["a1", "a2", "b1a", "b1b", "b2a", "b2b"].filter(f => has(`reading-${f}.json`)).flatMap(f => C(`reading-${f}.json`)).sort((a, b) => a.id.localeCompare(b.id));
out("reading", reading);
const listening = fs.readdirSync(new URL(".", import.meta.url)).filter(f => /^listening-[ab][12][ab]\.json$/.test(f)).flatMap(f => C(f)).sort((a, b) => a.id.localeCompare(b.id));
out("listening", listening);
const writing = [1, 2].filter(i => has(`writing-${i}.json`)).flatMap(i => C(`writing-${i}.json`)).sort((a, b) => a.id.localeCompare(b.id));
out("writing", writing);
const speaking = [1, 2].filter(i => has(`speaking-${i}.json`)).flatMap(i => C(`speaking-${i}.json`)).sort((a, b) => a.id.localeCompare(b.id));
out("speaking", speaking);

// A tiny index (ids and levels) so the home screen can show progress without loading the content itself.
fs.writeFileSync(new URL("../src/data/meta.json", import.meta.url), JSON.stringify({
  grammar: grammar.map(g => [g.id, g.level]), reading: reading.map(r => [r.id, r.level]), listening: listening.map(l => [l.id, l.level]),
  writing: writing.map(w => w.id), speaking: speaking.map(s => s.id)
}));

/* ---------- Roadmap: one guided path per level ---------- */
// Time ranges (minutes) per step. Vocabulary includes the reviews needed to really learn each item.
const course = JSON.parse(fs.readFileSync(new URL("../src/data/course.json", import.meta.url)));
const WRITE = { A1: ["w-01", "w-02", "w-03"], A2: ["w-04", "w-05", "w-07"], B1: ["w-06", "w-08", "w-09"], B2: ["w-10", "w-08", "w-05"] };
const SPEAK = { A1: ["s-01", "s-02", "s-03"], A2: ["s-04", "s-05", "s-07"], B1: ["s-06", "s-08", "s-09"], B2: ["s-10", "s-08", "s-06"] };
const WRITE_MIN = { A1: [20, 35], A2: [25, 45], B1: [35, 55], B2: [45, 75] };
// Grammar a unit's theme needs, so you can talk about it: placed just before the unit (BEFORE) or right after its words (AFTER).
const BEFORE = {
  2: ["g-subj", "pres"], 3: ["g-articles"], 4: ["g-reflexive"], 9: ["g-piacere", "g-modal"], 10: ["pp"],
  11: ["imp"], 12: ["g-prep-place-time"], 15: ["g-iobj"], 17: ["g-partitive", "g-imperative"], 19: ["fut", "cond"],
  21: ["cong"], 24: ["g-si"], 30: ["g-cong-imp", "g-ipotetico"],
  33: ["g-passive"], 34: ["g-passato-remoto"], 36: ["g-pronominali"], 37: ["g-registro"], 40: ["g-discourse"]
};
const AFTER = { 11: ["ppimp"] };
const roadmap = {};
for (const L of LV) {
  const units = course.units.filter(u => u.level === L);
  const gram = grammar.filter(g => g.level === L);
  const reads = reading.filter(r => r.level === L), hears = listening.filter(l => l.level === L);
  const content = [];
  const gPerUnit = gram.length / units.length;
  const placed = new Set();
  const addG = g => { if (!g || placed.has(g.id)) return; placed.add(g.id); content.push({ type: "grammar", ref: g.id, title: g.title, en: g.en, min: [25, 50] }); };
  const byId = id => gram.find(g => g.id === id);
  units.forEach((u, i) => {
    (BEFORE[u.n] || []).forEach(id => addG(byId(id)));
    const n = u.words.length + u.verbs.length + u.phrases.length;
    content.push({ type: "unit", ref: u.n, title: u.title, en: u.en, min: [Math.round(n * 1.5), Math.round(n * 3)] });
    (AFTER[u.n] || []).forEach(id => addG(byId(id)));
    // The other lessons, spread evenly in their usual order.
    const until = Math.round((i + 1) * gPerUnit);
    for (const g of gram) { if (placed.size >= until) break; if (!placed.has(g.id) && !Object.values(BEFORE).flat().concat(Object.values(AFTER).flat()).includes(g.id)) addG(g); }
    if (reads[i]) { const r = reads[i]; content.push({ type: "reading", ref: r.id, title: r.title, en: r.en, min: [Math.round(r.minutes * 2), Math.round(r.minutes * 3.5)] }); }
    // Listening: two or three times through, plus the questions.
    if (hears[i]) { const l = hears[i]; content.push({ type: "listening", ref: l.id, title: l.title, en: l.en, min: [l.minutes * 3 + 5, l.minutes * 5 + 10] }); }
    if (i % 3 === 2) {
      const k = (i - 2) / 3;
      if (WRITE[L][k]) { const w = writing.find(x => x.id === WRITE[L][k]); content.push({ type: "writing", ref: w.id, title: w.title, en: w.en, min: WRITE_MIN[L] }); }
      if (SPEAK[L][k]) { const s = speaking.find(x => x.id === SPEAK[L][k]); content.push({ type: "speaking", ref: s.id, title: s.title, en: s.en, min: [15, 30] }); }
    }
  });
  gram.forEach(addG);
  // A checkpoint after every 5 steps, and a level test at the end.
  const steps = []; let cp = 0;
  content.forEach((s, i) => {
    steps.push(s);
    if ((i + 1) % 5 === 0 && i < content.length - 1) steps.push({ type: "checkpoint", ref: ++cp, title: `Checkpoint ${cp}`, en: "A short quiz on the last five steps", min: [8, 12] });
  });
  steps.push({ type: "test", ref: L, title: `Test ${L}`, en: "A level test on everything in this path", min: [25, 40] });
  // Ids follow the content, not the position, so reordering the path keeps progress on each step.
  steps.forEach(s => { s.id = `${L}-${s.type}-${s.ref}`; });
  const minH = steps.reduce((a, s) => a + s.min[0], 0) / 60, maxH = steps.reduce((a, s) => a + s.min[1], 0) / 60;
  roadmap[L] = { steps, hours: [Math.round(minH), Math.round(maxH)] };
  console.log(`roadmap ${L}: ${steps.length} steps, ${Math.round(minH)}–${Math.round(maxH)} h`);
}
fs.writeFileSync(new URL("../src/data/roadmap.json", import.meta.url), JSON.stringify(roadmap));
