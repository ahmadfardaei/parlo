# Grammar lessons brief
Read STYLE.md first. Look at `grammar-existing.js`: 7 finished tense lessons. Match their schema, depth, clarity and tone exactly (they are the quality bar).

Write your lessons as a JSON array to the file named in your task. Schema per lesson:
```
{ "id": "g-…", "level": "A1|A2|B1|B2", "topic": "nouns|adjectives|prepositions|pronouns|verbtypes|tenses|sentences|functions",
  "title": "<Italian title>", "en": "<English title>",
  "summary": "<one sentence: what this is, in plain English>",
  "meaning": "<2-4 sentences: the idea in plain English; may use <b>/<i>>",
  "uses": [ { "h": "<short heading>", "t": "<1-2 sentences, may use <b>/<i>>", "ex": ["<Italian example>", "<English>"] }, … 3-6 ],
  "form": { "intro": "<how it works>",
            "tables": [ { "h": "<table title>", "rows": [["<left>", "<right>"], …] } ],   // optional; e.g. ["il", "masculine before most consonants: il libro"]
            "notes": ["<rule or tip>", …] },                                                // optional
  "irregular": [["<item>", "<form/explanation>"], …],   // optional (exceptions list)
  "irregularTitle": "<heading for that list>",          // optional
  "signals": ["<key words/cues>", …],                   // optional
  "mistakes": [ { "wrong": "…", "right": "…", "why": "…" }, … 2-4 ],
  "ex": [ 10-14 exercises ] }
```
Exercises:
- `{ "k":"type", "q":"Vado ___ Roma domani.", "h":"preposition", "a":["a"], "why":"Cities take a." }` — the learner types the missing part. `h` is a short hint shown in brackets (e.g. "article", "pronoun", "essere", "volere · io"). `a` lists ALL acceptable answers (lowercase; include valid alternatives).
- `{ "k":"mc", "q":"…", "o":["…","…","…"], "a":"<one of o>", "why":"…" }`
- Mix both kinds (roughly 2/3 type, 1/3 mc). Every exercise sentence must be natural Italian, used in a real context, and unambiguous (only the answers in `a` are correct). Make the `why` teach.

Right level of abstraction: each lesson covers ONE topic well. Explain what a learner at that level needs; leave advanced exceptions out or in a short note. Prefer tables for patterns.
Validate: `node validate.mjs grammar <file>`.
When done, reply with one line: file name and lesson count.
