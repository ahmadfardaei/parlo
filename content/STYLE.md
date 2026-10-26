# Parlo content style guide (read this first)

Audience: adult English speakers learning Italian, A1 → B2. The app is minimal and serious about quality.

## Voice: engaging, human, specific — never generic "AI textbook"
- Concrete, specific details: real Italian places (not just Rome/Milan: Trieste, Matera, Lecce, Bergamo, Cagliari, Ivrea, a village in the Langhe…), real foods, real customs, believable names (not always Marco & Giulia), real jobs, small odd details.
- Characters with a voice and a want. Some humour, some tension, a turn or a surprise. Let readers infer things.
- Vary genres and formats: short story with a twist, diary, letters/emails, WhatsApp chat, interview, podcast transcript, radio phone-in, a noticeboard of small ads, a local legend, a recipe told by a grandmother with opinions, an opinion column, a travel dispatch, a reportage, a complaint letter, a mystery…
- FORBIDDEN: moralising endings, "In conclusione", "è importante ricordare", lists of tourist facts, everyone being nice and everything going perfectly, stock openings ("Ciao, mi chiamo Marco e ho 25 anni" — unless subverted), overuse of em-dashes, rhetorical triads, "Non è solo X, è Y" constructions, "un viaggio", "un mix di", "un tuffo nel passato". No emoji.
- Italian must be natural, modern, idiomatic, correct (accents: è, perché, più, città, già, può…). Use the register real Italians would use in that format.
- Language level must match the CEFR level: A1 present tense mostly + a few passato prossimo, short sentences, high-frequency words; A2 adds passato prossimo/imperfetto/futuro, simple connectors; B1 congiuntivo, condizionale, longer sentences, some idioms; B2 full range, nuance, idioms, irony, complex syntax.

## Sentences and translations
- Every Italian sentence has its own English translation: natural English, faithful in meaning (not word-for-word).
- Sentence objects are `{ "it": "...", "en": "..." }`. Dialogue lines may add `"who": "Name"`.
- Split text into real sentences (one sentence per object). Keep each object short enough to make a good flashcard (ideally under ~30 words; split long ones at natural points).

## Topics (use exactly these keys when a `topic` is asked for)
people · daily · food · places · work · feelings · leisure · society · tech · nature · language
(people & relationships · home & daily life · food & drink · travel & places · work & study · health & feelings · free time & culture · society & money · media, science & tech · nature & environment · language & expression)

## Files
Write valid UTF-8 JSON only (no comments, no trailing commas). Validate with `node validate.mjs <type> <file>` (types: grammar, reading, writing, speaking) and fix every error until it prints OK.
