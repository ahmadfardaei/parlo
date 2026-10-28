import { S, D, esc, ICON, LEVELS, savePref, showToast, switchUser, displayName, sync, pull, push, resetAll, mergeEntries, applyChanged, markDirty, unitOf, lsDel, emit, go, syncText, activityByDay, fmtDur, dayKey, learned } from "../core.js";
import { supabase, appUrl } from "../supabase.js";

let mode = "signin", recovery = false, msg = null, armed = null;
const G = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.5z"/></svg>';
const friendly = e => {
  const m = (e && e.message) || String(e);
  if (/invalid login credentials/i.test(m)) return "That email and password don't match. Check them, or use “Forgot password?”.";
  if (/email not confirmed/i.test(m)) return "Confirm your email first: open the link we sent you, then sign in.";
  if (/already registered/i.test(m)) return "There's already an account with this email. Sign in instead.";
  if (/password should be at least/i.test(m)) return "Choose a password with at least 8 characters.";
  if (/rate limit|too many/i.test(m)) return "Too many attempts. Wait a minute and try again.";
  if (/provider is not enabled/i.test(m)) return "Google sign-in isn't switched on yet. Use email for now.";
  if (/fetch|network/i.test(m)) return "You seem to be offline. Connect and try again.";
  return m;
};
const msgHTML = () => msg ? `<p class="msg ${msg.ok ? "ok" : "err"}" role="${msg.ok ? "status" : "alert"}">${esc(msg.text)}</p>` : "";
function setMsg(text, ok) { msg = text ? { text, ok: !!ok } : null; const m = document.getElementById("auth-msg"); if (m) m.innerHTML = msgHTML(); }

/* ---------- Install ---------- */
let deferred = null;
const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; if (S.view.name === "account") emit("rerender"); });
window.addEventListener("appinstalled", () => { deferred = null; showToast("Installed. Open it from your home screen."); });
function installHTML() {
  if (standalone()) return `<p class="muted small">${ICON.check} Installed on this device.</p>`;
  if (deferred) return `<p class="muted small">Opens like an app and works offline.</p><button class="btn" data-install>Install the app</button>`;
  if (ios) return `<p class="muted small">In Safari: tap Share, then <b>Add to Home Screen</b>.</p>`;
  return `<p class="muted small">Chrome or Edge: use the install icon in the address bar. Android: menu → <b>Install app</b>.</p>`;
}

export function onAuthEvent(event, session) {
  if (event === "PASSWORD_RECOVERY") recovery = true;
  const was = !S.user;
  switchUser(session?.user || null);
  if (event === "PASSWORD_RECOVERY") go("#/account/data");
  else if (event === "SIGNED_IN" && was && S.view.name === "account") { msg = null; showToast("Signed in. Your progress now syncs."); go("#/"); }
}

export function viewAccount(app, v = S.view) {
  const tab = v.tab || "stats";
  // Each setting: a label and a short hint, with its control underneath, the same on every screen size.
  const row = (label, hint, control) => `<div class="setting"><div class="setting-label"><span>${label}</span>${hint ? `<span class="muted small">${hint}</span>` : ""}</div>${control}</div>`;
  const seg = (aria, attr, opts, cur, cls = "") => `<div class="seg small fill" role="group" aria-label="${aria}">${opts.map(([k, l]) => `<button class="${cls}" data-${attr}="${k}" aria-pressed="${cur === k}">${l}</button>`).join("")}</div>`;
  const prefs = `<section class="panel"><h2>Your level</h2>
      ${row("You understand", "Reading and listening.", seg("Level you understand", "und", LEVELS.map(l => [l, l]), S.pref.understand || S.pref.level))}
      ${row("You speak", "Your path follows this level.", seg("Level you speak", "level", LEVELS.map(l => [l, l]), S.pref.level))}
    </section>
    <section class="panel"><h2>Practice</h2>
      ${row("New words per session", "How many new words a unit session brings.", seg("New words per session", "newn", [5, 10, 20].map(n => [n, n]), S.pref.newN))}
      ${row("Forms about you", "Which forms you see in sentences about yourself.", seg("Gendered forms about you", "gender", [["m", "stanco"], ["f", "stanca"], ["x", "stanco/a"]], S.pref.gender || "x", "it"))}
      ${row("Install the app", "", `<div>${installHTML()}</div>`)}
    </section>`;
  let account;
  if (!supabase) account = `<section class="panel"><h2>Account</h2><p class="muted">Accounts aren't set up for this copy of the app. Progress is saved on this device.</p></section>`;
  else if (recovery) account = `<form class="panel form" id="recovery-form"><h2>Choose a new password</h2>
      <label class="field">New password<input class="input" id="new-pass" type="password" autocomplete="new-password" minlength="8" required></label>
      <div id="auth-msg">${msgHTML()}</div><button class="btn primary wide">Save password</button></form>`;
  else if (!S.user) {
    const up = mode === "signup";
    account = `<section class="panel form"><h2>${up ? "Create an account" : "Sign in"}</h2>
      <p class="muted small">An account keeps your progress, deck, drafts and statistics in sync on every device.</p>
      <button class="btn wide google" data-google>${G} Continue with Google</button>
      <p class="divider">or with email</p>
      <form id="auth-form" class="form">
        ${up ? `<label class="field">Your name<input class="input" id="a-name" autocomplete="name" required></label>` : ""}
        <label class="field">Email<input class="input" id="a-email" type="email" autocomplete="email" required></label>
        <label class="field">Password${up ? " (8+ characters)" : ""}<input class="input" id="a-pass" type="password" autocomplete="${up ? "new-password" : "current-password"}" ${up ? 'minlength="8"' : ""} required></label>
        <div id="auth-msg">${msgHTML()}</div>
        <button class="btn primary wide" id="a-submit">${up ? "Create account" : "Sign in"}</button>
      </form>
      ${up ? "" : `<div class="btn-row spread"><button class="text-btn" data-magic>Email me a sign-in link</button><button class="text-btn" data-forgot>Forgot password?</button></div>`}
      <p class="small">${up ? `Have an account? <button class="text-btn" data-mode="signin">Sign in</button>` : `New here? <button class="text-btn" data-mode="signup">Create an account</button>`}</p>
    </section>`;
  } else {
    const google = S.user.app_metadata?.provider === "google";
    account = `<section class="panel form"><h2>Account</h2>
      <form id="profile-form" class="form"><label class="field">Name<input class="input" id="p-name" value="${esc(displayName())}" autocomplete="name" required></label>
        <p class="muted small">${esc(S.user.email || "")} · signed in with ${google ? "Google" : "email"}</p>
        <div id="auth-msg">${msgHTML()}</div>
        <div class="btn-row"><button class="btn primary">Save name</button></div></form>
      ${google ? "" : `<form id="pass-form" class="form"><label class="field">Change password<input class="input" id="p-pass" type="password" autocomplete="new-password" minlength="8" placeholder="New password" required></label><button class="btn">Update password</button></form>`}
      <div class="btn-row"><button class="btn" data-signout>Sign out</button>
      ${armed === "delete" ? `<input class="input short" id="del-confirm" placeholder="Type DELETE" aria-label="Type DELETE to confirm"><button class="btn danger" data-del-confirm>Delete account</button><button class="btn quiet" data-del-cancel>Cancel</button>` : `<button class="btn quiet danger-text" data-del>Delete account…</button>`}</div>
    </section>`;
  }
  const [syncCls, syncTxt] = syncText();
  const data = `${!S.user ? "" : `<section class="panel"><h2>Sync</h2>
      <p class="muted small">${S.user ? `Last synced ${sync.last ? new Date(sync.last).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}.` : `Sign in to sync across devices.`}</p>
      <button class="btn" data-sync-now>Sync now</button></section>`}
    <section class="panel"><h2>Backup</h2>
      <p class="muted small">A file with all your progress, deck, drafts and statistics.</p>
      <div class="btn-row"><button class="btn" data-export>Download a backup</button><label class="btn">Restore a backup<input type="file" id="import-file" accept="application/json,.json" hidden></label></div></section>
    <section class="panel"><h2>Start over</h2>
      <p class="muted small">Erases your progress, deck and drafts on every device.</p>
      <button class="btn quiet danger-text" data-reset>${armed === "reset" ? "Tap again to erase everything" : "Reset all progress"}</button>
      <p class="muted small"><a href="privacy.html">Privacy</a></p></section>`;
  // Three tabs: progress, how you study, and your account and data.
  const tabs = `<nav class="seg tabs-seg" aria-label="Profile sections">${[["stats", "Progressi"], ["settings", "Studio"], ["data", "Account"]].map(([k, l]) => `<a href="#/account/${k}" ${k === tab ? 'aria-current="page"' : ""}>${l}</a>`).join("")}</nav>`;
  const body = tab === "settings" ? `<div class="settings-col">${prefs}</div>` : tab === "data" ? `<div class="grid-2"><div>${account}</div><div>${data}</div></div>` : statsHTML();
  const name = S.user ? displayName() : "";
  const und = S.pref.understand || S.pref.level;
  const head = `<section class="panel profile-card">
      <span class="avatar" aria-hidden="true">${name ? esc(name.trim()[0].toUpperCase()) : ICON.user}</span>
      <div class="profile-main"><p class="row-title">${name ? esc(name) : "Guest"}</p>
        <p class="muted small">Understands ${und} · speaks ${S.pref.level}</p>
        <p class="sync ${syncCls}" data-sync><i></i><span>${syncTxt}</span></p></div>
      ${S.user || tab === "data" ? "" : `<a class="btn small primary" href="#/account/data">Sign in</a>`}
    </section>`;
  app.innerHTML = `<header class="page-head"><h1>Profilo</h1></header>${head}${tabs}${body}`;
  wire(app);
}

/* ---------- Progress ---------- */
// What you can say comes first; study time shows only as a streak and the activity calendar.
function statsHTML() {
  const days = activityByDay();
  const today = dayKey(), sum = o => Object.values(o || {}).reduce((a, b) => a + b, 0);
  const total = Object.values(days).reduce((a, o) => a + sum(o), 0);
  const week = [0, 1, 2, 3, 4, 5, 6].reduce((a, i) => { const d = new Date(); d.setDate(d.getDate() - i); return a + sum(days[dayKey(d)]); }, 0);
  let streak = 0; for (let i = sum(days[today]) ? 0 : 1; ; i++) { const d = new Date(); d.setDate(d.getDate() - i); if (sum(days[dayKey(d)]) >= 60) streak++; else break; }
  const canSay = D.order.filter(learned).length, said = S.st["sp:say"]?.n || 0;
  const talks = Object.keys(S.st).filter(k => /^sp:s-/.test(k) && S.st[k]?.done).length;
  if (!total && !canSay && !said) return `<div class="empty-state"><h2>Nothing to show yet</h2><p class="muted">What you can say appears here as you learn.</p><a class="btn primary" href="#/">Start today's session</a></div>`;
  return `<h2 class="section-h">What you can say</h2>
    <div class="kpis">
      <div class="panel kpi"><span class="eyebrow">Words you can say</span><span class="kpi-num">${canSay}</span></div>
      <div class="panel kpi"><span class="eyebrow">Sentences said aloud</span><span class="kpi-num">${said}</span></div>
      <div class="panel kpi"><span class="eyebrow">Talks practised</span><span class="kpi-num">${talks}</span></div>
      <div class="panel kpi"><span class="eyebrow">Streak</span><span class="kpi-num">${streak} ${streak === 1 ? "day" : "days"}</span></div>
    </div>
    <h2 class="section-h">Time in the app</h2>
    <div class="kpis three">
      <div class="panel kpi"><span class="eyebrow">Today</span><span class="kpi-num">${fmtDur(sum(days[today]))}</span></div>
      <div class="panel kpi"><span class="eyebrow">Last 7 days</span><span class="kpi-num">${fmtDur(week)}</span></div>
      <div class="panel kpi"><span class="eyebrow">In all</span><span class="kpi-num">${fmtDur(total)}</span></div>
    </div>
    <section class="panel"><h2>Activity</h2>${heatmapHTML(days)}<p class="muted small">Time counts only while you're actively using the app.</p></section>`;
}
function heatmapHTML(days) {
  // As many weeks as fit on screen (a full year on laptops), so today is always visible without scrolling.
  const w = Math.min(window.innerWidth, 1180);
  const weeks = w >= 1024 ? 53 : Math.max(13, Math.floor((w - 100) / 15));
  const end = new Date(); end.setHours(0, 0, 0, 0);
  // Columns are weeks starting on Monday; the last column holds the current week.
  const start = new Date(end); start.setDate(end.getDate() - (weeks - 1) * 7);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const cells = [], months = [];
  let lastMonth = -1, lastCol = -9;
  for (let d = new Date(start), i = 0; d <= end; d.setDate(d.getDate() + 1), i++) {
    const sec = Object.values(days[dayKey(d)] || {}).reduce((a, b) => a + b, 0), m = sec / 60;
    const lvl = !m ? 0 : m < 5 ? 1 : m < 15 ? 2 : m < 30 ? 3 : 4;
    const col = Math.floor(i / 7) + 1, row = (i % 7) + 1;
    // Label a month at its first full week, and never closer than 3 columns to the previous label.
    if (row === 1 && d.getMonth() !== lastMonth) { if (col - lastCol >= 3 || lastCol < 0) { months.push(`<span style="grid-column:${col} / span 3">${d.toLocaleDateString("en", { month: "short" })}</span>`); lastCol = col; } lastMonth = d.getMonth(); }
    cells.push(`<i class="hm-${lvl}" style="grid-column:${col};grid-row:${row}" title="${d.toLocaleDateString("en", { day: "numeric", month: "short" })}: ${m ? fmtDur(sec) : "no study"}"></i>`);
  }
  const cols = Math.ceil(cells.length / 7);
  return `<div class="heatmap-wrap"><span></span><div class="hm-months" style="--cols:${cols}">${months.join("")}</div>
    <div class="hm-days" aria-hidden="true"><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span><span></span></div>
    <div class="heatmap" style="--cols:${cols}" role="img" aria-label="Study activity per day over the last ${weeks} weeks">${cells.join("")}</div></div>
    <div class="hm-legend"><span>Less</span>${[0, 1, 2, 3, 4].map(l => `<i class="hm-${l}"></i>`).join("")}<span>More</span></div>`;
}

function wire(app) {
  const $ = s => app.querySelector(s);
  app.querySelectorAll("[data-level]").forEach(b => b.onclick = () => { const l = b.dataset.level, u = S.pref.understand || S.pref.level; savePref({ level: l, understand: LEVELS.indexOf(u) < LEVELS.indexOf(l) ? l : u }); viewAccount(app); });
  app.querySelectorAll("[data-und]").forEach(b => b.onclick = () => { const u = b.dataset.und; savePref({ understand: u, level: LEVELS.indexOf(u) < LEVELS.indexOf(S.pref.level) ? u : S.pref.level }); viewAccount(app); });
  app.querySelectorAll("[data-newn]").forEach(b => b.onclick = () => { savePref({ newN: +b.dataset.newn }); viewAccount(app); });
  app.querySelectorAll("[data-gender]").forEach(b => b.onclick = () => { savePref({ gender: b.dataset.gender }); viewAccount(app); });
  app.querySelectorAll("[data-mode]").forEach(b => b.onclick = () => { mode = b.dataset.mode; msg = null; viewAccount(app); });
  $("[data-install]")?.addEventListener("click", async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice.catch(() => {}); deferred = null; viewAccount(app); });
  $("[data-google]")?.addEventListener("click", async () => { const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: appUrl() } }); if (error) setMsg(friendly(error)); });
  $("#auth-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    const email = $("#a-email").value.trim(), password = $("#a-pass").value, btn = $("#a-submit");
    btn.disabled = true; setMsg("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: appUrl(), data: { full_name: $("#a-name").value.trim() } } });
        if (error) throw error;
        if (!data.session) setMsg(`Almost there: open the confirmation link we sent to ${email}.`, true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) { setMsg(friendly(err)); } finally { btn.disabled = false; }
  });
  for (const k of ["magic", "forgot"]) $(`[data-${k}]`)?.addEventListener("click", async e => {
    const email = $("#a-email").value.trim();
    if (!email) { setMsg("Enter your email above first."); $("#a-email").focus(); return; }
    e.target.disabled = true;
    const { error } = k === "magic" ? await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: appUrl(), shouldCreateUser: false } }) : await supabase.auth.resetPasswordForEmail(email, { redirectTo: appUrl() });
    e.target.disabled = false;
    setMsg(error ? friendly(error) : k === "magic" ? `Check ${email} for your sign-in link.` : `Check ${email} for a link to choose a new password.`, !error);
  });
  $("#recovery-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: $("#new-pass").value });
    if (error) return setMsg(friendly(error));
    recovery = false; msg = null; showToast("Password updated."); go("#/");
  });
  $("#profile-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    const name = $("#p-name").value.trim(); if (!name) return;
    const { error } = await supabase.from("profiles").update({ display_name: name, updated_at: new Date().toISOString() }).eq("id", S.user.id);
    if (error) return setMsg(friendly(error));
    S.profile = Object.assign(S.profile || {}, { display_name: name }); setMsg("Saved.", true); emit("account");
  });
  $("#pass-form")?.addEventListener("submit", async e => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: $("#p-pass").value });
    if (error) return setMsg(friendly(error));
    $("#p-pass").value = ""; setMsg("Password updated.", true);
  });
  $("[data-sync-now]")?.addEventListener("click", async () => { await pull(); setMsg(sync.error ? "Couldn't reach the server. Try again when you're online." : "Everything is in sync.", !sync.error); });
  $("[data-signout]")?.addEventListener("click", async () => { await push(); await supabase.auth.signOut(); showToast("Signed out."); go("#/"); });
  $("[data-del]")?.addEventListener("click", () => { armed = "delete"; viewAccount(app); app.querySelector("#del-confirm")?.focus(); });
  $("[data-del-cancel]")?.addEventListener("click", () => { armed = null; viewAccount(app); });
  $("[data-del-confirm]")?.addEventListener("click", async e => {
    if ($("#del-confirm").value.trim() !== "DELETE") { $("#del-confirm").focus(); return; }
    e.target.disabled = true;
    const uid = S.user.id;
    const { error } = await supabase.rpc("delete_own_account");
    if (error) { e.target.disabled = false; return setMsg(friendly(error)); }
    lsDel("parlo.items." + uid); lsDel("parlo.dirty." + uid); armed = null;
    await supabase.auth.signOut({ scope: "local" });
    showToast("Your account and its data have been deleted."); go("#/");
  });
  $("[data-export]")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ app: "parlo-italiano", v: 2, exportedAt: new Date().toISOString(), pref: S.pref, items: S.st }, null, 1)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `parlo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  $("#import-file")?.addEventListener("change", async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      if (j.app !== "parlo-italiano" || !j.items) throw new Error();
      const changed = mergeEntries(j.items); changed.forEach(id => markDirty(unitOf(id))); applyChanged(changed);
      showToast(`Backup restored: ${changed.length} item${changed.length === 1 ? "" : "s"} updated.`);
    } catch (err) { showToast("That file isn't a backup from this app."); }
  });
  $("[data-reset]")?.addEventListener("click", () => {
    if (armed !== "reset") { armed = "reset"; viewAccount(app); setTimeout(() => { if (armed === "reset") { armed = null; if (S.view.name === "account") viewAccount(app); } }, 5000); return; }
    armed = null; resetAll(); showToast("All progress has been reset."); viewAccount(app);
  });
}
