# Grammar: shorter and clearer (second pass)

Learners say the lessons are too long and sometimes complicated. Make each lesson short enough to read on a phone in about 3 screens, and clear enough to use at once.

Read `content/GRAMMAR_STE.md` first. All its rules still apply (ASD-STE100 English, do not change Italian sentences, keep valid files). This brief adds stricter limits.

## Limits per lesson (the validator checks them)
- `summary`: one sentence, max 14 words. What it is and when to use it.
- `meaning` ("The idea"): max 3 sentences and 40 words. The one thing to understand. No lists of exceptions here.
- `uses`: 3 or 4. Keep the uses that people need most in daily life. Delete the others. `h` max 6 words; `t` one sentence, max 16 words.
- `form.intro`: one sentence, max 20 words. Do not repeat `meaning`.
- `form.tables`: max 3 tables, max 8 rows each. Delete rows with rare forms.
- `form.notes`: max 3, each max 25 words. Keep only notes that prevent a real mistake.
- `form.compare`: delete it if a table or a use already shows the same thing.
- `irregular`: max 12 rows, the most common verbs or words only.
- `mistakes`: 2 or 3. Keep the mistakes that learners really make. `why` max 16 words.
- `ex`: keep 10–14. Delete an exercise if it tests something you deleted. Exercise `why` max 20 words; `h` max 8 words.

## Tables: one language per column
On a phone, a cell that mixes a form, its English meaning and an Italian example is hard to read. Fix every table that has `rows` of arrays:
- Give each row one cell per kind of content. If a cell has "form : example" or "English: Italian example", split it into separate cells.
- Add `"cols"` to the table: one entry per cell, `"it"` for Italian or `"en"` for English. Every row must have exactly that number of cells.
  - Example: `{"h": "Indirect object pronouns", "cols": ["it", "en", "it"], "rows": [["mi", "to me", "Mi passi il sale?"], …]}`
  - Example: `{"h": "Formulas", "cols": ["en", "it"], "rows": [["asking (tu)", "Ti dispiacerebbe…?"], …]}`
- Use max 3 cells per row. If a row has a long list of Italian forms, keep the 2 or 3 most common.
- In an `"en"` cell, mark an Italian word with `<i>…</i>`. In an `"it"` cell, use `<b>…</b>` only to mark the ending or the key form.
- Tables whose `rows` are plain strings (one per person: io, tu, …) or `stem` + `end` do not need `cols`. Do not change them.

## What not to change
- `id`, `level`, `topic`, `title`, `en`, `tense`.
- Any Italian sentence you keep in `uses[].ex` (it has audio). You can delete a whole use.
- Exercise `q`, `a`, `o` (except where GRAMMAR_STE.md allows it).

## Check
Run `node content/validate.mjs grammar content/<file>` from `~/Desktop/parlo-app` after each file. It must print OK. It checks all the limits above.

## Report
One short line per lesson: what you deleted or merged. Do not paste the lesson text.
