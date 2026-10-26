# Writing tasks brief
Read STYLE.md first. Each task gives the learner a realistic reason to write, a short guide of what to cover, useful phrases, and 4 model answers (one per level) that show how the same task grows from A1 to B2. Models must sound like a real person (with personality and specific details), not a template — and each level's model must be a different, natural text, not the same text padded.

Write a JSON array to the file named in your task. Schema:
```
{ "id": "w-01", "title": "<Italian title>", "en": "<English title>", "topic": "<topic key>", "format": "<email, review, story, letter, post…>",
  "task": "<2-3 sentences in English: the situation and what to write>",
  "guide": ["<point to cover>", … 4-6],
  "phrases": [ {"it":"…","en":"…"}, … 8-12 useful phrases for this task, from simple to advanced ],
  "models": { "A1": { "body": [ { "s": [ {"it":"…","en":"…"} ] } ] }, "A2": {…}, "B1": {…}, "B2": {…} } }
```
Model lengths (Italian words): A1 60-90 · A2 110-160 · B1 180-250 · B2 260-350. Use each level's grammar appropriately (see STYLE.md).
Validate: `node validate.mjs writing <file>`. Reply with one line per task: id and words per level.
