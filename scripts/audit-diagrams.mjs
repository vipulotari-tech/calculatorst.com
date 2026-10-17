/**
 * Audit every built calculator page, rather than sampling hand-picked URLs.
 * This is a read-only inspection: it never rewrites formulas or deploys code.
 */
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const dist = resolve("dist");
const base = "http://127.0.0.1:4321";
const out = resolve("diagram-audit");
const problems = [];
const pages = [];
const results = [];
const now = new Date().toISOString();
const maxItems = 1000;
const arg = process.argv.indexOf("--page");
const selectedPage = arg === -1 ? null : process.argv[arg+1];
if (arg !== -1 && (!selectedPage || !/^\/[a-z0-9/-]+\/$/.test(selectedPage))) {
  throw new Error("Expected --page /valid-calculator-slug/");
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const children = await Promise.all(entries.map(async (entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  }));
  return children.flat();
}
function finding(path, severity, message) {
  problems.push({ path, severity, message });
}
function numberText(value) {
  return Number.isFinite(value) ? String(Math.round(value * 1000) / 1000) : null;
}
for (const filename of await walk(dist)) {
  if (!filename.endsWith("index.html")) continue;
  const html = await readFile(filename, "utf8");
  const path = "/" + relative(dist, filename).split(sep).join("/").replace(/index\.html$/, "");
  // Include legacy standalone calculator pages even when they do not use GenericCalculator.
  if (!path.endsWith("-calculator/") && !html.includes("data-calculator-slug=")) continue;
  pages.push(path);
}
pages.sort();
const discovered = pages.length;
if (selectedPage) {
  if (!pages.includes(selectedPage)) throw new Error("Selected calculator page not found in build: " + selectedPage);
  pages.splice(0, pages.length, selectedPage);
}
if (!selectedPage && pages.length < 30) {
  finding("/", "critical", "Found only " + pages.length + " calculator pages in dist; verify route discovery and build output.");
}
if (pages.length > maxItems) {
  finding("/", "critical", "Calculator page count unexpectedly exceeds " + maxItems + ".");
  pages.length = maxItems;
}

const server = spawn("npm", ["run", "preview", "--", "--host", "127.0.0.1", "--port", "4321"], {
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (chunk) => { serverLog = (serverLog + String(chunk)).slice(-3000); });
server.stderr.on("data", (chunk) => { serverLog = (serverLog + String(chunk)).slice(-3000); });
let browser;

try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    if (server.exitCode !== null) break;
    try {
      const response = await fetch(base + "/", { signal: AbortSignal.timeout(2000) });
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise((done) => setTimeout(done, 250));
  }
  if (!ready) throw new Error("Preview did not become ready: " + serverLog);
  await mkdir(join(out, "screenshots"), { recursive: true });

  browser = await chromium.launch({ headless: true });
  let next = 0;
  async function worker() {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    // External ad/analytics resources are irrelevant to diagram QA and may stall navigation.
    await context.route("**/*", (route) => {
      const url = route.request().url();
      return url.startsWith(base + "/") || url.startsWith("data:") || url.startsWith("blob:")
        ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    while (next < pages.length) {
      const route = pages[next++];
      const pageErrors = [];
      const listener = (error) => pageErrors.push(String(error.message).slice(0, 240));
      page.on("pageerror", listener);
      try {
        await page.setViewportSize({ width: 1280, height: 800 });
        const response = await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 18000 });
        if (!response?.ok()) {
          finding(route, "critical", "Page returned HTTP " + (response?.status() ?? "unknown"));
          continue;
        }
        const baseline = await page.evaluate(() => {
          const genericRoot = document.querySelector("[data-calculator-slug]");
          const root = genericRoot || document.querySelector("main") || document.body;
          if (!root) return null;
          const allSvgs = Array.from(root.querySelectorAll("svg[role='img']"));
          const desc = document.querySelector("meta[name='description']")?.getAttribute("content")?.trim() ?? "";
          const canonical = document.querySelector("link[rel='canonical']")?.getAttribute("href") ?? "";
          const gaps = allSvgs.filter((svg) => {
            const title = svg.querySelector("title")?.textContent?.trim();
            const label = svg.getAttribute("aria-label")?.trim() || svg.getAttribute("aria-labelledby");
            return !title && !label;
          }).length;
          const missingDescriptions = allSvgs.filter((svg) =>
            !svg.querySelector("desc")?.textContent?.trim() &&
            !svg.getAttribute("aria-describedby") &&
            !svg.closest("figure")?.querySelector("figcaption")?.textContent?.trim()
          ).length;
          return {
            slug: genericRoot?.getAttribute("data-calculator-slug") || location.pathname.split("/").filter(Boolean).pop(),
            hasGenericRoot: Boolean(genericRoot),
            description: desc,
            canonical,
            svgCount: allSvgs.length,
            unlabeledSvgs: gaps,
            undescribedSvgs: missingDescriptions,
            hasFormula: Boolean(root.querySelector(".result-steps-list")),
            result: root.querySelector(".result-primary")?.textContent?.trim() ?? null,
          };
        });
        if (!baseline) {
          finding(route, "critical", "Calculator form root did not render.");
          continue;
        }
        const notes = [];
        if (baseline.svgCount === 0) {
          finding(route, "review", "No SVG diagram in the calculator panel; review whether a project-specific visual is useful.");
        }
        if (baseline.unlabeledSvgs) finding(route, "high", baseline.unlabeledSvgs + " diagram(s) have no accessible name/title.");
        if (baseline.undescribedSvgs) finding(route, "medium", baseline.undescribedSvgs + " diagram(s) need an accessible explanation or caption.");
        if (baseline.description.length < 50 || baseline.description.length > 175) {
          finding(route, "medium", "Meta description has " + baseline.description.length + " characters; review clarity, uniqueness and search intent.");
        }
        if (!baseline.canonical.endsWith(route)) {
          finding(route, "high", "Canonical URL does not match built route: " + baseline.canonical.slice(0, 120));
        }
        if (baseline.hasGenericRoot && !baseline.hasFormula) finding(route, "review", "Calculation explanation panel not found in calculator root.");

        const slug = baseline.slug;
        const selector = baseline.hasGenericRoot ? '[data-calculator-slug="' + slug + '"]' : "main";
        const mode = page.locator(selector + ' select[name="mode"]');
        if (await mode.count()) {
          const options = await mode.locator("option").evaluateAll((els) => els.map((el) => el.value));
          if (options.length > 1 && baseline.svgCount) {
            await mode.selectOption(options[options.length - 1]);
            await page.waitForTimeout(75);
            const visibleShape = await page.evaluate(() => {
              const figure = document.querySelector("[data-crushed-stone-diagram]");
              if (!figure) return null;
              return Array.from(figure.querySelectorAll("[data-stone-mode]"))
                .filter((el) => getComputedStyle(el).display !== "none").map((el) => el.getAttribute("data-stone-mode"));
            });
            if (visibleShape && !visibleShape.includes(options[options.length - 1])) {
              finding(route, "high", "Mode selection did not activate the matching diagram shape.");
            }
            await mode.selectOption(options[0]);
          }
        }

        // Exercise the first visible numeric measurement and check for stale live results.
        const input = page.locator(selector + " .calc-field:not([hidden]) input[type='number']").first();
        if (await input.count()) {
          const before = await page.locator(selector + " .result-primary").first().textContent().catch(() => null);
          const old = await input.inputValue();
          const n = Number(old);
          if (old !== "" && Number.isFinite(n) && n > 0) {
            const changed = numberText(n * 1.65 + 1);
            if (changed && changed !== old) {
              await input.fill(changed);
              await page.waitForTimeout(80);
              const after = await page.locator(selector + " .result-primary").first().textContent().catch(() => null);
              if (before?.trim() && after?.trim() && before.trim() === after.trim()) {
                finding(route, "review", "Primary result did not change after a numeric measurement changed; confirm intended result dependency.");
              }
              await input.fill(old);
            }
          }
        }

        if (selectedPage) {
          await page.screenshot({ path: join(out, "screenshots", slug + "-desktop.png"), fullPage: true });
        }
        // Reload at mobile width to catch viewport overflow caused by fixed SVG text and controls.
        await page.setViewportSize({ width: 390, height: 844 });
        await page.reload({ waitUntil: "domcontentloaded", timeout: 18000 });
        const mobile = await page.evaluate(() => ({
          width: document.documentElement.scrollWidth,
          viewport: window.innerWidth,
          diagramCount: document.querySelectorAll("[data-calculator-slug] svg[role='img']").length,
        }));
        if (selectedPage) {
          await page.screenshot({ path: join(out, "screenshots", slug + "-mobile.png"), fullPage: true });
        }
        if (mobile.width > mobile.viewport + 3) {
          finding(route, "high", "Horizontal overflow on 390px mobile: document width " + mobile.width + "px.");
        }
        if (pageErrors.length) {
          finding(route, "review", "Browser error: " + pageErrors[0]);
        }
        results.push({ route, slug, svgCount: baseline.svgCount, desktop: true, mobile: true, notes });
      } catch (err) {
        finding(route, "critical", "Browser smoke test failed: " + String(err).slice(0, 300));
        results.push({ route, failed: true });
      } finally {
        page.off("pageerror", listener);
      }
    }
    await context.close();
  }
  await Promise.all(Array.from({ length: 4 }, () => worker()));
} catch (err) {
  finding("/", "critical", "Audit engine error: " + String(err).slice(0, 500));
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
const priority = { critical: 0, high: 1, medium: 2, review: 3 };
problems.sort((a, b) => (priority[a.severity] - priority[b.severity]) || a.path.localeCompare(b.path));
const report = {
  date: now,
  site: "https://calculatorst.com/",
  source: selectedPage ? "One selected built calculator page" : "All built calculator pages in dist",
  selectedPage,
  totalCalculatorPages: discovered,
  pagesDiscovered: pages.length,
  pagesVisited: results.length,
  diagramsFound: results.reduce((n, r) => n + (r.svgCount || 0), 0),
  severityCounts: Object.fromEntries(["critical", "high", "medium", "review"]
    .map((level) => [level, problems.filter((p) => p.severity === level).length])),
  findings: problems,
};
await mkdir(out, { recursive: true });
await writeFile(join(out, "report.json"), JSON.stringify(report, null, 2) + "\n");
const reportMd = [
  "# Calculator diagrams: scheduled quality audit",
  "",
  "- Run: " + now,
  "- Built calculator pages: " + report.pagesDiscovered,
  "- Browser-tested pages: " + report.pagesVisited,
  "- Diagrams found: " + report.diagramsFound,
  "- Findings: " + JSON.stringify(report.severityCounts),
  "",
  "## Prioritized repair queue",
  ...problems.slice(0, 100).map((p) => "- **" + p.severity.toUpperCase() + "** " + p.path + " — " + p.message),
  ...(problems.length > 100 ? ["", "More findings are available in report.json."] : []),
  "",
  "## Repair requirements",
  "Fix individual calculators in reviewed PRs. Recheck actual formula, units, rounding, invalid inputs, mode changes, SVG title/description, mobile and desktop, print/share, and browser tests. Never invent dimensions, densities or engineering approvals. Never bypass failed tests or auto-merge unverified code.",
  "",
];
await writeFile(join(out, "report.md"), reportMd.join("\n"));
console.log("Diagram audit:", JSON.stringify({
  pages: report.pagesDiscovered,
  visited: report.pagesVisited,
  diagrams: report.diagramsFound,
  counts: report.severityCounts,
}));
for (const p of problems.slice(0, 15)) console.log("[" + p.severity + "] " + p.path + ": " + p.message);
if (problems.some((p) => p.severity === "critical")) process.exitCode = 1;
