// Smoke test: a new learner goes through every main screen; any page error fails the run.
// Run: npm run build && npx vite preview --port 4791 & node tests/smoke.mjs   (B=<url> to test another address)
import { chromium } from "playwright-core";
const B = process.env.B || "http://localhost:4791/";
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
const page = await ctx.newPage(); const errs = [];
page.on("pageerror", e => errs.push(e.message));
const main = async (n = 160) => (await page.locator("main").innerText()).replace(/\s*\n+\s*/g, " | ").slice(0, n);
const go = async h => { await page.goto(B + h); await page.waitForTimeout(450); };
const step = async (name, fn) => { try { console.log(name.padEnd(12), await fn()); } catch (e) { errs.push(`${name}: ${e.message.split("\n")[0]}`); console.log(name.padEnd(12), "FAILED"); } };

await go("");
await step("onboarding", async () => { await page.click("[data-und=B1]"); await page.click("[data-pick=A2]"); await page.waitForTimeout(150); await page.click("[data-g=m]"); await page.waitForTimeout(300); return main(); });
await step("path", async () => { await go("#/learn/path"); return (await page.locator(".step").count()) + " steps"; });
await step("session", async () => {
  await go("#/session/unit/11");
  for (let k = 0; k < 30; k++) {
    if (await page.locator("[data-flip]").count()) await page.click("[data-flip]");
    const b = page.locator("[data-rate=seen], [data-rate=got], [data-now]").first();
    if (!(await b.count())) break; await b.click(); await page.waitForTimeout(60);
  }
  return main(100);
});
await step("quiz", async () => {
  await go("#/quiz");
  for (let k = 0; k < 10; k++) { if (await page.locator("#ans").count()) { await page.fill("#ans", "xyz"); await page.press("#ans", "Enter"); } else await page.locator("[data-o]").first().click(); await page.waitForTimeout(60); await page.click("[data-next]"); await page.waitForTimeout(60); }
  return main(80);
});
await step("grammar", async () => { await go("#/grammar/g-iobj"); await go("#/grammar/g-iobj/practice"); if (await page.locator("#ans").count()) { await page.fill("#ans", "gli"); await page.press("#ans", "Enter"); } else await page.locator("[data-o]").first().click(); await page.waitForTimeout(100); return (await page.locator(".fb").innerText()).replace(/\n+/g, " | ").slice(0, 80); });
await step("reading", async () => { await go("#/read/r-a1-03"); await page.click("[data-play]"); await page.waitForTimeout(500); await page.locator("article.reader .sent").nth(5).click(); await page.waitForTimeout(400); const who = await page.locator("[data-pos]").innerText(); await page.click("[data-play]"); return "playing: " + who; });
await step("listening", async () => { await go("#/listen/l-a2-01"); await page.click("[data-play]"); await page.waitForTimeout(500); await page.click("[data-play]"); return await page.locator("[data-pos]").innerText(); });
await step("say", async () => { await go("#/say/daily"); return main(80); });
await step("hide", async () => { await go("#/unit/1/words"); await page.locator("[data-expand]").first().click(); await page.click(".sheet-panel [data-hide]"); await go("#/deck/hidden"); return main(120); });
await step("deck", async () => { await go("#/deck"); return main(80); });
for (const t of ["stats", "settings", "data"]) await step("account/" + t, async () => { await go("#/account/" + t); return main(80); });
await step("writing", async () => { await go("#/write/w-04"); return main(60); });
await step("speaking", async () => { await go("#/speak/s-04"); return main(60); });
console.log(errs.length ? "ERRORS:\n- " + errs.join("\n- ") : "OK: no errors");
await browser.close();
process.exit(errs.length ? 1 : 0);
