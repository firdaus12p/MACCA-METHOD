#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const crypto = require("node:crypto");
const os = require("node:os");
const path = require("node:path");
const readline = require("node:readline");

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const SOURCE_AGENTS_DIR = path.join(PACKAGE_ROOT, ".agents");
const SOURCE_SKILLS_DIR = path.join(SOURCE_AGENTS_DIR, "skills");
const SOURCE_MANAGED_SKILLS_FILE = path.join(
  SOURCE_AGENTS_DIR,
  "macca-managed-skills.txt",
);
const SOURCE_LOCK_FILE = path.join(SOURCE_AGENTS_DIR, "macca-lock.json");
const SOURCE_LEGACY_PAYLOADS_FILE = path.join(
  SOURCE_AGENTS_DIR,
  "legacy-payloads.json",
);
const OWNERSHIP_MARKER = ".macca-owned.json";
const TRANSACTION_FILE = "macca-transaction.json";
const STATE_FILE = "macca-state.json";

const TOOL_DEFINITIONS = [
  {
    key: "copilot",
    aliases: ["github-copilot"],
    label: "GitHub Copilot",
    destination: (targetDir) => path.join(targetDir, ".github", "skills"),
    displayDestination: ".github/skills/",
  },
  {
    key: "cursor",
    aliases: [],
    label: "Cursor",
    destination: (targetDir) => path.join(targetDir, ".cursor", "skills"),
    displayDestination: ".cursor/skills/",
  },
  {
    key: "claude",
    aliases: ["claude-code"],
    label: "Claude Code",
    destination: (targetDir) => path.join(targetDir, ".claude", "skills"),
    displayDestination: ".claude/skills/",
  },
  {
    key: "windsurf",
    aliases: [],
    label: "Windsurf",
    destination: (targetDir) => path.join(targetDir, ".windsurf", "skills"),
    displayDestination: ".windsurf/skills/",
  },
  {
    key: "gemini",
    aliases: ["gemini-cli"],
    label: "Gemini CLI",
    destination: (targetDir) => path.join(targetDir, ".gemini", "skills"),
    displayDestination: ".gemini/skills/",
  },
  {
    key: "opencode",
    aliases: [],
    label: "OpenCode",
    destination: (targetDir) => path.join(targetDir, ".opencode", "skills"),
    displayDestination: ".opencode/skills/",
  },
  {
    key: "kilo",
    aliases: ["kilo-code"],
    label: "Kilo Code",
    destination: (targetDir) => path.join(targetDir, ".kilo", "skills"),
    displayDestination: ".kilo/skills/",
  },
  {
    key: "codex",
    aliases: ["openai-codex"],
    label: "Codex (OpenAI)",
    destination: (targetDir) => path.join(targetDir, ".agents", "skills"),
    displayDestination: ".agents/skills/",
  },
  {
    key: "kimi",
    aliases: ["kimi-cli"],
    label: "Kimi CLI",
    destination: (targetDir) => path.join(targetDir, ".agents", "skills"),
    displayDestination: ".agents/skills/",
  },
];

const TOOL_BY_KEY = new Map(TOOL_DEFINITIONS.map((tool) => [tool.key, tool]));
const TOOL_LOOKUP = new Map();
for (const tool of TOOL_DEFINITIONS) {
  TOOL_LOOKUP.set(tool.key, tool.key);
  for (const alias of tool.aliases) {
    TOOL_LOOKUP.set(alias, tool.key);
  }
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const command = args._[0] || "help";

    if (args.version) {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8"),
      );
      process.stdout.write(`${packageJson.version}\n`);
      return;
    }

    if (args.listTools) {
      printToolList();
      return;
    }

    if (args.help || command === "help") {
      printHelp();
      return;
    }

    ensurePackagedFiles();

    if (command === "install") {
      runInstall(args).catch((error) => exitWithError(error.message));
      return;
    }

    if (command === "upgrade") {
      runUpgrade(args);
      return;
    }

    exitWithError(`Unknown command: ${command}`);
  } catch (error) {
    exitWithError(error.message);
  }
}

function parseArgs(argv) {
  const args = {
    _: [],
    tools: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "-h" || token === "--help") {
      args.help = true;
      continue;
    }

    if (token === "-v" || token === "--version") {
      args.version = true;
      continue;
    }

    if (token === "-y" || token === "--yes") {
      args.yes = true;
      continue;
    }

    if (token === "-f" || token === "--force") {
      args.force = true;
      continue;
    }

    if (token === "--list-tools") {
      args.listTools = true;
      continue;
    }

    if (token === "-t" || token === "--tool" || token === "--tools") {
      const result = takeValue(argv, index, token);
      args.tools.push(result.value);
      index = result.index;
      continue;
    }

    if (token.startsWith("--tool=") || token.startsWith("--tools=")) {
      args.tools.push(token.slice(token.indexOf("=") + 1));
      continue;
    }

    if (token === "-d" || token === "--directory") {
      const result = takeValue(argv, index, token);
      args.directory = result.value;
      index = result.index;
      continue;
    }

    if (token.startsWith("--directory=")) {
      args.directory = token.slice(token.indexOf("=") + 1);
      continue;
    }

    if (token === "--name") {
      const result = takeValue(argv, index, token);
      args.name = result.value;
      index = result.index;
      continue;
    }

    if (token.startsWith("--name=")) {
      args.name = token.slice(token.indexOf("=") + 1);
      continue;
    }

    if (token === "--project") {
      const result = takeValue(argv, index, token);
      args.project = result.value;
      index = result.index;
      continue;
    }

    if (token.startsWith("--project=")) {
      args.project = token.slice(token.indexOf("=") + 1);
      continue;
    }

    if (token === "--communication-language") {
      const result = takeValue(argv, index, token);
      args.communicationLanguage = result.value;
      index = result.index;
      continue;
    }

    if (token.startsWith("--communication-language=")) {
      args.communicationLanguage = token.slice(token.indexOf("=") + 1);
      continue;
    }

    if (token === "--document-language" || token === "--documents-language") {
      const result = takeValue(argv, index, token);
      args.documentLanguage = result.value;
      index = result.index;
      continue;
    }

    if (
      token.startsWith("--document-language=") ||
      token.startsWith("--documents-language=")
    ) {
      args.documentLanguage = token.slice(token.indexOf("=") + 1);
      continue;
    }

    if (token.startsWith("-")) {
      throw new Error(`Unknown option: ${token}`);
    }

    args._.push(token);
  }

  return args;
}

function takeValue(argv, index, flag) {
  const value = argv[index + 1];
  if (value === undefined) {
    throw new Error(`Missing value for ${flag}`);
  }

  return {
    value,
    index: index + 1,
  };
}

function ensurePackagedFiles() {
  if (!fs.existsSync(SOURCE_SKILLS_DIR)) {
    throw new Error(
      "Packaged skills directory is missing. Reinstall the package or run from the repository root.",
    );
  }

  if (!fs.existsSync(SOURCE_LOCK_FILE)) {
    throw new Error(".agents/macca-lock.json is missing from the package.");
  }
}

function printHelp() {
  process.stdout.write(
    [
      "MACCA CLI",
      "",
      "Usage:",
      "  npx macca-method@latest install [options]",
      "  npx macca-method@latest upgrade [options]",
      "  npx macca-method@latest --list-tools",
      "",
      "Install options:",
      "  -t, --tool <name>                 Repeatable. Also accepts comma-separated values.",
      "  -d, --directory <path>           Target project directory. Defaults to the current directory.",
      "  -y, --yes                        Skip prompts and use defaults where needed.",
      "  -f, --force                      Overwrite locally modified managed skills.",
      "      --name <value>               Developer name.",
      "      --project <value>            Project name.",
      "      --communication-language <value>",
      "      --document-language <value>",
      "",
      "Examples:",
      "  npx macca-method@latest install",
      "  npx macca-method@latest install --tool github-copilot --tool codex --yes",
      "  npx macca-method@latest upgrade",
      "",
    ].join("\n"),
  );
}

function printToolList() {
  process.stdout.write("Supported tools:\n");
  TOOL_DEFINITIONS.forEach((tool, index) => {
    const aliases =
      tool.aliases.length > 0 ? ` (aliases: ${tool.aliases.join(", ")})` : "";
    process.stdout.write(
      `  ${index + 1}. ${tool.key} -> ${tool.label}${aliases}\n`,
    );
  });
}

function resolveTargetDirectory(rawDirectory) {
  if (!rawDirectory) {
    return process.cwd();
  }

  return path.resolve(process.cwd(), rawDirectory);
}

function assertSafeTargetDirectory(rawDirectory) {
  const requested = rawDirectory
    ? path.resolve(process.cwd(), rawDirectory)
    : process.cwd();
  const absolute = path.isAbsolute(requested)
    ? requested
    : path.resolve(requested);
  const segments = absolute.split(path.sep).filter(Boolean);
  let current = absolute.startsWith(path.sep)
    ? path.sep
    : segments.shift() || absolute;

  if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) {
    throw new Error(`Refusing symlinked target project ancestor: ${current}`);
  }

  for (const segment of segments) {
    current =
      current === path.sep
        ? path.join(current, segment)
        : path.join(current, segment);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) {
      throw new Error(`Refusing symlinked target project ancestor: ${current}`);
    }
  }

  return absolute;
}

function readNonEmptyLines(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values)];
}

function getSourceManagedSkills() {
  const managedSkills = readNonEmptyLines(SOURCE_MANAGED_SKILLS_FILE);
  if (managedSkills.length > 0) {
    return validateManagedSkillNames(
      managedSkills,
      "packaged managed-skill manifest",
    );
  }

  return validateManagedSkillNames(
    fs
      .readdirSync(SOURCE_SKILLS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort(),
    "packaged skills directory",
  );
}

function validateManagedSkillNames(skillNames, sourceLabel) {
  const validName = /^(?:_[a-z0-9]+|[a-z0-9]+(?:-[a-z0-9]+)*)$/;

  for (const skillName of skillNames) {
    if (
      !validName.test(skillName) ||
      skillName.includes("..") ||
      path.basename(skillName) !== skillName
    ) {
      throw new Error(`Unsafe skill name in ${sourceLabel}: ${skillName}`);
    }
  }

  return unique(skillNames);
}

function resolveOwnedSkillPath(destination, skillName) {
  validateManagedSkillNames([skillName], "managed-skill manifest");
  const root = path.resolve(destination);
  const target = path.resolve(root, skillName);

  if (!target.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Refusing path outside skill destination: ${skillName}`);
  }

  return target;
}

function normalizeLanguage(value) {
  const trimmed = String(value || "").trim();
  const lowered = trimmed.toLowerCase();

  switch (lowered) {
    case "":
    case "id":
    case "indo":
    case "indonesia":
    case "indonesian":
    case "bahasa indonesia":
      return "indonesian";
    case "en":
    case "eng":
    case "english":
    case "inggris":
    case "bahasa inggris":
      return "english";
    default:
      return lowered;
  }
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function assertSafeProjectPath(targetDir, destination) {
  const targetRoot = path.resolve(targetDir);
  const resolvedDestination = path.resolve(destination);
  if (
    resolvedDestination !== targetRoot &&
    !resolvedDestination.startsWith(`${targetRoot}${path.sep}`)
  ) {
    throw new Error(
      `Refusing destination outside target project: ${destination}`,
    );
  }

  if (fs.existsSync(targetRoot) && fs.lstatSync(targetRoot).isSymbolicLink()) {
    throw new Error(`Refusing symlinked target project: ${targetRoot}`);
  }

  const relative = path.relative(targetRoot, resolvedDestination);
  let current = targetRoot;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) {
      throw new Error(
        `Refusing symlinked skill destination component: ${current}`,
      );
    }
  }
}

function writeTextFile(filePath, content) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function copyFile(sourcePath, targetPath) {
  ensureDirectory(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
}

function hashFile(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function hashText(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

const IGNORED_DIRECTORY_NAMES = new Set([
  OWNERSHIP_MARKER,
  ".DS_Store",
  "Thumbs.db",
  "__pycache__",
  ".pytest_cache",
  ".ruff_cache",
]);

function shouldIgnoreDirectoryEntry(name) {
  if (IGNORED_DIRECTORY_NAMES.has(name)) {
    return true;
  }
  if (
    name.endsWith(".pyc") ||
    name.endsWith(".pyo") ||
    name.endsWith(".tmp") ||
    name.startsWith(".tmp-")
  ) {
    return true;
  }
  return false;
}

function getDirectoryFileHashes(directoryPath) {
  const hashes = {};

  function walk(currentPath, relativePath = "") {
    const entries = fs
      .readdirSync(currentPath, { withFileTypes: true })
      .filter((entry) => !shouldIgnoreDirectoryEntry(entry.name))
      .sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);
      const entryRelativePath = path
        .join(relativePath, entry.name)
        .split(path.sep)
        .join("/");
      if (entry.isSymbolicLink()) {
        throw new Error(`Refusing symlink inside managed skill: ${entryPath}`);
      }
      if (entry.isDirectory()) {
        walk(entryPath, entryRelativePath);
      } else if (entry.isFile()) {
        hashes[entryRelativePath] = hashFile(entryPath);
      } else {
        throw new Error(
          `Unsupported file type inside managed skill: ${entryPath}`,
        );
      }
    }
  }

  walk(directoryPath);
  return hashes;
}

function hashDirectory(directoryPath) {
  return hashText(JSON.stringify(getDirectoryFileHashes(directoryPath)));
}

function getLegacyPayloadHashes() {
  if (!fs.existsSync(SOURCE_LEGACY_PAYLOADS_FILE)) return {};
  const releases = readJsonObject(
    SOURCE_LEGACY_PAYLOADS_FILE,
    "legacy payload fingerprints",
  );
  const combined = {};
  for (const payloads of Object.values(releases)) {
    if (!payloads || typeof payloads !== "object" || Array.isArray(payloads))
      continue;
    for (const [encodedSkillName, payloadHash] of Object.entries(payloads)) {
      if (
        typeof payloadHash !== "string" ||
        !/^[a-f0-9]{64}$/.test(payloadHash)
      )
        continue;
      const skillName = encodedSkillName.startsWith("base64:")
        ? Buffer.from(
            encodedSkillName.slice("base64:".length),
            "base64",
          ).toString("utf8")
        : encodedSkillName;
      if (!combined[skillName]) combined[skillName] = new Set();
      combined[skillName].add(payloadHash);
    }
  }
  return combined;
}

function isLegacyDirectoryUnchanged(targetPath, skillName) {
  if (!fs.existsSync(targetPath) || isMaccaOwned(targetPath)) return false;
  if (!fs.lstatSync(targetPath).isDirectory()) return false;
  const hashes = getLegacyPayloadHashes()[skillName];
  const payloadHash = hashDirectory(targetPath);
  return Boolean(hashes && hashes.has(payloadHash));
}

function buildInstalledLock(managedSkills) {
  const lock = JSON.parse(fs.readFileSync(SOURCE_LOCK_FILE, "utf8"));
  lock.hashAlgorithm = "sha256";
  lock.payloadFiles = {};
  for (const skillName of managedSkills) {
    lock.payloadFiles[skillName] = getDirectoryFileHashes(
      path.join(SOURCE_SKILLS_DIR, skillName),
    );
  }
  return `${JSON.stringify(lock, null, 2)}\n`;
}

function compareSemver(left, right) {
  const parse = (value) =>
    String(value || "0.0.0")
      .split("-")[0]
      .split(".")
      .map((part) => Number.parseInt(part, 10) || 0);
  const a = parse(left);
  const b = parse(right);
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (a[index] || 0) - (b[index] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function assertPackageNotOlderThanInstalled(agentsDirectory) {
  const installedLockPath = path.join(agentsDirectory, "macca-lock.json");
  if (!fs.existsSync(installedLockPath)) {
    return;
  }

  const packagedLock = readJsonObject(SOURCE_LOCK_FILE, "packaged MACCA lock");
  const installedLock = readJsonObject(
    installedLockPath,
    "installed MACCA lock",
  );
  const packagedVersion = packagedLock.version;
  const installedVersion = installedLock.version;
  if (
    typeof packagedVersion !== "string" ||
    typeof installedVersion !== "string"
  ) {
    return;
  }

  if (compareSemver(packagedVersion, installedVersion) < 0) {
    throw new Error(
      `Refusing to downgrade MACCA from ${installedVersion} to ${packagedVersion}. ` +
        "Publish or use a newer package before running install/upgrade.",
    );
  }
}

function readOwnershipMarker(
  targetPath,
  expectedSkill = path.basename(targetPath),
) {
  const markerPath = path.join(targetPath, OWNERSHIP_MARKER);
  if (!fs.existsSync(markerPath)) {
    return null;
  }

  try {
    const marker = JSON.parse(fs.readFileSync(markerPath, "utf8"));
    if (marker.owner !== "macca-method" || marker.skill !== expectedSkill) {
      return null;
    }
    return marker;
  } catch {
    return null;
  }
}

function isMaccaOwned(targetPath) {
  return readOwnershipMarker(targetPath) !== null;
}

function assertManagedDirectoryUnchanged(targetPath, force = false) {
  if (force) {
    return;
  }
  const marker = readOwnershipMarker(targetPath);
  if (!marker) {
    throw new Error(
      `Refusing to overwrite unowned skill directory: ${targetPath}`,
    );
  }
  if (!marker.payloadHash || marker.payloadHash !== hashDirectory(targetPath)) {
    throw new Error(
      `Refusing to overwrite locally modified managed skill: ${targetPath}. ` +
        "Run upgrade with --force to overwrite local modifications.",
    );
  }
}

function readJsonObject(filePath, label) {
  try {
    const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("root value must be an object");
    }
    return value;
  } catch (error) {
    throw new Error(`Invalid ${label} at ${filePath}: ${error.message}`);
  }
}

function assertManagedFilesUnchanged(agentsDirectory, force = false) {
  if (force) {
    return;
  }
  const statePath = path.join(agentsDirectory, STATE_FILE);
  if (!fs.existsSync(statePath)) {
    return;
  }
  const state = readJsonObject(statePath, "MACCA state");
  for (const [fileName, expectedHash] of Object.entries(state.files || {})) {
    const filePath = path.join(agentsDirectory, fileName);
    if (!fs.existsSync(filePath) || hashFile(filePath) !== expectedHash) {
      throw new Error(
        `Refusing to overwrite locally modified MACCA metadata: ${filePath}. ` +
          "Run upgrade with --force to overwrite local modifications.",
      );
    }
  }
}

function buildStateContent(files) {
  const hashes = {};
  for (const [fileName, content] of Object.entries(files)) {
    hashes[fileName] = hashText(content);
  }
  return `${JSON.stringify({ version: 1, hashAlgorithm: "sha256", files: hashes }, null, 2)}\n`;
}

function writeJsonAtomic(filePath, value) {
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(
    temporaryPath,
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
  fs.renameSync(temporaryPath, filePath);
}

function removeManagedPath(targetPath, kind) {
  fs.rmSync(targetPath, { recursive: kind === "directory", force: true });
}

function assertTransactionPayload(entry, transactionId, candidatePath) {
  if (!fs.existsSync(candidatePath)) {
    return;
  }
  if (entry.kind === "directory") {
    const marker = readOwnershipMarker(
      candidatePath,
      path.basename(entry.targetPath),
    );
    if (!marker || marker.transactionId !== transactionId) {
      throw new Error(
        `Refusing recovery of directory without matching transaction evidence: ${candidatePath}`,
      );
    }
    return;
  }
  if (!entry.stagedHash || hashFile(candidatePath) !== entry.stagedHash) {
    throw new Error(
      `Refusing recovery of file without matching transaction hash: ${candidatePath}`,
    );
  }
}

function assertTransactionBackup(entry) {
  if (!fs.existsSync(entry.backupPath)) {
    return;
  }
  if (entry.kind === "directory") {
    const marker = readOwnershipMarker(
      entry.backupPath,
      path.basename(entry.targetPath),
    );
    const validManaged =
      marker &&
      marker.payloadHash &&
      marker.payloadHash === hashDirectory(entry.backupPath);
    const validLegacy =
      entry.legacySkillName &&
      isLegacyDirectoryUnchanged(entry.backupPath, entry.legacySkillName);
    if (!validManaged && !validLegacy) {
      throw new Error(
        `Refusing recovery from unowned or modified backup directory: ${entry.backupPath}`,
      );
    }
  }
}

function validateTransactionEntries(targetDir, journal) {
  if (
    journal.version !== 1 ||
    !["committing", "committed"].includes(journal.phase)
  ) {
    throw new Error("Unsupported MACCA transaction journal version or phase");
  }
  if (
    typeof journal.transactionId !== "string" ||
    !/^\d+-\d+-[a-f0-9]+$/.test(journal.transactionId)
  ) {
    throw new Error("Invalid MACCA transaction ID");
  }
  if (!Array.isArray(journal.entries)) {
    throw new Error("Invalid MACCA transaction journal entries");
  }

  const metadataTargets = new Set(
    [
      "macca-managed-skills.txt",
      "macca-lock.json",
      "macca-tools.txt",
      "developer-config.json",
      STATE_FILE,
    ].map((fileName) => path.resolve(targetDir, ".agents", fileName)),
  );
  const skillParents = new Set([
    ...TOOL_DEFINITIONS.map((tool) =>
      path.resolve(tool.destination(targetDir)),
    ),
    path.resolve(targetDir, ".opencode", "skill"),
  ]);
  const seenPaths = new Set();

  for (const entry of journal.entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error("Invalid MACCA transaction journal entry");
    }
    if (entry.kind !== "directory" && entry.kind !== "file") {
      throw new Error(`Invalid transaction entry kind: ${entry.kind}`);
    }
    if (
      typeof entry.targetPath !== "string" ||
      typeof entry.backupPath !== "string"
    ) {
      throw new Error("Transaction entry paths must be strings");
    }
    if (entry.stagingPath !== null && typeof entry.stagingPath !== "string") {
      throw new Error("Transaction staging path must be a string or null");
    }
    if (typeof entry.hadTarget !== "boolean") {
      throw new Error("Transaction hadTarget must be boolean");
    }
    if (
      entry.legacySkillName !== undefined &&
      (typeof entry.legacySkillName !== "string" ||
        !/^(?:_[a-z0-9]+|[a-z0-9]+(?:-[a-z0-9]+)*)$/.test(
          entry.legacySkillName,
        ))
    ) {
      throw new Error("Transaction legacy skill name is invalid");
    }
    if (
      entry.stagingPath !== null &&
      (typeof entry.stagedHash !== "string" ||
        !/^[a-f0-9]{64}$/.test(entry.stagedHash))
    ) {
      throw new Error("Transaction staged payload hash is missing or invalid");
    }

    const targetPath = path.resolve(entry.targetPath);
    const parent = path.dirname(targetPath);
    const targetName = path.basename(targetPath);
    const isValidFile =
      entry.kind === "file" && metadataTargets.has(targetPath);
    const isValidSkill =
      entry.kind === "directory" &&
      skillParents.has(parent) &&
      /^(?:_[a-z0-9]+|[a-z0-9]+(?:-[a-z0-9]+)*)$/.test(targetName);
    if (!isValidFile && !isValidSkill) {
      throw new Error(
        `Transaction target is not a managed MACCA path: ${targetPath}`,
      );
    }

    const backupPath = path.resolve(entry.backupPath);
    const expectedBackupPath = path.join(
      parent,
      `.${targetName}.macca-backup-${journal.transactionId}`,
    );
    if (backupPath !== expectedBackupPath) {
      throw new Error(`Invalid MACCA transaction backup path: ${backupPath}`);
    }
    if (entry.stagingPath !== null) {
      const stagingPath = path.resolve(entry.stagingPath);
      const expectedStagingPath = path.join(
        parent,
        `.${targetName}.macca-stage-${journal.transactionId}`,
      );
      if (stagingPath !== expectedStagingPath) {
        throw new Error(
          `Invalid MACCA transaction staging path: ${stagingPath}`,
        );
      }
    }

    for (const candidate of [
      targetPath,
      backupPath,
      entry.stagingPath && path.resolve(entry.stagingPath),
    ].filter(Boolean)) {
      assertSafeProjectPath(targetDir, candidate);
      if (seenPaths.has(candidate)) {
        throw new Error(
          `Duplicate path in MACCA transaction journal: ${candidate}`,
        );
      }
      seenPaths.add(candidate);
    }
  }

  return journal.entries;
}

function recoverInterruptedTransaction(targetDir) {
  const journalPath = path.join(targetDir, ".agents", TRANSACTION_FILE);
  assertSafeProjectPath(targetDir, journalPath);
  if (!fs.existsSync(journalPath)) {
    return;
  }

  const journal = readJsonObject(journalPath, "MACCA transaction journal");
  const entries = validateTransactionEntries(targetDir, journal);
  for (const entry of entries) {
    assertTransactionBackup(entry);
    if (
      journal.phase === "committed" ||
      fs.existsSync(entry.backupPath) ||
      !entry.hadTarget
    ) {
      assertTransactionPayload(entry, journal.transactionId, entry.targetPath);
    }
    if (entry.stagingPath && fs.existsSync(entry.stagingPath)) {
      assertTransactionPayload(entry, journal.transactionId, entry.stagingPath);
    }
  }
  if (journal.phase === "committed") {
    for (const entry of entries) {
      removeManagedPath(entry.backupPath, entry.kind);
      if (entry.stagingPath) removeManagedPath(entry.stagingPath, entry.kind);
    }
  } else {
    for (const entry of [...entries].reverse()) {
      if (fs.existsSync(entry.backupPath)) {
        removeManagedPath(entry.targetPath, entry.kind);
        fs.renameSync(entry.backupPath, entry.targetPath);
      } else if (!entry.hadTarget) {
        removeManagedPath(entry.targetPath, entry.kind);
      }
      if (entry.stagingPath) removeManagedPath(entry.stagingPath, entry.kind);
    }
  }
  fs.rmSync(journalPath, { force: true });
}

function getUniqueDestinations(targetDir, tools) {
  const destinations = new Map();
  for (const toolKey of tools) {
    const tool = TOOL_BY_KEY.get(toolKey);
    if (!tool) {
      throw new Error(`Unsupported tool: ${toolKey}`);
    }
    const destination = tool.destination(targetDir);
    assertSafeProjectPath(targetDir, destination);
    destinations.set(path.resolve(destination), destination);
  }
  return [...destinations.values()];
}

function applySkillTransaction(entries, targetDir, force = false) {
  const suffix = `${process.pid}-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
  const prepared = [];
  const committed = [];
  const journalPath = path.join(targetDir, ".agents", TRANSACTION_FILE);

  for (const entry of entries) {
    const {
      targetPath,
      sourcePath,
      content,
      kind = "directory",
      legacySkillName,
    } = entry;
    const targetName = path.basename(targetPath);
    const parent = path.dirname(targetPath);
    if (fs.existsSync(targetPath)) {
      const stat = fs.lstatSync(targetPath);
      if (stat.isSymbolicLink()) {
        throw new Error(
          `Refusing to replace symlinked managed path: ${targetPath}`,
        );
      }
      if (kind === "directory" && !stat.isDirectory()) {
        throw new Error(`Skill destination is not a directory: ${targetPath}`);
      }
      if (kind === "file" && !stat.isFile()) {
        throw new Error(
          `Managed file destination is not a file: ${targetPath}`,
        );
      }
      if (kind === "directory") {
        if (isMaccaOwned(targetPath)) {
          assertManagedDirectoryUnchanged(targetPath, force);
        } else if (
          !legacySkillName ||
          !isLegacyDirectoryUnchanged(targetPath, legacySkillName)
        ) {
          throw new Error(
            `Refusing to overwrite or remove unowned skill directory: ${targetPath}`,
          );
        }
      }
    }
    prepared.push({
      ...entry,
      kind,
      hadTarget: fs.existsSync(targetPath),
      stagingPath:
        sourcePath || content !== undefined
          ? path.join(parent, `.${targetName}.macca-stage-${suffix}`)
          : null,
      backupPath: path.join(parent, `.${targetName}.macca-backup-${suffix}`),
    });
  }

  try {
    for (const entry of prepared) {
      ensureDirectory(path.dirname(entry.targetPath));
      if (!entry.sourcePath && entry.content === undefined) {
        continue;
      }
      if (entry.kind === "file") {
        if (entry.sourcePath) {
          fs.copyFileSync(entry.sourcePath, entry.stagingPath);
        } else {
          fs.writeFileSync(entry.stagingPath, entry.content, "utf8");
        }
      } else {
        fs.cpSync(entry.sourcePath, entry.stagingPath, { recursive: true });
        const payloadHash = hashDirectory(entry.stagingPath);
        writeTextFile(
          path.join(entry.stagingPath, OWNERSHIP_MARKER),
          `${JSON.stringify(
            {
              owner: "macca-method",
              skill: path.basename(entry.targetPath),
              hashAlgorithm: "sha256",
              payloadHash,
              transactionId: suffix,
            },
            null,
            2,
          )}\n`,
        );
      }
      entry.stagedHash =
        entry.kind === "file"
          ? hashFile(entry.stagingPath)
          : hashDirectory(entry.stagingPath);
    }

    writeJsonAtomic(journalPath, {
      version: 1,
      phase: "committing",
      transactionId: suffix,
      entries: prepared.map(
        ({
          targetPath,
          stagingPath,
          backupPath,
          kind,
          hadTarget,
          stagedHash,
          legacySkillName,
        }) => ({
          targetPath,
          stagingPath,
          backupPath,
          kind,
          hadTarget,
          stagedHash: stagingPath ? stagedHash : null,
          legacySkillName,
        }),
      ),
    });

    for (const entry of prepared) {
      if (entry.hadTarget) {
        fs.renameSync(entry.targetPath, entry.backupPath);
      }
      committed.push(entry);
      if (entry.sourcePath || entry.content !== undefined) {
        fs.renameSync(entry.stagingPath, entry.targetPath);
      }
    }
    writeJsonAtomic(journalPath, {
      version: 1,
      phase: "committed",
      transactionId: suffix,
      entries: prepared.map(
        ({
          targetPath,
          stagingPath,
          backupPath,
          kind,
          hadTarget,
          stagedHash,
          legacySkillName,
        }) => ({
          targetPath,
          stagingPath,
          backupPath,
          kind,
          hadTarget,
          stagedHash: stagingPath ? stagedHash : null,
          legacySkillName,
        }),
      ),
    });
  } catch (error) {
    for (const entry of [...committed].reverse()) {
      fs.rmSync(entry.targetPath, {
        recursive: entry.kind === "directory",
        force: true,
      });
      if (entry.hadTarget && fs.existsSync(entry.backupPath)) {
        fs.renameSync(entry.backupPath, entry.targetPath);
      }
    }
    fs.rmSync(journalPath, { force: true });
    throw error;
  } finally {
    for (const entry of prepared) {
      if (entry.stagingPath) {
        fs.rmSync(entry.stagingPath, {
          recursive: entry.kind === "directory",
          force: true,
        });
      }
    }
  }

  for (const entry of committed) {
    fs.rmSync(entry.backupPath, {
      recursive: entry.kind === "directory",
      force: true,
    });
  }
  fs.rmSync(journalPath, { force: true });
}

function normalizeToolList(values) {
  const rawTokens = [];
  for (const value of values) {
    rawTokens.push(...String(value).split(","));
  }

  const resolved = [];
  for (const token of rawTokens) {
    const trimmed = token.trim().toLowerCase();
    if (!trimmed) {
      continue;
    }

    const key = TOOL_LOOKUP.get(trimmed);
    if (!key) {
      throw new Error(`Unknown tool: ${token}`);
    }

    resolved.push(key);
  }

  return unique(resolved);
}

function buildDeveloperConfig(options) {
  const config = {};
  if (options.name !== undefined) config.name = options.name;
  if (options.project !== undefined) config.project = options.project;
  if (
    options.communicationLanguage !== undefined ||
    options.documentLanguage !== undefined
  ) {
    config.languagePreferences = {};
    if (options.communicationLanguage !== undefined) {
      config.languagePreferences.communication = {
        raw: options.communicationLanguage,
        normalized: normalizeLanguage(options.communicationLanguage),
      };
    }
    if (options.documentLanguage !== undefined) {
      config.languagePreferences.documents = {
        raw: options.documentLanguage,
        normalized: normalizeLanguage(options.documentLanguage),
      };
    }
  }
  return config;
}

function mergeObjects(existing, update) {
  if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
    return update;
  }

  const merged = { ...existing };
  for (const [key, value] of Object.entries(update)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      merged[key] = mergeObjects(existing[key], value);
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

function readDeveloperConfig(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("root value must be an object");
    }
    return value;
  } catch (error) {
    throw new Error(`Cannot preserve malformed ${filePath}: ${error.message}`);
  }
}

function createPrompt() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      "Interactive install requires a TTY. Use --yes and explicit flags in non-interactive environments.",
    );
  }

  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function askQuestion(prompt, question) {
  return new Promise((resolve) => {
    prompt.question(question, resolve);
  });
}

async function promptForTools() {
  const prompt = createPrompt();

  try {
    process.stdout.write("\nPilih AI tool yang mau dipasang:\n");
    TOOL_DEFINITIONS.forEach((tool, index) => {
      process.stdout.write(
        `  ${index + 1}. ${tool.label} -> ${tool.displayDestination}\n`,
      );
    });
    process.stdout.write("\n");

    while (true) {
      const answer = await askQuestion(
        prompt,
        "Masukkan nomor/nama tool (pisahkan dengan koma, 'all', kosong = codex): ",
      );
      const parsed = parseInteractiveToolSelection(answer);
      if (parsed.error) {
        process.stdout.write(`  ${parsed.error}\n`);
        continue;
      }

      return parsed.tools;
    }
  } finally {
    prompt.close();
  }
}

function parseInteractiveToolSelection(answer) {
  const trimmed = String(answer || "").trim();
  if (!trimmed) {
    return { tools: ["codex"] };
  }

  if (trimmed.toLowerCase() === "all") {
    return { tools: TOOL_DEFINITIONS.map((tool) => tool.key) };
  }

  const tools = [];
  for (const part of trimmed.split(",")) {
    const token = part.trim();
    if (!token) {
      continue;
    }

    if (/^\d+$/.test(token)) {
      const index = Number(token) - 1;
      if (index < 0 || index >= TOOL_DEFINITIONS.length) {
        return { error: `Pilihan nomor tidak valid: ${token}` };
      }

      tools.push(TOOL_DEFINITIONS[index].key);
      continue;
    }

    const key = TOOL_LOOKUP.get(token.toLowerCase());
    if (!key) {
      return { error: `Nama tool tidak dikenal: ${token}` };
    }

    tools.push(key);
  }

  return { tools: unique(tools) };
}

async function promptForMetadata(seed) {
  const prompt = createPrompt();

  try {
    const name =
      seed.name !== undefined
        ? seed.name
        : await askQuestion(
            prompt,
            "Kamu mau dipanggil apa? (Kosong = Skip): ",
          );
    const project =
      seed.project !== undefined
        ? seed.project
        : await askQuestion(prompt, "Nama project ini apa? (Kosong = Skip): ");
    const communication =
      seed.communicationLanguage !== undefined
        ? seed.communicationLanguage
        : await askQuestion(
            prompt,
            "Bahasa komunikasi yang anda inginkan? (Kosong = Bahasa Indonesia): ",
          );
    const documents =
      seed.documentLanguage !== undefined
        ? seed.documentLanguage
        : await askQuestion(
            prompt,
            "Bahasa dokumen yang dihasilkan? (Kosong = Bahasa Indonesia): ",
          );

    return {
      name: name || "",
      project: project || "",
      communicationLanguage: communication || "Bahasa Indonesia",
      documentLanguage: documents || "Bahasa Indonesia",
    };
  } finally {
    prompt.close();
  }
}

function applyInstall(targetDir, tools, metadata, options = {}) {
  const force = Boolean(options.force);
  const managedSkills = getSourceManagedSkills();
  const agentsDirectory = path.join(targetDir, ".agents");
  ensureDirectory(targetDir);
  assertSafeProjectPath(targetDir, agentsDirectory);
  assertPackageNotOlderThanInstalled(agentsDirectory);
  for (const fileName of [
    "macca-managed-skills.txt",
    "macca-tools.txt",
    "developer-config.json",
    "macca-lock.json",
    STATE_FILE,
  ]) {
    assertSafeProjectPath(targetDir, path.join(agentsDirectory, fileName));
  }
  assertManagedFilesUnchanged(agentsDirectory, force);
  const previousManagedSkills = validateManagedSkillNames(
    readNonEmptyLines(path.join(agentsDirectory, "macca-managed-skills.txt")),
    ".agents/macca-managed-skills.txt",
  );
  const entries = [];
  for (const destination of getUniqueDestinations(targetDir, tools)) {
    for (const skillName of managedSkills) {
      entries.push({
        sourcePath: path.join(SOURCE_SKILLS_DIR, skillName),
        targetPath: resolveOwnedSkillPath(destination, skillName),
        legacySkillName: skillName,
      });
    }
  }
  const configPath = path.join(agentsDirectory, "developer-config.json");
  const config = mergeObjects(
    readDeveloperConfig(configPath),
    buildDeveloperConfig(metadata),
  );
  const managedContent = fs.existsSync(SOURCE_MANAGED_SKILLS_FILE)
    ? fs.readFileSync(SOURCE_MANAGED_SKILLS_FILE, "utf8")
    : `${managedSkills.join("\n")}\n`;
  const lockContent = buildInstalledLock(managedSkills);
  const toolsContent = `${tools.join("\n")}\n`;
  const stateContent = buildStateContent({
    "macca-managed-skills.txt": managedContent,
    "macca-lock.json": lockContent,
    "macca-tools.txt": toolsContent,
  });
  entries.push(
    {
      kind: "file",
      content: managedContent,
      targetPath: path.join(agentsDirectory, "macca-managed-skills.txt"),
    },
    {
      kind: "file",
      content: lockContent,
      targetPath: path.join(agentsDirectory, "macca-lock.json"),
    },
    {
      kind: "file",
      content: toolsContent,
      targetPath: path.join(agentsDirectory, "macca-tools.txt"),
    },
    {
      kind: "file",
      content: `${JSON.stringify(config, null, 2)}\n`,
      targetPath: configPath,
    },
    {
      kind: "file",
      content: stateContent,
      targetPath: path.join(agentsDirectory, STATE_FILE),
    },
  );
  applySkillTransaction(entries, targetDir, force);
}

function applyUpgrade(targetDir, options = {}) {
  const force = Boolean(options.force);
  const agentsDirectory = path.join(targetDir, ".agents");
  assertSafeProjectPath(targetDir, agentsDirectory);
  assertPackageNotOlderThanInstalled(agentsDirectory);
  for (const fileName of [
    "macca-managed-skills.txt",
    "macca-tools.txt",
    "developer-config.json",
    "macca-lock.json",
    STATE_FILE,
  ]) {
    assertSafeProjectPath(targetDir, path.join(agentsDirectory, fileName));
  }
  assertManagedFilesUnchanged(agentsDirectory, force);
  const tools = readNonEmptyLines(
    path.join(agentsDirectory, "macca-tools.txt"),
  );
  if (tools.length === 0) {
    throw new Error(
      ".agents/macca-tools.txt was not found. Run install first so MACCA knows which tools to update.",
    );
  }

  const previousManagedSkills = validateManagedSkillNames(
    readNonEmptyLines(path.join(agentsDirectory, "macca-managed-skills.txt")),
    ".agents/macca-managed-skills.txt",
  );
  const nextManagedSkills = getSourceManagedSkills();
  const entries = [];
  for (const destination of getUniqueDestinations(targetDir, tools)) {
    for (const skillName of nextManagedSkills) {
      entries.push({
        sourcePath: path.join(SOURCE_SKILLS_DIR, skillName),
        targetPath: resolveOwnedSkillPath(destination, skillName),
        legacySkillName: skillName,
      });
    }

    for (const skillName of previousManagedSkills.filter(
      (name) => !nextManagedSkills.includes(name),
    )) {
      const oldPath = resolveOwnedSkillPath(destination, skillName);
      if (fs.existsSync(oldPath) && isMaccaOwned(oldPath)) {
        assertManagedDirectoryUnchanged(oldPath, force);
        entries.push({ sourcePath: null, targetPath: oldPath });
      } else if (isLegacyDirectoryUnchanged(oldPath, skillName)) {
        entries.push({
          sourcePath: null,
          targetPath: oldPath,
          legacySkillName: skillName,
        });
      } else if (fs.existsSync(oldPath)) {
        process.stderr.write(
          `Preserving unmarked legacy skill directory: ${oldPath}\n`,
        );
      }
    }
  }

  if (tools.includes("opencode")) {
    const legacyOpenCodeRoot = path.join(targetDir, ".opencode", "skill");
    assertSafeProjectPath(targetDir, legacyOpenCodeRoot);
    for (const skillName of previousManagedSkills) {
      const oldPath = resolveOwnedSkillPath(legacyOpenCodeRoot, skillName);
      if (fs.existsSync(oldPath) && isMaccaOwned(oldPath)) {
        assertManagedDirectoryUnchanged(oldPath, force);
        entries.push({ sourcePath: null, targetPath: oldPath });
      } else if (isLegacyDirectoryUnchanged(oldPath, skillName)) {
        entries.push({
          sourcePath: null,
          targetPath: oldPath,
          legacySkillName: skillName,
        });
      } else if (fs.existsSync(oldPath)) {
        if (!force) {
          throw new Error(
            `Legacy OpenCode skill was modified; move or back it up before upgrade: ${oldPath}. ` +
              "Run upgrade with --force to overwrite local modifications.",
          );
        }
      }
    }
  }
  const managedContent = fs.existsSync(SOURCE_MANAGED_SKILLS_FILE)
    ? fs.readFileSync(SOURCE_MANAGED_SKILLS_FILE, "utf8")
    : `${nextManagedSkills.join("\n")}\n`;
  const lockContent = buildInstalledLock(nextManagedSkills);
  const toolsContent = `${tools.join("\n")}\n`;
  const stateContent = buildStateContent({
    "macca-managed-skills.txt": managedContent,
    "macca-lock.json": lockContent,
    "macca-tools.txt": toolsContent,
  });
  entries.push(
    {
      kind: "file",
      content: managedContent,
      targetPath: path.join(agentsDirectory, "macca-managed-skills.txt"),
    },
    {
      kind: "file",
      content: lockContent,
      targetPath: path.join(agentsDirectory, "macca-lock.json"),
    },
    {
      kind: "file",
      content: stateContent,
      targetPath: path.join(agentsDirectory, STATE_FILE),
    },
  );
  applySkillTransaction(entries, targetDir, force);

  if (tools.includes("kimi")) reportLegacyKimiInstall();
}

function getLegacyKimiRoot() {
  if (process.platform === "win32") {
    return path.join(
      process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
      "agents",
      "skills",
    );
  }
  return path.join(os.homedir(), ".config", "agents", "skills");
}

function reportLegacyKimiInstall() {
  const legacyRoot = getLegacyKimiRoot();
  if (!fs.existsSync(legacyRoot)) return;

  const legacyHashes = getLegacyPayloadHashes();
  const detected = [];
  for (const [skillName, acceptedHashes] of Object.entries(legacyHashes)) {
    const skillPath = path.join(legacyRoot, skillName);
    if (!fs.existsSync(skillPath)) continue;
    const stat = fs.lstatSync(skillPath);
    if (stat.isSymbolicLink() || !stat.isDirectory()) continue;
    const payloadHash = hashDirectory(skillPath);
    detected.push({ skillPath, unchanged: acceptedHashes.has(payloadHash) });
  }

  if (!detected.length) return;
  process.stderr.write(
    `Legacy Kimi copies remain outside this project at ${legacyRoot}. ` +
      "MACCA did not delete global files. Verify the new project-local .agents/skills installation, " +
      "then remove old copies manually if your Kimi version still discovers them.\n",
  );
}

function printInstallSummary(action, tools) {
  process.stdout.write(`\n  MACCA ${action} untuk:\n`);
  for (const toolKey of tools) {
    const tool = TOOL_BY_KEY.get(toolKey);
    process.stdout.write(
      `  ✓ ${tool.label.padEnd(16)} -> ${tool.displayDestination}\n`,
    );
  }
  process.stdout.write("\n");
}

async function runInstall(args) {
  let tools = normalizeToolList(args.tools);
  if (tools.length === 0) {
    tools = args.yes ? ["codex"] : await promptForTools();
  }

  const targetDir = assertSafeTargetDirectory(args.directory);
  ensureDirectory(targetDir);
  assertSafeProjectPath(targetDir, path.join(targetDir, ".agents"));
  recoverInterruptedTransaction(targetDir);
  const existingTools = readNonEmptyLines(
    path.join(targetDir, ".agents", "macca-tools.txt"),
  );
  tools = unique([...existingTools, ...tools]);
  const configPath = path.join(targetDir, ".agents", "developer-config.json");
  const existingConfig = readDeveloperConfig(configPath);
  const hasExistingConfig = fs.existsSync(configPath);
  const metadata = args.yes
    ? {
        name:
          args.name !== undefined
            ? args.name
            : hasExistingConfig
              ? undefined
              : "",
        project:
          args.project !== undefined
            ? args.project
            : hasExistingConfig
              ? undefined
              : "",
        communicationLanguage:
          args.communicationLanguage !== undefined
            ? args.communicationLanguage
            : hasExistingConfig
              ? undefined
              : "Bahasa Indonesia",
        documentLanguage:
          args.documentLanguage !== undefined
            ? args.documentLanguage
            : hasExistingConfig
              ? undefined
              : "Bahasa Indonesia",
      }
    : await promptForMetadata({
        ...args,
        name: args.name !== undefined ? args.name : existingConfig.name,
        project:
          args.project !== undefined ? args.project : existingConfig.project,
        communicationLanguage:
          args.communicationLanguage !== undefined
            ? args.communicationLanguage
            : existingConfig.languagePreferences?.communication?.raw,
        documentLanguage:
          args.documentLanguage !== undefined
            ? args.documentLanguage
            : existingConfig.languagePreferences?.documents?.raw,
      });

  applyInstall(targetDir, tools, metadata, { force: Boolean(args.force) });

  printInstallSummary("installed", tools);
  process.stdout.write(`  Target project: ${targetDir}\n\n`);
}

function runUpgrade(args) {
  const targetDir = assertSafeTargetDirectory(args.directory);
  assertSafeProjectPath(targetDir, path.join(targetDir, ".agents"));
  recoverInterruptedTransaction(targetDir);
  const tools = readNonEmptyLines(
    path.join(targetDir, ".agents", "macca-tools.txt"),
  );
  applyUpgrade(targetDir, { force: Boolean(args.force) });
  printInstallSummary("updated", tools);
  process.stdout.write(`  Target project: ${targetDir}\n\n`);
}

function exitWithError(message) {
  process.stderr.write(`\nError: ${message}\n`);
  process.exit(1);
}

main();
