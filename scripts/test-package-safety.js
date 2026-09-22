#!/usr/bin/env node

"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");
const { gunzipSync, gzipSync } = require("node:zlib");
const { resolveNpmCommand } = require("./lib/npm-command.js");
const { documentationFiles, markdownLinks, headingAnchors, validateDocs } = require("./validate-docs.js");

const root = path.resolve(__dirname, "..");
const validator = path.join(root, "scripts", "validate-package.js");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "macca-package-safety-"));
const fixture = path.join(tmp, "fixture");
let checks = 0;

function npm(args, cwd) {
  const npm = resolveNpmCommand(args);
  return execFileSync(
    npm.command, npm.args,
    { cwd, encoding: "utf8", shell: false, stdio: ["ignore", "pipe", "pipe"] },
  );
}

function pack(directory) {
  const [result] = JSON.parse(npm([
    "pack", "--json", "--ignore-scripts", "--pack-destination", tmp,
  ], directory));
  return { ...result, tarball: path.join(tmp, result.filename) };
}

function validate(script, args, expected = []) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: tmp,
    encoding: "utf8",
  });
  assert.ifError(result.error);
  const output = `${result.stdout}${result.stderr}`;
  assert.equal(result.status, expected.length ? 1 : 0, output);
  for (const text of expected) {
    assert.ok(output.includes(text), `Missing diagnostic ${text}: ${output}`);
  }
  checks += 1;
}

try {
  assert.deepEqual(markdownLinks([
    "`[example](missing.md)` and ``[example](also-missing.md)``",
    "~~~md", "[example](fenced.md)", "~~~",
    "![image](image.webp) [guide](docs/workflows.md#baseline)",
    "[reference][guide]", "[guide]: docs/configuration.md",
  ].join("\n")).map((link) => link.destination), [
    "image.webp", "docs/workflows.md#baseline", "docs/configuration.md",
  ]);
  assert.deepEqual([...headingAnchors([
    "# Setup: `work_mode` & checks!", "# Repeat", "# Repeat", "# Repeat-1", "# Repeat",
    "```md", "# Not a heading", "```", "Café guide", "----------",
  ].join("\n"))], ["setup-work_mode--checks", "repeat", "repeat-1", "repeat-1-1", "repeat-2", "café-guide"]);
  checks += 1;

  const docsFixture = path.join(tmp, "docs-fixture");
  fs.mkdirSync(path.join(docsFixture, "docs"), { recursive: true });
  for (const file of documentationFiles) fs.writeFileSync(path.join(docsFixture, file), "# Guide\n");
  const docsReadme = path.join(docsFixture, "README.md");
  const packagedDocs = new Set(documentationFiles);
  fs.writeFileSync(docsReadme, "# Guide\n[workflow](docs/workflows.md#guide)\n`[not a link](missing.md)`\n");
  assert.deepEqual(validateDocs(docsFixture, packagedDocs), []);
  checks += 1;
  fs.writeFileSync(docsReadme, "[bad anchor](docs/workflows.md#missing)\n![bad image](absent.webp)\n");
  const brokenLinks = validateDocs(docsFixture, packagedDocs);
  assert.ok(brokenLinks.some((issue) => issue.includes("missing heading anchor")));
  assert.ok(brokenLinks.some((issue) => issue.includes("missing local link target")));
  checks += 1;
  fs.writeFileSync(docsReadme, "[unpublished guide](docs/workflows.md#guide)\n");
  assert.ok(validateDocs(docsFixture, new Set(["README.md"])).some((issue) => issue.includes("not packaged")));
  checks += 1;

  const original = pack(root);
  validate(validator, [original.tarball]);

  // Copy only the validated publication payload, never arbitrary workspace state.
  for (const { path: relative } of original.files) {
    const target = path.join(fixture, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(root, relative), target);
  }
  const packagePath = path.join(fixture, "package.json");
  const metadata = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  // Directory inclusion and npm's automatic CHANGELOG inclusion must not mask
  // a missing explicit publication declaration.
  const explicitFiles = [
    "CHANGELOG.md", ".agents/skills/_shared/scripts/read-preferences.js", "scripts/test-preferences.js",
  ];
  for (const file of explicitFiles) {
    fs.writeFileSync(packagePath, JSON.stringify({ ...metadata, files: metadata.files.filter((entry) => entry !== file) }));
    validate(validator, [pack(fixture).tarball], [`package files must explicitly include ${file}`]);
  }
  fs.writeFileSync(packagePath, JSON.stringify(metadata));
  const omittedDoc = "docs/workflows.md";
  const docPath = path.join(fixture, omittedDoc);
  const originalDoc = fs.readFileSync(docPath);
  fs.rmSync(docPath);
  const withoutDoc = pack(fixture);
  assert.ok(!withoutDoc.files.some((file) => file.path === omittedDoc));
  validate(validator, [withoutDoc.tarball], [`published package is missing ${omittedDoc}`]);
  fs.writeFileSync(docPath, originalDoc);
  const lockPath = path.join(fixture, ".agents", "macca-lock.json");
  const manifestPath = path.join(fixture, ".agents", "macca-managed-skills.txt");
  const originalLock = fs.readFileSync(lockPath, "utf8");
  const originalManifest = fs.readFileSync(manifestPath, "utf8");
  const staleLock = JSON.parse(originalLock);
  staleLock.version = "0.0.0-stale-lock";
  fs.writeFileSync(lockPath, JSON.stringify(staleLock));
  validate(validator, [pack(fixture).tarball], ["package/lock version mismatch"]);
  fs.writeFileSync(lockPath, originalLock);
  fs.writeFileSync(manifestPath, originalManifest.replace(/^developer\r?\n/m, ""));
  validate(validator, [pack(fixture).tarball], [
    "macca-lock.json skills do not match macca-managed-skills.txt",
    "managed skills do not match the official package contract",
  ]);
  staleLock.version = metadata.version;
  staleLock.skills = staleLock.skills.filter((skill) => skill !== "developer");
  fs.writeFileSync(lockPath, JSON.stringify(staleLock));
  validate(validator, [pack(fixture).tarball], [
    "managed skills do not match the official package contract",
  ]);
  fs.writeFileSync(manifestPath, originalManifest);
  validate(validator, [pack(fixture).tarball], [
    "macca-lock.json skills do not match macca-managed-skills.txt",
  ]);
  fs.writeFileSync(lockPath, originalLock);

  // Exercise archive parsing without relying on an installed tar executable.
  const cleanTarball = pack(fixture).tarball;
  const tar = gunzipSync(fs.readFileSync(cleanTarball));
  const firstSize = Number.parseInt(tar.subarray(124, 136).toString("ascii"), 8);
  const firstEnd = 512 + Math.ceil(firstSize / 512) * 512;
  const firstPath = tar.subarray(0, 100).toString("utf8").split("\0")[0];
  const crafted = path.join(tmp, "crafted.tgz");
  function checkArchive(bytes, expected = []) {
    fs.writeFileSync(crafted, gzipSync(bytes));
    validate(validator, [crafted], expected);
  }
  function checksum(header) {
    header.fill(32, 148, 156);
    const value = header.reduce((sum, byte) => sum + byte, 0);
    header.write(`${value.toString(8).padStart(6, "0")}\0 `, 148, 8, "ascii");
    return header;
  }
  function paxEntry(value, type = "x") {
    const record = `path=${value}\n`;
    let length = Buffer.byteLength(record) + 2;
    while (length !== Buffer.byteLength(record) + String(length).length + 1) {
      length = Buffer.byteLength(record) + String(length).length + 1;
    }
    const body = Buffer.from(`${length} ${record}`);
    const header = Buffer.from(tar.subarray(0, 512));
    header.fill(0, 0, 100);
    header.write("PaxHeader");
    header.write(`${body.length.toString(8).padStart(11, "0")}\0`, 124, 12, "ascii");
    header[156] = type.charCodeAt(0);
    return Buffer.concat([checksum(header), body, Buffer.alloc((512 - body.length % 512) % 512)]);
  }
  // A PAX path override must take precedence over the regular header name.
  const renamed = Buffer.from(tar);
  renamed.fill(0, 0, 100);
  renamed.write("package/placeholder");
  checksum(renamed.subarray(0, 512));
  checkArchive(Buffer.concat([paxEntry(firstPath), renamed]));
  const longPath = `package/${"long-private-path-".repeat(8)}.md`;
  checkArchive(Buffer.concat([paxEntry(longPath), tar]), [
    `published package includes unauthorized file ${longPath.slice(8)}`,
  ]);
  checkArchive(Buffer.concat([paxEntry("package/../private.md"), tar]), [
    "non-canonical package path",
  ]);
  checkArchive(Buffer.concat([paxEntry(firstPath, "g"), tar]), ["unsupported tar entry type"]);
  checkArchive(Buffer.concat([tar.subarray(0, firstEnd), tar]), ["duplicate package path"]);
  const link = Buffer.from(tar);
  link[156] = 50;
  checksum(link.subarray(0, 512));
  checkArchive(link, ["unsupported tar entry type"]);
  const badChecksum = Buffer.from(tar);
  badChecksum[0] ^= 1;
  checkArchive(badChecksum, ["tar checksum mismatch"]);
  checkArchive(tar.subarray(0, firstEnd - 1), ["truncated tar block"]);

  metadata.scripts.prepack = 'node -e "process.exit(97)"';
  metadata.scripts.postpack = 'node -e "process.exit(97)"';
  const unauthorized = [
    "docs/private.md",
    "bin/credentials.json",
    ".agents/skills/developer/private.md",
    ".agents/skills/setup-macca-method/private.md",
    ".agents/skills/_shared/references/secrets.md",
    ".agents/skills/brainstorm-prd/assets/private.template.md",
    ".agents/skills/unofficial/SKILL.md",
    ".agents/developer-config.json",
    "evals/results/report.json",
    "evals/acceptance-workspace/transcript.md",
  ];
  metadata.files.push(".agents/skills/unofficial/", ".agents/developer-config.json", "docs/private.md", "evals/");
  fs.writeFileSync(packagePath, `${JSON.stringify(metadata, null, 2)}\n`);
  for (const relative of unauthorized) {
    const target = path.join(fixture, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, "Synthetic private fixture; never publish.\n");
  }
  const unexpectedDiagnostics = unauthorized.map(
    (file) => `published package includes unauthorized file ${file}`,
  );
  // The current fixture is invalid, but the earlier tarball is still valid.
  const fixtureValidator = path.join(fixture, "scripts", "validate-package.js");
  validate(fixtureValidator, [original.tarball]);
  validate(fixtureValidator, [], unexpectedDiagnostics);
  const contaminated = pack(fixture);
  assert.ok(contaminated.files.some((file) => file.path === "docs/private.md"),
    "private documentation fixture must actually be packed to exercise rejection");
  for (const relative of unauthorized) {
    fs.rmSync(path.join(fixture, relative));
  }
  // Cleaning the source cannot hide files already present in the actual artifact.
  validate(validator, [contaminated.tarball], unexpectedDiagnostics);

  const missing = original.files.map((entry) => entry.path).filter((file) =>
    file.startsWith(".agents/skills/_shared/") ||
    file.includes("/assets/") || file.includes("/references/") ||
    file === ".agents/legacy-payloads.json" ||
    file === ".agents/skills/developer/SKILL.md" ||
    file === ".agents/skills/setup-macca-method/SKILL.md" ||
    ["CHANGELOG.md", "scripts/test-preferences.js", "scripts/test-config.js", "scripts/test-cli-setup.js", "scripts/test-npm-command.js",
      "scripts/lib/npm-command.js"].includes(file),
  );
  for (const relative of missing) {
    fs.rmSync(path.join(fixture, relative));
  }
  validate(validator, [pack(fixture).tarball], missing.map(
    (file) => `published package is missing ${file}`,
  ));

  metadata.version = "0.0.0-package-safety-fixture";
  fs.writeFileSync(packagePath, `${JSON.stringify(metadata, null, 2)}\n`);
  validate(validator, [pack(fixture).tarball], [
    "tarball name/version do not match package.json",
  ]);
  process.stdout.write(`OK: ${checks} package safety checks passed\n`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
