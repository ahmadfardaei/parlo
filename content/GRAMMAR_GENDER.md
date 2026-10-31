# Grammar: sentences about the learner follow their gender

The app asks learners which forms to show for sentences about themselves: masculine (sono stanco), feminine (sono stanca), or both. Vocabulary already follows this. Grammar lessons do not: a woman sees "Da bambino andavo al mare".

Your job: in each grammar lesson, find every sentence where **the speaker (io) or a group the speaker is in (noi)** has a gendered form, and add the other-gender version.

## Which sentences
Add a version only when the gender belongs to the speaker:
- "Da bambino andavo al mare." → "Da bambina andavo al mare."
- "Sono andato al cinema." → "Sono andata al cinema."
- "Mi sono alzato tardi." → "Mi sono alzata tardi."
- "Sono stanco." / "Sono contento di vederti." / "Sono nato a Bari." / "Ero sicuro che…"
- noi: "Siamo arrivati tardi." → "Siamo arrivate tardi." only when the context does not say who "noi" is. If unsure, skip.

Do NOT change:
- sentences about other people (Marco è andato, mia sorella è stanca, Lei è gentile);
- sentences that address "tu" or "Lei" (the listener, not the learner);
- sentences with no gendered form for the speaker (ho mangiato, vado a casa);
- forms already written as "andato/a" (the app already handles "/a").

## How to write it
Edit the lesson files in place: content/grammar-1.json … grammar-10.json (and grammar-existing.js if you were given it). Keep every existing field unchanged. Only add:

1. In `uses[]`: add `"exAlt": { "base": "m", "other": "<the sentence in the other gender>" }` next to `ex`.
   - `base` is the gender of the sentence as it is written now ("m" or "f").
   - Change only the gendered words. Keep everything else identical, including punctuation.
   - The English translation (`ex[1]`) stays the same.
2. In `ex[]` (exercises): add `"alt": { "base": "m", "q": "…", "a": … , "o": … }`.
   - `q`: the question in the other gender (keep `___` exactly where it is).
   - `a`: the answer(s) in the other gender, same type as the original (array for "type", string for "mc").
   - `o`: only for "mc" exercises, the options in the other gender (must include `a`).
   - Include only the fields that change (if only `q` changes, give only `q`). `base` is always required.
   - Also rewrite `why` in `alt.why` only if it quotes a gendered form that changes.
3. In `mistakes[]`: add `"alt": { "base": "m", "wrong": "…", "right": "…" }` the same way, only if they are about the speaker.

The Italian must be correct. Check agreement of every word that changes (participle, adjective, "bambino/bambina", "nato/nata", "solo/sola", "sicuro/sicura", "stato/stata"…).

## Check
Run `node content/validate.mjs grammar content/<file>` after each file. It must print OK. It checks the structure of `exAlt` and `alt`.

## Report
One line per lesson: how many sentences you gave a second version. List any sentence you were unsure about.
