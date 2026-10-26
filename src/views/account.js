import { S, esc, ICON, LEVELS, LEVEL_NAMES, savePref, showToast, switchUser, displayName, sync, pull, push, resetAll, mergeEntries, applyChanged, markDirty, unitOf, lsDel, emit, go } from "../core.js";
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
window.addEventListener("appinstalled", () => { deferred = null; showToast("Parlo is installed."); });
function installHTML() {
  if (standalone()) return `<p class="muted small">${ICON.check} Installed on this device.</p>`;
  if (deferred) return `<p class="muted small">Opens like an app and works offline.</p><button class="btn" data-install>Install Parlo</button>`;
  if (ios) return `<p class="muted small">In Safari: tap Share, then <b>Add to Home Screen</b>.</p>`;
  return `<p class="muted small">Chrome or Edge: use the install icon in the address bar. Android: menu → <b>Install app</b>.</p>`;
}

export function onAuthEvent(event, session) {
  if (event === "PASSWORD_RECOVERY") recovery = true;
  const was = !S.user;
  switchUser(session?.user || null);
  if (event === "PASSWORD_RECOVERY") go("#/account");
  else if (event === "SIGNED_IN" && was && S.view.name === "account") { msg = null; showToast("Signed in. Your progress now syncs."); go("#/"); }
}

export function viewAccount(app) {
  const settings = `<section class="panel"><h2>Settings</h2>
      <div class="setting"><span>Your level</span><div class="seg small" role="group" aria-label="Your level">${LEVELS.map(l => `<button data-level="${l}" aria-pressed="${S.pref.level === l}">${l}</button>`).join("")}</div></div>
      <div class="setting"><span>New cards per session</span><div class="seg small" role="group" aria-label="New cards">${[0, 10, 20, 30].map(n => `<button data-newn="${n}" aria-pressed="${S.pref.newN === n}">${n}</button>`).join("")}</div></div>
      <div class="setting"><span>Speech speed</span><div class="seg small" role="group" aria-label="Speech speed">${[["0.75", "Slow"], ["0.92", "Normal"]].map(([r, l]) => `<button data-rate="${r}" aria-pressed="${String(S.pref.rate || 0.92) === r}">${l}</button>`).join("")}</div></div>
      <div class="setting"><span>Install</span><div>${installHTML()}</div></div>
    </section>`;
  const data = `<section class="panel"><h2>Your data</h2>
      <div class="btn-row"><button class="btn" data-export>Download a backup</button><label class="btn">Restore a backup<input type="file" id="import-file" accept="application/json,.json" hidden></label></div>
      <button class="text-btn danger" data-reset>${armed === "reset" ? "Tap again to erase all progress, drafts and your deck" : "Reset all progress"}</button>
      <p class="muted small"><a href="privacy.html">Privacy</a></p></section>`;
  let main;
  if (!supabase) main = `<section class="panel"><p class="muted">Accounts aren't set up for this copy of Parlo. Progress is saved on this device.</p></section>`;
  else if (recovery) main = `<form class="panel form" id="recovery-form"><h2>Choose a new password</h2>
      <label class="field">New password<input class="input" id="new-pass" type="password" autocomplete="new-password" minlength="8" required></label>
      <div id="auth-msg">${msgHTML()}</div><button class="btn primary wide">Save password</button></form>`;
  else if (!S.user) {
    const up = mode === "signup";
    main = `<section class="panel form">
      <p class="muted small">An account keeps your progress, deck and drafts in sync on every device.</p>
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
    main = `<section class="panel form"><h2>Profile</h2>
      <form id="profile-form" class="form"><label class="field">Name<input class="input" id="p-name" value="${esc(displayName())}" autocomplete="name" required></label>
        <p class="muted small">${esc(S.user.email || "")} · ${google ? "Google" : "Email"} · <span data-sync class="sync"><i></i><span></span></span></p>
        <div id="auth-msg">${msgHTML()}</div>
        <div class="btn-row"><button class="btn primary">Save</button><button type="button" class="btn" data-sync-now>Sync now</button></div></form>
      ${google ? "" : `<form id="pass-form" class="form"><label class="field">Change password<input class="input" id="p-pass" type="password" autocomplete="new-password" minlength="8" placeholder="New password" required></label><button class="btn">Update password</button></form>`}
    </section>`;
  }
  const danger = S.user ? `<section class="panel"><h2>Sign out</h2><p class="muted small">Your progress stays safe in your account.</p>
      <div class="btn-row"><button class="btn" data-signout>Sign out</button>
      ${armed === "delete" ? `<input class="input short" id="del-confirm" placeholder="Type DELETE" aria-label="Type DELETE to confirm"><button class="btn danger" data-del-confirm>Delete account</button><button class="btn quiet" data-del-cancel>Cancel</button>` : `<button class="btn quiet danger-text" data-del>Delete account…</button>`}</div></section>` : "";
  app.innerHTML = `<header class="page-head"><h1>${S.user ? "Ciao, " + esc(displayName().split(" ")[0] || "") : mode === "signup" ? "Create your account" : "Profilo"}</h1></header>${main}${settings}${data}${danger}`;
  wire(app);
}

function wire(app) {
  const $ = s => app.querySelector(s);
  app.querySelectorAll("[data-level]").forEach(b => b.onclick = () => { savePref({ level: b.dataset.level }); viewAccount(app); });
  app.querySelectorAll("[data-newn]").forEach(b => b.onclick = () => { savePref({ newN: +b.dataset.newn }); viewAccount(app); });
  app.querySelectorAll("[data-rate]").forEach(b => b.onclick = () => { savePref({ rate: +b.dataset.rate }); viewAccount(app); });
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
    } catch (err) { showToast("That file isn't a Parlo backup."); }
  });
  $("[data-reset]")?.addEventListener("click", () => {
    if (armed !== "reset") { armed = "reset"; viewAccount(app); setTimeout(() => { if (armed === "reset") { armed = null; if (S.view.name === "account") viewAccount(app); } }, 5000); return; }
    armed = null; resetAll(); showToast("All progress has been reset."); viewAccount(app);
  });
}
