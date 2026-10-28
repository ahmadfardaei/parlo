# Grammar rewrite: ASD-STE100 style, daily-use only

The goal: every English explanation in the grammar lessons follows ASD-STE100 (Simplified Technical English). Short, clear, precise. No fluff. Cut grammar that people do not use in daily Italian.

## What to rewrite (English text only)
`summary`, `meaning`, `uses[].h`, `uses[].t`, `form.intro`, `form.notes[]`, table `h` titles and English parts of table rows, `irregularTitle`, the English side of `irregular` rows, `signals` (if English), `mistakes[].why`, exercise `why` and `h` (hint).

Do NOT change: `id`, `level`, `topic`, `title`, `en` (lesson English title), the schema, any Italian example sentence or its English translation (`uses[].ex`), exercise `q`/`a`/`o` text. Italian sentences have recorded audio; changing them breaks the audio. You MAY delete an example, use, note, table row, mistake or exercise when it teaches rare grammar (see below). Keep at least 3 uses, 2 mistakes and 10 exercises per lesson.

## STE rules to apply
1. One idea per sentence. Max 20 words per sentence; aim for 8–15.
2. Active voice. Simple present tense for rules ("Use essere with…", "The participle agrees with…").
3. Write rules as instructions where possible: "Use ci for a place you said before." Not "Ci is generally used to replace…".
4. One word, one meaning. Use the same term for the same thing everywhere (e.g. always "past participle", never also "participle form").
5. No filler: delete "basically", "simply", "really", "just", "actually", "of course", "very", "quite", "often you'll find", "it's worth noting", "don't worry", "the good news is", jokes, metaphors, exclamation marks, rhetorical questions.
6. No contractions in explanations (do not, it is). Keep articles (a, an, the).
7. Use common words: "use" not "utilise", "about" not "approximately", "show" not "denote". Grammar terms (subject, direct object, past participle, infinitive, auxiliary) are allowed technical names.
8. Lists over long sentences. A note with 3+ items → short sentence + the items.
9. `summary`: one sentence, max 15 words, what it is and when to use it.
10. `meaning`: max 3 sentences.
11. `uses[].t`, `mistakes[].why`, exercise `why`: one sentence each, max 15 words.
12. Keep the existing light HTML (<b>, <i>) only where it marks an Italian form. No other HTML.

Example
- Before: "Two tiny, very common words: ci stands for a place or “about it / on it”; ne stands for “of it, of them, some”, especially with numbers."
- After: "Ci replaces a place or a + thing. Ne replaces di + thing or a noun after a number."

## Cut grammar that people do not use in daily life
Daily life = everyday speech, messages, emails, news, signs, normal books. Remove (rules, rows, notes, examples, exercises) that teach:
- literary or archaic forms: egli, ella, esso/essa as subject, codesto, trapassato remoto, "il quale" when "che" works in normal speech (keep il quale only as a short recognition note), apocopated literary forms;
- long lists of rare irregular verbs: keep only the common ones (essere, avere, fare, dire, andare, venire, stare, dare, sapere, potere, volere, dovere, uscire, bere, rimanere, tenere, mettere, prendere, vedere, leggere, scrivere, chiudere, aprire, chiedere, rispondere, vivere, nascere, morire, scegliere, piacere, conoscere, decidere, perdere, correre, succedere and similar high-frequency verbs);
- fine points a B2 speaker never needs (rare agreement exceptions, regional or bookish variants, archaic spellings).

Special case — `g-passato-remoto`: keep the lesson but make it "recognise only". Explain it appears in books, history and in southern speech. Keep regular endings and the 3rd person forms of the most common irregulars (fu, ebbe, fece, disse, venne, nacque, morì, vide, scrisse, prese, mise, volle). Exercises: recognition (mc: which infinitive / which passato prossimo) rather than producing rare 1st/2nd person forms. You may change exercise q/a/o in this lesson only.

If you delete an exercise and drop below 10, write a new one from an existing Italian example sentence in the same lesson (reuse the sentence exactly so audio exists).

## Output
Edit the files in place. Keep valid JSON (or valid JS for grammar-existing.js). After editing each JSON file run: `node content/validate.mjs grammar content/<file>` from ~/Desktop/parlo-app and fix every error.
Report: per lesson, one line listing what grammar you cut (if any).
