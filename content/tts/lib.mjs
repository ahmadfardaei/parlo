import fs from "fs";
export function key() {
  const f = new URL("../../.tts.env", import.meta.url);
  if (!fs.existsSync(f)) throw new Error("Missing ~/Desktop/parlo-app/.tts.env with GOOGLE_TTS_KEY=…");
  const m = fs.readFileSync(f, "utf8").match(/GOOGLE_TTS_KEY\s*=\s*"?([^"\s]+)/);
  if (!m) throw new Error(".tts.env has no GOOGLE_TTS_KEY");
  return m[1];
}
export async function synth(k, text, voice, rate) {
  const audioConfig = { audioEncoding: "MP3", sampleRateHertz: 24000 };
  if (rate && !/Chirp/.test(voice)) audioConfig.speakingRate = rate;
  const r = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${k}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: { text }, voice: { languageCode: "it-IT", name: voice }, audioConfig })
  });
  if (!r.ok) { const e = new Error(`${r.status} ${(await r.text()).slice(0, 300)}`); e.status = r.status; throw e; }
  return Buffer.from((await r.json()).audioContent, "base64");
}
export async function listVoices(k) {
  const r = await fetch(`https://texttospeech.googleapis.com/v1/voices?languageCode=it-IT&key=${k}`);
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return (await r.json()).voices;
}
