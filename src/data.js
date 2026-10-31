// Content is split into chunks that load on demand (and are cached offline by the service worker).
// Plain JSON files: the browser reads JSON much faster than the same data as JavaScript.
import course from "./data/course.json?url";
import grammar from "./data/grammar.json?url";
import reading from "./data/reading.json?url";
import listening from "./data/listening.json?url";
import writing from "./data/writing.json?url";
import speaking from "./data/speaking.json?url";
const URLS = { course, grammar, reading, listening, writing, speaking };
const load = key => fetch(URLS[key]).then(r => { if (!r.ok) throw new Error(`${key}: ${r.status}`); return r.json(); });
const cache = {};
export function ensure(key) {
  return cache[key] || (cache[key] = load(key).catch(e => { delete cache[key]; throw e; }));
}
