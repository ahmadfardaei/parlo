# Listening exercises brief
Read STYLE.md first (voice rules, Italian quality, CEFR level rules). These are scripts for AUDIO: the learner hears them first and reads the transcript only after answering.

Write a JSON array to the file named in your task. Schema per exercise:
```
{ "id": "l-a1-01", "level": "A1", "title": "<Italian title>", "en": "<English title>",
  "topic": "<topic key>", "genre": "<e.g. voicemail, phone call, station announcement>",
  "minutes": <audio length: Italian words / 135, rounded>,
  "situation": "<English, one or two short sentences: who is talking, where, why. Set the scene, no spoilers. It must not answer any question, including the gist question>",
  "speakers": { "<who>": "f|m|f2|m2", … },     // every "who" used in body, max 4 speakers, each a different voice
  "body": [ { "who": "<speaker>", "s": [ {"it":"…","en":"…"}, … ] }, … ],   // one block = one turn
  "questions": [ { "q":"<question in Italian>", "o":["…","…","…"], "a":"<one of o>" }, … 8-10 ] }
```

## Make it work as audio
- Audio-native formats only: phone call, voicemail, conversation at a counter or shop, station or airport announcement, radio ad, weather forecast, traffic report, local news brief, radio phone-in, podcast segment, interview, guided tour, doctor or vet visit, job interview, landlord call, a friend telling a story, a short talk or lecture excerpt, a debate on the radio.
- Nothing visual ("as you can see", "look at this"). The listener must be able to follow from sound alone.
- Natural spoken Italian for the situation: allora, cioè, dunque, insomma, senti, guarda, eh, boh, mi raccomando, va be'. Use them like real people do, not in every line. Announcements and news use their own formal register.
- Short turns. Spoken sentences are shorter than written ones. One sentence per `s` object.
- Concrete details the ear must catch: times, prices, platform numbers, days, addresses, names spelled out when needed, what someone actually decided. At B1/B2 also attitude, intention, irony, what is implied.
- Voices: "f" and "f2" are two different female voices, "m" and "m2" two different male voices. Match the voice to the speaker's gender. A monologue (announcement, podcast) has one speaker, e.g. "Annunciatrice" or the host's name.
- Every block has "who", and every "who" is a key in "speakers".

## Length: these are LONG, real-world audio (5–10 minutes)
Italian words: A1 600–750 (≈5 min) · A2 800–1000 (≈6–7 min) · B1 1050–1250 (≈8 min) · B2 1300–1500 (≈10 min). The validator enforces the minimum.

## Make 5–10 minutes worth listening to (never boring)
- It must hold attention like a good radio piece or podcast: a situation with a want, a problem, a complication, a turn or surprise, and an ending (resolved, funny or open).
- Use formats that naturally last several minutes: a radio programme with segments and a listener call, a podcast episode with a guest, a phone call that turns into a story, a series of voice messages across one day, scenes from one day (a short narrator line can link scenes), an interview, a debate, a guided visit with questions from the group.
- Give characters personality: a stubborn grandmother, a nervous first-timer, a talkative barista. Humour and small odd details. Let people interrupt, misunderstand, correct themselves.
- No lists of tourist facts, no lecture tone, no "lesson" dialogues where people ask questions only so the other can explain grammar or vocabulary.
- Pace: mix short quick turns with a few longer ones (one person telling something for 4–6 sentences).

## Questions
- In Italian, at the level (A1 very simple). 8–10 per exercise, in the order the answers come in the audio. 3 options each (A1–A2) or 3–4 (B1–B2).
- The first question is about the gist. Neither the title, the genre nor the situation may give away the answer to ANY question. The rest test details and, from B1, inference and the speaker's attitude.
- Wrong options must be plausible: they use words that are in the audio, or a detail that was mentioned and then corrected ("No, not Tuesday — Wednesday").
- Each question has one clearly correct answer from the audio alone.

Validate: `node content/validate.mjs listening <file>` (from ~/Desktop/parlo-app). Fix every error.
When done, reply with one line per exercise: id, genre, words, speakers.
