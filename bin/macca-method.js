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
const { assertValidConfig } = require(path.join(
  SOURCE_SKILLS_DIR, "_shared", "scripts", "config-validator.js",
));
const operation = { stage: "not started", targetDir: null, recoveryChanged: false };
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

    if (command === "doctor") {
      runDoctor(args);
      return;
    }

    ensurePackagedFiles();

    if (command === "install") {
      runInstall(args).catch(exitWithError);
      return;
    }

    if (command === "upgrade") {
      runUpgrade(args);
      return;
    }

    exitWithError(`Unknown command: ${command}`);
  } catch (error) {
    exitWithError(error);
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

  if (args._.length > 1) {
    throw new Error("Unexpected positional arguments. Use --directory <path> for the target project.");
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
      "  macca-method doctor [--directory <path>]  Read-only installation check (no repair).",
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
      "      --document-language <value>  Defaults to the communication language on first install.",
      "  Requires Node.js >=22; Node.js 22 and 24 are supported runtimes in the configured CI matrix.",
      "",
      "Examples:",
      "  npx macca-method@latest install",
      "  npx macca-method@latest install --tool github-copilot --tool codex --name \"Your Name\" --project \"Your Project\" --yes",
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
  if (path.sep === "\\" && /^[\\/]{2}/.test(rawDirectory || process.cwd())) {
    throw Object.assign(new Error("Windows UNC/device paths are unsupported. Use a local drive path such as C:\\projects\\app."), { code: "MACCA_UNSUPPORTED_PATH", path: rawDirectory });
  }
  const requested = rawDirectory
    ? path.resolve(process.cwd(), rawDirectory)
    : process.cwd();
  const absolute = path.isAbsolute(requested)
    ? requested
    : path.resolve(requested);
  const root = path.parse(absolute).root;
  if (path.sep === "\\" && /^[\\/]{2}/.test(root)) {
    throw Object.assign(new Error("Windows UNC/device paths are unsupported. Use a local drive path."), { code: "MACCA_UNSUPPORTED_PATH", path: absolute });
  }
  const segments = absolute.slice(root.length).split(path.sep).filter(Boolean);
  let current = root;

  if (isSymlink(current)) {
    throw new Error(`Refusing symlinked target project ancestor: ${current}`);
  }

  for (const segment of segments) {
    current = path.join(current, segment);
    if (isSymlink(current)) {
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
      return "indonesian";
  }
}

function ensureDirectory(directoryPath) {
  operation.stage = "writing";
  fs.mkdirSync(directoryPath, { recursive: true });
}

function isSymlink(candidate) {
  try {
    return fs.lstatSync(candidate).isSymbolicLink();
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function assertSafeProjectPath(targetDir, destination) {
  const targetRoot = path.resolve(targetDir);
  const resolvedDestination = path.resolve(destination);
  if (
    resolvedDestination !== targetRoot &&
    !resolvedDestination.startsWith(targetRoot.endsWith(path.sep) ? targetRoot : `${targetRoot}${path.sep}`)
  ) {
    throw new Error(
      `Refusing destination outside target project: ${destination}`,
    );
  }

  if (isSymlink(targetRoot)) {
    throw new Error(`Refusing symlinked target project: ${targetRoot}`);
  }

  const relative = path.relative(targetRoot, resolvedDestination);
  let current = targetRoot;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    if (isSymlink(current)) {
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

// Payload fingerprints intentionally omit caches. Destructive operations need
// a separate snapshot that includes every entry, including empty directories.
function hashSnapshot(targetPath, kind) {
  const stat = fs.lstatSync(targetPath);
  if (
    stat.isSymbolicLink() ||
    (kind === "directory" ? !stat.isDirectory() : !stat.isFile())
  ) {
    throw new Error(`Refusing unexpected managed path type: ${targetPath}`);
  }
  if (kind === "file") return hashFile(targetPath);

  const entries = [];
  function walk(directory, relative = "") {
    for (const name of fs.readdirSync(directory).sort()) {
      const candidate = path.join(directory, name);
      const entryPath = relative ? `${relative}/${name}` : name;
      const entryStat = fs.lstatSync(candidate);
      if (entryStat.isSymbolicLink()) {
        throw new Error(`Refusing symlink inside managed skill: ${candidate}`);
      }
      if (entryStat.isDirectory()) {
        entries.push([entryPath, "directory"]);
        walk(candidate, entryPath);
      } else if (entryStat.isFile()) {
        entries.push([entryPath, "file", hashFile(candidate)]);
      } else {
        throw new Error(
          `Unsupported file type inside managed skill: ${candidate}`,
        );
      }
    }
  }
  walk(targetPath);
  return hashText(JSON.stringify(entries));
}

function getUnhashedEntries(directoryPath) {
  const omitted = [];
  function walk(directory, relative = "") {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (!relative && entry.name === OWNERSHIP_MARKER) continue;
      const entryPath = path.join(relative, entry.name);
      const candidate = path.join(directory, entry.name);
      if (
        shouldIgnoreDirectoryEntry(entry.name) ||
        (entry.isDirectory() && fs.readdirSync(candidate).length === 0)
      ) {
        omitted.push(entryPath);
      } else if (entry.isDirectory()) {
        walk(candidate, entryPath);
      }
    }
  }
  walk(directoryPath);
  return omitted;
}

function preserveUnhashedEntries(targetPath, stagingPath) {
  for (const relative of getUnhashedEntries(targetPath)) {
    const source = path.join(targetPath, relative);
    const destination = path.join(stagingPath, relative);
    if (fs.existsSync(destination)) {
      const kind = fs.lstatSync(source).isDirectory() ? "directory" : "file";
      if (hashSnapshot(source, kind) !== hashSnapshot(destination, kind)) {
        throw new Error(
          `Refusing to overwrite preserved skill content: ${source}`,
        );
      }
    } else {
      ensureDirectory(path.dirname(destination));
      fs.cpSync(source, destination, {
        recursive: true,
        errorOnExist: true,
        force: false,
      });
    }
  }
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
  const parse = (value, label) => {
    const match = typeof value === "string" && value.match(
      /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/,
    );
    const prerelease = match && match[4] ? match[4].split(".") : [];
    if (!match || match[0] !== value || prerelease.some((part) => /^0[0-9]+$/.test(part))) {
      throw Object.assign(new Error(
        `Invalid semantic version for ${label}: expected MAJOR.MINOR.PATCH with optional prerelease/build metadata; numeric version and prerelease identifiers must not have leading zeros.`,
      ), { code: "MACCA_VERSION_INVALID" });
    }
    return { core: match.slice(1, 4), prerelease };
  };
  // Keep numeric identifiers as decimal strings: SemVer does not bound their size.
  const compareNumeric = (a, b) => a.length !== b.length
    ? (a.length < b.length ? -1 : 1)
    : (a === b ? 0 : a < b ? -1 : 1);
  const a = parse(left, "left version");
  const b = parse(right, "right version");
  for (let index = 0; index < 3; index += 1) {
    const diff = compareNumeric(a.core[index], b.core[index]);
    if (diff !== 0) return diff;
  }
  if (!a.prerelease.length || !b.prerelease.length) {
    return a.prerelease.length === b.prerelease.length ? 0 : a.prerelease.length ? -1 : 1;
  }
  for (let index = 0; index < Math.min(a.prerelease.length, b.prerelease.length); index += 1) {
    const x = a.prerelease[index];
    const y = b.prerelease[index];
    if (x === y) continue;
    const xNumeric = /^[0-9]+$/.test(x);
    const yNumeric = /^[0-9]+$/.test(y);
    if (xNumeric && yNumeric) return compareNumeric(x, y);
    if (xNumeric !== yNumeric) return xNumeric ? -1 : 1;
    return x < y ? -1 : 1;
  }
  if (a.prerelease.length !== b.prerelease.length) {
    return a.prerelease.length < b.prerelease.length ? -1 : 1;
  }
  return 0;
}

function assertPackageNotOlderThanInstalled(agentsDirectory, includeRecovery = false) {
  const packagedLock = readJsonObject(SOURCE_LOCK_FILE, "packaged MACCA lock");
  const packagedVersion = packagedLock.version;
  const targetDir = path.dirname(agentsDirectory);
  const installedLockPath = path.join(agentsDirectory, "macca-lock.json");
  const assertRegularLock = (lockPath) => {
    assertSafeProjectPath(targetDir, lockPath);
    if (!fs.lstatSync(lockPath).isFile()) {
      throw new Error(`Invalid MACCA lock at ${lockPath}: expected a regular file.`);
    }
  };
  const checkVersion = (lockPath) => {
    let installedVersion = packagedVersion;
    if (lockPath) {
      assertRegularLock(lockPath);
      installedVersion = readJsonObject(lockPath, "installed MACCA lock").version;
    }
    let comparison;
    try {
      comparison = compareSemver(packagedVersion, installedVersion);
    } catch (error) {
      if (error.code !== "MACCA_VERSION_INVALID") throw error;
      throw Object.assign(new Error(
        `Cannot verify MACCA downgrade safety: ${error.message} ` +
          `Check the version fields in the packaged MACCA lock (${SOURCE_LOCK_FILE}, left) and installed MACCA lock (${lockPath || installedLockPath}, right) before retrying.`,
      ), { code: error.code });
    }

    if (comparison < 0) {
      throw new Error(
        `Refusing to downgrade MACCA from ${installedVersion} to ${packagedVersion}. ` +
          "Publish or use a newer package before running install/upgrade.",
      );
    }
  };
  // Validate the package even on first install, before a target can be created.
  checkVersion(null);
  assertSafeProjectPath(targetDir, installedLockPath);
  if (fs.existsSync(installedLockPath)) checkVersion(installedLockPath);
  if (!includeRecovery) return;

  const journalPath = path.join(agentsDirectory, TRANSACTION_FILE);
  assertSafeProjectPath(targetDir, journalPath);
  if (!fs.existsSync(journalPath)) return;
  const journal = readJsonObject(journalPath, "MACCA transaction journal");
  const entries = validateTransactionEntries(targetDir, journal);
  // Recovery may restore a newer lock or delete version evidence. Inspect only
  // the whitelisted lock entry, after validating its paths and recovery hashes.
  for (const entry of entries) {
    if (path.resolve(entry.targetPath) !== path.resolve(installedLockPath)) continue;
    if (fs.existsSync(entry.backupPath)) {
      assertRegularLock(entry.backupPath);
      assertTransactionBackup(entry, journal.phase);
      checkVersion(entry.backupPath);
    }
    if (entry.stagingPath && fs.existsSync(entry.stagingPath)) {
      assertRegularLock(entry.stagingPath);
      assertTransactionPayload(entry, journal.transactionId, entry.stagingPath);
      checkVersion(entry.stagingPath);
    }
  }
}

function readOwnershipMarker(
  targetPath,
  expectedSkill = path.basename(targetPath),
) {
  const markerPath = path.join(targetPath, OWNERSHIP_MARKER);
  let stat;
  try {
    stat = fs.lstatSync(markerPath);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
  // Payload hashing omits this metadata file. Check its type independently so
  // ownership checks never follow a symlink or try to read a pipe/device.
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw Object.assign(new Error(
      `Unsafe ownership marker at ${JSON.stringify(markerPath)}: expected a regular non-symlink file. Back up and review this path before retrying.`,
    ), { code: "MACCA_UNSAFE_MARKER", path: markerPath });
  }

  const content = fs.readFileSync(markerPath, "utf8");
  try {
    const marker = JSON.parse(content);
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
        "Back up and review local modifications first. --force destructively overwrites managed local modifications.",
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
    if (error.code) throw error;
    throw Object.assign(new Error(`Invalid ${label} at ${filePath}: expected a JSON object.`), { path: filePath, code: "MACCA_METADATA_INVALID" });
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
          "Back up and review local modifications first. --force destructively overwrites managed local modifications.",
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
  const temporaryPath = `${filePath}.tmp-${process.pid}-${crypto.randomBytes(16).toString("hex")}`;
  let descriptor;
  let created = false;
  try {
    descriptor = fs.openSync(temporaryPath, "wx", 0o600);
    created = true;
    fs.writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.renameSync(temporaryPath, filePath);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    if (created) fs.rmSync(temporaryPath, { force: true });
  }
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
    if (
      !marker ||
      marker.transactionId !== transactionId ||
      !entry.stagedHash ||
      hashDirectory(candidatePath) !== entry.stagedHash
    ) {
      throw new Error(
        `Refusing recovery of directory without matching transaction evidence: ${candidatePath}`,
      );
    }
    if (!entry.stagedSnapshotHash && getUnhashedEntries(candidatePath).length) {
      throw new Error(
        `Refusing legacy recovery with unhashed directory content: ${candidatePath}`,
      );
    }
  } else if (!entry.stagedHash || hashFile(candidatePath) !== entry.stagedHash) {
    throw new Error(
      `Refusing recovery of file without matching transaction hash: ${candidatePath}`,
    );
  }
  const snapshot = hashSnapshot(candidatePath, entry.kind);
  if (entry.stagedSnapshotHash && snapshot !== entry.stagedSnapshotHash) {
    throw new Error(
      `Refusing recovery of modified transaction payload: ${candidatePath}`,
    );
  }
}

function assertTransactionBackup(entry, phase) {
  if (!fs.existsSync(entry.backupPath)) {
    return;
  }
  const snapshot = hashSnapshot(entry.backupPath, entry.kind);
  if (
    !entry.hadTarget ||
    (entry.originalHash && snapshot !== entry.originalHash)
  ) {
    throw new Error(
      `Refusing recovery from modified transaction backup: ${entry.backupPath}`,
    );
  }
  if (entry.originalHash) return;
  // Old journals lack a pre-transaction snapshot. A file backup can be restored
  // without discarding its contents, but cannot safely be deleted on commit.
  if (entry.kind === "file" && phase === "committed") {
    throw new Error(
      `Refusing cleanup of legacy backup without a snapshot: ${entry.backupPath}`,
    );
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
    if (
      (!validManaged && !validLegacy) ||
      getUnhashedEntries(entry.backupPath).length
    ) {
      throw new Error(
        `Refusing recovery from unowned or modified backup directory: ${entry.backupPath}`,
      );
    }
  }
}

function validateTransactionEntries(targetDir, journal) {
  if (
    ![1, 2].includes(journal.version) ||
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
    for (const [field, required] of [
      ["originalHash", entry.hadTarget],
      ["stagedSnapshotHash", entry.stagingPath !== null],
    ]) {
      if ((journal.version === 2 && required) || entry[field] != null) {
        if (
          typeof entry[field] !== "string" ||
          !/^[a-f0-9]{64}$/.test(entry[field])
        ) {
          throw new Error(`Transaction ${field} is missing or invalid`);
        }
      }
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
    assertTransactionBackup(entry, journal.phase);
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
    if (
      journal.phase === "committing" &&
      entry.hadTarget &&
      !fs.existsSync(entry.backupPath) &&
      entry.originalHash &&
      (!fs.existsSync(entry.targetPath) ||
        hashSnapshot(entry.targetPath, entry.kind) !== entry.originalHash)
    ) {
      throw new Error(
        `Refusing recovery of modified original target: ${entry.targetPath}`,
      );
    }
  }
  // Recovery can restore a config different from the visible one. Validate the
  // candidate after evidence checks, but before the first rollback/cleanup.
  for (const entry of entries) {
    if (entry.targetPath === path.join(targetDir, ".agents", "developer-config.json")) {
      const candidate = journal.phase === "committing" && fs.existsSync(entry.backupPath)
        ? entry.backupPath : entry.targetPath;
      readDeveloperConfig(candidate);
    }
  }
  if (journal.phase === "committed") {
    operation.stage = "recovery";
    operation.recoveryChanged = true;
    for (const entry of entries) {
      removeManagedPath(entry.backupPath, entry.kind);
      if (entry.stagingPath) removeManagedPath(entry.stagingPath, entry.kind);
    }
  } else {
    operation.stage = "recovery";
    operation.recoveryChanged = true;
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
          assertManagedDirectoryUnchanged(
            targetPath,
            force && Boolean(sourcePath),
          );
        } else if (
          !legacySkillName ||
          !isLegacyDirectoryUnchanged(targetPath, legacySkillName)
        ) {
          throw new Error(
            `Refusing to overwrite or remove unowned skill directory: ${targetPath}`,
          );
        }
        if (!sourcePath && getUnhashedEntries(targetPath).length) {
          throw new Error(
            `Refusing to remove skill with unhashed content: ${targetPath}`,
          );
        }
      }
    }
    prepared.push({
      ...entry,
      kind,
      hadTarget: fs.existsSync(targetPath),
      originalHash: fs.existsSync(targetPath)
        ? hashSnapshot(targetPath, kind)
        : null,
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
        if (entry.hadTarget) {
          preserveUnhashedEntries(entry.targetPath, entry.stagingPath);
        }
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
      entry.stagedSnapshotHash = hashSnapshot(entry.stagingPath, entry.kind);
    }

    writeJsonAtomic(journalPath, {
      version: 2,
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
          stagedSnapshotHash,
          originalHash,
          legacySkillName,
        }) => ({
          targetPath,
          stagingPath,
          backupPath,
          kind,
          hadTarget,
          stagedHash: stagingPath ? stagedHash : null,
          stagedSnapshotHash: stagingPath ? stagedSnapshotHash : null,
          originalHash,
          legacySkillName,
        }),
      ),
    });

    for (const entry of prepared) {
      if (entry.hadTarget) {
        if (hashSnapshot(entry.targetPath, entry.kind) !== entry.originalHash) {
          throw new Error(
            `Managed path changed during transaction: ${entry.targetPath}`,
          );
        }
        fs.renameSync(entry.targetPath, entry.backupPath);
      }
      if (entry.sourcePath || entry.content !== undefined) {
        fs.renameSync(entry.stagingPath, entry.targetPath);
      }
    }
    writeJsonAtomic(journalPath, {
      version: 2,
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
          stagedSnapshotHash,
          originalHash,
          legacySkillName,
        }) => ({
          targetPath,
          stagingPath,
          backupPath,
          kind,
          hadTarget,
          stagedHash: stagingPath ? stagedHash : null,
          stagedSnapshotHash: stagingPath ? stagedSnapshotHash : null,
          originalHash,
          legacySkillName,
        }),
      ),
    });
  } catch (error) {
    try {
      if (fs.existsSync(journalPath)) {
        // Live failures and crash recovery must use the same preflight checks.
        // A conflict leaves the journal and every remaining path for recovery.
        recoverInterruptedTransaction(targetDir);
      } else {
        const staged = prepared.filter(
          (entry) => entry.stagingPath && fs.existsSync(entry.stagingPath),
        );
        // A partially written stage has no trustworthy snapshot. Validate all
        // completed stages before deleting any; retain partial/conflicting work.
        for (const entry of staged) {
          if (!entry.stagedSnapshotHash) {
            throw new Error(
              `Preserving incomplete transaction staging: ${entry.stagingPath}`,
            );
          }
          assertTransactionPayload(entry, suffix, entry.stagingPath);
        }
        for (const entry of staged) {
          removeManagedPath(entry.stagingPath, entry.kind);
        }
      }
    } catch (recoveryError) {
      error.message = `${error.message}; ${recoveryError.message}`;
      throw error;
    }
    throw error;
  }

  recoverInterruptedTransaction(targetDir);
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
    Object.defineProperty(merged, key, {
      value: value && typeof value === "object" && !Array.isArray(value)
        ? mergeObjects(Object.hasOwn(existing, key) ? existing[key] : undefined, value)
        : value,
      enumerable: true, writable: true, configurable: true,
    });
  }
  return merged;
}

function readDeveloperConfig(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
    assertValidConfig(value, filePath);
    return value;
  } catch (error) {
    if (error.code) {
      error.path = filePath;
      throw error;
    }
    throw Object.assign(new Error(`Cannot preserve malformed ${filePath}: $ must contain valid JSON.`), {
      code: "MACCA_CONFIG_INVALID", field: "$", fields: ["$"], path: filePath,
    });
  }
}

const promptStates = new WeakMap();

function cancellation() {
  return Object.assign(new Error("Setup cancelled."), { code: "MACCA_CANCELLED" });
}

function preparePrompt(prompt) {
  if (promptStates.has(prompt)) return promptStates.get(prompt);
  const state = { lines: [], pending: null, error: null };
  const fail = (error) => {
    state.error = error;
    if (state.pending) {
      state.pending.reject(error);
      state.pending = null;
    }
  };
  const onLine = (line) => {
    if (state.pending) {
      state.pending.resolve(line);
      state.pending = null;
    } else state.lines.push(line);
  };
  const onCancel = () => fail(cancellation());
  const onError = (error) => fail(Object.assign(new Error("Interactive input failed. Check your terminal and retry."), { code: error.code || "MACCA_INPUT_ERROR" }));
  prompt.on("line", onLine);
  prompt.on("SIGINT", onCancel);
  prompt.on("close", onCancel);
  prompt.on("error", onError);
  prompt.input?.on("error", onError);
  state.dispose = () => {
    prompt.close();
    prompt.removeListener("line", onLine);
    prompt.removeListener("SIGINT", onCancel);
    prompt.removeListener("close", onCancel);
    prompt.removeListener("error", onError);
    prompt.input?.removeListener("error", onError);
    promptStates.delete(prompt);
  };
  promptStates.set(prompt, state);
  return state;
}

function createPrompt() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      "Interactive install requires a TTY. Use --yes and explicit flags in non-interactive environments.",
    );
  }

  const prompt = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  preparePrompt(prompt);
  return prompt;
}

function askQuestion(prompt, question) {
  const state = preparePrompt(prompt);
  return new Promise((resolve, reject) => {
    if (state.error) return reject(state.error);
    state.pending = { resolve, reject };
    try {
      prompt.setPrompt(question);
      prompt.prompt();
      if (state.lines.length && state.pending) {
        state.pending = null;
        resolve(state.lines.shift());
      }
    } catch (error) {
      state.pending = null;
      reject(error);
    }
  });
}

async function promptForTools(prompt) {
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

async function promptForMetadata(seed, prompt) {
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
          "Bahasa dokumen yang dihasilkan? (Kosong = sama dengan komunikasi): ",
        );

  return {
    name: seed.name,
    project: seed.project,
    communicationLanguage: communication || "Bahasa Indonesia",
    documentLanguage: documents || communication || "Bahasa Indonesia",
  };
}

function addRetiredSkills(entries, targetDir, destination, skillNames) {
  assertSafeProjectPath(targetDir, destination);
  for (const skillName of skillNames) {
    const targetPath = resolveOwnedSkillPath(destination, skillName);
    if (!fs.existsSync(targetPath)) continue;
    try {
      assertSafeProjectPath(targetDir, targetPath);
      hashSnapshot(targetPath, "directory");
      if (isMaccaOwned(targetPath)) {
        // Retirement never needs to discard local edits, even with --force.
        assertManagedDirectoryUnchanged(targetPath);
      } else if (!isLegacyDirectoryUnchanged(targetPath, skillName)) {
        throw new Error("ownership could not be verified");
      }
      if (getUnhashedEntries(targetPath).length) {
        throw new Error("directory contains unhashed content");
      }
    } catch (error) {
      process.stderr.write(
        `Preserving obsolete skill directory: ${targetPath} (${error.message})\n`,
      );
      continue;
    }
    entries.push({ sourcePath: null, targetPath, legacySkillName: skillName });
  }
}

function applyInstall(targetDir, tools, metadata, options = {}) {
  const force = Boolean(options.force);
  const managedSkills = getSourceManagedSkills();
  const agentsDirectory = path.join(targetDir, ".agents");
  const configPath = path.join(agentsDirectory, "developer-config.json");
  assertSafeProjectPath(targetDir, configPath);
  const config = mergeObjects(readDeveloperConfig(configPath), buildDeveloperConfig(metadata));
  assertValidConfig(config, configPath);
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
  tools = unique([
    ...readNonEmptyLines(path.join(agentsDirectory, "macca-tools.txt")),
    ...tools,
  ]);
  const entries = [];
  for (const destination of getUniqueDestinations(targetDir, tools)) {
    for (const skillName of managedSkills) {
      entries.push({
        sourcePath: path.join(SOURCE_SKILLS_DIR, skillName),
        targetPath: resolveOwnedSkillPath(destination, skillName),
        legacySkillName: skillName,
      });
    }
    addRetiredSkills(
      entries,
      targetDir,
      destination,
      previousManagedSkills.filter((name) => !managedSkills.includes(name)),
    );
  }
  if (tools.includes("opencode")) {
    addRetiredSkills(
      entries,
      targetDir,
      path.join(targetDir, ".opencode", "skill"),
      previousManagedSkills,
    );
  }
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
  const configPath = path.join(agentsDirectory, "developer-config.json");
  assertSafeProjectPath(targetDir, configPath);
  readDeveloperConfig(configPath);
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

    addRetiredSkills(
      entries,
      targetDir,
      destination,
      previousManagedSkills.filter((name) => !nextManagedSkills.includes(name)),
    );
  }

  if (tools.includes("opencode")) {
    addRetiredSkills(
      entries,
      targetDir,
      path.join(targetDir, ".opencode", "skill"),
      previousManagedSkills,
    );
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
  assertSupportedRuntime();
  operation.stage = "not started";
  operation.recoveryChanged = false;
  operation.targetDir = resolveTargetDirectory(args.directory);
  const targetDir = assertSafeTargetDirectory(args.directory);
  const configPath = path.join(targetDir, ".agents", "developer-config.json");
  assertSafeProjectPath(targetDir, configPath);
  assertSafeProjectPath(targetDir, path.join(targetDir, ".agents", "macca-tools.txt"));
  const existingConfig = readDeveloperConfig(configPath);
  const existingTools = readNonEmptyLines(
    path.join(targetDir, ".agents", "macca-tools.txt"),
  );
  const hasExistingConfig = fs.existsSync(configPath);
  let tools = normalizeToolList(args.tools);
  let metadata;
  let prompt;
  try {
    const getPrompt = () => (prompt ||= createPrompt());
    if (!tools.length) {
      tools = args.yes ? (existingTools.length ? existingTools : ["codex"]) : await promptForTools(getPrompt());
    }
    tools = unique([...existingTools, ...tools]);
    const seed = {
      name: args.name,
      project: args.project,
      communicationLanguage: args.communicationLanguage,
      documentLanguage: args.documentLanguage,
    };
    if (args.yes) {
      metadata = { ...seed };
      if (!hasExistingConfig) {
        metadata.communicationLanguage ??= "Bahasa Indonesia";
        metadata.documentLanguage ??= metadata.communicationLanguage;
      }
    } else {
      // Reusing a saved section must not rewrite its raw/normalized pair.
      const saved = existingConfig.languagePreferences || {};
      const communication = seed.communicationLanguage ?? saved.communication?.raw ?? saved.communication?.normalized;
      const documents = seed.documentLanguage ?? saved.documents?.raw ?? saved.documents?.normalized;
      metadata = await promptForMetadata({ ...seed, communicationLanguage: communication, documentLanguage: documents },
        communication === undefined || documents === undefined ? getPrompt() : prompt);
      if (seed.communicationLanguage === undefined && saved.communication) delete metadata.communicationLanguage;
      if (seed.documentLanguage === undefined && saved.documents) delete metadata.documentLanguage;
    }
    assertValidConfig(mergeObjects(existingConfig, buildDeveloperConfig(metadata)), configPath);
    getUniqueDestinations(targetDir, tools);
    if (prompt && promptStates.get(prompt).error) throw promptStates.get(prompt).error;
  } finally {
    if (prompt) promptStates.get(prompt).dispose();
  }

  assertPackageNotOlderThanInstalled(path.join(targetDir, ".agents"), true);
  recoverInterruptedTransaction(targetDir);
  // A crash can leave the config only in its backup. First-install defaults
  // must not overwrite settings restored by recovery on an unattended retry.
  if (args.yes && !hasExistingConfig && fs.existsSync(configPath)) {
    if (args.communicationLanguage === undefined) delete metadata.communicationLanguage;
    if (args.documentLanguage === undefined) delete metadata.documentLanguage;
  }
  applyInstall(targetDir, tools, metadata, { force: Boolean(args.force) });

  operation.stage = "complete";
  printInstallSummary("installed", tools);
  printSetupHint(targetDir);
}

function runUpgrade(args) {
  assertSupportedRuntime();
  operation.stage = "not started";
  operation.recoveryChanged = false;
  operation.targetDir = resolveTargetDirectory(args.directory);
  const targetDir = assertSafeTargetDirectory(args.directory);
  const configPath = path.join(targetDir, ".agents", "developer-config.json");
  assertSafeProjectPath(targetDir, configPath);
  readDeveloperConfig(configPath);
  assertPackageNotOlderThanInstalled(path.join(targetDir, ".agents"), true);
  recoverInterruptedTransaction(targetDir);
  assertSafeProjectPath(targetDir, path.join(targetDir, ".agents", "macca-tools.txt"));
  const tools = readNonEmptyLines(
    path.join(targetDir, ".agents", "macca-tools.txt"),
  );
  applyUpgrade(targetDir, { force: Boolean(args.force) });
  operation.stage = "complete";
  printInstallSummary("updated", tools);
  printSetupHint(targetDir);
}

function printSetupHint(targetDir) {
  process.stdout.write(`  Target project: ${targetDir}\n  Restart your AI host to load the skills. Run the setup-macca-method skill for setup; name/project are optional.\n\n`);
}

function assertSupportedRuntime() {
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 22) {
    throw Object.assign(new Error("Unsupported Node.js runtime. Install Node.js 22 or 24, then retry."), { code: "MACCA_NODE_UNSUPPORTED" });
  }
  if (![22, 24].includes(major)) process.stderr.write("Notice: this Node.js runtime is unverified; CI verifies Node.js 22 and 24.\n");
}

function runDoctor(args) {
  operation.stage = "read-only diagnosis";
  operation.targetDir = resolveTargetDirectory(args.directory);
  let failures = 0;
  let warnings = 0;
  const report = (level, message, filePath) => {
    if (level === "FAIL") failures += 1;
    if (level === "WARN") warnings += 1;
    process.stdout.write(`${level}: ${message}${filePath ? ` Path: ${JSON.stringify(filePath)}` : ""}\n`);
  };
  const inspect = (filePath, check) => {
    try { return check(); } catch (error) {
      report("FAIL", error.message, filePath);
      return undefined;
    }
  };
  const major = Number(process.versions.node.split(".")[0]);
  report(major < 22 ? "FAIL" : [22, 24].includes(major) ? "OK" : "WARN",
    major < 22 ? "Unsupported Node.js runtime; use Node.js 22 or 24." :
      [22, 24].includes(major) ? "Node.js runtime is supported." : "Node.js runtime is unverified; CI verifies 22 and 24.");
  const targetDir = inspect(operation.targetDir, () => assertSafeTargetDirectory(args.directory));
  if (targetDir) {
    const metadata = (name) => path.join(targetDir, ".agents", name);
    const required = (filePath) => {
      assertSafeProjectPath(targetDir, filePath);
      const stat = fs.lstatSync(filePath);
      if (!stat.isFile()) throw new Error("Required installed file is not a regular file.");
    };
    inspect(targetDir, () => {
      if (!fs.statSync(targetDir).isDirectory()) throw new Error("Target project is not a directory.");
    });
    const journalPath = metadata(TRANSACTION_FILE);
    inspect(journalPath, () => {
      assertSafeProjectPath(targetDir, journalPath);
      if (fs.existsSync(journalPath)) report("FAIL", "Interrupted transaction retained. Back up the project and journal, then rerun install/upgrade for validated recovery; do not delete the journal.", journalPath);
    });
    inspect(metadata("developer-config.json"), () => {
      required(metadata("developer-config.json"));
      readDeveloperConfig(metadata("developer-config.json"));
      report("OK", "Developer config is valid (values hidden).");
    });
    const tools = inspect(metadata("macca-tools.txt"), () => {
      required(metadata("macca-tools.txt"));
      const selected = readNonEmptyLines(metadata("macca-tools.txt"));
      if (!selected.length || selected.some((key) => !TOOL_BY_KEY.has(key))) throw new Error("Selected tools are missing or unsupported; review macca-tools.txt.");
      report("OK", `Selected tools: ${unique(selected).join(", ")}.`);
      return unique(selected);
    });
    const skills = inspect(metadata("macca-managed-skills.txt"), () => {
      required(metadata("macca-managed-skills.txt"));
      const names = validateManagedSkillNames(readNonEmptyLines(metadata("macca-managed-skills.txt")), "installed manifest");
      if (!names.length || !names.includes("_shared")) throw new Error("Installed managed-skill manifest is empty or missing _shared.");
      return names;
    });
    const lock = inspect(metadata("macca-lock.json"), () => {
      required(metadata("macca-lock.json"));
      const value = readJsonObject(metadata("macca-lock.json"), "installed lock");
      if (typeof value.version !== "string" || !value.version) throw new Error("Installed lock version is missing or invalid.");
      if (!Array.isArray(value.skills) || !value.skills.length || value.skills.some((name) => typeof name !== "string")) throw new Error("Installed lock skill list is missing or invalid.");
      validateManagedSkillNames(value.skills, "installed lock");
      if (skills && (value.skills.some((name) => !skills.includes(name)) || skills.some((name) => !value.skills.includes(name)))) throw new Error("Installed lock and managed-skill manifest disagree.");
      if (value.payloadFiles !== undefined && (!value.payloadFiles || typeof value.payloadFiles !== "object" || Array.isArray(value.payloadFiles))) throw new Error("Installed lock payloadFiles must be an object.");
      return value;
    });
    inspect(metadata(STATE_FILE), () => {
      assertSafeProjectPath(targetDir, metadata(STATE_FILE));
      if (!fs.existsSync(metadata(STATE_FILE))) {
        report("WARN", "Installation state is absent; metadata integrity cannot be verified.", metadata(STATE_FILE));
        return;
      }
      required(metadata(STATE_FILE));
      const state = readJsonObject(metadata(STATE_FILE), "MACCA state");
      for (const name of ["macca-tools.txt", "macca-managed-skills.txt", "macca-lock.json"]) {
        required(metadata(name));
        if (!/^[a-f0-9]{64}$/.test(state.files?.[name] || "")) throw new Error("Installation state is missing a valid metadata fingerprint.");
        if (hashFile(metadata(name)) !== state.files[name]) report("WARN", "Local metadata drift; back up and review before upgrade.", metadata(name));
      }
    });
    if (tools && skills && lock) {
      if (!lock.payloadFiles) report("WARN", "Installed lock has no payloadFiles; checking current packaged references/assets for existence only. Upgrade after backup to establish fingerprints.", metadata("macca-lock.json"));
      const destinations = inspect(targetDir, () => getUniqueDestinations(targetDir, tools));
      for (const destination of destinations || []) {
        for (const skill of skills) {
          const skillPath = resolveOwnedSkillPath(destination, skill);
          inspect(skillPath, () => {
            assertSafeProjectPath(targetDir, skillPath);
            const actual = getDirectoryFileHashes(skillPath);
            if (skill !== "_shared") required(path.join(skillPath, "SKILL.md"));
            const expected = lock.payloadFiles ? lock.payloadFiles[skill] : getDirectoryFileHashes(path.join(SOURCE_SKILLS_DIR, skill));
            if (!expected || typeof expected !== "object" || Array.isArray(expected) || !Object.keys(expected).length) throw new Error("Installed lock is missing valid payload fingerprints for this skill.");
            if (skill === "_shared" && !Object.keys(expected).some((name) => name.startsWith("references/"))) throw new Error("Shared references are missing from installed lock.");
            for (const [relative, hash] of Object.entries(expected)) {
              if (!relative || relative.includes("\\") || relative.split("/").some((part) => !part || part === "." || part === "..") || path.isAbsolute(relative) || /^[A-Za-z]:/.test(relative) || typeof hash !== "string" || !/^[a-f0-9]{64}$/.test(hash)) throw new Error("Invalid payload path or hash in installed lock.");
              const filePath = path.join(skillPath, relative);
              if (!Object.hasOwn(actual, relative)) report("FAIL", "Required installed payload file is missing.", filePath);
              else if (lock.payloadFiles && actual[relative] !== hash) report("WARN", "Local skill drift; back up and review before upgrade.", filePath);
            }
            if (lock.payloadFiles && Object.keys(actual).some((relative) => !Object.hasOwn(expected, relative))) report("WARN", "Additional local skill files; back up and review before upgrade.", skillPath);
            const marker = readOwnershipMarker(skillPath, skill);
            const markerPath = path.join(skillPath, OWNERSHIP_MARKER);
            if (!marker) {
              report("WARN", "Ownership marker is absent or invalid; upgrade may require review.", markerPath);
            } else if (typeof marker.payloadHash !== "string" ||
                !/^[a-f0-9]{64}$/.test(marker.payloadHash) ||
                marker.payloadHash !== hashText(JSON.stringify(actual))) {
              report("WARN", "Ownership marker payload fingerprint is missing, malformed, or mismatched; ordinary upgrade will refuse this skill. Back up and review the skill and marker; doctor does not repair them.", markerPath);
            }
          });
        }
      }
    }
  }
  process.stdout.write(`Doctor: ${failures} failure(s), ${warnings} warning(s). Read-only; no files changed.\n`);
  if (failures) process.stdout.write("Next: review the reported paths and back up existing files before install/upgrade.\n");
  process.exitCode = failures ? 1 : 0;
}

function exitWithError(error) {
  if (typeof error === "string") error = new Error(error);
  const nextSteps = {
    EACCES: "Check permissions and ownership of the reported path; choose a writable project directory.",
    EPERM: "Check permissions or file locks at the reported path; close programs holding it and retry.",
    EBUSY: "Close programs holding the reported path, then retry.",
    ENOSPC: "Free space on the target volume, then retry; preserve transaction files for recovery.",
    ENOENT: "Check the reported path and parent directory. Restore missing package files or run install for a missing installation.",
    MACCA_CONFIG_INVALID: "Back up developer-config.json, correct the listed fields without sharing secret values, then retry. --force cannot bypass config validation.",
    MACCA_CANCELLED: "Rerun install when ready, or use --yes with explicit flags.",
    MACCA_INPUT_ERROR: "Open a working terminal, or use --yes with explicit flags.",
    MACCA_NODE_UNSUPPORTED: "Use Node.js 22 or 24, then retry.",
  };
  let next = nextSteps[error.code] || "Review the reported path and back up local files before retrying. Use doctor for a read-only check.";
  if (/symlink/i.test(error.message)) next = "Symlinked paths are rejected conservatively. Resolve the real path (including macOS aliases such as /var or /tmp), review it, and pass that real directory with --directory.";
  let pending = false;
  if (operation.targetDir) {
    try { pending = fs.existsSync(path.join(operation.targetDir, ".agents", TRANSACTION_FILE)); } catch { /* Error reporting must not mask the original error. */ }
  }
  const stage = operation.stage === "not started" ? "not started; no files changed by this attempt" :
    operation.stage === "read-only diagnosis" ? "read-only diagnosis; no files changed" :
      `${operation.stage}; files may have changed${operation.recoveryChanged ? "; recovery may have changed files" : ""}`;
  process.stderr.write(`\nError [${error.code || "MACCA_ERROR"}]: ${error.message}\nPath: ${JSON.stringify(error.path || operation.targetDir || process.cwd())}\nChange stage: ${stage}.\n${pending ? "Pending transaction journal retained; back up and review it before retrying recovery.\n" : ""}Next: ${next}\n`);
  process.exitCode = error.code === "MACCA_CANCELLED" ? 130 : 1;
}

main();
