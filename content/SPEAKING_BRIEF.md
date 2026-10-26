# Speaking topics brief
Read STYLE.md first. Each topic gives a prompt to talk about for 5-10 minutes, guiding questions, useful spoken phrases, and 4 example talks (one per level). The examples are TRANSCRIPTS OF SPEECH: natural spoken Italian with fillers and self-corrections where realistic (allora, cioè, insomma, diciamo, boh, niente…, "come si dice…"), short sentences, personal anecdotes and specific details. Different speakers per level with different lives — not the same text padded.

Write a JSON array to the file named in your task. Schema:
```
{ "id": "s-01", "title": "<Italian title>", "en": "<English title>", "topic": "<topic key>",
  "task": "<2-3 sentences in English: what to talk about and for how long>",
  "questions": [ {"it":"<guiding question in Italian>","en":"…"}, … 6-8 from simple to deeper ],
  "phrases": [ {"it":"…","en":"…"}, … 8-12 useful spoken phrases/connectors ],
  "models": { "A1": { "speaker": "<name, age, city>", "body": [ { "s": [ {"it":"…","en":"…"} ] } ] }, "A2": {…}, "B1": {…}, "B2": {…} } }
```
Example lengths (Italian words, ≈ minutes of speech at learner pace): A1 230-300 (≈4-5 min) · A2 380-480 (≈5-6) · B1 600-750 (≈6-8) · B2 850-1050 (≈8-10).
Validate: `node validate.mjs speaking <file>`. Reply with one line per topic: id and words per level.
