#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const skillsDir = path.join(root, ".agents", "skills");
const manifestPath = path.join(root, ".agents", "macca-managed-skills.txt");
const invocationPath = path.join(skillsDir, "_shared", "references", "invocation-policy.md");
const issues = [];

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function requireText(file, text, message) {
    if (!file.includes(text)) issues.push(message);
}

const managed = fs.readFileSync(manifestPath, "utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const publicSkills = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "_shared" && fs.existsSync(path.join(skillsDir, entry.name, "SKILL.md")))
    .map((entry) => entry.name)
    .sort();
const manifestSkills = managed.filter((name) => name !== "_shared").sort();

if (JSON.stringify(publicSkills) !== JSON.stringify(manifestSkills)) {
    issues.push(`manifest/folder mismatch: folders=${publicSkills.join(",")} manifest=${manifestSkills.join(",")}`);
}

const invocation = fs.readFileSync(invocationPath, "utf8");
for (const skill of publicSkills) {
    if (!invocation.includes(`\`${skill}\``)) issues.push(`invocation policy missing ${skill}`);
}

const meet = read(".agents/skills/meet/SKILL.md");
requireText(meet, "exactly one contribution block", "meet must limit each selected persona to one contribution");
requireText(meet, "No persona gets a second response", "meet must prohibit second persona turns");

const quick = read(".agents/skills/quick-dev/SKILL.md");
requireText(quick, "active report-first gate", "quick-dev must not intercept active report-first approval");

for (const skill of ["bug-fix", "code-review", "spec-compliance", "spec-audit"]) {
    const body = read(`.agents/skills/${skill}/SKILL.md`);
    requireText(body, "fix-mode.md", `${skill} must load the canonical fix-mode contract`);
}

const bugFix = read(".agents/skills/bug-fix/SKILL.md");
requireText(bugFix, "Always wait for explicit user approval before the first code change", "bug-fix must require explicit approval before first code change");
requireText(bugFix, "Validate Regression Prevention", "bug-fix must validate regression-prevention changes before recording the bug");

const release = read(".agents/skills/release-readiness/SKILL.md");
requireText(release, "report-only", "release-readiness must remain report-only");
requireText(release, "Never deploys", "release-readiness description must prohibit deployment");

const brainstormSession = read(".agents/skills/_shared/references/brainstorm-session.md");
for (const depth of ["quick", "standard", "critical"]) {
    requireText(brainstormSession, `\`${depth}\``, `brainstorm session must define ${depth} discovery depth`);
}
requireText(brainstormSession, "escalate the active depth to `critical`", "brainstorm session must escalate saved depth when current evidence is critical");

const requiredAssets = [
    ["brainstorm-prd", "PRD.template.md"],
    ["brainstorm-architecture", "architecture.template.md"],
    ["brainstorm-schema", "schema.template.md"],
    ["brainstorm-api", "api.template.md"],
    ["brainstorm-styleguide", "StyleGuide.template.md"],
    ["brainstorm-rules", "rules.template.md"],
    ["brainstorm-task", "Task.template.md"]
];
for (const [skill, asset] of requiredAssets) {
    const assetPath = path.join(skillsDir, skill, "assets", asset);
    if (!fs.existsSync(assetPath)) issues.push(`${skill} missing deferred output asset ${asset}`);
    const body = read(`.agents/skills/${skill}/SKILL.md`);
    requireText(body, `assets/${asset}`, `${skill} must defer-load ${asset}`);
}

requireText(read(".agents/skills/spec-init/SKILL.md"), "## Missing Decisions", "spec-init must record missing decisions");
requireText(read(".agents/skills/brainstorm-task/SKILL.md"), "Definition of Done", "brainstorm-task must derive phase Definition of Done");
requireText(read(".agents/skills/developer/SKILL.md"), "references/execute-task.md", "developer must use state-based task workflow");
requireText(read(".agents/skills/spec-audit/SKILL.md"), "skill-catalog.md", "framework audit must use compact skill catalog first");

const apiAsset = read(".agents/skills/brainstorm-api/assets/api.template.md");
for (const marker of [
    "## REST Section",
    "## GraphQL Section",
    "## RPC / tRPC Section",
    "## Event-Driven Section",
    "Retryable",
    "Client Action"
]) {
    requireText(apiAsset, marker, `api template missing ${marker}`);
}

const schemaAsset = read(".agents/skills/brainstorm-schema/assets/schema.template.md");
for (const marker of [
    "## Relational Section",
    "## Document Section",
    "## Key-Value Section",
    "## Graph Section",
    "## Event Store Section"
]) {
    requireText(schemaAsset, marker, `schema template missing ${marker}`);
}

const taskAsset = read(".agents/skills/brainstorm-task/assets/Task.template.md");
requireText(taskAsset, "## Phase 2: [Phase Name]", "task template missing a second phase example");
requireText(taskAsset, "Repeat the `Phase Definition of Done` block", "task template must require Definition of Done for every phase");

for (const skill of publicSkills) {
    const body = read(`.agents/skills/${skill}/SKILL.md`);
    if (body.includes("../_shared/references/runtime-config.md")) {
        issues.push(`${skill} still loads monolithic runtime-config.md`);
    }
}

if (issues.length) {
    process.stderr.write(`Behavioral contract findings:\n${issues.map((issue) => `- ${issue}`).join("\n")}\n`);
    process.exit(1);
}

process.stdout.write(`OK: ${publicSkills.length} skill behavioral contracts validated\n`);
