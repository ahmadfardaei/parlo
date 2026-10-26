// Grammar lessons: the main verb tenses. Separate from the 40 vocabulary units.
// Exercise types: "type" (write the form; `a` lists accepted answers) and "mc" (choose; `a` is the right option).

const P = ["io", "tu", "lui / lei", "noi", "voi", "loro"];

export const GRAMMAR = [
  {
    id: "pres", tense: "pres", level: "A1", title: "Presente", en: "Present tense",
    summary: "The everyday tense: what you do, what's true, what's happening now, and often what's already planned.",
    meaning: "The presente covers more ground than the English present. It translates “I speak”, “I'm speaking”, “I do speak”, and often “I'm going to speak”. With <b>da</b> it even translates the English “I have been doing”.",
    uses: [
      { h: "Habits and routines", t: "Things you do regularly.", ex: ["Ogni mattina bevo un caffè al bar.", "Every morning I drink a coffee at the bar."] },
      { h: "Facts and states", t: "Things that are true in general or right now.", ex: ["Roma è la capitale d'Italia.", "Rome is the capital of Italy."] },
      { h: "Right now", t: "Where English uses -ing. Use <b>stare</b> + gerund only to stress that it's happening this very moment.", ex: ["Che fai? — Guardo un film.", "What are you doing? — I'm watching a film."] },
      { h: "Planned future", t: "For arrangements, especially with a time word.", ex: ["Domani parto per Napoli.", "I'm leaving for Naples tomorrow."] },
      { h: "“Since / for” with da", t: "For something that started in the past and is still going on. English uses the present perfect here; Italian uses the presente.", ex: ["Studio italiano da due anni.", "I've been studying Italian for two years."] }
    ],
    form: {
      intro: "Drop <b>-are</b>, <b>-ere</b> or <b>-ire</b> and add the endings. Subject pronouns (io, tu…) are usually left out: the ending already tells you who.",
      tables: [
        { h: "-are · parlare", stem: "parl", end: ["o", "i", "a", "iamo", "ate", "ano"] },
        { h: "-ere · prendere", stem: "prend", end: ["o", "i", "e", "iamo", "ete", "ono"] },
        { h: "-ire · dormire", stem: "dorm", end: ["o", "i", "e", "iamo", "ite", "ono"] },
        { h: "-ire (-isc-) · finire", stem: "fin", end: ["isco", "isci", "isce", "iamo", "ite", "iscono"] }
      ],
      notes: [
        "<b>-care / -gare</b> keep their hard sound with an h before i: cerchi, cerchiamo; paghi, paghiamo.",
        "<b>-iare</b> verbs keep only one i: mangi (not mangii), studi, mangiamo.",
        "Many -ire verbs take <b>-isc-</b> (finire, capire, preferire, pulire, spedire) except in noi and voi. Learn them as you meet them."
      ]
    },
    irregular: [
      ["essere", "sono, sei, è, siamo, siete, sono"], ["avere", "ho, hai, ha, abbiamo, avete, hanno"],
      ["andare", "vado, vai, va, andiamo, andate, vanno"], ["fare", "faccio, fai, fa, facciamo, fate, fanno"],
      ["stare", "sto, stai, sta, stiamo, state, stanno"], ["dare", "do, dai, dà, diamo, date, danno"],
      ["dire", "dico, dici, dice, diciamo, dite, dicono"], ["venire", "vengo, vieni, viene, veniamo, venite, vengono"],
      ["uscire", "esco, esci, esce, usciamo, uscite, escono"], ["volere", "voglio, vuoi, vuole, vogliamo, volete, vogliono"],
      ["potere", "posso, puoi, può, possiamo, potete, possono"], ["dovere", "devo, devi, deve, dobbiamo, dovete, devono"],
      ["sapere", "so, sai, sa, sappiamo, sapete, sanno"], ["bere", "bevo, bevi, beve, beviamo, bevete, bevono"]
    ],
    signals: ["sempre", "di solito", "ogni giorno", "spesso", "adesso", "oggi", "da + time"],
    mistakes: [
      { wrong: "Sono studiando.", right: "Studio. / Sto studiando.", why: "The -ing form uses <b>stare</b>, never essere." },
      { wrong: "Abito qui per tre anni.", right: "Abito qui da tre anni.", why: "Still living here → presente + <b>da</b>." },
      { wrong: "Io parlo italiano.", right: "Parlo italiano.", why: "Not wrong, but the pronoun sounds emphatic (“<i>I</i> speak Italian”). Leave it out normally." }
    ],
    ex: [
      { k: "type", q: "Di solito ___ alle sette.", v: "svegliarsi", p: "io", a: ["mi sveglio"], why: "Reflexive: mi + sveglio." },
      { k: "type", q: "Noi ___ italiano da un anno.", v: "studiare", a: ["studiamo"], why: "-iare: only one i → studiamo." },
      { k: "type", q: "Tu ___ la pizza o la pasta?", v: "preferire", a: ["preferisci"], why: "Preferire takes -isc-: preferisco, preferisci…" },
      { k: "type", q: "Loro ___ sempre tardi.", v: "finire", a: ["finiscono"], why: "-isc- verb: finiscono." },
      { k: "type", q: "Che cosa ___ voi stasera?", v: "fare", a: ["fate"], why: "Fare is irregular: facciamo, fate, fanno." },
      { k: "type", q: "Non ___ venire, ho da fare.", v: "potere", p: "io", a: ["posso"], why: "Potere: posso, puoi, può…" },
      { k: "type", q: "Marco e Anna ___ a Roma domani.", v: "andare", a: ["vanno"], why: "Presente for a planned trip. Andare: vado, vai, va, andiamo, andate, vanno." },
      { k: "type", q: "Noi ___ il conto.", v: "pagare", a: ["paghiamo"], why: "-gare keeps the hard g: paghiamo." },
      { k: "type", q: "___ la verità, te lo giuro.", v: "dire", p: "io", a: ["dico"], why: "Dire: dico, dici, dice…" },
      { k: "type", q: "Voi ___ un caffè?", v: "volere", a: ["volete"], why: "Volere: voglio, vuoi, vuole, vogliamo, volete, vogliono." },
      { k: "mc", q: "Abito a Milano ___ cinque anni.", o: ["da", "per", "fa", "tra"], a: "da", why: "Still true now → presente + da." },
      { k: "mc", q: "“Shh! I'm watching the news.”", o: ["Sto guardando il telegiornale.", "Sono guardando il telegiornale.", "Guardavo il telegiornale."], a: "Sto guardando il telegiornale.", why: "In progress right now → stare + gerund (or simply guardo)." }
    ]
  },
  {
    id: "pp", tense: "pp", level: "A1", title: "Passato prossimo", en: "Present perfect / past",
    summary: "The everyday past: finished actions, what happened and what you did.",
    meaning: "The passato prossimo is the main past tense of spoken Italian. It covers both “I did” and “I have done”. It's made of two words: <b>avere</b> or <b>essere</b> in the presente + the <b>past participle</b>.",
    uses: [
      { h: "A finished action", t: "Something that happened and is over, often with a time word.", ex: ["Ieri ho mangiato al ristorante.", "Yesterday I ate at a restaurant."] },
      { h: "A sequence of events", t: "One thing after another: the story moves forward.", ex: ["Sono arrivata, ho posato la borsa e ho chiamato mia madre.", "I arrived, put down my bag and called my mother."] },
      { h: "Experiences and results", t: "Where English uses “have done”.", ex: ["Hai mai visto Venezia? — No, mai.", "Have you ever seen Venice? — No, never."] },
      { h: "A closed period", t: "Something that lasted a set time and is finished.", ex: ["Ho vissuto a Londra per tre anni.", "I lived in London for three years."] }
    ],
    form: {
      intro: "<b>avere / essere</b> (presente) + <b>past participle</b>. Regular participles: <b>-are → -ato</b> (parlato), <b>-ere → -uto</b> (venduto), <b>-ire → -ito</b> (dormito).",
      tables: [
        { h: "with avere · mangiare", rows: ["ho mangiato", "hai mangiato", "ha mangiato", "abbiamo mangiato", "avete mangiato", "hanno mangiato"] },
        { h: "with essere · andare", rows: ["sono andato/a", "sei andato/a", "è andato/a", "siamo andati/e", "siete andati/e", "sono andati/e"] }
      ],
      notes: [
        "<b>avere</b>: most verbs, and every verb with a direct object (<i>ho mangiato una pizza</i>).",
        "<b>essere</b>: movement and change verbs without an object (andare, venire, arrivare, partire, uscire, entrare, tornare, salire, scendere, nascere, morire, diventare, rimanere, succedere), essere and stare, piacere, and <b>every reflexive verb</b> (mi sono alzato).",
        "With <b>essere</b> the participle agrees with the subject like an adjective: Marco è andat<b>o</b>, Anna è andat<b>a</b>, siamo andat<b>i</b>, le ragazze sono andat<b>e</b>."
      ]
    },
    irregular: [
      ["fare", "fatto"], ["dire", "detto"], ["prendere", "preso"], ["mettere", "messo"], ["vedere", "visto"], ["leggere", "letto"],
      ["scrivere", "scritto"], ["aprire", "aperto"], ["chiudere", "chiuso"], ["bere", "bevuto"], ["venire", "venuto"], ["rimanere", "rimasto"],
      ["nascere", "nato"], ["morire", "morto"], ["essere / stare", "stato"], ["vivere", "vissuto"], ["rispondere", "risposto"], ["chiedere", "chiesto"],
      ["scegliere", "scelto"], ["perdere", "perso"], ["decidere", "deciso"], ["succedere", "successo"], ["spendere", "speso"], ["correre", "corso"]
    ],
    signals: ["ieri", "stamattina", "la settimana scorsa", "l'anno scorso", "due giorni fa", "una volta", "già", "mai", "appena"],
    mistakes: [
      { wrong: "Ho andato al cinema.", right: "Sono andato/a al cinema.", why: "Andare is a movement verb → <b>essere</b>." },
      { wrong: "Maria è arrivato.", right: "Maria è arrivata.", why: "With essere the participle agrees with the subject." },
      { wrong: "Ho vissuto a Roma da tre anni.", right: "Ho vissuto a Roma per tre anni.", why: "Finished period → <b>per</b>. (Still living there → <i>Vivo a Roma da tre anni</i>.)" }
    ],
    ex: [
      { k: "type", q: "Ieri ___ un bel film.", v: "vedere", p: "io", a: ["ho visto", "ho veduto"], why: "Vedere → visto (irregular participle), with avere." },
      { k: "type", q: "Anna ___ a casa alle otto.", v: "tornare", a: ["è tornata"], why: "Tornare takes essere; Anna is feminine → tornata." },
      { k: "type", q: "Noi ___ la pizza ieri sera.", v: "mangiare", a: ["abbiamo mangiato"], why: "Direct object (la pizza) → avere." },
      { k: "type", q: "I ragazzi ___ presto stamattina.", v: "uscire", a: ["sono usciti"], why: "Uscire takes essere; masculine plural → usciti." },
      { k: "type", q: "Tu ___ la lettera?", v: "scrivere", a: ["hai scritto"], why: "Scrivere → scritto." },
      { k: "type", q: "Stamattina ___ alle sei.", v: "svegliarsi", p: "io", a: ["mi sono svegliato", "mi sono svegliata"], why: "Reflexive verbs always take essere." },
      { k: "type", q: "Che cosa ___ voi a Natale?", v: "fare", a: ["avete fatto"], why: "Fare → fatto, with avere." },
      { k: "type", q: "Mia nonna ___ nel 1950.", v: "nascere", a: ["è nata"], why: "Nascere takes essere → nata." },
      { k: "type", q: "Loro ___ il treno delle nove.", v: "prendere", a: ["hanno preso"], why: "Prendere → preso." },
      { k: "type", q: "___ la finestra perché faceva caldo.", v: "aprire", p: "io", a: ["ho aperto"], why: "Aprire → aperto." },
      { k: "mc", q: "Luca ___ a Parigi l'anno scorso.", o: ["è andato", "ha andato", "è andata"], a: "è andato", why: "Essere + masculine singular participle." },
      { k: "mc", q: "La festa mi ___ moltissimo.", o: ["è piaciuta", "ha piaciuto", "è piaciuto"], a: "è piaciuta", why: "Piacere takes essere and agrees with what is liked: la festa → piaciuta." },
      { k: "mc", q: "“Have you ever been to Venice?”", o: ["Sei mai stato a Venezia?", "Hai mai stato a Venezia?", "Sei mai essuto a Venezia?"], a: "Sei mai stato a Venezia?", why: "Essere's participle is <b>stato</b>, with essere." }
    ]
  },
  {
    id: "imp", tense: "imp", level: "A2", title: "Imperfetto", en: "Imperfect",
    summary: "The background past: how things were, what used to happen, what was going on.",
    meaning: "The imperfetto describes the past without focusing on a start or an end. Think of it as the <b>scenery</b> of a story: descriptions, habits, and actions in progress. English uses “used to”, “would” or “was doing”, or just the simple past.",
    uses: [
      { h: "Past habits", t: "What used to happen regularly.", ex: ["Da bambino andavo al mare ogni estate.", "As a child I went to the seaside every summer."] },
      { h: "Descriptions", t: "People, places, weather, feelings, age, time.", ex: ["Era una giornata fredda e pioveva.", "It was a cold day and it was raining."] },
      { h: "In progress, then interrupted", t: "The background action is in the imperfetto; the event that interrupts it is in the passato prossimo.", ex: ["Mentre cucinavo, è suonato il telefono.", "While I was cooking, the phone rang."] },
      { h: "Two things at once", t: "Parallel actions in the past, often with mentre.", ex: ["Io leggevo e lui dormiva.", "I was reading and he was sleeping."] },
      { h: "Polite requests", t: "A softer way to ask in shops and offices.", ex: ["Volevo un caffè, per favore.", "I'd like a coffee, please."] }
    ],
    form: {
      intro: "The most regular tense in Italian: drop the final <b>-re</b> and add <b>-vo, -vi, -va, -vamo, -vate, -vano</b>.",
      tables: [
        { h: "-are · parlare", stem: "parla", end: ["vo", "vi", "va", "vamo", "vate", "vano"] },
        { h: "-ere · prendere", stem: "prende", end: ["vo", "vi", "va", "vamo", "vate", "vano"] },
        { h: "-ire · dormire", stem: "dormi", end: ["vo", "vi", "va", "vamo", "vate", "vano"] }
      ],
      notes: ["The stress in noi and voi stays on the -va-: parlaVAmo, parlaVAte."]
    },
    irregular: [
      ["essere", "ero, eri, era, eravamo, eravate, erano"], ["fare", "facevo, facevi, faceva…"], ["dire", "dicevo, dicevi, diceva…"],
      ["bere", "bevevo, bevevi, beveva…"], ["proporre (-porre)", "proponevo, proponevi…"], ["tradurre (-durre)", "traducevo, traducevi…"]
    ],
    signals: ["da bambino/a", "di solito", "ogni estate", "sempre", "spesso", "mentre", "c'era una volta"],
    mistakes: [
      { wrong: "Da piccolo sono andato al mare ogni estate.", right: "Da piccolo andavo al mare ogni estate.", why: "A repeated habit → imperfetto." },
      { wrong: "Mentre ho cucinato, è arrivato Marco.", right: "Mentre cucinavo, è arrivato Marco.", why: "The background action in progress → imperfetto." }
    ],
    ex: [
      { k: "type", q: "Da bambino ___ molto.", v: "leggere", p: "io", a: ["leggevo"], why: "Regular: legge- + vo." },
      { k: "type", q: "Quando eravamo piccoli, ___ sempre in giardino.", v: "giocare", a: ["giocavamo"], why: "A past habit → imperfetto." },
      { k: "type", q: "Mentre tu ___, io cucinavo.", v: "dormire", a: ["dormivi"], why: "Two parallel actions → both imperfetto." },
      { k: "type", q: "Mia nonna ___ una casa in campagna.", v: "avere", a: ["aveva"], why: "A description of the past." },
      { k: "type", q: "Che tempo ___ ieri?", v: "fare", a: ["faceva"], why: "Weather is description; fare → facevo, facevi, faceva." },
      { k: "type", q: "I miei genitori ___ molto giovani.", v: "essere", a: ["erano"], why: "Essere is irregular: ero, eri, era, eravamo, eravate, erano." },
      { k: "type", q: "Voi ___ spesso al cinema?", v: "andare", a: ["andavate"], why: "A past habit (spesso)." },
      { k: "type", q: "Scusi, ___ chiedere un'informazione.", v: "volere", p: "io", a: ["volevo"], why: "Polite imperfetto: volevo." },
      { k: "type", q: "Loro ___ sempre la verità.", v: "dire", a: ["dicevano"], why: "Dire → dicevo, dicevi…" },
      { k: "type", q: "Ieri sera ___ stanchissimi.", v: "essere", p: "noi", a: ["eravamo"], why: "A state (tiredness) → imperfetto." },
      { k: "mc", q: "Ogni domenica ___ dai nonni.", o: ["andavamo", "siamo andati", "andremo"], a: "andavamo", why: "Ogni domenica = a habit → imperfetto." },
      { k: "mc", q: "Mentre ___ la doccia, è andata via la luce.", o: ["facevo", "ho fatto", "farò"], a: "facevo", why: "The action in progress when something happened." }
    ]
  },
  {
    id: "ppimp", tense: null, level: "A2", title: "Passato prossimo o imperfetto?", en: "Choosing the past tense",
    summary: "The key question of the Italian past: is it an event, or the background?",
    meaning: "Think of a film. The <b>passato prossimo</b> is the action: what happened, step by step, with an end. The <b>imperfetto</b> is the set and the atmosphere: what things were like, what was going on, what used to happen.",
    uses: [
      { h: "Event vs background", t: "Passato prossimo moves the story forward; imperfetto describes the scene.", ex: ["Era tardi e pioveva. Ho chiamato un taxi.", "It was late and it was raining. I called a taxi."] },
      { h: "Interruption", t: "The ongoing action is imperfetto, the interrupting event passato prossimo.", ex: ["Leggevo quando è arrivato Marco.", "I was reading when Marco arrived."] },
      { h: "Once vs regularly", t: "A single time (or a counted number of times) vs a habit.", ex: ["Sono andato in Spagna tre volte. / Andavo in Spagna ogni estate.", "I went to Spain three times. / I used to go to Spain every summer."] },
      { h: "Closed vs open time", t: "A period with a clear end vs an unbounded background.", ex: ["Ho abitato a Roma per due anni. / Abitavo a Roma quando ti ho conosciuto.", "I lived in Rome for two years. / I was living in Rome when I met you."] },
      { h: "Verbs that change meaning", t: "Conoscevo = I knew / ho conosciuto = I met. Sapevo = I knew / ho saputo = I found out. Dovevo = I was supposed to / ho dovuto = I had to (and did).", ex: ["Conoscevo Laura, ma ieri ho conosciuto suo fratello.", "I knew Laura, but yesterday I met her brother."] }
    ],
    form: {
      intro: "Ask yourself one question: <b>does it move the story forward?</b> Yes → passato prossimo. No, it sets the scene or repeats → imperfetto.",
      compare: [
        ["Passato prossimo", "Imperfetto"],
        ["What happened", "What was going on"],
        ["Single or counted events", "Habits and repetition"],
        ["Clear beginning or end", "No focus on beginning or end"],
        ["ieri, una volta, tre volte, all'improvviso", "mentre, di solito, sempre, da bambino"]
      ]
    },
    signals: ["all'improvviso → pp", "una volta → pp", "mentre → imp", "di solito → imp", "ogni giorno → imp", "per due ore → pp"],
    mistakes: [
      { wrong: "Ieri ero al cinema e vedevo un film.", right: "Ieri sono andato al cinema e ho visto un film.", why: "Completed events in sequence → passato prossimo." },
      { wrong: "Ho conosciuto Paolo da anni.", right: "Conosco Paolo da anni.", why: "Still true now → presente + da." }
    ],
    ex: [
      { k: "mc", q: "Quando ___ piccola, avevo un gatto.", o: ["ero", "sono stata"], a: "ero", why: "Description of a past period → imperfetto." },
      { k: "mc", q: "Mentre leggevo, ___ il telefono.", o: ["suonava", "è suonato"], a: "è suonato", why: "The event that interrupts → passato prossimo." },
      { k: "mc", q: "Ieri ___ Laura a una festa: è simpaticissima!", o: ["conoscevo", "ho conosciuto"], a: "ho conosciuto", why: "Meeting someone for the first time = ho conosciuto." },
      { k: "mc", q: "Da giovane mio padre ___ a calcio ogni sabato.", o: ["giocava", "ha giocato"], a: "giocava", why: "Ogni sabato = habit → imperfetto." },
      { k: "mc", q: "La casa ___ grande e luminosa.", o: ["era", "è stata"], a: "era", why: "Description → imperfetto." },
      { k: "mc", q: "Stamattina ___ alle sette e sono uscito subito.", o: ["mi alzavo", "mi sono alzato"], a: "mi sono alzato", why: "A sequence of single events → passato prossimo." },
      { k: "mc", q: "Non sono venuto alla festa perché ___ male.", o: ["stavo", "sono stato"], a: "stavo", why: "The background reason, a state → imperfetto." },
      { k: "mc", q: "___ in Spagna tre volte.", o: ["Andavo", "Sono andato"], a: "Sono andato", why: "A counted number of times → passato prossimo." },
      { k: "mc", q: "Che cosa ___ quando ti ho chiamato?", o: ["facevi", "hai fatto"], a: "facevi", why: "Action in progress when the call came → imperfetto." },
      { k: "mc", q: "Ieri ___ a casa tutto il giorno.", o: ["sono rimasto", "rimanevo"], a: "sono rimasto", why: "A closed, finished period (tutto il giorno) → passato prossimo." },
      { k: "mc", q: "Non ___ che eri in città! Perché non mi hai chiamato?", o: ["sapevo", "ho saputo"], a: "sapevo", why: "Sapevo = I knew (a state). Ho saputo = I found out." },
      { k: "mc", q: "All'improvviso ___ a piovere.", o: ["cominciava", "è cominciato"], a: "è cominciato", why: "All'improvviso marks a sudden event → passato prossimo." }
    ]
  },
  {
    id: "fut", tense: "fut", level: "A2", title: "Futuro semplice", en: "Future",
    summary: "Plans, predictions and promises, and also guesses about the present.",
    meaning: "The futuro translates “I will do” and “I'm going to do”. In everyday speech Italians often use the <b>presente</b> for near, certain plans (<i>domani vado a Roma</i>), so the futuro sounds more distant, more formal or more uncertain.",
    uses: [
      { h: "Future plans and events", t: "Especially further away or less certain.", ex: ["L'anno prossimo andrò in Giappone.", "Next year I'll go to Japan."] },
      { h: "Predictions", t: "What you expect to happen.", ex: ["Domani pioverà al nord.", "Tomorrow it will rain in the north."] },
      { h: "Promises", t: "Commitments and decisions.", ex: ["Te lo prometto: arriverò in orario.", "I promise: I'll be on time."] },
      { h: "Guessing about now", t: "A very Italian use: the futuro expresses probability in the present.", ex: ["Dov'è Marco? — Sarà a casa.", "Where's Marco? — He's probably at home."] },
      { h: "After quando and se", t: "When the future is meant, Italian keeps the futuro where English uses the present.", ex: ["Quando arriverai, ti chiamerò.", "When you arrive, I'll call you."] }
    ],
    form: {
      intro: "Take the infinitive, drop the final <b>-e</b>, and add <b>-ò, -ai, -à, -emo, -ete, -anno</b>. In -are verbs the a becomes <b>e</b>: parlare → parler-.",
      tables: [
        { h: "-are · parlare", stem: "parler", end: ["ò", "ai", "à", "emo", "ete", "anno"] },
        { h: "-ere · prendere", stem: "prender", end: ["ò", "ai", "à", "emo", "ete", "anno"] },
        { h: "-ire · dormire", stem: "dormir", end: ["ò", "ai", "à", "emo", "ete", "anno"] }
      ],
      notes: [
        "<b>-care / -gare</b> add h: cercherò, pagherò.",
        "<b>-ciare / -giare</b> drop the i: mangerò, comincerò.",
        "Watch the accents: parlerò, parlerà. They're part of the spelling."
      ]
    },
    irregular: [
      ["essere", "sarò, sarai, sarà…"], ["avere", "avrò"], ["andare", "andrò"], ["fare", "farò"], ["dare", "darò"], ["stare", "starò"],
      ["potere", "potrò"], ["dovere", "dovrò"], ["sapere", "saprò"], ["vedere", "vedrò"], ["vivere", "vivrò"], ["volere", "vorrò"],
      ["venire", "verrò"], ["rimanere", "rimarrò"], ["bere", "berrò"], ["tenere", "terrò"]
    ],
    signals: ["domani", "dopodomani", "la settimana prossima", "fra / tra due giorni", "in futuro", "presto", "un giorno"],
    mistakes: [
      { wrong: "Mangiarò la pizza.", right: "Mangerò la pizza.", why: "-are verbs change a → e, and -giare drops the i." },
      { wrong: "Venirò domani.", right: "Verrò domani.", why: "Venire has an irregular stem: verr-." }
    ],
    ex: [
      { k: "type", q: "L'anno prossimo ___ in Sicilia.", v: "andare", p: "io", a: ["andrò"], why: "Irregular stem andr- + ò." },
      { k: "type", q: "Domani ___ tutto il giorno.", v: "piovere", a: ["pioverà"], why: "Prediction: pioverà." },
      { k: "type", q: "Noi ___ alle otto.", v: "arrivare", a: ["arriveremo"], why: "-are → -er-: arriveremo." },
      { k: "type", q: "Tu ___ venire alla festa?", v: "potere", a: ["potrai"], why: "Irregular stem potr-." },
      { k: "type", q: "Quando ___ grandi, capiranno.", v: "essere", p: "loro", a: ["saranno"], why: "Essere → sar-." },
      { k: "type", q: "Voi ___ il treno o l'aereo?", v: "prendere", a: ["prenderete"], why: "Regular: prender- + ete." },
      { k: "type", q: "Ti ___ domani, va bene?", v: "chiamare", p: "io", a: ["chiamerò"], why: "A promise → futuro." },
      { k: "type", q: "Loro ___ a cena da noi.", v: "venire", a: ["verranno"], why: "Venire → verr-." },
      { k: "type", q: "Che cosa ___ da grande?", v: "fare", p: "tu", a: ["farai"], why: "Fare → far-." },
      { k: "type", q: "Stasera ___ la pizza.", v: "mangiare", p: "noi", a: ["mangeremo"], why: "-giare drops the i: mangeremo." },
      { k: "type", q: "___ io il conto.", v: "pagare", p: "io", a: ["pagherò"], why: "-gare adds h: pagherò." },
      { k: "mc", q: "Dov'è Giulia? — Non so, ___ in ufficio.", o: ["sarà", "è stata", "era"], a: "sarà", why: "A guess about the present → futuro (“she's probably…”)." }
    ]
  },
  {
    id: "cond", tense: "cond", level: "A2", title: "Condizionale", en: "Conditional (would)",
    summary: "“Would”: polite requests, wishes, advice, and things that depend on something else.",
    meaning: "The condizionale presente translates “would do”. You'll use it every day without thinking about hypotheses at all, because it's the polite way to ask for things: <b>vorrei</b>, <b>potrebbe</b>, <b>mi piacerebbe</b>.",
    uses: [
      { h: "Polite requests", t: "In shops, restaurants and offices.", ex: ["Vorrei un caffè. Potrebbe portarmi il conto?", "I'd like a coffee. Could you bring me the bill?"] },
      { h: "Wishes", t: "Often with piacere.", ex: ["Mi piacerebbe vivere al mare.", "I'd love to live by the sea."] },
      { h: "Advice", t: "<b>Dovresti</b> = you should; <b>potresti</b> = you could.", ex: ["Dovresti dormire di più.", "You should sleep more."] },
      { h: "Hypothetical", t: "What would happen. With “se” it pairs with the congiuntivo imperfetto (B1): se avessi tempo, viaggerei.", ex: ["Con più tempo, studierei anche il cinese.", "With more time, I'd also study Chinese."] },
      { h: "Reported, unconfirmed news", t: "Journalists use it for “reportedly” (B2).", ex: ["Secondo i giornali, il ministro sarebbe a Parigi.", "According to the papers, the minister is reportedly in Paris."] }
    ],
    form: {
      intro: "Same stem as the futuro, with the endings <b>-ei, -esti, -ebbe, -emmo, -este, -ebbero</b>.",
      tables: [
        { h: "-are · parlare", stem: "parler", end: ["ei", "esti", "ebbe", "emmo", "este", "ebbero"] },
        { h: "-ere · prendere", stem: "prender", end: ["ei", "esti", "ebbe", "emmo", "este", "ebbero"] },
        { h: "-ire · dormire", stem: "dormir", end: ["ei", "esti", "ebbe", "emmo", "este", "ebbero"] }
      ],
      notes: [
        "Every irregular futuro stem is irregular here too: sar-, avr-, andr-, far-, potr-, dovr-, vorr-, verr-…",
        "Don't mix up noi: <b>parleremmo</b> (we would speak, double m) vs <b>parleremo</b> (we will speak)."
      ]
    },
    irregular: [
      ["essere", "sarei, saresti, sarebbe…"], ["avere", "avrei"], ["andare", "andrei"], ["fare", "farei"], ["potere", "potrei"],
      ["dovere", "dovrei"], ["volere", "vorrei"], ["venire", "verrei"], ["sapere", "saprei"], ["vivere", "vivrei"], ["stare", "starei"], ["bere", "berrei"]
    ],
    signals: ["per favore", "volentieri", "al tuo posto", "secondo me", "con più tempo", "magari"],
    mistakes: [
      { wrong: "Io vorrebbi un caffè.", right: "Io vorrei un caffè.", why: "io → -ei." },
      { wrong: "Domani andremmo al mare. (meaning “we will go”)", right: "Domani andremo al mare.", why: "One m = will, two m = would." }
    ],
    ex: [
      { k: "type", q: "___ un bicchiere d'acqua, per favore.", v: "volere", p: "io", a: ["vorrei"], why: "Polite request: vorrei." },
      { k: "type", q: "Tu ___ studiare di più.", v: "dovere", a: ["dovresti"], why: "Advice: dovresti = you should." },
      { k: "type", q: "Mi ___ vedere quel film.", v: "piacere", a: ["piacerebbe"], why: "Wish: mi piacerebbe." },
      { k: "type", q: "Scusi, ___ chiudere la finestra?", v: "potere", p: "Lei", a: ["potrebbe"], why: "Formal Lei uses the 3rd person: potrebbe." },
      { k: "type", q: "Noi ___ volentieri, ma siamo stanchi.", v: "venire", a: ["verremmo"], why: "Venire → verr- + emmo." },
      { k: "type", q: "Al tuo posto, io non lo ___.", v: "fare", a: ["farei"], why: "Fare → far- + ei." },
      { k: "type", q: "Voi ___ un po' di vino?", v: "prendere", a: ["prendereste"], why: "Regular: prender- + este." },
      { k: "type", q: "Loro ___ felici di conoscerti.", v: "essere", a: ["sarebbero"], why: "Essere → sar- + ebbero." },
      { k: "type", q: "Che cosa ___ al mio posto?", v: "fare", p: "tu", a: ["faresti"], why: "far- + esti." },
      { k: "type", q: "___ in Italia per sempre.", v: "vivere", p: "io", a: ["vivrei"], why: "Vivere → vivr- + ei." },
      { k: "mc", q: "“We'd go to Rome tomorrow, but we have no time.”", o: ["Andremmo a Roma domani, ma non abbiamo tempo.", "Andremo a Roma domani, ma non abbiamo tempo."], a: "Andremmo a Roma domani, ma non abbiamo tempo.", why: "Would → double m: andremmo." },
      { k: "mc", q: "“You should rest.” (friendly advice)", o: ["Dovresti riposarti.", "Dovrai riposarti.", "Dovevi riposarti."], a: "Dovresti riposarti.", why: "Dovresti = should. Dovrai = you will have to." }
    ]
  },
  {
    id: "cong", tense: "cong", level: "B1", title: "Congiuntivo presente", en: "Present subjunctive",
    summary: "The mood of opinions, doubts, wishes and feelings: “penso che sia…”.",
    meaning: "The congiuntivo isn't a time, it's a <b>mood</b>. It marks what's subjective or uncertain: what someone thinks, wants, hopes, fears or doubts. It almost always appears after <b>che</b>, in the second half of a sentence.",
    uses: [
      { h: "Opinions and beliefs", t: "penso che, credo che, mi sembra che, immagino che.", ex: ["Penso che Marco abbia ragione.", "I think Marco is right."] },
      { h: "Wishes and wants", t: "voglio che, spero che, preferisco che.", ex: ["Spero che tu stia bene.", "I hope you're well."] },
      { h: "Feelings", t: "sono contento che, ho paura che, mi dispiace che.", ex: ["Sono felice che siate qui.", "I'm happy you're here."] },
      { h: "Doubt", t: "non so se, dubito che, non sono sicuro che.", ex: ["Non sono sicura che sia vero.", "I'm not sure it's true."] },
      { h: "Impersonal phrases", t: "è importante che, è meglio che, bisogna che, è possibile che.", ex: ["È importante che tu dorma abbastanza.", "It's important that you sleep enough."] },
      { h: "Some conjunctions", t: "benché, sebbene (although), prima che (before), affinché (so that), a meno che (unless), purché (as long as).", ex: ["Esco benché piova.", "I'm going out although it's raining."] }
    ],
    form: {
      intro: "-are verbs take <b>-i</b>; -ere and -ire verbs take <b>-a</b>. The three singular forms are the same, so add <b>io / tu / lui</b> when it's unclear who you mean.",
      tables: [
        { h: "-are · parlare", stem: "parl", end: ["i", "i", "i", "iamo", "iate", "ino"], che: true },
        { h: "-ere · prendere", stem: "prend", end: ["a", "a", "a", "iamo", "iate", "ano"], che: true },
        { h: "-ire · dormire", stem: "dorm", end: ["a", "a", "a", "iamo", "iate", "ano"], che: true },
        { h: "-ire (-isc-) · finire", stem: "fin", end: ["isca", "isca", "isca", "iamo", "iate", "iscano"], che: true }
      ],
      notes: [
        "Shortcut for irregulars: start from the <b>io</b> form of the presente. vengo → venga, dico → dica, faccio → faccia, esco → esca, posso → possa.",
        "<b>Same subject → di + infinitive</b>: Penso <b>di</b> avere ragione (not “penso che io abbia”).",
        "<b>Certainty → indicativo</b>: So che è vero. Sono sicuro che viene. È vero che…"
      ]
    },
    irregular: [
      ["essere", "sia, sia, sia, siamo, siate, siano"], ["avere", "abbia, abbia, abbia, abbiamo, abbiate, abbiano"], ["andare", "vada, vada, vada, andiamo, andiate, vadano"],
      ["fare", "faccia… facciamo, facciate, facciano"], ["stare", "stia… stiamo, stiate, stiano"], ["dare", "dia… diamo, diate, diano"],
      ["dire", "dica… diciamo, diciate, dicano"], ["venire", "venga… veniamo, veniate, vengano"], ["potere", "possa… possiamo, possiate, possano"],
      ["volere", "voglia… vogliamo, vogliate, vogliano"], ["dovere", "debba… dobbiamo, dobbiate, debbano"], ["sapere", "sappia… sappiamo, sappiate, sappiano"], ["uscire", "esca… usciamo, usciate, escano"]
    ],
    signals: ["penso che", "credo che", "spero che", "voglio che", "è importante che", "bisogna che", "benché", "prima che"],
    mistakes: [
      { wrong: "Penso che è vero.", right: "Penso che sia vero.", why: "Very common in casual speech, but correct Italian uses the congiuntivo after penso che." },
      { wrong: "Spero che vieni.", right: "Spero che tu venga.", why: "Spero che + congiuntivo." },
      { wrong: "Penso che io abbia ragione.", right: "Penso di avere ragione.", why: "Same subject in both halves → di + infinitive." }
    ],
    ex: [
      { k: "type", q: "Penso che Marco ___ ragione.", v: "avere", a: ["abbia"], why: "Opinion → congiuntivo: abbia." },
      { k: "type", q: "Spero che tu ___ bene.", v: "stare", a: ["stia"], why: "Stare → stia." },
      { k: "type", q: "È importante che voi ___ presto.", v: "arrivare", a: ["arriviate"], why: "-are, voi: arriviate." },
      { k: "type", q: "Voglio che loro ___ la verità.", v: "dire", a: ["dicano"], why: "From dico → dicano." },
      { k: "type", q: "Credo che il film ___ alle nove.", v: "cominciare", a: ["cominci"], why: "-are verbs take -i: cominci." },
      { k: "type", q: "Sono contenta che tu ___ qui.", v: "essere", a: ["sia"], why: "Feeling → congiuntivo: sia." },
      { k: "type", q: "Bisogna che noi ___ subito.", v: "partire", a: ["partiamo"], why: "Noi is the same as the presente: partiamo." },
      { k: "type", q: "Non so se Anna ___ venire.", v: "potere", a: ["possa"], why: "Doubt → possa." },
      { k: "type", q: "Preferisco che tu ___ la macchina.", v: "prendere", a: ["prenda"], why: "-ere verbs take -a: prenda." },
      { k: "type", q: "Esco benché ___.", v: "piovere", a: ["piova"], why: "Benché always takes the congiuntivo." },
      { k: "type", q: "Dubito che loro ___ in tempo.", v: "finire", a: ["finiscano"], why: "-isc- verb: finiscano." },
      { k: "mc", q: "So che Luca ___ in Spagna.", o: ["è", "sia"], a: "è", why: "So che = certainty → indicativo." },
      { k: "mc", q: "“I think I'm right.”", o: ["Penso di avere ragione.", "Penso che io abbia ragione.", "Penso che ho ragione."], a: "Penso di avere ragione.", why: "Same subject → di + infinitive." }
    ]
  }
];

export const PRONOUNS = P;
