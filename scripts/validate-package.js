#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { gunzipSync } = require("node:zlib");
const { TextDecoder } = require("node:util");
const { resolveNpmCommand } = require("./lib/npm-command.js");
const { validateDocs } = require("./validate-docs.js");

const root = path.resolve(__dirname, "..");
const issues = [];

// Keep the publication contract independent of directory contents and user state.
const skillAssets = {
  "add-feature": [],
  "brainstorm-api": ["assets/api.template.md"],
  "brainstorm-architecture": ["assets/architecture.template.md"],
  "brainstorm-prd": ["assets/PRD.template.md"],
  "brainstorm-rules": ["assets/rules.template.md"],
  "brainstorm-schema": ["assets/schema.template.md"],
  "brainstorm-styleguide": ["assets/StyleGuide.template.md"],
  "brainstorm-task": ["assets/Task.template.md"],
  "bug-fix": ["assets/bug-log.template.md"],
  "code-review": ["references/review-checklist.md"],
  developer: [
    "references/close-phase.md",
    "references/execute-task.md",
    "references/onboarding.md",
  ],
  help: [],
  meet: [],
  "quick-dev": [],
  "release-readiness": [],
  "setup-macca-method": [],
  "spec-audit": [],
  "spec-compliance": [],
  "spec-init": [],
};
const sharedReferences = [
  "additional-skills", "brainstorm-session", "config-mutation", "finding-format",
  "fix-mode", "human-loop", "implementation-principles", "invocation-policy",
  "language-config", "interaction-contract", "output-ownership", "personas", "planning-principles", "runtime-config",
  "scope-delta", "scope-rules", "skill-catalog", "workspace-safety",
];
const requiredFiles = new Set([
  "package.json",
  "README.md",
  "CHANGELOG.md",
  "docs/workflows.md",
  "docs/configuration.md",
  "docs/troubleshooting.md",
  "LICENSE",
  "flow.webp",
  "image-macca-method.webp",
  "bin/macca-method.js",
  ".agents/legacy-payloads.json",
  ".agents/macca-lock.json",
  ".agents/macca-managed-skills.txt",
  ...Object.entries(skillAssets).flatMap(([name, assets]) =>
    ["SKILL.md", ...assets].map((file) => `.agents/skills/${name}/${file}`),
  ),
  ...sharedReferences.map((name) => `.agents/skills/_shared/references/${name}.md`),
  ".agents/skills/_shared/scripts/validate-skills.py",
  ".agents/skills/_shared/scripts/config-validator.js",
  ".agents/skills/_shared/scripts/config-file.js",
  ".agents/skills/_shared/scripts/read-preferences.js",
  "scripts/lib/npm-command.js",
  ...[
    "run-skill-validator", "test-install", "test-installer-safety",
    "test-package-safety", "test-upgrade-legacy", "validate-package",
    "validate-skill-behavior", "validate-docs", "test-config", "test-preferences", "test-cli-setup", "test-npm-command",
  ].map((name) => `scripts/${name}.js`),
]);

function sorted(values) {
  return [...values].sort();
}

function readArchive(tarballPath) {
  // Deliberately bounded to npm's regular-file ustar/local-PAX payloads. No
  // extraction, links, global overrides, GNU extensions, or candidate execution.
  const fail = (message) => { throw new Error(`Invalid package archive: ${message}`); };
  const decode = (bytes) => new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const text = (bytes) => {
    const end = bytes.indexOf(0);
    if (end !== -1 && bytes.subarray(end).some((byte) => byte !== 0)) {
      fail("ambiguous tar string field");
    }
    return decode(end === -1 ? bytes : bytes.subarray(0, end));
  };
  const octal = (bytes) => {
    const value = decode(bytes).replace(/\0+$/, "").trim();
    if (!/^[0-7]+$/.test(value)) fail("unsupported tar numeric field");
    const result = Number.parseInt(value, 8);
    if (!Number.isSafeInteger(result)) fail("tar numeric field overflow");
    return result;
  };
  const metadataPaths = new Set([
    "package.json", ".agents/macca-lock.json", ".agents/macca-managed-skills.txt",
  ]);
  if (fs.statSync(tarballPath).size > 16 * 1024 * 1024) fail("compressed size exceeds 16 MiB");
  const tar = gunzipSync(fs.readFileSync(tarballPath), { maxOutputLength: 32 * 1024 * 1024 });
  if (tar.length % 512 !== 0) fail("truncated tar block");
  const files = [];
  const metadata = new Map();
  const seen = new Set();
  let pax = null;
  let offset = 0;
  let entries = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      if (pax || offset + 1024 > tar.length || tar.subarray(offset).some((byte) => byte !== 0)) {
        fail("ambiguous or incomplete tar terminator");
      }
      return { files, metadata };
    }
    if (++entries > 4096) fail("too many tar entries");
    const checksum = header.reduce((sum, byte, index) => sum + (index >= 148 && index < 156 ? 32 : byte), 0);
    // Checksum fields conventionally end in NUL followed by a space.
    const storedChecksum = decode(header.subarray(148, 156)).replace(/[\0 ]+$/, "");
    if (!/^[0-7]+$/.test(storedChecksum) || Number.parseInt(storedChecksum, 8) !== checksum) {
      fail("tar checksum mismatch");
    }
    if (text(header.subarray(257, 263)) !== "ustar" || decode(header.subarray(263, 265)) !== "00") {
      fail("unsupported tar format");
    }
    const size = octal(header.subarray(124, 136));
    const bodyStart = offset + 512;
    offset = bodyStart + Math.ceil(size / 512) * 512;
    if (offset > tar.length) fail("truncated tar entry");
    const body = tar.subarray(bodyStart, bodyStart + size);
    const type = header[156];
    if (type === 120) { // Local PAX extended header.
      if (pax || size > 64 * 1024) fail("ambiguous or oversized PAX header");
      pax = new Map();
      let cursor = 0;
      while (cursor < body.length) {
        const space = body.indexOf(32, cursor);
        if (space === -1) fail("malformed PAX length");
        const lengthText = decode(body.subarray(cursor, space));
        const length = Number(lengthText);
        if (!/^[1-9][0-9]*$/.test(lengthText) || !Number.isSafeInteger(length) ||
            length <= space - cursor + 1 || cursor + length > body.length || body[cursor + length - 1] !== 10) {
          fail("malformed PAX record");
        }
        const record = decode(body.subarray(space + 1, cursor + length - 1));
        const equal = record.indexOf("=");
        const key = record.slice(0, equal);
        if (equal < 1 || pax.has(key) || ![
          "path", "size", "mtime", "atime", "ctime", "uid", "gid", "uname", "gname",
          "SCHILY.dev", "SCHILY.ino", "SCHILY.nlink",
        ].includes(key) || /[\0\r\n]/.test(record)) fail("unsupported or ambiguous PAX attribute");
        pax.set(key, record.slice(equal + 1));
        cursor += length;
      }
      continue;
    }
    if (type !== 0 && type !== 48) fail("unsupported tar entry type");
    if (text(header.subarray(157, 257))) fail("regular file has a link target");
    if (pax?.has("size") && pax.get("size") !== String(size)) fail("ambiguous PAX size");
    const prefix = text(header.subarray(345, 500));
    const name = text(header.subarray(0, 100));
    const fullPath = pax?.get("path") ?? (prefix ? `${prefix}/${name}` : name);
    pax = null;
    if (!fullPath.startsWith("package/") || fullPath.includes("\\") ||
        fullPath.split("/").some((part) => !part || part === "." || part === "..")) {
      fail("non-canonical package path");
    }
    const relative = fullPath.slice("package/".length);
    if (seen.has(relative)) fail("duplicate package path");
    seen.add(relative);
    files.push({ path: relative });
    if (metadataPaths.has(relative)) {
      if (size > 256 * 1024) fail("metadata exceeds 256 KiB");
      metadata.set(relative, decode(body));
    }
  }
  fail("missing tar terminator");
}

const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && !fs.statSync(path.resolve(args[0])).isFile())) {
  throw new Error("Usage: node scripts/validate-package.js [local-tarball.tgz]");
}
const expectedPackage = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const archive = args.length ? readArchive(path.resolve(args[0])) : null;
function readMetadata(relative) {
  if (!archive) return fs.readFileSync(path.join(root, relative), "utf8");
  if (!archive.metadata.has(relative)) throw new Error(`published package is missing ${relative}`);
  return archive.metadata.get(relative);
}
const packageJson = archive ? JSON.parse(readMetadata("package.json")) : expectedPackage;
const lock = JSON.parse(readMetadata(".agents/macca-lock.json"));
const manifestSkills = readMetadata(".agents/macca-managed-skills.txt")
  .split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const packageFiles = Array.isArray(packageJson.files) ? packageJson.files : [];

if (packageFiles.includes(".agents/")) {
  issues.push("package files must not include the broad .agents/ directory");
}
for (const file of [
  "docs/workflows.md", "docs/configuration.md", "docs/troubleshooting.md", "scripts/validate-docs.js",
  "CHANGELOG.md", ".agents/skills/_shared/scripts/config-validator.js",
  ".agents/skills/_shared/scripts/read-preferences.js", "scripts/test-preferences.js",
]) {
  if (!packageFiles.includes(file)) issues.push(`package files must explicitly include ${file}`);
}
if (packageFiles.some((file) => /^\/?docs\/?$/.test(file) || /^\/?docs\/.*[*?\[\]{}]/.test(file))) {
  issues.push("package files must not include a broad docs directory or glob");
}

if (lock.version !== expectedPackage.version) {
  issues.push(
    `package/lock version mismatch: package=${expectedPackage.version} lock=${lock.version}`,
  );
}

if (!Array.isArray(lock.skills) || JSON.stringify(sorted(lock.skills)) !== JSON.stringify(sorted(manifestSkills))) {
  issues.push("macca-lock.json skills do not match macca-managed-skills.txt");
}

if (
  JSON.stringify(sorted(manifestSkills)) !==
  JSON.stringify(sorted(["_shared", ...Object.keys(skillAssets)]))
) {
  issues.push("managed skills do not match the official package contract");
}

function listPackageFiles() {
  // Disable lifecycle hooks so validation cannot recursively invoke itself.
  const npm = resolveNpmCommand(["pack", root, "--dry-run", "--json", "--ignore-scripts"]);
  return JSON.parse(execFileSync(npm.command, npm.args, {
    cwd: root,
    encoding: "utf8",
    shell: false,
    maxBuffer: 10 * 1024 * 1024,
  }));
}

const packageList = archive ? [{ ...packageJson, files: archive.files }] : listPackageFiles();
if (!Array.isArray(packageList) || packageList.length !== 1 || !Array.isArray(packageList[0].files)) {
  throw new Error("npm pack did not return exactly one package file listing");
}
const packed = packageList[0];
const files = packed.files.map((entry) => entry.path);
const fileSet = new Set(files);

if (packed.name !== expectedPackage.name || packed.version !== expectedPackage.version) {
  issues.push("tarball name/version do not match package.json");
}
if (fileSet.size !== files.length) {
  issues.push("published package contains duplicate paths");
}
for (const file of files) {
  if (!requiredFiles.has(file)) {
    issues.push(`published package includes unauthorized file ${file}`);
  }
}

for (const requiredFile of requiredFiles) {
  if (!fileSet.has(requiredFile)) {
    issues.push(`published package is missing ${requiredFile}`);
  }
}

// Source links must target both a required publication file and the actual
// pack listing. Candidate archives remain passive: never execute their code.
if (!archive) {
  issues.push(...validateDocs(root, new Set([...requiredFiles].filter((file) => fileSet.has(file)))));
}

if (issues.length > 0) {
  process.stderr.write(
    `Package contract findings:\n${issues.map((issue) => `- ${issue}`).join("\n")}\n`,
  );
  process.exit(1);
}

process.stdout.write(
  `OK: package metadata and ${files.length} tarball files validated${archive ? "" : "; README and 3 guides have valid packaged links/anchors"}\n`,
);
