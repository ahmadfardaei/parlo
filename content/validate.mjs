import fs from "fs";
const [type, file] = process.argv.slice(2);
const errs = [];
const S = (o, path) => { if (!o || typeof o.it !== "string" || !o.it.trim() || typeof o.en !== "string" || !o.en.trim()) errs.push(`${path}: sentence needs it + en`); };
const TOPICS = ["people","daily","food","places","work","feelings","leisure","society","tech","nature","language"];
const LV = ["A1","A2","B1","B2"];
let d; try { d = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { console.log("INVALID JSON:", e.message); process.exit(1); }
if (!Array.isArray(d)) { console.log("Top level must be an array"); process.exit(1); }
const words = s => s.split(/\s+/).filter(Boolean).length;
const html = s => (JSON.stringify(s).match(/<(?!\/?(b|i)>)[^>]*>/g) || []);
d.forEach((x, i) => {
  const P = `[${i}] ${x.id || "?"}`;
  if (!x.id) errs.push(`${P}: missing id`);
  if (type === "grammar") {
    for (const k of ["id","level","topic","title","en","summary","meaning","uses","form","mistakes","ex"]) if (x[k] === undefined) errs.push(`${P}: missing ${k}`);
    if (!LV.includes(x.level)) errs.push(`${P}: bad level`);
    if (!["nouns","adjectives","prepositions","pronouns","verbtypes","tenses","sentences","functions"].includes(x.topic)) errs.push(`${P}: bad topic ${x.topic}`);
    (x.uses||[]).forEach((u,j)=>{ if(!u.h||!u.t||!Array.isArray(u.ex)||u.ex.length!==2) errs.push(`${P} use ${j}: needs h,t,ex[it,en]`); });
    if (!x.form || !x.form.intro) errs.push(`${P}: form.intro missing`);
    (x.form?.tables||[]).forEach((t,j)=>{ if(!t.h) errs.push(`${P} table ${j}: needs h`); if(!(t.rows||t.end)) errs.push(`${P} table ${j}: needs rows (array of [left,right]) or stem+end`); if(t.rows && t.rows.some(r=>!Array.isArray(r)||r.length<2)) errs.push(`${P} table ${j}: each row must be [left, right]`); });
    (x.mistakes||[]).forEach((m,j)=>{ if(!m.wrong||!m.right||!m.why) errs.push(`${P} mistake ${j}: needs wrong,right,why`); });
    if ((x.ex||[]).length < 10) errs.push(`${P}: needs >= 10 exercises`);
    (x.ex||[]).forEach((e,j)=>{
      if (e.k==="type") { if(!e.q.includes("___")) errs.push(`${P} ex ${j}: q needs ___`); if(!Array.isArray(e.a)||!e.a.length) errs.push(`${P} ex ${j}: a must be a non-empty array`); }
      else if (e.k==="mc") { if(!Array.isArray(e.o)||!e.o.includes(e.a)) errs.push(`${P} ex ${j}: mc answer must be one of o`); }
      else errs.push(`${P} ex ${j}: k must be type|mc`);
      if(!e.why) errs.push(`${P} ex ${j}: needs why`);
    });
  }
  if (type === "reading") {
    for (const k of ["id","level","title","en","topic","genre","minutes","blurb","body","glossary","questions"]) if (x[k] === undefined) errs.push(`${P}: missing ${k}`);
    if (!LV.includes(x.level)) errs.push(`${P}: bad level`);
    if (!TOPICS.includes(x.topic)) errs.push(`${P}: bad topic`);
    let n = 0;
    (x.body||[]).forEach((b,j)=>{ if(!Array.isArray(b.s)||!b.s.length) errs.push(`${P} block ${j}: needs s[]`); (b.s||[]).forEach((s,k)=>{S(s,`${P} block ${j} s ${k}`); n+=words(s.it||"");}); });
    x._words = n;
    const min = {A1:250,A2:450,B1:750,B2:1150}[x.level];
    if (n < min) errs.push(`${P}: only ${n} Italian words, need >= ${min}`);
    (x.glossary||[]).forEach((g,j)=>S(g,`${P} glossary ${j}`));
    if ((x.questions||[]).length < 4) errs.push(`${P}: needs >= 4 questions`);
    (x.questions||[]).forEach((q,j)=>{ if(!q.q||!Array.isArray(q.o)||!q.o.includes(q.a)) errs.push(`${P} question ${j}: needs q, o[], a in o`); });
  }
  if (type === "writing" || type === "speaking") {
    const keys = type === "writing" ? ["id","title","en","topic","task","guide","phrases","models"] : ["id","title","en","topic","task","questions","phrases","models"];
    for (const k of keys) if (x[k] === undefined) errs.push(`${P}: missing ${k}`);
    if (!TOPICS.includes(x.topic)) errs.push(`${P}: bad topic`);
    (x.phrases||[]).forEach((g,j)=>S(g,`${P} phrase ${j}`));
    (x.questions||[]).forEach((g,j)=>S(g,`${P} question ${j}`));
    const min = type === "writing" ? {A1:50,A2:100,B1:170,B2:250} : {A1:220,A2:380,B1:600,B2:850};
    for (const L of LV) {
      const m = x.models?.[L]; if (!m) { errs.push(`${P}: missing model ${L}`); continue; }
      let n = 0; (m.body||[]).forEach((b,j)=>{ if(!Array.isArray(b.s)) errs.push(`${P} ${L} block ${j}: needs s[]`); (b.s||[]).forEach((s,k)=>{S(s,`${P} ${L} b${j} s${k}`); n+=words(s.it||"");}); });
      if (n < min[L]) errs.push(`${P} ${L}: only ${n} words, need >= ${min[L]}`);
    }
  }
  const h = html(x); if (h.length) errs.push(`${P}: only <b>/<i> tags allowed: ${h.slice(0,3)}`);
});
if (type === "reading") console.log(d.map(x => `${x.id} ${x.level} ${x._words}w ~${x.minutes}min`).join("\n"));
console.log(errs.length ? "ERRORS:\n- " + errs.join("\n- ") : `OK (${d.length} items)`);
process.exit(errs.length ? 1 : 0);
