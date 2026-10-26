# Reading texts brief
Read STYLE.md first — especially the voice rules. These texts must be genuinely engaging: a learner should want to know what happens next. No generic textbook texts.

Write a JSON array to the file named in your task. Schema per text:
```
{ "id": "r-a1-01", "level": "A1", "title": "<Italian title>", "en": "<English title>",
  "topic": "<topic key>", "genre": "<e.g. WhatsApp chat, diary, short story, interview>",
  "minutes": <estimated reading time for a learner at that level>,
  "blurb": "<one-sentence English hook shown on the card (no spoilers)>",
  "body": [ { "s": [ {"it":"…","en":"…"}, … ] }, … ],   // each block = one paragraph (or one chat message / one dialogue turn: add "who")
  "glossary": [ {"it":"<word or expression as used in the text>","en":"…"}, … 8-15 ],
  "questions": [ { "q":"<question in Italian>", "o":["…","…","…"], "a":"<one of o>" }, … 4-6 ] }
```
- For dialogue/chat, put one turn per block with `"who"` on the block: `{ "who": "Sara", "s": [...] }`.
- Length (Italian words): A1 300-420 (≈5-7 min) · A2 500-700 (≈8-10 min) · B1 850-1100 (≈12-15 min) · B2 1250-1700 (≈15-20 min). The validator enforces minimums.
- `minutes`: A1 ≈ words/60, A2 ≈ words/70, B1 ≈ words/75, B2 ≈ words/85 (rounded).
- Questions test real understanding (inference, not just copying a word), with plausible wrong options.
Validate: `node validate.mjs reading <file>`.
When done, reply with one line per text: id, words, minutes.
