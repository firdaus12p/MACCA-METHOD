#!/usr/bin/env node

"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");
const readerPath = path.resolve(__dirname, "../.agents/skills/_shared/scripts/read-preferences.js");
const validator = require("../.agents/skills/_shared/scripts/config-validator.js");
const { readPreferences, summarize } = require(readerPath);
const source = fs.readFileSync(readerPath, "utf8");
const loaderSource = fs.readFileSync(path.join(path.dirname(readerPath), "config-file.js"), "utf8");
const validatorSource = fs.readFileSync(path.join(path.dirname(readerPath), "config-validator.js"), "utf8");
const LIMIT = 1024 * 1024;
const SECRET = "SYNTHETIC_SECRET_DO_NOT_OUTPUT_42";
let passed = 0;

function test(name, action) {
  action();
  passed += 1;
  process.stdout.write(`OK: ${name}\n`);
}

function ioError(code) {
  return Object.assign(new Error(SECRET), { code });
}

// Entire fixture filesystem stays in memory. Any write/chmod/mkdir or other
// unapproved fs API fails immediately; tests never load live user preferences.
function runCli(content = "{}", options = {}) {
  const output = { stdout: "", stderr: "", exitCode: 0, calls: [] };
  const bytes = Buffer.from(content);
  const platform = options.platform || "linux";
  const pathApi = platform === "win32" ? path.win32 : path.posix;
  const args = options.args || [platform === "win32" ? `C:\\workspace\\.agents\\${SECRET}.json` : `/workspace/.agents/${SECRET}.json`];
  const target = pathApi.resolve(args[0] || "/unused");
  let offset = 0;
  let stats = 0;
  const stat = (extra = {}) => ({
    dev: 1, ino: 2, size: bytes.length, mtimeMs: 10, ctimeMs: 10,
    isFile: () => true, isDirectory: () => false, isSymbolicLink: () => false, ...extra,
  });
  const constants = { O_RDONLY: 0, O_NOFOLLOW: 131072, O_NONBLOCK: 2048 };
  const mockFs = Object.freeze({
    constants: options.zeroSafeFlags ? { O_RDONLY: 0, O_NOFOLLOW: 0, O_NONBLOCK: 0 }
      : options.noSafeFlags ? { O_RDONLY: 0 } : constants,
    lstatSync(file) {
      if (options.chainCalls) options.chainCalls.push(file);
      if (file !== target) {
        if (file === options.badAncestor) {
          if (options.ancestorMissing) throw ioError("ENOENT");
          return stat({ isFile: () => false, isDirectory: () => true,
            isSymbolicLink: () => !options.ancestorIdentityOnly && (!options.ancestorSwap || stats > 0),
            ino: options.ancestorSwap && stats > 0 ? 9 : 2 });
        }
        return stat({ isFile: () => false, isDirectory: () => true });
      }
      output.calls.push("lstat");
      if (options.lstatError) throw options.lstatError;
      return stat(options.before);
    },
    openSync(file, flags) {
      output.calls.push("open");
      assert.equal(file, target);
      assert.equal(flags, platform === "win32" ? constants.O_RDONLY
        : constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
      if (options.openError) throw options.openError;
      return 123;
    },
    fstatSync(fd) {
      output.calls.push("fstat");
      assert.equal(fd, 123);
      stats += 1;
      if (options.statError) throw options.statError;
      return stat(stats === 1 ? options.opened : options.after);
    },
    readSync(fd, buffer, start, length, position) {
      output.calls.push("read");
      assert.equal(fd, 123);
      assert.equal(position, null);
      assert.equal(buffer.length, LIMIT + 1);
      assert(start + length <= LIMIT + 1);
      if (options.readError) throw options.readError;
      const count = Math.min(length, bytes.length - offset, options.chunkSize || Infinity);
      bytes.copy(buffer, start, offset, offset + count);
      offset += count;
      return count;
    },
    closeSync(fd) {
      output.calls.push("close");
      assert.equal(fd, 123);
      if (options.closeError) throw options.closeError;
    },
  });
  const loaderModule = { exports: {} };
  vm.runInNewContext(loaderSource, {
    Buffer, module: loaderModule, process: { platform },
    require(name) {
      if (name === "node:fs") return mockFs;
      assert.equal(name, "node:path");
      return pathApi;
    },
  }, { timeout: 5000 });
  const module = { exports: {} };
  const requireStub = (name) => {
    if (name === "./config-file.js") {
      if (options.noLoader) throw ioError("MODULE_NOT_FOUND");
      return loaderModule.exports;
    }
    assert.equal(name, "./config-validator.js");
    if (options.noValidator) throw ioError("MODULE_NOT_FOUND");
    return validator;
  };
  requireStub.main = options.imported ? {} : module;
  vm.runInNewContext(options.validatorCli ? validatorSource : source, {
    Buffer, module, require: requireStub,
    process: {
      argv: ["node", readerPath, ...args],
      stdout: { write(text) { output.stdout += text; } },
      stderr: { write(text) { output.stderr += text; } },
      get exitCode() { return output.exitCode; },
      set exitCode(value) { output.exitCode = value; },
    },
  }, { filename: readerPath, timeout: 5000 });
  assert(!`${output.stdout}${output.stderr}`.includes(SECRET), "secret leaked to CLI output");
  return output;
}

function summary(content, options) {
  const result = runCli(content, options);
  assert.equal(result.exitCode, 0, result.stderr);
  assert.equal(result.stderr, "");
  return JSON.parse(result.stdout);
}

function rejected(content, options) {
  const result = runCli(content, options);
  assert.equal(result.exitCode, 1);
  assert.equal(result.stdout, "");
  assert(result.stderr.length > 0);
  return result;
}

test("module exports readPreferences/summarize without filesystem or CLI side effects", () => {
  assert.equal(typeof readPreferences, "function");
  assert.deepEqual(Object.keys(require(readerPath)).sort(), ["readPreferences", "summarize"]);
  assert.deepEqual(runCli(SECRET, { imported: true }), {
    stdout: "", stderr: "", exitCode: 0, calls: [],
  });
});

test("summary has an exact closed schema, without changing the validator API or accepted extensions", () => {
  assert.deepEqual(Object.keys(validator).sort(), ["assertValidConfig", "validateConfig"]);
  const config = {
    name: SECRET, project: SECRET, [SECRET]: SECRET,
    languagePreferences: {
      communication: { normalized: "EN", raw: SECRET, [SECRET]: SECRET },
      documents: { raw: "id", [SECRET]: SECRET },
    },
    developerPreferences: { workMode: "direct", scope: "fullstack", [SECRET]: SECRET },
    brainstormPreferences: {
      discussionMode: "all-at-once", recommendations: false, discoveryDepth: "quick", [SECRET]: SECRET,
    },
    codeReviewPreferences: { fixMode: "report-first", [SECRET]: SECRET },
    additionalSkills: [{ name: SECRET, purpose: SECRET, paths: { [SECRET]: SECRET }, [SECRET]: SECRET }],
    availableMCPs: [SECRET],
  };
  assert.deepEqual(validator.validateConfig(config), []);
  assert.deepEqual(summary(JSON.stringify(config)), {
    absent: false,
    identity: { nameSet: true, projectSet: true },
    languagePreferences: {
      communication: { configured: true, effective: "english", source: "normalized" },
      documents: { configured: true, effective: "indonesian", source: "raw" },
    },
    developerPreferences: {
      workMode: { configured: true, value: "direct" },
      scope: { configured: true, value: "fullstack" },
    },
    brainstormPreferences: {
      discussionMode: { configured: true, value: "all-at-once" },
      recommendations: { configured: true, value: false },
      discoveryDepth: { configured: true, value: "quick" },
    },
    codeReviewPreferences: { fixMode: { configured: true, value: "report-first" } },
    additionalSkills: { configured: true, count: 1 },
    availableMCPs: { configured: true, count: 1, denied: false },
  });
});

test("missing config is absent with independent unsaved defaults and no writes", () => {
  const result = runCli("", { lstatError: ioError("ENOENT") });
  const absent = JSON.parse(result.stdout);
  assert.equal(result.exitCode, 0);
  assert.equal(result.stderr, "");
  assert.deepEqual(result.calls, ["lstat"]);
  assert.deepEqual(absent, { ...summarize({}), absent: true });
  assert.deepEqual(absent.languagePreferences, {
    communication: { configured: false, effective: "indonesian", source: "default" },
    documents: { configured: false, effective: "indonesian", source: "default" },
  });
  assert.deepEqual(absent.developerPreferences.scope, { configured: false, value: null });
  assert.deepEqual(absent.availableMCPs, { configured: false, count: 0, denied: false });
  assert.equal(summary("{}").absent, false);
});

test("known and unknown free text never leaves the process, including names/paths/toolName", () => {
  const skill = { name: SECRET, purpose: SECRET, toolName: SECRET, paths: { [SECRET]: SECRET } };
  for (const key of ["path", "githubPath", "opencodePath", "claudePath", "cursorPath",
    "windsurfPath", "geminiPath", "kiloPath", "kimiPath", "codexPath"]) skill[key] = SECRET;
  const config = {
    name: SECRET, project: SECRET, toolName: SECRET, path: SECRET, purpose: SECRET,
    [SECRET]: { secret: SECRET },
    languagePreferences: {
      communication: { raw: SECRET, normalized: SECRET, [SECRET]: SECRET },
      documents: { raw: "English", normalized: SECRET, [SECRET]: SECRET },
      [SECRET]: SECRET,
    },
    developerPreferences: { scope: "backend", workMode: "plan-first", [SECRET]: SECRET },
    brainstormPreferences: {
      discussionMode: "three-at-a-time", recommendations: false, discoveryDepth: "critical", [SECRET]: SECRET,
    },
    codeReviewPreferences: { fixMode: "fix-then-report", [SECRET]: SECRET },
    additionalSkills: [skill], availableMCPs: [SECRET],
  };
  const before = JSON.stringify(config);
  const safe = summary(before);
  assert.deepEqual(safe, summarize(config));
  assert.equal(JSON.stringify(config), before);
  assert(!JSON.stringify(safe).includes(SECRET));
  assert.deepEqual(safe.identity, { nameSet: true, projectSet: true });
  assert.deepEqual(safe.additionalSkills, { configured: true, count: 1 });
  assert.deepEqual(safe.availableMCPs, { configured: true, count: 1, denied: false });
  assert.deepEqual(safe.brainstormPreferences.recommendations, { configured: true, value: false });
  assert.deepEqual(safe.languagePreferences.communication, {
    configured: true, effective: "indonesian", source: "default",
  });
  assert.deepEqual(safe.languagePreferences.documents, { configured: true, effective: "english", source: "raw" });
});

test("every finite preference is preserved, without inventing missing choices", () => {
  const choices = {
    developerPreferences: { scope: ["frontend", "backend", "fullstack"], workMode: ["direct", "plan-first"] },
    brainstormPreferences: {
      discussionMode: ["one-by-one", "three-at-a-time", "all-at-once"],
      discoveryDepth: ["quick", "standard", "critical"], recommendations: [false, true],
    },
    codeReviewPreferences: { fixMode: ["report-first", "fix-then-report"] },
  };
  for (const [section, fields] of Object.entries(choices)) {
    for (const [key, values] of Object.entries(fields)) {
      assert.deepEqual(summarize({})[section][key], { configured: false, value: null });
      for (const value of values) {
        assert.deepEqual(summarize({ [section]: { [key]: value } })[section][key], { configured: true, value });
      }
      rejected(JSON.stringify({ [section]: { [key]: SECRET } }));
    }
  }
});

test("exact language aliases normalize independently with normalized/raw/default precedence", () => {
  const aliases = {
    indonesian: ["indonesian", "id", "indo", "indonesia", "bahasa indonesia"],
    english: ["english", "en", "eng", "inggris", "bahasa inggris"],
  };
  for (const [effective, values] of Object.entries(aliases)) {
    for (const value of values) {
      for (const source of ["normalized", "raw"]) {
        const channel = { raw: SECRET, normalized: SECRET, [source]: ` ${value.toUpperCase()} ` };
        const safe = summarize({ languagePreferences: { communication: channel, documents: {} } });
        assert.deepEqual(safe.languagePreferences.communication, { configured: true, effective, source });
        assert.equal(safe.languagePreferences.documents.effective, "indonesian");
      }
    }
  }
  const safe = summary(JSON.stringify({ languagePreferences: {
    communication: { normalized: "EN", raw: "id" }, documents: { normalized: "", raw: "en" },
  } }));
  assert.equal(safe.languagePreferences.communication.source, "normalized");
  assert.equal(safe.languagePreferences.communication.effective, "english");
  assert.equal(safe.languagePreferences.documents.source, "raw");
  for (const raw of ["", "en-US", "English please", SECRET]) {
    assert.equal(summarize({ languagePreferences: { documents: { raw } } }).languagePreferences.documents.source, "default");
  }
});

test("empty/none restrictions and false remain distinct from missing", () => {
  for (const availableMCPs of [[], "none"]) {
    const safe = summarize({ availableMCPs, additionalSkills: [], brainstormPreferences: { recommendations: false } });
    assert.deepEqual(safe.availableMCPs, { configured: true, count: 0, denied: true });
    assert.deepEqual(safe.additionalSkills, { configured: true, count: 0 });
    assert.deepEqual(safe.brainstormPreferences.recommendations, { configured: true, value: false });
  }
  assert.deepEqual(summarize({ availableMCPs: ["none"] }).availableMCPs, { configured: true, count: 1, denied: false });
  assert.deepEqual(summarize({ name: "", project: " " }).identity, { nameSet: false, projectSet: false });
});

test("extensions/prototype keys are accepted and accessors/inherited preferences never run", () => {
  const config = JSON.parse(`{"__proto__":{"name":"${SECRET}"},"constructor":"${SECRET}","tests":{"secret":"${SECRET}"}}`);
  Object.defineProperty(config, "unknown", { get() { throw new Error(SECRET); } });
  assert.deepEqual(summarize(config), summarize({}));
  const inherited = Object.create({ developerPreferences: { scope: "backend" }, name: SECRET });
  assert.deepEqual(summarize(inherited), summarize({}));
  assert.throws(() => summarize({ get name() { throw new Error(SECRET); } }), /name: must be a data property/);
});

test("malformed/schema errors use validator diagnostics without parser or value excerpts", () => {
  for (const content of [SECRET, `{"name":"${SECRET}", broken}`, "null", "[]",
    JSON.stringify({ name: { [SECRET]: SECRET } }),
    JSON.stringify({ additionalSkills: [{ name: SECRET, paths: { [SECRET]: false } }] }),
    JSON.stringify({ availableMCPs: [null, SECRET] }),
  ]) {
    const result = rejected(content);
    assert.equal(result.calls.at(-1), "close");
    assert.match(result.stderr, /Invalid config/);
  }
  assert.match(rejected(SECRET).stderr, /\$: must contain valid JSON/);
  assert.match(rejected(JSON.stringify({ additionalSkills: [{ name: SECRET, paths: { [SECRET]: false } }] })).stderr,
    /additionalSkills\[0\]\.paths\[0\]: must be a string/);
});

test("symlinks, directories, FIFOs and devices are rejected before open/read", () => {
  for (const before of [
    { isFile: () => false, isSymbolicLink: () => true },
    { isFile: () => true, isSymbolicLink: () => true },
    ...["directory", "fifo", "device"].map(() => ({ isFile: () => false })),
  ]) {
    const result = rejected(SECRET, { before });
    assert.deepEqual(result.calls, ["lstat"]);
    assert.match(result.stderr, /regular, non-symlink|symlinks or junctions/);
  }
});

test("raced symlinks/FIFOs and changed identity are rejected without reading", () => {
  assert.deepEqual(rejected(SECRET, { openError: ioError("ELOOP") }).calls, ["lstat", "open"]);
  for (const opened of [{ isFile: () => false }, { ino: 3 }, { dev: 2 }]) {
    assert.deepEqual(rejected(SECRET, { opened }).calls, ["lstat", "open", "fstat", "close"]);
  }
  assert.deepEqual(rejected(SECRET, { noSafeFlags: true }).calls, ["lstat"]);
  assert.deepEqual(rejected(SECRET, { zeroSafeFlags: true }).calls, ["lstat"]);
});

test("byte cap covers oversized files, growth and short reads; exact 1 MiB is accepted", () => {
  assert.deepEqual(rejected("{}", { before: { size: LIMIT + 1 } }).calls, ["lstat"]);
  assert.deepEqual(rejected("{}", { opened: { size: LIMIT + 1 } }).calls, ["lstat", "open", "fstat", "close"]);
  assert.equal(summary("{}" + " ".repeat(LIMIT - 2), { chunkSize: 65536 }).absent, false);
  const grown = rejected("{}" + " ".repeat(LIMIT), { before: { size: 2 }, opened: { size: 2 } });
  assert.match(grown.stderr, /1 MiB/);
  assert.equal(grown.calls.at(-1), "close");
  assert.equal(summary('{"name":"private"}', { chunkSize: 1 }).identity.nameSet, true);
  for (const after of [{ size: 3 }, { mtimeMs: 11 }, { ctimeMs: 11 }]) {
    assert.match(rejected("{}", { after }).stderr, /changed during reading/);
  }
});

test("I/O, usage and missing validator errors never echo raw paths or exceptions", () => {
  for (const options of [
    { lstatError: ioError("EACCES") }, { openError: ioError("ENOENT") },
    { statError: ioError("EIO") }, { readError: ioError("EIO") }, { closeError: ioError("EIO") },
  ]) rejected(SECRET, options);
  assert.match(rejected("{}", { noValidator: true }).stderr, /validation unavailable/);
  rejected("", { noValidator: true, lstatError: ioError("ENOENT") });
  for (const args of [[], [SECRET, SECRET]]) {
    const result = rejected("", { args });
    assert.deepEqual(result.calls, []);
    assert.match(result.stderr, /^Usage:/);
  }
});

test("real CLI is read-only, preserves file mode and leaves missing parent absent", () => {
  const packagePath = fs.realpathSync(path.resolve(__dirname, "../package.json"));
  const before = fs.readFileSync(packagePath);
  const mode = fs.statSync(packagePath).mode;
  const result = spawnSync(process.execPath, [readerPath, packagePath], { encoding: "utf8", timeout: 10000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  assert.equal(JSON.parse(result.stdout).identity.nameSet, true);
  assert(!result.stdout.includes("macca-method"));
  assert.deepEqual(readPreferences(packagePath), JSON.parse(result.stdout));
  assert.deepEqual(fs.readFileSync(packagePath), before);
  assert.equal(fs.statSync(packagePath).mode, mode);
  const missingParent = path.join(fs.realpathSync(__dirname), "__macca_preferences_missing_fixture__");
  assert.equal(fs.existsSync(missingParent), false);
  const missing = spawnSync(process.execPath, [readerPath, path.join(missingParent, "config.json")], {
    encoding: "utf8", timeout: 10000,
  });
  assert.ifError(missing.error);
  assert.equal(missing.status, 0);
  assert.equal(JSON.parse(missing.stdout).absent, true);
  assert.equal(fs.existsSync(missingParent), false);
  const usage = spawnSync(process.execPath, [readerPath], { encoding: "utf8", timeout: 10000 });
  assert.ifError(usage.error);
  assert.equal(usage.status, 1);
  assert.match(usage.stderr, /^Usage:/);
});

test("both CLIs reject ancestor links/junctions, including dangling links, before opening", () => {
  for (const validatorCli of [false, true]) {
    for (const platform of ["linux", "win32"]) {
      const badAncestor = platform === "win32" ? "C:\\workspace\\.agents" : "/workspace/.agents";
      const chainCalls = [];
      // A dangling ancestor is still a symlink at lstat; its missing target
      // must never be reached (or misreported as absent preferences).
      for (const lstatError of [undefined, ioError("ENOENT")]) {
        const result = rejected(SECRET, { validatorCli, platform, badAncestor, lstatError, chainCalls });
        assert.deepEqual(result.calls, []);
        assert.equal(chainCalls.at(-1), badAncestor);
        assert.match(result.stderr, /symlinks or junctions/);
      }
      const raced = rejected(SECRET, { validatorCli, platform, badAncestor, ancestorSwap: true });
      assert(!raced.calls.includes("read"));
      assert.equal(raced.calls.at(-1), "close");
      const replaced = rejected(SECRET, {
        validatorCli, platform, badAncestor, ancestorSwap: true, ancestorIdentityOnly: true,
      });
      assert(!replaced.calls.includes("read"));
      assert.match(replaced.stderr, /path changed/);
      const missing = runCli("", { validatorCli, platform, badAncestor, ancestorMissing: true });
      assert.equal(missing.exitCode, validatorCli ? 1 : 0);
      if (!validatorCli) assert.equal(JSON.parse(missing.stdout).absent, true);
      assert.deepEqual(missing.calls, []);
    }
  }
});

test("Windows local paths work without POSIX flags; namespaces/devices/ADS are denied before I/O", () => {
  for (const validatorCli of [false, true]) {
    for (const flags of [{ noSafeFlags: true }, { zeroSafeFlags: true }]) {
      const result = runCli("{}", { validatorCli, platform: "win32", ...flags });
      assert.equal(result.exitCode, 0, result.stderr);
      assert.equal(result.calls.at(-1), "close");
    }
    for (const file of ["\\\\server\\share\\config.json", "\\\\?\\C:\\config.json", "\\\\.\\pipe\\config",
      "C:config.json", "C:\\NUL", "C:\\workspace\\CON.txt", "C:\\workspace\\config.json:stream",
      "C:\\workspace.\\config.json", "C:\\workspace\\COM¹.txt"]) {
      const chainCalls = [];
      const result = rejected(SECRET, { validatorCli, platform: "win32", args: [file], chainCalls });
      assert.deepEqual(result.calls, []);
      assert.deepEqual(chainCalls, []);
    }
  }
});

test("validator CLI shares bounded descriptor reads and rejects FIFO/oversize/unsafe flags", () => {
  for (const options of [
    { before: { isFile: () => false } }, { before: { size: LIMIT + 1 } },
    { noSafeFlags: true }, { zeroSafeFlags: true },
  ]) {
    const result = rejected(SECRET, { validatorCli: true, ...options });
    assert(!result.calls.includes("open"));
    assert(!result.calls.includes("read"));
  }
  for (const options of [{ opened: { isFile: () => false } }, { opened: { ino: 4 } }]) {
    const result = rejected(SECRET, { validatorCli: true, ...options });
    assert(!result.calls.includes("read"));
    assert.equal(result.calls.at(-1), "close");
  }
  assert.match(rejected("{}" + " ".repeat(LIMIT), {
    validatorCli: true, before: { size: 2 }, opened: { size: 2 },
  }).stderr, /1 MiB/);
  const exact = runCli("{}" + " ".repeat(LIMIT - 2), { validatorCli: true, chunkSize: 65536 });
  assert.equal(exact.exitCode, 0);
  assert.equal(exact.stdout, "Valid config.\n");
  for (const content of [SECRET, JSON.stringify({ developerPreferences: { scope: SECRET } })]) {
    rejected(content, { validatorCli: true });
  }
  for (const validatorCli of [false, true]) {
    assert.match(rejected("{}", { validatorCli, noLoader: true }).stderr, /loader unavailable/);
  }
});

process.stdout.write(`\n${passed} preference reader tests passed.\n`);
