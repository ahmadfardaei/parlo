import { S, D, esc, ICON, LEVELS, LEVEL_NAMES, TOPICS, counts, pct, savePref, sayOf, statusOf, statusLabel, openSheet } from "../core.js";
import { ensure } from "../data.js";
import { pdfUrl } from "../voice.js";
import { SECTIONS } from "./home.js";

export const GTOPICS = { nouns: "Nouns & articles", adjectives: "Adjectives & describing", prepositions: "Prepositions", pronouns: "Pronouns", verbtypes: "Kinds of verbs", tenses: "Verb tenses", sentences: "Building sentences", functions: "Using Italian well" };
const LEVEL_ORDER = l => LEVELS.indexOf(l);

function groupsHTML(items, keyOf, labelOf, rowOf, summaryOf, openKey) {
  const keys = [...new Set(items.map(keyOf))];
  return keys.map(k => {
    const list = items.filter(x => keyOf(x) === k);
    return `<details class="group" ${k === openKey ? "open" : ""}><summary><span class="group-title">${esc(labelOf(k))}</span><span class="group-meta">${summaryOf(list)}</span></summary>
      <div class="link-list cols">${list.map(rowOf).join("")}</div></details>`;
  }).join("");
}
const byLevel = () => S.pref.groupBy !== "topic";
// Impara's header and section tabs: your path first, then the library.
export function learnNav(active) {
  const tabs = [{ key: "path", it: "Percorso", href: `#/path/${S.pref.level}` }, ...SECTIONS.map(s => ({ ...s, href: `#/learn/${s.key}` }))];
  return `<header class="page-head"><h1>Impara</h1></header>
    <nav class="seg tabs-seg" aria-label="Sections">${tabs.map(s => `<a href="${s.href}" ${s.key === active ? 'aria-current="page"' : ""}>${s.it}</a>`).join("")}</nav>`;
}

export async function viewLearn(app, v, alive) {
  const sec = v.section;
  const modeless = sec === "writing" || sec === "speaking";
  // One toolbar for every section: the filter on the left, actions (Quiz, then PDF) on the right, search on its own row.
  const actions = [
    sec === "vocab" || sec === "grammar" ? `<a class="btn quiet small" href="#/quiz">Quiz me</a>` : "",
    ["vocab", "grammar", "reading"].includes(sec) ? `<button class="btn quiet small pdf-link" data-pdf>${ICON.download}<span>PDF</span></button>` : ""
  ].join("");
  app.innerHTML = `${learnNav(sec)}
    <div class="list-tools">
      ${modeless ? `<p class="muted small">${SECTIONS.find(s => s.key === sec).en}. Each task has examples for every level.</p>` : `<div class="seg small" role="group" aria-label="Group by">
        <button data-groupby="level" aria-pressed="${byLevel()}">By level</button><button data-groupby="topic" aria-pressed="${!byLevel()}">By topic</button></div>`}
      ${actions ? `<div class="tool-actions">${actions}</div>` : ""}
    </div>
    ${sec === "vocab" ? `<input class="input search" id="vsearch" type="search" placeholder="Search words, verbs, phrases" aria-label="Search the vocabulary">` : ""}
    <div id="learn-body"><p class="muted">Loading…</p></div>`;
  app.querySelectorAll("[data-groupby]").forEach(b => b.onclick = () => { savePref({ groupBy: b.dataset.groupby }); viewLearn(app, v, alive); });
  app.querySelector("[data-pdf]")?.addEventListener("click", () => openSheet(`<div class="sheet-body">
      <p class="eyebrow">Download as PDF</p><p class="s-it">${SECTIONS.find(s => s.key === sec).it}</p>
      <p class="muted small">The whole section for one level, ready to print.</p>
      <div class="pdf-row">${LEVELS.map(l => `<a class="btn ${l === S.pref.level ? "primary" : "quiet"} small pdf-link" href="${pdfUrl(`${sec}-${l}`)}" target="_blank" rel="noopener">${ICON.download}<span>${l}</span></a>`).join("")}</div></div>`));
  const body = app.querySelector("#learn-body");

  if (sec === "vocab") {
    const draw = () => {
      body.innerHTML = groupsHTML(D.units, u => byLevel() ? u.level : u.topic, k => byLevel() ? `${k} · ${LEVEL_NAMES[k]}` : TOPICS[k],
        u => { const c = counts(D.unitIds[u.n]); return `<a class="row-link" href="#/unit/${u.n}/words"><span class="num">${u.n}</span><span><span class="row-title it">${esc(u.title)}</span><span class="muted small">${esc(u.en)}${byLevel() ? "" : " · " + u.level}</span></span><span class="row-meta">${c.due ? `<span class="pill due">${c.due} due</span>` : pct(c) ? pct(c) + "%" : ""}</span>${ICON.chev}</a>`; },
        list => { const c = counts(list.flatMap(u => D.unitIds[u.n])); return `${list.length} units · ${pct(c)}% known`; },
        byLevel() ? S.pref.level : null);
    };
    draw();
    const search = app.querySelector("#vsearch");
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      if (q.length < 2) return draw();
      const hits = D.order.filter(id => sayOf(id).toLowerCase().includes(q) || D.items[id].d.en.toLowerCase().includes(q));
      hits.sort((a, b) => (sayOf(a).toLowerCase().startsWith(q) ? 0 : 1) - (sayOf(b).toLowerCase().startsWith(q) ? 0 : 1));
      body.innerHTML = hits.length ? `<p class="muted small">${hits.length} result${hits.length === 1 ? "" : "s"}${hits.length > 50 ? " · showing 50" : ""}</p><div class="link-list panel flush cols">${hits.slice(0, 50).map(id => {
        const it = D.items[id];
        return `<a class="row-link" href="#/unit/${it.u}/${it.type === "w" ? "words" : it.type === "v" ? "verbs" : "phrases"}"><span><span class="row-title it">${esc(sayOf(id))}</span><span class="muted small">${esc(it.d.en)}</span></span><span class="row-meta"><span class="status ${statusOf(id)}">${statusLabel(id)}</span> U${it.u}</span>${ICON.chev}</a>`;
      }).join("")}</div>` : `<p class="empty-line">Nothing matches “${esc(search.value)}”.</p>`;
    });
    return;
  }

  const data = await ensure(sec === "grammar" ? "grammar" : sec);
  if (!alive()) return;
  if (!data.length) { body.innerHTML = `<div class="empty-state"><h2>Coming soon</h2><p>This section is being written.</p></div>`; return; }

  if (sec === "grammar") {
    const sorted = [...data].sort((a, b) => LEVEL_ORDER(a.level) - LEVEL_ORDER(b.level));
    body.innerHTML = groupsHTML(byLevel() ? sorted : data, g => byLevel() ? g.level : g.topic, k => byLevel() ? `${k} · ${LEVEL_NAMES[k]}` : GTOPICS[k],
      g => { const s = S.st["g:" + g.id]; return `<a class="row-link" href="#/grammar/${g.id}"><span><span class="row-title it">${esc(g.title)}</span><span class="muted small">${esc(g.en)}${byLevel() ? "" : " · " + g.level}</span></span><span class="row-meta">${s && s.best != null ? `${s.best}/${s.total}` : ""}</span>${ICON.chev}</a>`; },
      list => { const done = list.filter(g => S.st["g:" + g.id]?.best != null).length; return `${list.length} lessons${done ? ` · ${done} practised` : ""}`; },
      byLevel() ? S.pref.level : null);
  } else if (sec === "listening") {
    body.innerHTML = groupsHTML(data, l => byLevel() ? l.level : l.topic, k => byLevel() ? `${k} · ${LEVEL_NAMES[k]}` : TOPICS[k],
      l => { const st = S.st["l:" + l.id]; return `<a class="row-link tall" href="#/listen/${l.id}"><span><span class="row-title it">${esc(l.title)}</span><span class="small">${esc(l.situation)}</span><span class="muted small">${byLevel() ? "" : l.level + " · "}${esc(l.genre)} · ${l.minutes} min</span></span><span class="row-meta">${st?.done ? `<span class="pill ok">${ICON.check} ${st.score}/${st.total}</span>` : ""}</span>${ICON.chev}</a>`; },
      list => { const done = list.filter(l => S.st["l:" + l.id]?.done).length; return `${list.length} exercises${done ? ` · ${done} done` : ""}`; },
      byLevel() ? S.pref.level : null);
  } else if (sec === "reading") {
    body.innerHTML = groupsHTML(data, r => byLevel() ? r.level : r.topic, k => byLevel() ? `${k} · ${LEVEL_NAMES[k]}` : TOPICS[k],
      r => { const done = S.st["r:" + r.id]?.done; return `<a class="row-link tall" href="#/read/${r.id}"><span><span class="row-title it">${esc(r.title)}</span><span class="small">${esc(r.blurb)}</span><span class="muted small">${byLevel() ? "" : r.level + " · "}${esc(r.genre)} · ${r.minutes} min</span></span><span class="row-meta">${done ? `<span class="pill ok">${ICON.check} Read</span>` : ""}</span>${ICON.chev}</a>`; },
      list => { const done = list.filter(r => S.st["r:" + r.id]?.done).length; return `${list.length} texts${done ? ` · ${done} read` : ""}`; },
      byLevel() ? S.pref.level : null);
  } else {
    const base = sec === "writing" ? "write" : "speak", pre = sec === "writing" ? "wr:" : "sp:";
    body.innerHTML = `<div class="link-list panel flush cols">${data.map(x => {
      const st = S.st[pre + x.id];
      const started = sec === "writing" ? st?.text?.trim() : st?.done;
      return `<a class="row-link tall" href="#/${base}/${x.id}"><span><span class="row-title it">${esc(x.title)}</span><span class="muted small">${esc(x.en)} · ${esc(TOPICS[x.topic] || "")}</span></span><span class="row-meta">${started ? `<span class="pill ok">${sec === "writing" ? "Draft saved" : "Practised"}</span>` : ""}</span>${ICON.chev}</a>`;
    }).join("")}</div>`;
  }
}
