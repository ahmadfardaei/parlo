// Grammar lessons: the main verb tenses. Separate from the 40 vocabulary units.
// Exercise types: "type" (write the form; `a` lists accepted answers) and "mc" (choose; `a` is the right option).

const P = ["io", "tu", "lui / lei", "noi", "voi", "loro"];

export const GRAMMAR = [
  {
    id: "pres", tense: "pres", level: "A1", title: "Presente", en: "Present tense",
    summary: "The presente: use it for habits, facts, actions now and planned events.",
    meaning: "The presente has more uses than the English present. It translates “I speak”, “I am speaking” and often “I am going to speak”. With <b>da</b>, it also translates “I have been doing”.",
    uses: [
      { h: "Habits and routines", t: "Use the presente for actions you do regularly.", ex: ["Ogni mattina bevo un caffè al bar.", "Every morning I drink a coffee at the bar."] },
      { h: "Facts and states", t: "Use it for facts that are always true or true now.", ex: ["Roma è la capitale d'Italia.", "Rome is the capital of Italy."] },
      { h: "Right now", t: "Use it, or <b>stare</b> + gerund, for an action in progress now.", ex: ["Che fai? — Guardo un film.", "What are you doing? — I'm watching a film."] },
      { h: "Planned future", t: "Use it for arrangements, usually with a time word.", ex: ["Domani parto per Napoli.", "I'm leaving for Naples tomorrow."] },
      { h: "“Since / for” with da", t: "Use presente + <b>da</b> for an action that started in the past and continues.", ex: ["Studio italiano da due anni.", "I've been studying Italian for two years."] }
    ],
    form: {
      intro: "Remove <b>-are</b>, <b>-ere</b> or <b>-ire</b> and add the endings. Usually leave out the subject pronoun (io, tu…). The ending shows the subject.",
      tables: [
        { h: "-are · parlare", stem: "parl", end: ["o", "i", "a", "iamo", "ate", "ano"] },
        { h: "-ere · prendere", stem: "prend", end: ["o", "i", "e", "iamo", "ete", "ono"] },
        { h: "-ire · dormire", stem: "dorm", end: ["o", "i", "e", "iamo", "ite", "ono"] },
        { h: "-ire (-isc-) · finire", stem: "fin", end: ["isco", "isci", "isce", "iamo", "ite", "iscono"] }
      ],
      notes: [
        "<b>-care / -gare</b>: add h before i to keep the hard sound: cerchi, cerchiamo; paghi, paghiamo.",
        "<b>-iare</b>: keep only one i: mangi (not mangii), studi, mangiamo.",
        "Many -ire verbs add <b>-isc-</b>, except in noi and voi: finire, capire, preferire, pulire, spedire."
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
      { wrong: "Sono studiando.", right: "Studio. / Sto studiando.", why: "Make the -ing form with <b>stare</b>, never with essere." },
      { wrong: "Abito qui per tre anni.", right: "Abito qui da tre anni.", why: "The action continues now: use presente + <b>da</b>." },
      { wrong: "Io parlo italiano.", right: "Parlo italiano.", why: "The pronoun is not wrong, but it adds emphasis, so usually leave it out." }
    ],
    ex: [
      { k: "type", q: "Di solito ___ alle sette.", v: "svegliarsi", p: "io", a: ["mi sveglio"], why: "Reflexive verb: mi + sveglio." },
      { k: "type", q: "Noi ___ italiano da un anno.", v: "studiare", a: ["studiamo"], why: "-iare verbs keep only one i: studiamo." },
      { k: "type", q: "Tu ___ la pizza o la pasta?", v: "preferire", a: ["preferisci"], why: "Preferire takes -isc-: preferisco, preferisci." },
      { k: "type", q: "Loro ___ sempre tardi.", v: "finire", a: ["finiscono"], why: "-isc- verb: finiscono." },
      { k: "type", q: "Che cosa ___ voi stasera?", v: "fare", a: ["fate"], why: "Fare is irregular: facciamo, fate, fanno." },
      { k: "type", q: "Non ___ venire, ho da fare.", v: "potere", p: "io", a: ["posso"], why: "Potere is irregular: posso, puoi, può." },
      { k: "type", q: "Marco e Anna ___ a Roma domani.", v: "andare", a: ["vanno"], why: "Use the presente for a planned trip: andare → vanno." },
      { k: "type", q: "Noi ___ il conto.", v: "pagare", a: ["paghiamo"], why: "-gare verbs keep the hard g: paghiamo." },
      { k: "type", q: "___ la verità, te lo giuro.", v: "dire", p: "io", a: ["dico"], why: "Dire is irregular: dico, dici, dice." },
      { k: "type", q: "Voi ___ un caffè?", v: "volere", a: ["volete"], why: "Volere is irregular: voglio, vuoi, vuole, vogliamo, volete, vogliono." },
      { k: "mc", q: "Abito a Milano ___ cinque anni.", o: ["da", "per", "fa", "tra"], a: "da", why: "The action continues now: use presente + da." },
      { k: "mc", q: "“Shh! I'm watching the news.”", o: ["Sto guardando il telegiornale.", "Sono guardando il telegiornale.", "Guardavo il telegiornale."], a: "Sto guardando il telegiornale.", why: "Action in progress now: use stare + gerund or guardo." }
    ]
  },
  {
    id: "pp", tense: "pp", level: "A1", title: "Passato prossimo", en: "Present perfect / past",
    summary: "The passato prossimo: the main spoken past tense, for finished actions.",
    meaning: "The passato prossimo is the main past tense in spoken Italian. It translates both “I did” and “I have done”. Make it with <b>avere</b> or <b>essere</b> in the presente + the <b>past participle</b>.",
    uses: [
      { h: "A finished action", t: "Use it for a finished action, often with a time word.", ex: ["Ieri ho mangiato al ristorante.", "Yesterday I ate at a restaurant."] },
      { h: "A sequence of events", t: "Use it for events in a sequence, one after the other.", ex: ["Sono arrivata, ho posato la borsa e ho chiamato mia madre.", "I arrived, put down my bag and called my mother."] },
      { h: "Experiences and results", t: "Use it where English uses “have done”.", ex: ["Hai mai visto Venezia? — No, mai.", "Have you ever seen Venice? — No, never."] },
      { h: "A closed period", t: "Use it for a period with a clear end.", ex: ["Ho vissuto a Londra per tre anni.", "I lived in London for three years."] }
    ],
    form: {
      intro: "<b>avere / essere</b> (presente) + <b>past participle</b>. Regular past participles: <b>-are → -ato</b> (parlato), <b>-ere → -uto</b> (venduto), <b>-ire → -ito</b> (dormito).",
      tables: [
        { h: "with avere · mangiare", rows: ["ho mangiato", "hai mangiato", "ha mangiato", "abbiamo mangiato", "avete mangiato", "hanno mangiato"] },
        { h: "with essere · andare", rows: ["sono andato/a", "sei andato/a", "è andato/a", "siamo andati/e", "siete andati/e", "sono andati/e"] }
      ],
      notes: [
        "Use <b>avere</b> with most verbs and with every verb that has a direct object: <i>ho mangiato una pizza</i>.",
        "Use <b>essere</b> with: movement and change verbs without a direct object (andare, venire, arrivare, partire, uscire, entrare, tornare, salire, scendere, nascere, morire, diventare, rimanere, succedere); essere, stare and piacere; all reflexive verbs (<i>mi sono alzato</i>).",
        "With <b>essere</b>, the past participle agrees with the subject: Marco è andat<b>o</b>, Anna è andat<b>a</b>, siamo andat<b>i</b>, le ragazze sono andat<b>e</b>.",
        "Some verbs use <b>avere</b> with a direct object and <b>essere</b> without one: <i>ho finito il lavoro</i> / <i>il film è finito</i>; <i>ho cominciato il corso</i> / <i>il corso è cominciato</i>; <i>ho passato l'esame</i> / <i>sono passato da te</i>; <i>ho cambiato casa</i> / <i>Luca è cambiato</i>; <i>hanno aumentato i prezzi</i> / <i>i prezzi sono aumentati</i>.",
        "<b>correre</b>: use avere for the activity (<i>ho corso un'ora</i>) and essere with a destination (<i>sono corso a casa</i>).",
        "Weather verbs take avere or essere: <i>ha piovuto</i>, <i>è piovuto</i>."
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
      { wrong: "Ho andato al cinema.", right: "Sono andato/a al cinema.", why: "Andare is a movement verb: use <b>essere</b>." },
      { wrong: "Maria è arrivato.", right: "Maria è arrivata.", why: "With essere, the past participle agrees with the subject." },
      { wrong: "Ho vissuto a Roma da tre anni.", right: "Ho vissuto a Roma per tre anni.", why: "Use <b>per</b> for a finished period; use presente + da if it continues." }
    ],
    ex: [
      { k: "type", q: "Ieri ___ un bel film.", v: "vedere", p: "io", a: ["ho visto", "ho veduto"], why: "Vedere takes avere and has an irregular past participle: visto." },
      { k: "type", q: "Anna ___ a casa alle otto.", v: "tornare", a: ["è tornata"], why: "Tornare takes essere; Anna is feminine: tornata." },
      { k: "type", q: "Noi ___ la pizza ieri sera.", v: "mangiare", a: ["abbiamo mangiato"], why: "Direct object (la pizza): use avere." },
      { k: "type", q: "I ragazzi ___ presto stamattina.", v: "uscire", a: ["sono usciti"], why: "Uscire takes essere; masculine plural: usciti." },
      { k: "type", q: "Tu ___ la lettera?", v: "scrivere", a: ["hai scritto"], why: "Scrivere has an irregular past participle: scritto." },
      { k: "type", q: "Stamattina ___ alle sei.", v: "svegliarsi", p: "io", a: ["mi sono svegliato", "mi sono svegliata"], why: "Reflexive verbs always take essere." },
      { k: "type", q: "Che cosa ___ voi a Natale?", v: "fare", a: ["avete fatto"], why: "Fare takes avere and has an irregular past participle: fatto." },
      { k: "type", q: "Mia nonna ___ nel 1950.", v: "nascere", a: ["è nata"], why: "Nascere takes essere: nata." },
      { k: "type", q: "Loro ___ il treno delle nove.", v: "prendere", a: ["hanno preso"], why: "Prendere has an irregular past participle: preso." },
      { k: "type", q: "___ la finestra perché faceva caldo.", v: "aprire", p: "io", a: ["ho aperto"], why: "Aprire has an irregular past participle: aperto." },
      { k: "mc", q: "Luca ___ a Parigi l'anno scorso.", o: ["è andato", "ha andato", "è andata"], a: "è andato", why: "Andare takes essere; Luca is masculine singular: andato." },
      { k: "mc", q: "La festa mi ___ moltissimo.", o: ["è piaciuta", "ha piaciuto", "è piaciuto"], a: "è piaciuta", why: "Piacere takes essere and agrees with the thing you like: piaciuta." },
      { k: "mc", q: "“Have you ever been to Venice?”", o: ["Sei mai stato a Venezia?", "Hai mai stato a Venezia?", "Sei mai essuto a Venezia?"], a: "Sei mai stato a Venezia?", why: "Essere takes essere, and its past participle is <b>stato</b>." }
    ]
  },
  {
    id: "imp", tense: "imp", level: "A2", title: "Imperfetto", en: "Imperfect",
    summary: "The imperfetto: the past tense for descriptions, habits and actions in progress.",
    meaning: "The imperfetto describes the past without a clear start or end. Use it for the background of a story: descriptions, habits and actions in progress. English uses “used to”, “would”, “was doing” or the simple past.",
    uses: [
      { h: "Past habits", t: "Use it for actions that happened regularly.", ex: ["Da bambino andavo al mare ogni estate.", "As a child I went to the seaside every summer."] },
      { h: "Descriptions", t: "Use it to describe people, places, weather, feelings, age and time.", ex: ["Era una giornata fredda e pioveva.", "It was a cold day and it was raining."] },
      { h: "In progress, then interrupted", t: "Use the imperfetto for the background action and the passato prossimo for the interruption.", ex: ["Mentre cucinavo, è suonato il telefono.", "While I was cooking, the phone rang."] },
      { h: "Two things at once", t: "Use it for two parallel past actions, often with mentre.", ex: ["Io leggevo e lui dormiva.", "I was reading and he was sleeping."] },
      { h: "Polite requests", t: "Use it to ask politely in shops and offices.", ex: ["Volevo un caffè, per favore.", "I'd like a coffee, please."] }
    ],
    form: {
      intro: "This is the most regular Italian tense. Remove the final <b>-re</b> and add <b>-vo, -vi, -va, -vamo, -vate, -vano</b>.",
      tables: [
        { h: "-are · parlare", stem: "parla", end: ["vo", "vi", "va", "vamo", "vate", "vano"] },
        { h: "-ere · prendere", stem: "prende", end: ["vo", "vi", "va", "vamo", "vate", "vano"] },
        { h: "-ire · dormire", stem: "dormi", end: ["vo", "vi", "va", "vamo", "vate", "vano"] }
      ],
      notes: ["In noi and voi, put the stress on -va-: parlaVAmo, parlaVAte."]
    },
    irregular: [
      ["essere", "ero, eri, era, eravamo, eravate, erano"], ["fare", "facevo, facevi, faceva…"], ["dire", "dicevo, dicevi, diceva…"],
      ["bere", "bevevo, bevevi, beveva…"], ["proporre (-porre)", "proponevo, proponevi…"], ["tradurre (-durre)", "traducevo, traducevi…"]
    ],
    signals: ["da bambino/a", "di solito", "ogni estate", "sempre", "spesso", "mentre", "c'era una volta"],
    mistakes: [
      { wrong: "Da piccolo sono andato al mare ogni estate.", right: "Da piccolo andavo al mare ogni estate.", why: "Repeated habit: use the imperfetto." },
      { wrong: "Mentre ho cucinato, è arrivato Marco.", right: "Mentre cucinavo, è arrivato Marco.", why: "Background action in progress: use the imperfetto." }
    ],
    ex: [
      { k: "type", q: "Da bambino ___ molto.", v: "leggere", p: "io", a: ["leggevo"], why: "Regular verb: legge- + vo." },
      { k: "type", q: "Quando eravamo piccoli, ___ sempre in giardino.", v: "giocare", a: ["giocavamo"], why: "Past habit: use the imperfetto." },
      { k: "type", q: "Mentre tu ___, io cucinavo.", v: "dormire", a: ["dormivi"], why: "Two parallel actions: use the imperfetto for both." },
      { k: "type", q: "Mia nonna ___ una casa in campagna.", v: "avere", a: ["aveva"], why: "Description of the past: use the imperfetto." },
      { k: "type", q: "Che tempo ___ ieri?", v: "fare", a: ["faceva"], why: "Weather is a description; fare is irregular: faceva." },
      { k: "type", q: "I miei genitori ___ molto giovani.", v: "essere", a: ["erano"], why: "Essere is irregular: ero, eri, era, eravamo, eravate, erano." },
      { k: "type", q: "Voi ___ spesso al cinema?", v: "andare", a: ["andavate"], why: "Past habit (spesso): use the imperfetto." },
      { k: "type", q: "Scusi, ___ chiedere un'informazione.", v: "volere", p: "io", a: ["volevo"], why: "Polite request: use the imperfetto volevo." },
      { k: "type", q: "Loro ___ sempre la verità.", v: "dire", a: ["dicevano"], why: "Dire is irregular: dicevo, dicevi, diceva." },
      { k: "type", q: "Ieri sera ___ stanchissimi.", v: "essere", p: "noi", a: ["eravamo"], why: "State (tiredness): use the imperfetto." },
      { k: "mc", q: "Ogni domenica ___ dai nonni.", o: ["andavamo", "siamo andati", "andremo"], a: "andavamo", why: "Ogni domenica shows a habit: use the imperfetto." },
      { k: "mc", q: "Mentre ___ la doccia, è andata via la luce.", o: ["facevo", "ho fatto", "farò"], a: "facevo", why: "Action in progress when something happened: use the imperfetto." }
    ]
  },
  {
    id: "ppimp", tense: null, level: "A2", title: "Passato prossimo o imperfetto?", en: "Choosing the past tense",
    summary: "Choose the past tense: passato prossimo for events, imperfetto for the background.",
    meaning: "The <b>passato prossimo</b> tells what happened, step by step, with an end. The <b>imperfetto</b> tells the background: how things were, what was in progress and what happened regularly.",
    uses: [
      { h: "Event vs background", t: "Use the passato prossimo for events and the imperfetto for the scene.", ex: ["Era tardi e pioveva. Ho chiamato un taxi.", "It was late and it was raining. I called a taxi."] },
      { h: "Interruption", t: "Use the imperfetto for the action in progress and the passato prossimo for the interruption.", ex: ["Leggevo quando è arrivato Marco.", "I was reading when Marco arrived."] },
      { h: "Once vs regularly", t: "Use the passato prossimo for counted events and the imperfetto for habits.", ex: ["Sono andato in Spagna tre volte. / Andavo in Spagna ogni estate.", "I went to Spain three times. / I used to go to Spain every summer."] },
      { h: "Closed vs open time", t: "Use the passato prossimo for a period with an end; the imperfetto for open background.", ex: ["Ho abitato a Roma per due anni. / Abitavo a Roma quando ti ho conosciuto.", "I lived in Rome for two years. / I was living in Rome when I met you."] },
      { h: "Verbs that change meaning", t: "Some verbs change meaning: conoscevo means I knew, ho conosciuto means I met.", ex: ["Conoscevo Laura, ma ieri ho conosciuto suo fratello.", "I knew Laura, but yesterday I met her brother."] }
    ],
    form: {
      intro: "Ask one question: <b>does the action move the story forward?</b> Yes: use the passato prossimo. No, it sets the scene or repeats: use the imperfetto.",
      compare: [
        ["Passato prossimo", "Imperfetto"],
        ["What happened", "What was in progress"],
        ["One event or a counted number of events", "Habits and repeated actions"],
        ["Clear start or end", "No clear start or end"],
        ["ho conosciuto (I met), ho saputo (I found out), ho dovuto (I had to, and did)", "conoscevo (I knew), sapevo (I knew), dovevo (I was supposed to)"],
        ["ieri, una volta, tre volte, all'improvviso", "mentre, di solito, sempre, da bambino"]
      ]
    },
    signals: ["all'improvviso → pp", "una volta → pp", "mentre → imp", "di solito → imp", "ogni giorno → imp", "per due ore → pp"],
    mistakes: [
      { wrong: "Ieri ero al cinema e vedevo un film.", right: "Ieri sono andato al cinema e ho visto un film.", why: "Finished events in a sequence: use the passato prossimo." },
      { wrong: "Ho conosciuto Paolo da anni.", right: "Conosco Paolo da anni.", why: "Still true now: use presente + da." }
    ],
    ex: [
      { k: "mc", q: "Quando ___ piccola, avevo un gatto.", o: ["ero", "sono stata"], a: "ero", why: "Description of a past period: use the imperfetto." },
      { k: "mc", q: "Mentre leggevo, ___ il telefono.", o: ["suonava", "è suonato"], a: "è suonato", why: "Interrupting event: use the passato prossimo." },
      { k: "mc", q: "Ieri ___ Laura a una festa: è simpaticissima!", o: ["conoscevo", "ho conosciuto"], a: "ho conosciuto", why: "First meeting with a person: use ho conosciuto." },
      { k: "mc", q: "Da giovane mio padre ___ a calcio ogni sabato.", o: ["giocava", "ha giocato"], a: "giocava", why: "Ogni sabato shows a habit: use the imperfetto." },
      { k: "mc", q: "La casa ___ grande e luminosa.", o: ["era", "è stata"], a: "era", why: "Description: use the imperfetto." },
      { k: "mc", q: "Stamattina ___ alle sette e sono uscito subito.", o: ["mi alzavo", "mi sono alzato"], a: "mi sono alzato", why: "Single events in a sequence: use the passato prossimo." },
      { k: "mc", q: "Non sono venuto alla festa perché ___ male.", o: ["stavo", "sono stato"], a: "stavo", why: "Background reason (a state): use the imperfetto." },
      { k: "mc", q: "___ in Spagna tre volte.", o: ["Andavo", "Sono andato"], a: "Sono andato", why: "Counted number of times: use the passato prossimo." },
      { k: "mc", q: "Che cosa ___ quando ti ho chiamato?", o: ["facevi", "hai fatto"], a: "facevi", why: "Action in progress at the time of the call: use the imperfetto." },
      { k: "mc", q: "Ieri ___ a casa tutto il giorno.", o: ["sono rimasto", "rimanevo"], a: "sono rimasto", why: "Closed period (tutto il giorno): use the passato prossimo." },
      { k: "mc", q: "Non ___ che eri in città! Perché non mi hai chiamato?", o: ["sapevo", "ho saputo"], a: "sapevo", why: "Sapevo means I knew (a state); ho saputo means I found out." },
      { k: "mc", q: "All'improvviso ___ a piovere.", o: ["cominciava", "è cominciato"], a: "è cominciato", why: "All'improvviso shows a sudden event: use the passato prossimo." }
    ]
  },
  {
    id: "fut", tense: "fut", level: "A2", title: "Futuro semplice", en: "Future",
    summary: "The futuro: use it for plans, predictions, promises and guesses about now.",
    meaning: "The futuro translates “I will do” and “I am going to do”. For near, certain plans, Italians usually use the <b>presente</b>: <i>domani vado a Roma</i>. The futuro can sound more distant, formal or uncertain.",
    uses: [
      { h: "Future plans and events", t: "Use it for plans and events, mainly far away or less certain.", ex: ["L'anno prossimo andrò in Giappone.", "Next year I'll go to Japan."] },
      { h: "Predictions", t: "Use it for what you expect to happen.", ex: ["Domani pioverà al nord.", "Tomorrow it will rain in the north."] },
      { h: "Promises", t: "Use it for promises and decisions.", ex: ["Te lo prometto: arriverò in orario.", "I promise: I'll be on time."] },
      { h: "Guessing about now", t: "Use the futuro for a guess about the present.", ex: ["Dov'è Marco? — Sarà a casa.", "Where's Marco? — He's probably at home."] },
      { h: "After quando and se", t: "Use the futuro after quando and se for the future; English uses the present.", ex: ["Quando arriverai, ti chiamerò.", "When you arrive, I'll call you."] }
    ],
    form: {
      intro: "Remove the final <b>-e</b> from the infinitive and add <b>-ò, -ai, -à, -emo, -ete, -anno</b>. In -are verbs, the a changes to <b>e</b>: parlare → parler-.",
      tables: [
        { h: "-are · parlare", stem: "parler", end: ["ò", "ai", "à", "emo", "ete", "anno"] },
        { h: "-ere · prendere", stem: "prender", end: ["ò", "ai", "à", "emo", "ete", "anno"] },
        { h: "-ire · dormire", stem: "dormir", end: ["ò", "ai", "à", "emo", "ete", "anno"] }
      ],
      notes: [
        "<b>-care / -gare</b>: add h: cercherò, pagherò.",
        "<b>-ciare / -giare</b>: remove the i: mangerò, comincerò.",
        "Write the accents: parlerò, parlerà. They are part of the spelling."
      ]
    },
    irregular: [
      ["essere", "sarò, sarai, sarà…"], ["avere", "avrò"], ["andare", "andrò"], ["fare", "farò"], ["dare", "darò"], ["stare", "starò"],
      ["potere", "potrò"], ["dovere", "dovrò"], ["sapere", "saprò"], ["vedere", "vedrò"], ["vivere", "vivrò"], ["volere", "vorrò"],
      ["venire", "verrò"], ["rimanere", "rimarrò"], ["bere", "berrò"], ["tenere", "terrò"]
    ],
    signals: ["domani", "dopodomani", "la settimana prossima", "fra / tra due giorni", "in futuro", "presto", "un giorno"],
    mistakes: [
      { wrong: "Mangiarò la pizza.", right: "Mangerò la pizza.", why: "In -are verbs, a changes to e; -giare verbs remove the i." },
      { wrong: "Venirò domani.", right: "Verrò domani.", why: "Venire has an irregular stem: verr-." }
    ],
    ex: [
      { k: "type", q: "L'anno prossimo ___ in Sicilia.", v: "andare", p: "io", a: ["andrò"], why: "Andare has an irregular stem: andr- + ò." },
      { k: "type", q: "Domani ___ tutto il giorno.", v: "piovere", a: ["pioverà"], why: "Prediction: pioverà." },
      { k: "type", q: "Noi ___ alle otto.", v: "arrivare", a: ["arriveremo"], why: "In -are verbs, -ar- changes to -er-: arriveremo." },
      { k: "type", q: "Tu ___ venire alla festa?", v: "potere", a: ["potrai"], why: "Potere has an irregular stem: potr-." },
      { k: "type", q: "Quando ___ grandi, capiranno.", v: "essere", p: "loro", a: ["saranno"], why: "Essere has an irregular stem: sar-." },
      { k: "type", q: "Voi ___ il treno o l'aereo?", v: "prendere", a: ["prenderete"], why: "Regular verb: prender- + ete." },
      { k: "type", q: "Ti ___ domani, va bene?", v: "chiamare", p: "io", a: ["chiamerò"], why: "Promise: use the futuro." },
      { k: "type", q: "Loro ___ a cena da noi.", v: "venire", a: ["verranno"], why: "Venire has an irregular stem: verr-." },
      { k: "type", q: "Che cosa ___ da grande?", v: "fare", p: "tu", a: ["farai"], why: "Fare has an irregular stem: far-." },
      { k: "type", q: "Stasera ___ la pizza.", v: "mangiare", p: "noi", a: ["mangeremo"], why: "-giare verbs remove the i: mangeremo." },
      { k: "type", q: "___ io il conto.", v: "pagare", p: "io", a: ["pagherò"], why: "-gare verbs add h: pagherò." },
      { k: "mc", q: "Dov'è Giulia? — Non so, ___ in ufficio.", o: ["sarà", "è stata", "era"], a: "sarà", why: "Guess about the present: use the futuro." }
    ]
  },
  {
    id: "cond", tense: "cond", level: "A2", title: "Condizionale", en: "Conditional (would)",
    summary: "The condizionale: “would”, for polite requests, wishes, advice and hypothetical situations.",
    meaning: "The condizionale presente translates “would do”. Use it every day to ask politely: <b>vorrei</b>, <b>potrebbe</b>, <b>mi piacerebbe</b>.",
    uses: [
      { h: "Polite requests", t: "Use it to ask politely in shops, restaurants and offices.", ex: ["Vorrei un caffè. Potrebbe portarmi il conto?", "I'd like a coffee. Could you bring me the bill?"] },
      { h: "Wishes", t: "Use it for wishes, often with piacere.", ex: ["Mi piacerebbe vivere al mare.", "I'd love to live by the sea."] },
      { h: "Advice", t: "<b>Dovresti</b> means “you should”; <b>potresti</b> means “you could”.", ex: ["Dovresti dormire di più.", "You should sleep more."] },
      { h: "Hypothetical", t: "Use it for what would happen; after se, use the congiuntivo imperfetto (B1).", ex: ["Con più tempo, studierei anche il cinese.", "With more time, I'd also study Chinese."] },
      { h: "Reported, unconfirmed news", t: "News reports use it for unconfirmed information (“reportedly”, B2).", ex: ["Secondo i giornali, il ministro sarebbe a Parigi.", "According to the papers, the minister is reportedly in Paris."] }
    ],
    form: {
      intro: "Use the futuro stem with the endings <b>-ei, -esti, -ebbe, -emmo, -este, -ebbero</b>.",
      tables: [
        { h: "-are · parlare", stem: "parler", end: ["ei", "esti", "ebbe", "emmo", "este", "ebbero"] },
        { h: "-ere · prendere", stem: "prender", end: ["ei", "esti", "ebbe", "emmo", "este", "ebbero"] },
        { h: "-ire · dormire", stem: "dormir", end: ["ei", "esti", "ebbe", "emmo", "este", "ebbero"] }
      ],
      notes: [
        "Irregular futuro stems are also irregular here: sar-, avr-, andr-, far-, potr-, dovr-, vorr-, verr-.",
        "Do not confuse the noi forms: <b>parleremmo</b> (would, double m) and <b>parleremo</b> (will, one m).",
        "After <b>se</b>, use the congiuntivo imperfetto: <i>se avessi tempo, viaggerei</i>."
      ]
    },
    irregular: [
      ["essere", "sarei, saresti, sarebbe…"], ["avere", "avrei"], ["andare", "andrei"], ["fare", "farei"], ["potere", "potrei"],
      ["dovere", "dovrei"], ["volere", "vorrei"], ["venire", "verrei"], ["sapere", "saprei"], ["vivere", "vivrei"], ["stare", "starei"], ["bere", "berrei"]
    ],
    signals: ["per favore", "volentieri", "al tuo posto", "secondo me", "con più tempo", "magari"],
    mistakes: [
      { wrong: "Io vorrebbi un caffè.", right: "Io vorrei un caffè.", why: "The io ending is -ei." },
      { wrong: "Domani andremmo al mare. (meaning “we will go”)", right: "Domani andremo al mare.", why: "Use one m for “will” and two m for “would”." }
    ],
    ex: [
      { k: "type", q: "___ un bicchiere d'acqua, per favore.", v: "volere", p: "io", a: ["vorrei"], why: "Polite request: vorrei." },
      { k: "type", q: "Tu ___ studiare di più.", v: "dovere", a: ["dovresti"], why: "Advice: dovresti means “you should”." },
      { k: "type", q: "Mi ___ vedere quel film.", v: "piacere", a: ["piacerebbe"], why: "Wish: mi piacerebbe." },
      { k: "type", q: "Scusi, ___ chiudere la finestra?", v: "potere", p: "Lei", a: ["potrebbe"], why: "Formal Lei uses the 3rd person: potrebbe." },
      { k: "type", q: "Noi ___ volentieri, ma siamo stanchi.", v: "venire", a: ["verremmo"], why: "Venire has the stem verr-: verr- + emmo." },
      { k: "type", q: "Al tuo posto, io non lo ___.", v: "fare", a: ["farei"], why: "Fare has the stem far-: far- + ei." },
      { k: "type", q: "Voi ___ un po' di vino?", v: "prendere", a: ["prendereste"], why: "Regular verb: prender- + este." },
      { k: "type", q: "Loro ___ felici di conoscerti.", v: "essere", a: ["sarebbero"], why: "Essere has the stem sar-: sar- + ebbero." },
      { k: "type", q: "Che cosa ___ al mio posto?", v: "fare", p: "tu", a: ["faresti"], why: "Fare has the stem far-: far- + esti." },
      { k: "type", q: "___ in Italia per sempre.", v: "vivere", p: "io", a: ["vivrei"], why: "Vivere has the stem vivr-: vivr- + ei." },
      { k: "mc", q: "“We'd go to Rome tomorrow, but we have no time.”", o: ["Andremmo a Roma domani, ma non abbiamo tempo.", "Andremo a Roma domani, ma non abbiamo tempo."], a: "Andremmo a Roma domani, ma non abbiamo tempo.", why: "“Would” takes double m: andremmo." },
      { k: "mc", q: "“You should rest.” (friendly advice)", o: ["Dovresti riposarti.", "Dovrai riposarti.", "Dovevi riposarti."], a: "Dovresti riposarti.", why: "Dovresti means “you should”; dovrai means “you will have to”." }
    ]
  },
  {
    id: "cong", tense: "cong", level: "B1", title: "Congiuntivo presente", en: "Present subjunctive",
    summary: "The congiuntivo presente: use it after che for opinions, doubts, wishes and feelings.",
    meaning: "The congiuntivo is a <b>mood</b>, not a tense. It shows that something is subjective or not certain: an opinion, wish, hope, fear or doubt. It usually comes after <b>che</b>, in the second part of the sentence.",
    uses: [
      { h: "Opinions and beliefs", t: "Use it after penso che, credo che, mi sembra che, immagino che.", ex: ["Penso che Marco abbia ragione.", "I think Marco is right."] },
      { h: "Wishes and wants", t: "Use it after voglio che, spero che, preferisco che.", ex: ["Spero che tu stia bene.", "I hope you're well."] },
      { h: "Feelings", t: "Use it after sono contento che, ho paura che, mi dispiace che.", ex: ["Sono felice che siate qui.", "I'm happy you're here."] },
      { h: "Doubt", t: "Use it after non so se, dubito che, non sono sicuro che.", ex: ["Non sono sicura che sia vero.", "I'm not sure it's true."] },
      { h: "Impersonal phrases", t: "Use it after è importante che, è meglio che, bisogna che, è possibile che.", ex: ["È importante che tu dorma abbastanza.", "It's important that you sleep enough."] },
      { h: "Some conjunctions", t: "Use it after benché, sebbene, prima che, affinché, a meno che, purché.", ex: ["Esco benché piova.", "I'm going out although it's raining."] }
    ],
    form: {
      intro: "-are verbs take <b>-i</b>. -ere and -ire verbs take <b>-a</b>. The three singular forms are the same, so add <b>io / tu / lui</b> when the subject is not clear.",
      tables: [
        { h: "-are · parlare", stem: "parl", end: ["i", "i", "i", "iamo", "iate", "ino"], che: true },
        { h: "-ere · prendere", stem: "prend", end: ["a", "a", "a", "iamo", "iate", "ano"], che: true },
        { h: "-ire · dormire", stem: "dorm", end: ["a", "a", "a", "iamo", "iate", "ano"], che: true },
        { h: "-ire (-isc-) · finire", stem: "fin", end: ["isca", "isca", "isca", "iamo", "iate", "iscano"], che: true }
      ],
      notes: [
        "For irregular verbs, start from the presente <b>io</b> form: vengo → venga, dico → dica, faccio → faccia, esco → esca, posso → possa.",
        "<b>Same subject → di + infinitive</b>: Penso <b>di</b> avere ragione (not “penso che io abbia”).",
        "<b>Certainty → indicativo</b>: So che è vero. Sono sicuro che viene. È vero che…",
        "<b>Sequence of tenses</b>: main verb in the presente → congiuntivo <b>presente</b> or <b>passato</b> (penso che venga / sia venuto). Main verb in a past tense → congiuntivo <b>imperfetto</b> or <b>trapassato</b> (pensavo che venisse / fosse venuto).",
        "Casual speech often uses the indicativo: <i>penso che è tardi</i>, <i>non so se viene</i>. In writing and careful speech, use the congiuntivo: <i>penso che sia tardi</i>, <i>non so se venga</i>."
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
      { wrong: "Penso che è vero.", right: "Penso che sia vero.", why: "Use the congiuntivo after penso che; the indicativo is only casual speech." },
      { wrong: "Spero che vieni.", right: "Spero che tu venga.", why: "Spero che takes the congiuntivo." },
      { wrong: "Penso che io abbia ragione.", right: "Penso di avere ragione.", why: "Same subject in both parts: use di + infinitive." }
    ],
    ex: [
      { k: "type", q: "Penso che Marco ___ ragione.", v: "avere", a: ["abbia"], why: "An opinion takes the congiuntivo: abbia." },
      { k: "type", q: "Spero che tu ___ bene.", v: "stare", a: ["stia"], why: "Stare is irregular: stia." },
      { k: "type", q: "È importante che voi ___ presto.", v: "arrivare", a: ["arriviate"], why: "-are verb, voi form: arriviate." },
      { k: "type", q: "Voglio che loro ___ la verità.", v: "dire", a: ["dicano"], why: "Start from the io form dico: dicano." },
      { k: "type", q: "Credo che il film ___ alle nove.", v: "cominciare", a: ["cominci"], why: "-are verbs take -i: cominci." },
      { k: "type", q: "Sono contenta che tu ___ qui.", v: "essere", a: ["sia"], why: "A feeling takes the congiuntivo: sia." },
      { k: "type", q: "Bisogna che noi ___ subito.", v: "partire", a: ["partiamo"], why: "The noi form is the same as in the presente: partiamo." },
      { k: "type", q: "Non so se Anna ___ venire.", v: "potere", a: ["possa"], why: "A doubt takes the congiuntivo: possa." },
      { k: "type", q: "Preferisco che tu ___ la macchina.", v: "prendere", a: ["prenda"], why: "-ere verbs take -a: prenda." },
      { k: "type", q: "Esco benché ___.", v: "piovere", a: ["piova"], why: "Benché always takes the congiuntivo." },
      { k: "type", q: "Dubito che loro ___ in tempo.", v: "finire", a: ["finiscano"], why: "-isc- verb: finiscano." },
      { k: "mc", q: "So che Luca ___ in Spagna.", o: ["è", "sia"], a: "è", why: "So che shows certainty: use the indicativo." },
      { k: "mc", q: "“I think I'm right.”", o: ["Penso di avere ragione.", "Penso che io abbia ragione.", "Penso che ho ragione."], a: "Penso di avere ragione.", why: "Same subject: use di + infinitive." }
    ]
  }
];

export const PRONOUNS = P;
