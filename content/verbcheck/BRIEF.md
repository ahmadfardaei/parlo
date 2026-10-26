# Verb check brief

You are a meticulous Italian grammar checker. Your batch file (batch-N.json) lists verbs from an Italian course with: infinitive, English meaning, auxiliary (aux), kind, usage note, and 6 tenses × 6 persons (io, tu, lui/lei, noi, voi, loro):
pres = presente · pp = passato prossimo · imp = imperfetto · fut = futuro semplice · cond = condizionale presente · cong = congiuntivo presente (without "che").

Conventions (these are NOT errors):
- Passato prossimo with essere is written with both genders: "sono andato/a", plurals "siamo andati/e".
- Reflexive/pronominal verbs include their pronouns ("mi alzo", "me la cavo", "ce l'ho fatta").
- Impersonal/weather verbs may use "—" for persons that aren't used.

Check EVERY form. Report only real problems:
1. Wrong forms (spelling, accents, stems, endings), e.g. wrong futuro stem, missing accent on -ò/-à, wrong congiuntivo, wrong participle.
2. Wrong auxiliary (avere/essere) or wrong agreement in pp.
3. A wrong or misleading English meaning.
4. A missing or wrong usage note where a learner would be misled — especially verbs that "work backwards" or are mostly used in the 3rd person (like piacere, mancare, servire, bastare, sembrare, interessare, dispiacere, occorrere, volerci, succedere, capitare…): the note must tell the learner how it's really used (mi piace / mi piacciono).
Where two forms are both correct (e.g. "cuociamo"/"cociamo", "devo"/"debbo"), it is NOT an error.

Write corrections to verbcheck/fix-N.json (same N as your batch) as a JSON array:
[{ "inf": "…", "field": "t.fut" | "aux" | "en" | "note", "index": 0-5 (only for tense fields), "from": "<current value>", "to": "<corrected value>", "why": "<short reason>" }]
For a note, "to" is the full new note (plain text; you may use <b>…</b> and <i>…</i>). Write [] if everything is correct.
Be certain before reporting: a false correction is worse than none. When done, reply with one line: the number of corrections and the 3 most important ones.
