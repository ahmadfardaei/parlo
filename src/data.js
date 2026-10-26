// Content is split into chunks that load on demand (and are cached offline by the service worker).
const loaders = {
  course: () => import("./data/course.json"),
  grammar: () => import("./data/grammar.json"),
  reading: () => import("./data/reading.json"),
  writing: () => import("./data/writing.json"),
  speaking: () => import("./data/speaking.json")
};
const cache = {};
export function ensure(key) {
  return cache[key] || (cache[key] = loaders[key]().then(m => m.default).catch(e => { delete cache[key]; throw e; }));
}
