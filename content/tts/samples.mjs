// Make one sample per Italian voice so the voices can be compared by ear: node content/tts/samples.mjs
import fs from "fs";
import os from "os";
import { key, synth, listVoices } from "./lib.mjs";
const k = key();
const out = `${os.homedir()}/Desktop/Parlo voice samples`;
fs.mkdirSync(out, { recursive: true });
const voices = (await listVoices(k)).filter(v => /Neural2|Chirp3-HD|Chirp-HD|Studio|Wavenet/.test(v.name));
console.log(voices.map(v => `${v.name} (${v.ssmlGender})`).join("\n"));
const text = "Buongiorno! Vorrei un caffè e un cornetto, per favore. Ieri sono andata al mercato di Ballarò: c'era tantissima gente, e il pesce era freschissimo.";
const pick = voices.filter(v => /Chirp3-HD/.test(v.name)).slice(0, 8).concat(voices.filter(v => /Neural2/.test(v.name)));
for (const v of pick) {
  try { fs.writeFileSync(`${out}/${v.name} (${v.ssmlGender.toLowerCase()}).mp3`, await synth(k, text, v.name, 0.95)); process.stdout.write("."); }
  catch (e) { console.log("\n", v.name, e.message); }
}
console.log(`\nSaved ${pick.length} samples to ${out}`);
