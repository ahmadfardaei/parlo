// Generate every clip: node content/tts/generate.mjs <femaleVoice> <maleVoice>
// Resumable: existing files are skipped. Output: ~/Desktop/parlo-audio/{f,m}/<hash>.mp3
import fs from "fs";
import os from "os";
import { key, synth } from "./lib.mjs";
const [femaleVoice, maleVoice] = process.argv.slice(2);
if (!femaleVoice || !maleVoice) { console.log("Usage: node generate.mjs <femaleVoice> <maleVoice>"); process.exit(1); }
// f2 and m2 are the extra voices used in listening exercises with more than two speakers.
const k = key(), VOICE = { f: femaleVoice, m: maleVoice, f2: "it-IT-Chirp3-HD-Kore", m2: "it-IT-Chirp3-HD-Charon" };
const root = `${os.homedir()}/Desktop/parlo-audio`;
for (const v of Object.keys(VOICE)) fs.mkdirSync(`${root}/${v}`, { recursive: true });
const jobs = JSON.parse(fs.readFileSync(new URL("./jobs.json", import.meta.url))).filter(j => !fs.existsSync(`${root}/${j.v}/${j.h}.mp3`));
console.log(`${jobs.length} clips to generate with ${femaleVoice} / ${maleVoice}`);
let done = 0, failed = 0, i = 0;
const t0 = Date.now();
async function worker() {
  while (i < jobs.length) {
    const j = jobs[i++];
    for (let attempt = 0; ; attempt++) {
      try { fs.writeFileSync(`${root}/${j.v}/${j.h}.mp3`, await synth(k, j.t, VOICE[j.v], 0.95)); done++; break; }
      catch (e) {
        if ((!e.status || e.status === 429 || e.status >= 500) && attempt < 6) { await new Promise(r => setTimeout(r, 1000 * 2 ** attempt + Math.random() * 500)); continue; }
        failed++; fs.appendFileSync(`${root}/failed.log`, `${j.v}\t${j.h}\t${j.t}\t${e.message}\n`); break;
      }
    }
    if ((done + failed) % 250 === 0) console.log(`${done + failed}/${jobs.length} · ${failed} failed · ${Math.round((Date.now() - t0) / 1000)} s`);
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
console.log(`Done: ${done} generated, ${failed} failed, in ${Math.round((Date.now() - t0) / 60000)} min.`);
