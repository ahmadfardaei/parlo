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
const writing = [1, 2].filter(i => has(`writing-${i}.json`)).flatMap(i => C(`writing-${i}.json`)).sort((a, b) => a.id.localeCompare(b.id));
out("writing", writing);
const speaking = [1, 2].filter(i => has(`speaking-${i}.json`)).flatMap(i => C(`speaking-${i}.json`)).sort((a, b) => a.id.localeCompare(b.id));
out("speaking", speaking);

fs.writeFileSync(new URL("../src/data/meta.json", import.meta.url), JSON.stringify({ grammar: grammar.length, reading: reading.length, writing: writing.length, speaking: speaking.length }));
