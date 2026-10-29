// Gives each character in a reading a voice of their own: node content/reading-voices.mjs
// Writes r.speakers ({ name: voice }) and r.narrator into content/reading-*.json.
// Voices: f, f2, f3, f4 (female) and m, m2, m3, m4 (male); see content/tts/generate.mjs.
import fs from "fs";
import { voiceForName, narratorVoice } from "../src/voice.js";

// Gender when the name does not show it, and labels that are the same person (one voice).
const GENDER = { "Annuncio": "m", "Post-it verde": "f", "Post-it rosa": "f", "Post-it giallo": "m", "Post-it azzurro": "m", "Post-it arancione": "f", "Post-it, scrittura piccola": "f",
  "Irene": "f", "Programma": "f", "Domenica mattina": "f", "Radio Ateneo": "f", "Giornalista": "f", "Intervistatrice": "f", "G., Ivrea": "m", "Post-it di Marta": "f", "Post-it di Giacomo": "m", "Post-it di Samir": "m" };
const SAME = { "Da: Farmacia San Savino – A: Franco Bertolino": "f", "Da: Franco Bertolino – A: Farmacia San Savino": "m" };
const SLOTS = { f: ["f", "f2", "f3", "f4"], m: ["m", "m2", "m3", "m4"] };

for (const f of fs.readdirSync(new URL(".", import.meta.url)).filter(f => /^reading-.*\.json$/.test(f))) {
  const path = new URL(f, import.meta.url), d = JSON.parse(fs.readFileSync(path));
  for (const r of d) {
    const who = [...new Set(r.body.filter(b => b.who).map(b => b.who))];
    const narrated = r.body.some(b => !b.who);
    r.narrator = narratorVoice(r.id);
    if (!who.length) { delete r.speakers; continue; }
    // Postcards from one writer: one voice.
    if (/^Cartolina /.test(who[0])) { r.speakers = Object.fromEntries(who.map(w => [w, "f"])); continue; }
    const used = { f: narrated && r.narrator === "f" ? 1 : 0, m: narrated && r.narrator === "m" ? 1 : 0 };
    r.speakers = {};
    for (const w of who) {
      if (SAME[w]) { r.speakers[w] = SAME[w]; continue; }
      const g = GENDER[w] || voiceForName(w);
      r.speakers[w] = SLOTS[g][used[g]++ % 4];
    }
  }
  fs.writeFileSync(path, JSON.stringify(d, null, 2) + "\n");
}
