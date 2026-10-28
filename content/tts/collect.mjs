// Lists every audio clip the app can play: node content/tts/collect.mjs → content/tts/jobs.json
import fs from "fs";
import { spoken, clipHash, voiceForName, narratorVoice } from "../../src/voice.js";
const D = f => JSON.parse(fs.readFileSync(new URL(`../../src/data/${f}.json`, import.meta.url)));
const course = D("course"), grammar = D("grammar"), reading = D("reading"), writing = D("writing"), speaking = D("speaking");
const listening = fs.existsSync(new URL("../../src/data/listening.json", import.meta.url)) ? D("listening") : [];
const jobs = new Map();
const add = (text, v = "f") => { if (!text || text === "—") return; const t = spoken(text); if (!t) return; jobs.set(v + clipHash(text), { v, h: clipHash(text), t }); };
const full = w => !w.art ? w.it : (w.art.endsWith("'") ? w.art + w.it : w.art + " " + w.it);
const other = v => v === "m" ? "f" : "m";
const withAlt = (text, alt) => { if (alt) { add(text, alt.base); add(alt.other, other(alt.base)); } else add(text, "f"); };
for (const u of course.units) {
  for (const w of u.words) { add(full(w)); withAlt(w.ex, w.exAlt); }
  for (const p of u.phrases) { add(p.it); withAlt(p.ex, p.exAlt); }
  for (const v of u.verbs) {
    add(v.inf);
    v.ex.forEach(([it], i) => withAlt(it, v.exAlt?.[i]));
    for (const list of Object.values(v.t)) for (const f of list) {
      if (!f || f === "—") continue;
      add(f); // "/a" forms are spoken in the masculine
      if (/[oi]\/[ae](?![\p{L}])/u.test(f)) add(f.replace(/([oi])\/([ae])(?![\p{L}])/u, "$2"));
    }
  }
}
for (const g of grammar) {
  g.uses.forEach(u => add(u.ex[0]));
  g.ex.forEach(e => { if (e.k === "type") add(e.a[0]); });
}
const blocks = (body, voiceOf) => body.forEach(b => b.s.forEach(s => add(s.it, voiceOf(b))));
for (const r of reading) { blocks(r.body, b => b.who ? voiceForName(b.who) : narratorVoice(r.id)); r.glossary.forEach(g => add(g.it)); }
const LV = { A1: "f", A2: "m", B1: "f", B2: "m" };
for (const w of writing) { for (const [l, m] of Object.entries(w.models)) blocks(m.body, () => LV[l]); w.phrases.forEach(p => add(p.it)); }
for (const l of listening) blocks(l.body, b => l.speakers[b.who]);
for (const s of speaking) { for (const m of Object.values(s.models)) blocks(m.body, () => voiceForName(m.speaker)); s.phrases.forEach(p => add(p.it)); s.questions.forEach(q => add(q.it)); }
const list = [...jobs.values()];
fs.writeFileSync(new URL("./jobs.json", import.meta.url), JSON.stringify(list));
const by = v => list.filter(j => j.v === v);
console.log(`clips: ${list.length} (female ${by("f").length}, male ${by("m").length}); characters: ${list.reduce((a, j) => a + j.t.length, 0)}`);
