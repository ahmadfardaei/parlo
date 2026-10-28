// Shared by the app and by the audio generator (content/tts), so both agree on which clip belongs to which text.
// Audio clips and PDFs live in a separate static repo (parlo-media) so the app itself stays small.
export const MEDIA_BASE = "https://ahmadfardaei.github.io/parlo-media";
export const pdfUrl = path => `${MEDIA_BASE}/pdf/${path}.pdf`;
// Switched on once the clips have been generated and published.
export const AUDIO_READY = true;

// The text that is actually spoken: drop quote marks and dashes that make voices pause oddly.
export const spoken = t => String(t).replace(/\/[aie]+(?![\p{L}])/gu, "").replace(/[«»“”"]/g, "").replace(/\s*[—–]\s*/g, ", ").replace(/…/g, ".").replace(/\s+/g, " ").trim();
export function clipHash(t) { const s = spoken(t).toLowerCase(); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }
export const clipUrl = (t, v = "f") => `${MEDIA_BASE}/audio/${v}/${clipHash(t)}.mp3`;

// Speaker names → voice. Italian first names ending in -a are mostly feminine, with a few well-known exceptions.
const MALE_A = ["andrea", "luca", "nicola", "mattia", "elia", "battista", "enea", "gianluca", "giosuè", "tobia", "zaccaria", "geremia", "isaia"];
export function voiceForName(who) {
  if (!who) return "f";
  const first = String(who).replace(/^(da|a|di)\s*:\s*/i, "").replace(/^(signor[ae]?|dott(oressa|\.)?|prof(essoressa|\.)?|nonn[ao]|zi[ao])\s+/i, "").trim().split(/[\s,–-]+/)[0].toLowerCase();
  if (/^(nonna|zia|mamma|signora|dottoressa|professoressa)$/.test(first)) return "f";
  if (/^(nonno|zio|papà|babbo|signor|signore|dottore|professore)$/.test(first)) return "m";
  if (MALE_A.includes(first)) return "m";
  return /a$/.test(first) ? "f" : "m";
}
// First-person sentences that exist in both genders are read by the matching voice.
export const voiceForGender = g => g === "m" ? "m" : "f";
// Narration alternates between voices from one text to the next (r-a1-01 female, r-a1-02 male, …).
export const narratorVoice = id => (parseInt(String(id).slice(-1), 10) || 0) % 2 ? "f" : "m";
