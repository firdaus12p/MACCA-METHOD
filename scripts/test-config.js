#!/usr/bin/env node

"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");
const validatorPath = path.resolve(
  __dirname, "../.agents/skills/_shared/scripts/config-validator.js",
);
const { validateConfig, assertValidConfig } = require(validatorPath);
const source = fs.readFileSync(validatorPath, "utf8");
const loaderSource = fs.readFileSync(path.join(path.dirname(validatorPath), "config-file.js"), "utf8");
let passed = 0;

function test(name, action) {
  action();
  passed += 1;
  process.stdout.write(`OK: ${name}\n`);
}

function fields(value) {
  return validateConfig(value).map((error) => error.field);
}

// CLI fixtures stay in memory: even the test suite does not write config files.
// A read-only fs stub also fails if the CLI attempts any other filesystem API.
function runCli(content, { args = ["SECRET-config.json"], readError, imported = false } = {}) {
  const output = { stdout: "", stderr: "", exitCode: 0, reads: 0 };
  const file = path.resolve(args[0] || "unused");
  const bytes = Buffer.from(content);
  let offset = 0;
  const stat = (directory = false) => ({
    dev: 1, ino: 2, size: bytes.length, mtimeMs: 10, ctimeMs: 10,
    isFile: () => !directory, isDirectory: () => directory, isSymbolicLink: () => false,
  });
  const loader = { exports: {} };
  vm.runInNewContext(loaderSource, {
    module: loader, Buffer, process: { platform: process.platform },
    require(name) {
      if (name === "node:path") return path;
      assert.equal(name, "node:fs");
      return Object.freeze({
        constants: fs.constants,
        lstatSync(target) {
          if (target === file && readError) throw readError;
          return stat(target !== file);
        },
        openSync(target) { assert.equal(target, file); return 123; },
        fstatSync(fd) { assert.equal(fd, 123); return stat(); },
        readSync(fd, buffer, start, length) {
          assert.equal(fd, 123);
          output.reads += 1;
          const count = Math.min(length, bytes.length - offset);
          bytes.copy(buffer, start, offset, offset + count);
          offset += count;
          return count;
        },
        closeSync(fd) { assert.equal(fd, 123); },
      });
    },
  }, { timeout: 5000 });
  const module = { exports: {} };
  const requireStub = (name) => {
    assert.equal(name, "./config-file.js");
    return loader.exports;
  };
  requireStub.main = imported ? {} : module;
  const processStub = {
    argv: ["node", validatorPath, ...args],
    stdout: { write: (text) => { output.stdout += text; } },
    stderr: { write: (text) => { output.stderr += text; } },
    get exitCode() { return output.exitCode; },
    set exitCode(value) { output.exitCode = value; },
  };
  vm.runInNewContext(source, {
    module, require: requireStub, process: processStub,
  }, { filename: validatorPath, timeout: 5000 });
  return output;
}

test("optional fields and complete current config", () => {
  assert.deepEqual(validateConfig({}), []);
  assert.deepEqual(validateConfig({
    name: "", project: "",
    languagePreferences: {
      communication: { raw: "English", normalized: "english" },
      documents: { raw: "Bahasa Indonesia", normalized: "indonesian" },
    },
    developerPreferences: { workMode: "direct", scope: "fullstack" },
    brainstormPreferences: {
      discussionMode: "one-by-one", recommendations: true, discoveryDepth: "standard",
    },
    codeReviewPreferences: { fixMode: "report-first" },
    additionalSkills: [{
      name: "react", purpose: "UI", paths: { copilot: "a", opencode: "b", codex: "c" },
    }],
    availableMCPs: ["context7", "supabase"],
  }), []);
  assert.equal(assertValidConfig({}, "valid.json"), undefined);
});

test("all documented enums remain accepted", () => {
  const enums = {
    developerPreferences: { workMode: ["direct", "plan-first"], scope: ["frontend", "backend", "fullstack"] },
    brainstormPreferences: {
      discussionMode: ["one-by-one", "three-at-a-time", "all-at-once"],
      discoveryDepth: ["quick", "standard", "critical"], recommendations: [true, false],
    },
    codeReviewPreferences: { fixMode: ["report-first", "fix-then-report"] },
  };
  for (const [section, choices] of Object.entries(enums)) {
    for (const [field, values] of Object.entries(choices)) {
      for (const value of values) assert.deepEqual(validateConfig({ [section]: { [field]: value } }), []);
    }
  }
});

test("language aliases and fallback strings are preserved verbatim", () => {
  for (const language of [
    "indonesian", "id", "indo", "indonesia", "bahasa indonesia",
    "english", "en", "eng", "inggris", "bahasa inggris", " EN ", "", "custom language",
  ]) {
    const config = { languagePreferences: {
      communication: { raw: language, normalized: language }, documents: {},
    } };
    const before = JSON.stringify(config);
    assert.deepEqual(validateConfig(config), []);
    assert.equal(JSON.stringify(config), before);
  }
});

test("legacy paths and explicit MCP denial are supported", () => {
  const skill = { name: "legacy", purpose: "", paths: { futureHost: "" } };
  for (const key of ["path", "githubPath", "opencodePath", "claudePath", "cursorPath",
    "windsurfPath", "geminiPath", "kiloPath", "kimiPath", "codexPath"]) {
    skill[key] = "legacy/SKILL.md";
    assert.deepEqual(fields({ additionalSkills: [{ name: "legacy", [key]: 12 }] }), [
      `additionalSkills[0].${key}`,
    ]);
  }
  assert.deepEqual(validateConfig({ additionalSkills: [skill], availableMCPs: "none" }), []);
  assert.deepEqual(validateConfig({ additionalSkills: [], availableMCPs: [] }), []);
  assert.deepEqual(validateConfig({ availableMCPs: ["none"] }), []);
  assert.deepEqual(fields({ additionalSkills: ["legacy"] }), ["additionalSkills[0]"]);
  assert.deepEqual(fields({ availableMCPs: "context7" }), ["availableMCPs"]);
});

test("root and nested objects reject null, arrays, and primitives", () => {
  for (const bad of [null, [], "x", 7, true, undefined]) {
    assert.deepEqual(fields(bad), ["$"]);
    for (const key of ["languagePreferences", "developerPreferences", "brainstormPreferences", "codeReviewPreferences"]) {
      assert.deepEqual(fields({ [key]: bad }), [key]);
    }
    for (const key of ["communication", "documents"]) {
      assert.deepEqual(fields({ languagePreferences: { [key]: bad } }), [`languagePreferences.${key}`]);
    }
  }
});

test("nested errors accumulate with exact field and array positions", () => {
  assert.deepEqual(fields({
    name: null, project: [],
    languagePreferences: { communication: { raw: [], normalized: false }, documents: null },
    developerPreferences: { workMode: "unsafe", scope: null },
    brainstormPreferences: { discussionMode: [], recommendations: "true", discoveryDepth: "unsafe" },
    codeReviewPreferences: { fixMode: "unsafe" },
    additionalSkills: [null, {}, { name: " ", purpose: 7, paths: null }, { name: "x", paths: { codex: [] } }],
    availableMCPs: ["context7", null, " ", 4],
  }), [
    "name", "project", "languagePreferences.communication.raw",
    "languagePreferences.communication.normalized", "languagePreferences.documents",
    "developerPreferences.workMode", "developerPreferences.scope",
    "brainstormPreferences.discussionMode", "brainstormPreferences.recommendations",
    "brainstormPreferences.discoveryDepth", "codeReviewPreferences.fixMode",
    "additionalSkills[0]", "additionalSkills[1].name", "additionalSkills[2].name",
    "additionalSkills[2].purpose", "additionalSkills[2].paths", "additionalSkills[3].paths[0]",
    "availableMCPs[1]", "availableMCPs[2]", "availableMCPs[3]",
  ]);
  for (const bad of [null, {}, "", false]) {
    assert.deepEqual(fields({ additionalSkills: bad }), ["additionalSkills"]);
    assert.deepEqual(fields({ availableMCPs: bad }), ["availableMCPs"]);
  }
  assert.deepEqual(fields({ availableMCPs: new Array(1) }), ["availableMCPs[0]"]);
});

test("unknown fields at every schema level are untouched and never evaluated", () => {
  const extension = { get secret() { throw new Error("extension evaluated"); } };
  const language = { raw: "custom", normalized: "custom" };
  const skill = { name: "x", paths: { newHost: "x" } };
  const config = {
    languagePreferences: { communication: language, documents: {} },
    developerPreferences: {}, brainstormPreferences: {}, codeReviewPreferences: {},
    additionalSkills: [skill], availableMCPs: [],
  };
  const levels = [config, config.languagePreferences, language, config.languagePreferences.documents,
    config.developerPreferences, config.brainstormPreferences, config.codeReviewPreferences, skill];
  for (const level of levels) {
    level.extension = extension;
    Object.defineProperty(level, "unknownAccessor", {
      enumerable: true, get() { throw new Error("unknown accessor evaluated"); },
    });
    Object.freeze(level);
  }
  assert.deepEqual(validateConfig(config), []);
  assertValidConfig(config);
  for (const level of levels) assert.equal(level.extension, extension);
  const special = JSON.parse('{"__proto__":{"polluted":true},"constructor":null,"prototype":[]}');
  const before = JSON.stringify(special);
  assert.deepEqual(validateConfig(special), []);
  assert.equal(JSON.stringify(special), before);
  assert.equal(Object.prototype.polluted, undefined);
  assert.deepEqual(fields(Object.assign(Object.create({ name: 42 }), { project: "" })), []);
});

test("known accessors are rejected without execution", () => {
  const config = { get name() { throw new Error("must not execute"); } };
  assert.deepEqual(fields(config), ["name"]);
});

test("assertion errors expose code and fields but never hostile values or map keys", () => {
  const secret = "SECRET-credential-123\n\u001b[31m";
  const config = {
    name: { secret }, developerPreferences: { workMode: secret },
    additionalSkills: [{ name: "x", paths: { [secret]: { secret } } }],
  };
  const before = JSON.stringify(config);
  const diagnostics = validateConfig(config);
  assert.equal(JSON.stringify(config), before);
  for (const error of diagnostics) assert.deepEqual(Object.keys(error), ["field", "message"]);
  assert(!JSON.stringify(diagnostics).includes("SECRET"));
  assert.throws(() => assertValidConfig(config, "project/.agents/developer-config.json"), (error) => {
    assert.equal(error.code, "MACCA_CONFIG_INVALID");
    assert.equal(error.field, "name");
    assert.deepEqual(error.fields, ["name", "developerPreferences.workMode", "additionalSkills[0].paths[0]"]);
    assert.match(error.message, /project\/\.agents\/developer-config\.json/);
    assert(!`${error.stack}${JSON.stringify(error)}`.includes("SECRET"));
    return true;
  });
  assert.throws(() => assertValidConfig(null, "config\n\u001b.json"), (error) => {
    assert(error.message.includes('"config\\n\\u001b.json"'));
    return true;
  });
});

test("requiring the module has no CLI side effects and exports only the agreed API", () => {
  assert.deepEqual(Object.keys(require(validatorPath)).sort(), ["assertValidConfig", "validateConfig"]);
  assert.deepEqual(runCli("not JSON", { imported: true }), { stdout: "", stderr: "", exitCode: 0, reads: 0 });
});

test("CLI success is human-readable and read-only", () => {
  assert.deepEqual(runCli('{"name":"SECRET","extension":{"token":"PRIVATE"}}'), {
    stdout: 'Valid config.\n', stderr: "", exitCode: 0, reads: 2,
  });
});

test("CLI schema and JSON diagnostics redact configuration and parser excerpts", () => {
  for (const content of [
    '{"developerPreferences":{"workMode":"SECRET"}}',
    '{"additionalSkills":[{"name":"x","paths":{"SECRET":false}}]}',
    '{"name":"SECRET", broken JSON}',
    "SECRET invalid JSON", "null", "[]",
  ]) {
    const result = runCli(content);
    assert.equal(result.exitCode, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /Invalid config:/);
    assert(!result.stderr.includes("SECRET"));
  }
  assert.match(runCli('{"availableMCPs":[false]}').stderr, /availableMCPs\[0\]/);
  assert.match(runCli("malformed").stderr, /\$: must contain valid JSON/);
});

test("CLI missing/unreadable files and usage return exit 1 with no raw exceptions", () => {
  for (const code of ["ENOENT", "EACCES", "EISDIR"]) {
    const readError = Object.assign(new Error("SECRET filesystem excerpt"), { code });
    const result = runCli("", { readError });
    assert.equal(result.exitCode, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, code === "ENOENT" ? /Missing config file/ : /Cannot inspect config file/);
    assert(!result.stderr.includes("SECRET"));
  }
  for (const args of [[], ["one.json", "SECRET"]]) {
    const result = runCli("", { args });
    assert.equal(result.exitCode, 1);
    assert.equal(result.reads, 0);
    assert.match(result.stderr, /^Usage:/);
    assert(!result.stderr.includes("SECRET"));
  }
});

test("real Node CLI exits correctly without creating fixture files", () => {
  const usage = spawnSync(process.execPath, [validatorPath], { encoding: "utf8", timeout: 10000 });
  assert.ifError(usage.error);
  assert.equal(usage.status, 1);
  assert.match(usage.stderr, /^Usage:/);
  // package.json is also a valid extension-rich config object (name is a string).
  const packagePath = fs.realpathSync(path.resolve(__dirname, "../package.json"));
  for (const [file, status] of [[packagePath, 0], [fs.realpathSync(validatorPath), 1]]) {
    const before = fs.readFileSync(file);
    const result = spawnSync(process.execPath, [validatorPath, file], {
      encoding: "utf8", timeout: 10000,
    });
    assert.ifError(result.error);
    assert.equal(result.status, status, result.stderr);
    assert.deepEqual(fs.readFileSync(file), before);
    assert.match(status === 0 ? result.stdout : result.stderr, status === 0 ? /^Valid config/ : /must contain valid JSON/);
  }
  const missing = path.join(fs.realpathSync(__dirname), "__macca_config_missing_fixture__.json");
  assert.equal(fs.existsSync(missing), false);
  const result = spawnSync(process.execPath, [validatorPath, missing], { encoding: "utf8", timeout: 10000 });
  assert.ifError(result.error);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /^Missing config file/);
  assert.equal(fs.existsSync(missing), false);
});

process.stdout.write(`\n${passed} config validator tests passed.\n`);
