/**
 * One page per run. The same page stays locked until audited clean on main.
 * GitHub Issue stores durable cursor; failed pages may be delegated to Copilot.
 */
import { appendFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve, relative, join, sep } from "node:path";

const mode = process.argv[2];
if (!["select", "complete"].includes(mode)) throw Error("Use select or complete");
const [owner, repo] = (process.env.GITHUB_REPOSITORY || "").split("/");
const token = process.env.GITHUB_TOKEN;
if (!owner || !repo || !token) throw Error("GITHUB_TOKEN and GITHUB_REPOSITORY required");
const agentToken = process.env.COPILOT_AGENT_PAT;
const title = "Calculator Diagram — Sequential Repair Progress";
const issuePrefix = "Diagram repair: ";
const stateMark = /<!-- diagram-sequence-state:(\{[^\r\n]+\}) -->/;
const dir = resolve("diagram-audit");

async function gh(url, method = "GET", payload, auth = token) {
  const r = await fetch("https://api.github.com" + url, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + auth,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "calculatorst-diagram-queue"
    },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
    signal: AbortSignal.timeout(20000)
  });
  const s = await r.text();
  if (!r.ok) throw Error("GitHub API " + r.status + " " + method + " " + url + ": " + s.slice(0, 500));
  return s ? JSON.parse(s) : {};
}
async function walk(d) {
  return (await Promise.all((await readdir(d, { withFileTypes: true })).map(x =>
    x.isDirectory() ? walk(join(d, x.name)) : [join(d, x.name)]))).flat();
}
const paths = [];
for (const file of await walk(resolve("dist"))) {
  if (!file.endsWith("/index.html")) continue;
  const route = "/" + relative(resolve("dist"), file).split(sep).join("/").replace(/index\.html$/, "");
  if (route.endsWith("-calculator/") || (await readFile(file, "utf8")).includes("data-calculator-slug=")) paths.push(route);
}
const pages = [...new Set(paths)].sort();
if (pages.length < 30) throw Error("Incomplete calculator inventory: " + pages.length);
let issues = [];
for (let p = 1; p <= 20; p++) {
  const batch = await gh("/repos/" + owner + "/" + repo + "/issues?state=all&per_page=100&page=" + p);
  issues.push(...batch.filter(x => !x.pull_request));
  if (batch.length < 100) break;
}
let progress = issues.find(x => x.title === title);
let state;
try { state = JSON.parse(progress?.body?.match(stateMark)?.[1] || "null"); } catch {}
if (!state || !Number.isInteger(state.cursor)) {
  state = { cursor: 0, active: null, cycle: 1, completed: 0, total: pages.length, lastResult: "Not started" };
}
state.total = pages.length;
if (state.active && !pages.includes(state.active)) state.active = null;

function statusBody(detail) {
  return [
    "# Sequential calculator diagram repair",
    "",
    "<!-- diagram-sequence-state:" + JSON.stringify(state) + " -->",
    "",
    "**Active:** " + (state.active || "Next page pending"),
    "**Done this cycle:** " + state.completed + " / " + state.total,
    "**Cycle:** " + state.cycle,
    "**Last status:** " + state.lastResult,
    "",
    "The scheduler inspects only ONE page per run. It never advances a failed page. A clean re-test on main after fix and the full regression suite are required to advance.",
    "",
    detail || ""
  ].join("\n").slice(0, 60000);
}
async function save(detail) {
  const body = statusBody(detail);
  progress = progress
    ? await gh("/repos/" + owner + "/" + repo + "/issues/" + progress.number, "PATCH", { body, state: "open" })
    : await gh("/repos/" + owner + "/" + repo + "/issues", "POST", { title, body });
}
if (mode === "select") {
  const page = state.active || pages[state.cursor % pages.length];
  state.active = page;
  await save("Current page is locked until a clean verification run.");
  await mkdir(dir, { recursive: true });
  const info = { page, index: pages.indexOf(page), total: pages.length, cycle: state.cycle };
  await writeFile(join(dir, "current-page.json"), JSON.stringify(info, null, 2));
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, "page=" + page + "\n");
  console.log("Active calculator page " + (info.index + 1) + "/" + pages.length + ": " + page);
} else {
  const page = JSON.parse(await readFile(join(dir, "current-page.json"), "utf8")).page;
  if (page !== state.active) throw Error("Page cursor changed during run; refusing to advance");
  const gateNames = ["UNIT", "TYPES", "BUILD", "SEO", "BROWSER", "DIAGRAM"];
  const gates = Object.fromEntries(gateNames.map(k => [k.toLowerCase(), process.env["GATE_" + k] || "missing"]));
  let report;
  try { report = JSON.parse(await readFile(join(dir, "report.json"), "utf8")); } catch {}
  const reportValid = report?.selectedPage === page && report?.pagesVisited === 1;
  const findings = reportValid ? report.findings : [{ path: page, severity: "critical", message: "Page audit report missing or invalid" }];
  const globalsPass = Object.values(gates).every(v => v === "success");
  const passed = reportValid && findings.length === 0 && globalsPass;
  const runUrl = "https://github.com/" + owner + "/" + repo + "/actions/runs/" + process.env.GITHUB_RUN_ID;
  const summary = [
    "URL: https://calculatorst.com" + page,
    "Run: " + runUrl,
    "Validation: " + JSON.stringify(gates),
    "Report valid: " + reportValid,
    "Findings: " + findings.length,
    ...findings.slice(0, 45).map(x => "- " + x.severity + " " + x.message)
  ].join("\n");
  if (passed) {
    const issue = issues.find(x => x.title === issuePrefix + page && x.state === "open");
    if (issue) await gh("/repos/" + owner + "/" + repo + "/issues/" + issue.number, "PATCH", { state: "closed", state_reason: "completed" });
    state.cursor = (pages.indexOf(page) + 1) % pages.length;
    state.completed = Math.min(state.completed + 1, pages.length);
    if (!state.cursor) { state.cycle++; state.completed = 0; }
    state.active = null;
    state.lastResult = "PASS " + page;
    await save("## Page verified, moved forward\n\n" + summary + "\n\nNext: " + pages[state.cursor]);
    console.log("Page passed, next is " + pages[state.cursor]);
  } else {
    state.lastResult = "BLOCKED " + page;
    let repair = issues.find(x => x.title === issuePrefix + page);
    const instructions = [
      "# Fix exactly ONE calculator page",
      "",
      summary,
      "",
      "## Definition of done",
      "Inspect the source calculator component and calculation model for this page. Fix genuine diagram errors, project-specific geometry, responsive SVG labels, dynamic units and modes, accurate quantities and rounding, meaningful captions and descriptions, SEO, mobile overflow, accessible SVG title and desc, and print/share if present. Add appropriate regression tests for this page. Validate numeric units and edge cases. Run npm test, npx astro check, npm run build, npm run test:seo, npm run test:e2e, and node scripts/audit-diagrams.mjs --page " + page + ". Create one reviewable PR targeting main. Do NOT change unrelated pages, invent material assumptions, or bypass tests.",
      "",
      "The sequential scheduler will hold on this page until the changes are merged and pass all tests on main."
    ].join("\n");
    if (findings.length || !reportValid) {
      repair = repair
        ? await gh("/repos/" + owner + "/" + repo + "/issues/" + repair.number, "PATCH", { body: instructions, state: "open" })
        : await gh("/repos/" + owner + "/" + repo + "/issues", "POST", { title: issuePrefix + page, body: instructions });
      if (agentToken && !repair.assignees?.some(x => x.login?.includes("copilot"))) {
        try {
          const assigned = await gh("/repos/" + owner + "/" + repo + "/issues/" + repair.number + "/assignees", "POST", {
            assignees: ["copilot-swe-agent[bot]"],
            agent_assignment: {
              target_repo: owner + "/" + repo, base_branch: "main",
              custom_instructions: "Fix exactly " + page + " and add tests. Make a PR, do not merge automatically.",
              custom_agent: "", model: ""
            }
          }, agentToken);
          if (!assigned.assignees?.some(x => x.login?.includes("copilot"))) {
            console.warn("Agent assignment unavailable; repair issue retained.");
          } else {
            console.log("Assigned Copilot to repair issue #" + repair.number);
          }
        } catch (e) { console.warn("Copilot assignment failed, repair issue retained: " + String(e).slice(0, 350)); }
      }
    }
    await save("## BLOCKED: retry the same page after a fix\n\n" + summary +
      (repair ? "\n\nRepair task: #" + repair.number : "\n\nFix global CI checks first.") +
      (!agentToken ? "\n\nAutomated coding needs COPILOT_AGENT_PAT and an enabled paid GitHub Copilot cloud agent." : ""));
    console.log("Blocked " + page + "; next run stays on this page.");
    // Do not exit nonzero here: track broken pages without disabling schedules.
  }
}
