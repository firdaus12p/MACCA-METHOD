#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { EventEmitter } = require("node:events");
const { spawnSync } = require("node:child_process");

const repo = path.resolve(__dirname, "..");
const cli = path.join(repo, "bin", "macca-method.js");
const source = fs.readFileSync(cli, "utf8").replace(/main\(\);\s*$/, "");
const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "macca-setup-"));
let passed = 0;

function load(overrides = {}, nodeVersion = process.versions.node) {
  let stdout = "";
  let stderr = "";
  const input = Object.assign(new EventEmitter(), { isTTY: true });
  const processMock = {
    ...process, versions: { ...process.versions, node: nodeVersion },
    stdin: input,
    stdout: { isTTY: true, write: (value) => { stdout += value; } },
    stderr: { write: (value) => { stderr += value; } },
    exitCode: 0,
  };
  const sandbox = {
    // Production resolves the validator absolutely using PACKAGE_ROOT. This
    // require belongs to scripts/, deliberately exercising the VM caveat.
    require: (name) => overrides[name] || require(
      overrides["node:path"] === path.win32 && name.endsWith("\\config-validator.js")
        ? path.join(repo, ".agents", "skills", "_shared", "scripts", "config-validator.js")
        : name,
    ),
    process: processMock, __dirname: path.dirname(cli), Buffer, console,
  };
  vm.runInNewContext(source, sandbox, { filename: cli });
  return Object.assign(sandbox, {
    output: () => `${stdout}${stderr}`,
    state: () => vm.runInContext("operation", sandbox),
    dispose: (prompt) => vm.runInContext("promptStates", sandbox).get(prompt).dispose(),
  });
}

function fakePrompt(action) {
  const prompt = new EventEmitter();
  prompt.input = new EventEmitter();
  prompt.questions = [];
  prompt.setPrompt = (text) => { prompt.current = text; };
  prompt.prompt = () => {
    prompt.questions.push(prompt.current);
    queueMicrotask(() => action(prompt, prompt.questions.length));
  };
  prompt.close = () => { prompt.emit("close"); };
  return prompt;
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function json(file, value) { write(file, `${JSON.stringify(value, null, 2)}\n`); }
function configPath(project) { return path.join(project, ".agents", "developer-config.json"); }
function readConfig(project) { return JSON.parse(fs.readFileSync(configPath(project), "utf8")); }

// Include directories, symlinks and exact bytes: a doctor must not even repair
// a journal or create an empty target directory.
function snapshot(directory) {
  if (!fs.existsSync(directory)) return null;
  const entries = [];
  function walk(current, relative = "") {
    for (const name of fs.readdirSync(current).sort()) {
      const candidate = path.join(current, name);
      const key = path.join(relative, name);
      const stat = fs.lstatSync(candidate);
      if (stat.isSymbolicLink()) entries.push([key, "link", fs.readlinkSync(candidate)]);
      else if (stat.isDirectory()) { entries.push([key, "dir"]); walk(candidate, key); }
      else if (stat.isFile()) entries.push([key, "file", fs.readFileSync(candidate).toString("base64")]);
      else entries.push([key, "special", stat.mode, stat.ino, stat.size]);
    }
  }
  walk(directory);
  return entries;
}

function run(project, args, status = 0, executable = cli) {
  const result = spawnSync(process.execPath, [executable, ...args, "--directory", project], {
    encoding: "utf8", timeout: 60000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, status, `${result.stdout}${result.stderr}`);
  return `${result.stdout}${result.stderr}`;
}

function readOnlyFs() {
  const mocked = Object.create(fs);
  for (const name of ["mkdirSync", "writeFileSync", "appendFileSync", "renameSync", "rmSync", "unlinkSync", "rmdirSync", "copyFileSync", "cpSync", "openSync", "chmodSync"]) {
    mocked[name] = () => { assert.fail(`Unexpected mutation: ${name}`); };
  }
  return mocked;
}

function versionFixture(name) {
  const fixture = path.join(root, `${name} package`);
  const executable = path.join(fixture, "bin", "macca-method.js");
  write(executable, fs.readFileSync(cli));
  fs.cpSync(path.join(repo, ".agents"), path.join(fixture, ".agents"), { recursive: true });
  const packagedPath = path.join(fixture, ".agents", "macca-lock.json");
  const lock = JSON.parse(fs.readFileSync(packagedPath, "utf8"));
  const setVersion = (version) => json(packagedPath, { ...lock, version });
  setVersion("2.0.0");
  const project = path.join(root, `${name} project`);
  run(project, ["install", "--yes"], 0, executable);
  setVersion("3.0.0-rc.1");
  return { project, executable, setVersion };
}

function pendingLock(project, { current, backup, stage, version = 2, phase = "committing" }) {
  const agents = path.join(project, ".agents");
  const targetPath = path.join(agents, "macca-lock.json");
  const transactionId = "1-1-abcdef";
  const backupPath = path.join(agents, `.macca-lock.json.macca-backup-${transactionId}`);
  const stagingPath = stage === undefined ? null : path.join(agents, `.macca-lock.json.macca-stage-${transactionId}`);
  for (const [file, value] of [[targetPath, current], [backupPath, backup], [stagingPath, stage]]) {
    if (!file) continue;
    if (value === undefined) fs.rmSync(file, { force: true });
    else json(file, { version: value });
  }
  const instance = load();
  const stagedHash = current !== undefined ? instance.hashFile(targetPath)
    : stagingPath ? instance.hashFile(stagingPath) : null;
  const entry = {
    targetPath, backupPath, stagingPath, kind: "file", hadTarget: backup !== undefined || current !== undefined,
    stagedHash,
    ...(version === 2 ? {
      originalHash: backup !== undefined ? instance.hashFile(backupPath)
        : current !== undefined ? instance.hashFile(targetPath) : null,
      stagedSnapshotHash: stagingPath ? instance.hashFile(stagingPath) : null,
    } : {}),
  };
  const journalPath = path.join(agents, "macca-transaction.json");
  json(journalPath, { version, transactionId, phase, entries: [entry] });
  return { journalPath, entry };
}

function assertVersionRefusal(fixture, pattern) {
  const before = snapshot(fixture.project);
  for (const command of ["install", "upgrade"]) {
    for (const flags of [[], ["--force"]]) {
      const output = run(fixture.project, [command, "--yes", ...flags], 1, fixture.executable);
      assert.match(output, pattern);
      assert.match(output, /not started; no files changed/);
      assert.deepEqual(snapshot(fixture.project), before);
    }
  }
}

async function test(name, action) {
  await action();
  passed += 1;
  process.stdout.write(`OK: ${name}\n`);
}

async function main() {
  await test("SemVer follows the complete standard prerelease precedence chain", () => {
    const { compareSemver } = load();
    const ordered = [
      "1.0.0-alpha", "1.0.0-alpha.1", "1.0.0-alpha.beta", "1.0.0-beta",
      "1.0.0-beta.2", "1.0.0-beta.11", "1.0.0-rc.1", "1.0.0",
    ];
    for (let i = 0; i < ordered.length; i += 1) {
      for (let j = 0; j < ordered.length; j += 1) {
        assert.equal(compareSemver(ordered[i], ordered[j]), Math.sign(i - j), `${ordered[i]} vs ${ordered[j]}`);
      }
    }
  });

  await test("SemVer compares core, numeric and ASCII identifiers without numeric precision loss", () => {
    const { compareSemver } = load();
    const huge = "9".repeat(400);
    for (const [older, newer] of [
      ["0.0.0", "0.0.1"], ["1.9.99", "1.10.0"], ["2.99.99", "3.0.0-0"],
      ["3.0.0-rc.2", "3.0.0-rc.10"], ["3.0.0-0", "3.0.0-1"],
      ["3.0.0-999", "3.0.0-a"], ["3.0.0-A", "3.0.0-a"],
      ["3.0.0--", "3.0.0-A"], ["3.0.0-01a", "3.0.0-1a"],
      ["3.0.0-alpha", "3.0.0-alpha.0"], ["3.0.0-rc.1", "3.0.0"],
      ["9007199254740992.0.0", "9007199254740993.0.0"],
      ["1.9007199254740992.0", "1.9007199254740993.0"],
      ["1.0.9007199254740992", "1.0.9007199254740993"],
      ["1.0.0-9007199254740992", "1.0.0-9007199254740993"],
      [`${huge}.0.0`, `1${"0".repeat(400)}.0.0`],
      [`1.0.0-${huge}`, `1.0.0-1${"0".repeat(400)}`],
      [`1.0.0-${huge}`, "1.0.0-a"],
    ]) {
      assert.equal(compareSemver(older, newer), -1, `${older} < ${newer}`);
      assert.equal(compareSemver(newer, older), 1, `${newer} > ${older}`);
    }
  });

  await test("SemVer ignores build metadata, including leading zeros and hyphens", () => {
    const { compareSemver } = load();
    for (const version of ["0.0.0", "3.0.0", "3.0.0-rc.1", "1.0.0-0", "1.0.0-01a.-"]) {
      assert.equal(compareSemver(version, version), 0);
      assert.equal(compareSemver(`${version}+001.build-5`, `${version}+other.000`), 0);
      assert.equal(compareSemver(`${version}+-`, version), 0);
      assert.equal(compareSemver(version, `${version}+0`), 0);
    }
    assert.equal(compareSemver("3.0.0-rc.2+zzz", "3.0.0-rc.10+aaa"), -1);
    assert.equal(compareSemver("3.0.0+001", "3.0.0-rc.1+999"), 1);
  });

  await test("SemVer rejects malformed or missing versions on either side instead of coercing zero", () => {
    const { compareSemver } = load();
    for (const invalid of [
      undefined, null, false, 0, 3, {}, [], "", " ", "v3.0.0", "=3.0.0",
      "3", "3.0", "3.0.0.0", "03.0.0", "3.00.0", "3.0.00",
      "-3.0.0", "3.-1.0", "3.0.-1", "3.0.x", "3.0.0junk",
      "3.0.0-", "3.0.0-01", "3.0.0-rc.01", "3.0.0-rc..1", "3.0.0-.rc", "3.0.0-rc.",
      "3.0.0+", "3.0.0+build..1", "3.0.0+.build", "3.0.0+build.", "3.0.0+a+b",
      "3.0.0-rc_1", "3.0.0+build_1", "3.0.0-rç", " 3.0.0", "3.0.0 ", "3.0.0\n",
    ]) {
      for (const [left, right, side] of [[invalid, "0.0.0", "left"], ["0.0.0", invalid, "right"]]) {
        assert.throws(() => compareSemver(left, right), {
          code: "MACCA_VERSION_INVALID", message: new RegExp(`Invalid semantic version for ${side} version: expected MAJOR.MINOR.PATCH`),
        });
      }
    }
  });

  await test("downgrade guard accepts equal metadata and valid legacy versions, rejects invalid lock versions", () => {
    const agents = path.join(root, "semver guard", ".agents");
    const installedPath = path.join(agents, "macca-lock.json");
    const packagedPath = path.join(repo, ".agents", "macca-lock.json");
    let packagedVersion = "3.0.0-rc.1";
    const mocked = readOnlyFs();
    mocked.readFileSync = (candidate, ...args) => candidate === packagedPath
      ? JSON.stringify({ version: packagedVersion }) : fs.readFileSync(candidate, ...args);
    const instance = load({ "node:fs": mocked });
    instance.assertPackageNotOlderThanInstalled(agents);
    for (const installedVersion of ["0.0.0", "2.0.0", "3.0.0-beta.11", "3.0.0-rc.1+001"]) {
      json(installedPath, { version: installedVersion });
      instance.assertPackageNotOlderThanInstalled(agents);
    }
    for (const side of ["packaged", "installed"]) {
      for (const invalid of [undefined, null, 3, "", "3.0", "3.0.0-01"]) {
        packagedVersion = side === "packaged" ? invalid : "3.0.0-rc.1";
        json(installedPath, { version: side === "installed" ? invalid : "2.0.0" });
        const before = snapshot(agents);
        assert.throws(() => instance.assertPackageNotOlderThanInstalled(agents), (error) => {
          assert.equal(error.code, "MACCA_VERSION_INVALID");
          assert.match(error.message, /Cannot verify MACCA downgrade safety/);
          assert.match(error.message, new RegExp(`${side === "packaged" ? "left" : "right"} version`));
          assert.ok(error.message.includes(packagedPath));
          assert.ok(error.message.includes(installedPath));
          return true;
        });
        assert.deepEqual(snapshot(agents), before);
      }
    }
  });

  await test("CLI install and upgrade refuse stable-to-RC downgrade, even forced, without modifying files", () => {
    const fixture = path.join(root, "semver package");
    const fixtureCli = path.join(fixture, "bin", "macca-method.js");
    write(fixtureCli, fs.readFileSync(cli));
    fs.cpSync(path.join(repo, ".agents"), path.join(fixture, ".agents"), { recursive: true });
    const packagedPath = path.join(fixture, ".agents", "macca-lock.json");
    const lock = JSON.parse(fs.readFileSync(packagedPath, "utf8"));
    json(packagedPath, { ...lock, version: "3.0.0" });
    const project = path.join(root, "semver stable install");
    run(project, ["install", "--yes"], 0, fixtureCli);
    const installedPath = path.join(project, ".agents", "macca-lock.json");
    assert.equal(JSON.parse(fs.readFileSync(installedPath, "utf8")).version, "3.0.0");
    json(packagedPath, { ...lock, version: "3.0.0-rc.1" });
    const before = snapshot(project);
    const packageBefore = snapshot(fixture);
    for (const command of ["install", "upgrade"]) {
      for (const flags of [[], ["--force"]]) {
        const output = run(project, [command, "--yes", ...flags], 1, fixtureCli);
        assert.match(output, /Refusing to downgrade MACCA from 3\.0\.0 to 3\.0\.0-rc\.1/);
        assert.match(output, /not started; no files changed/);
        assert.deepEqual(snapshot(project), before);
        assert.deepEqual(snapshot(fixture), packageBefore);
      }
    }
    for (const side of ["packaged", "installed"]) {
      for (const invalid of [undefined, 3, "3.0.0-01"]) {
        json(packagedPath, { ...lock, version: side === "packaged" ? invalid : "3.0.0-rc.1" });
        json(installedPath, { ...lock, version: side === "installed" ? invalid : "3.0.0" });
        const invalidBefore = snapshot(project);
        for (const command of ["install", "upgrade"]) {
          const output = run(project, [command, "--yes", "--force"], 1, fixtureCli);
          assert.match(output, /MACCA_VERSION_INVALID/);
          assert.match(output, /Cannot verify MACCA downgrade safety/);
          assert.match(output, /not started; no files changed/);
          assert.deepEqual(snapshot(project), invalidBefore);
        }
      }
    }
  });

  await test("version preflight retains even an empty committed journal on stable-to-RC refusal", () => {
    const fixture = versionFixture("committed version preflight");
    json(path.join(fixture.project, ".agents", "macca-lock.json"), { version: "3.0.0" });
    json(path.join(fixture.project, ".agents", "macca-transaction.json"), {
      version: 2, transactionId: "1-1-abcdef", phase: "committed", entries: [],
    });
    assertVersionRefusal(fixture, /Refusing to downgrade MACCA from 3\.0\.0 to 3\.0\.0-rc\.1/);
  });

  await test("version preflight checks rollback backups with absent or older visible locks in v1 and v2 journals", () => {
    const fixture = versionFixture("rollback version preflight");
    for (const version of [1, 2]) {
      for (const current of [undefined, "2.0.0"]) {
        pendingLock(fixture.project, { version, current, backup: "3.0.0" });
        assertVersionRefusal(fixture, /Refusing to downgrade MACCA from 3\.0\.0/);
      }
    }
  });

  await test("version preflight preserves newer staged locks and committed backup evidence", () => {
    const fixture = versionFixture("staged version preflight");
    for (const version of [1, 2]) {
      pendingLock(fixture.project, { version, stage: "3.0.0" });
      assertVersionRefusal(fixture, /Refusing to downgrade MACCA from 3\.0\.0/);
    }
    pendingLock(fixture.project, { current: "2.0.0", backup: "3.0.0", phase: "committed" });
    assertVersionRefusal(fixture, /Refusing to downgrade MACCA from 3\.0\.0/);
  });

  await test("invalid package, visible, backup and staged versions fail before journal mutation", () => {
    const fixture = versionFixture("invalid recovery version");
    for (const invalid of [null, "3.0.0-01"]) {
      for (const location of ["package", "current", "backup", "stage"]) {
        fixture.setVersion(location === "package" ? invalid : "3.0.0-rc.1");
        pendingLock(fixture.project, {
          current: location === "current" ? invalid : undefined,
          backup: location === "backup" ? invalid : undefined,
          stage: location === "stage" ? invalid : undefined,
        });
        assertVersionRefusal(fixture, /MACCA_VERSION_INVALID/);
      }
    }
    const missing = path.join(root, "invalid version missing target");
    fixture.setVersion("3.0");
    assert.match(run(missing, ["install", "--yes"], 1, fixture.executable), /MACCA_VERSION_INVALID/);
    assert.equal(snapshot(missing), null);
  });

  await test("a newer package recovers valid legacy and current lock journals before installing or upgrading", () => {
    const fixture = versionFixture("allowed recovery version");
    fixture.setVersion("4.0.0");
    for (const command of ["install", "upgrade"]) {
      for (const version of [1, 2]) {
        for (const current of [undefined, "2.0.0"]) {
          const { journalPath, entry } = pendingLock(fixture.project, { version, current, backup: "3.0.0" });
          run(fixture.project, [command, "--yes", "--force"], 0, fixture.executable);
          assert.ok(!fs.existsSync(journalPath));
          assert.ok(!fs.existsSync(entry.backupPath));
          assert.equal(JSON.parse(fs.readFileSync(entry.targetPath, "utf8")).version, "4.0.0");
        }
        const { journalPath, entry } = pendingLock(fixture.project, { version, stage: "3.0.0" });
        run(fixture.project, [command, "--yes", "--force"], 0, fixture.executable);
        assert.ok(!fs.existsSync(journalPath));
        assert.ok(!fs.existsSync(entry.stagingPath));
        assert.equal(JSON.parse(fs.readFileSync(entry.targetPath, "utf8")).version, "4.0.0");
      }
    }
  });

  await test("version preflight validates journal whitelist and hashes before reading recovery lock metadata", () => {
    const project = path.join(root, "preflight read boundaries");
    const agents = path.join(project, ".agents");
    for (const field of ["backupPath", "stagingPath"]) {
      const { journalPath, entry } = pendingLock(project, { backup: "0.0.0", stage: "0.0.0" });
      const original = entry[field];
      const outside = path.join(root, "external-lock.json");
      json(outside, { version: "99.0.0" });
      entry[field] = outside;
      json(journalPath, { version: 2, transactionId: "1-1-abcdef", phase: "committing", entries: [entry] });
      const mocked = readOnlyFs();
      mocked.readFileSync = (candidate, ...args) => {
        assert.notEqual(candidate, outside, "unvalidated recovery path must never be read");
        return fs.readFileSync(candidate, ...args);
      };
      assert.throws(() => load({ "node:fs": mocked }).assertPackageNotOlderThanInstalled(agents, true), /Invalid MACCA transaction (backup|staging) path/);
      entry[field] = original;
      json(journalPath, { version: 2, transactionId: "1-1-abcdef", phase: "committing", entries: [entry] });
      write(original, "not JSON; modified after journal snapshot");
      const before = snapshot(project);
      assert.throws(() => load({ "node:fs": readOnlyFs() }).assertPackageNotOlderThanInstalled(agents, true), /modified transaction backup|matching transaction hash/);
      assert.deepEqual(snapshot(project), before);
    }
    const { journalPath, entry } = pendingLock(project, { backup: "0.0.0" });
    entry.targetPath = path.join(project, "unmanaged.json");
    json(journalPath, { version: 2, transactionId: "1-1-abcdef", phase: "committing", entries: [entry] });
    assert.throws(() => load({ "node:fs": readOnlyFs() }).assertPackageNotOlderThanInstalled(agents, true), /not a managed MACCA path/);
  });

  await test("Windows drive ancestors start at the parsed root; UNC/device paths are rejected", () => {
    const seen = [];
    const mock = { lstatSync: (candidate) => { seen.push(candidate); return { isSymbolicLink: () => false }; } };
    const instance = load({ "node:path": path.win32, "node:fs": mock });
    assert.equal(instance.assertSafeTargetDirectory("C:\\Users\\Name\\project"), "C:\\Users\\Name\\project");
    assert.deepEqual(seen, ["C:\\", "C:\\Users", "C:\\Users\\Name", "C:\\Users\\Name\\project"]);
    seen.length = 0;
    for (const candidate of ["\\\\server\\share\\app", "\\\\?\\C:\\app", "\\\\.\\C:\\app", "//server/share/app"]) {
      assert.throws(() => instance.assertSafeTargetDirectory(candidate), /UNC\/device.*local drive/);
    }
    assert.deepEqual(seen, []);
  });

  await test("root containment accepts descendants and rejects sibling prefixes", () => {
    const instance = load();
    instance.assertSafeProjectPath(path.parse(root).root, root);
    assert.throws(() => instance.assertSafeProjectPath(path.join(root, "app"), path.join(root, "app-other")), /outside target/);
  });

  await test("buffered answers share one readline interface and documents default to communication", async () => {
    let creations = 0;
    const prompt = fakePrompt((interface_, number) => {
      if (number === 1) for (const line of ["codex", "English", ""]) interface_.emit("line", line);
    });
    const instance = load({ "node:readline": { createInterface: () => { creations += 1; return prompt; } } });
    const project = path.join(root, "buffered answers 日本語");
    await instance.runInstall({ tools: [], directory: project });
    assert.equal(creations, 1);
    assert.equal(prompt.questions.length, 3);
    assert.doesNotMatch(prompt.questions.join(" "), /dipanggil|Nama project/);
    const config = readConfig(project);
    assert.equal(config.languagePreferences.communication.normalized, "english");
    assert.equal(config.languagePreferences.documents.normalized, "english");
    assert.ok(!Object.hasOwn(config, "name"));
    assert.ok(!Object.hasOwn(config, "project"));
    assert.equal(prompt.eventNames().length, 0);
    assert.equal(prompt.input.eventNames().length, 0);
    assert.match(instance.output(), /Restart.*setup-macca-method skill/);
  });

  for (const event of ["SIGINT", "close", "error", "input-error"]) {
    for (const stage of [1, 2, 3]) {
      await test(`${event} at prompt ${stage} settles, cleans listeners and retains pending journal`, async () => {
        const project = path.join(root, `cancel-${event}-${stage}`);
        const journal = path.join(project, ".agents", "macca-transaction.json");
        json(journal, { intentionally: "invalid pending journal must not be recovered" });
        const before = snapshot(project);
        const prompt = fakePrompt((interface_, number) => {
          if (number !== stage) interface_.emit("line", number === 1 ? "codex" : "English");
          else if (event === "input-error") interface_.input.emit("error", new Error("private input details"));
          else interface_.emit(event, new Error("private input details"));
        });
        const instance = load({ "node:readline": { createInterface: () => prompt }, "node:fs": readOnlyFs() });
        await assert.rejects(instance.runInstall({ tools: [], directory: project }), (error) => {
          instance.exitWithError(error);
          assert.equal(instance.process.exitCode, ["SIGINT", "close"].includes(event) ? 130 : 1);
          return true;
        });
        assert.match(instance.output(), /not started; no files changed by this attempt/);
        assert.match(instance.output(), /Pending transaction journal retained/);
        assert.doesNotMatch(instance.output(), /private input details/);
        assert.deepEqual(snapshot(project), before);
        assert.equal(prompt.eventNames().length, 0);
        assert.equal(prompt.input.eventNames().length, 0);
      });
    }
  }

  await test("closed readline between questions rejects the next question", async () => {
    const instance = load();
    const prompt = fakePrompt((interface_) => interface_.emit("line", "codex"));
    assert.equal(await instance.askQuestion(prompt, "tools"), "codex");
    prompt.emit("close");
    await assert.rejects(instance.askQuestion(prompt, "language"), { code: "MACCA_CANCELLED" });
    instance.dispose(prompt);
    assert.equal(prompt.eventNames().length, 0);
  });

  await test("non-TTY install does not create its missing target", () => {
    const project = path.join(root, "non tty missing");
    const output = run(project, ["install"], 1);
    assert.match(output, /requires a TTY/);
    assert.match(output, /not started/);
    assert.equal(snapshot(project), null);
  });

  await test("--yes defaults documents to English, preserves all settings and unknown fields on rerun", () => {
    const project = path.join(root, "flags path Ω");
    run(project, ["install", "--yes", "--tool", "cursor", "--communication-language", "English", "--name", "Tester", "--project", "Demo"]);
    const config = readConfig(project);
    assert.equal(config.languagePreferences.documents.normalized, "english");
    config.extension = { token: "secret-extension-value", nested: [1, 2] };
    config.languagePreferences.documents.extra = { keep: true };
    config.codeReviewPreferences = { fixMode: "report-first" };
    Object.defineProperty(config, "__proto__", { value: { unknown: true }, enumerable: true });
    json(configPath(project), config);
    run(project, ["install", "--yes"]);
    assert.deepEqual(readConfig(project), config);
    assert.equal(fs.readFileSync(path.join(project, ".agents", "macca-tools.txt"), "utf8"), "cursor\n");
    run(project, ["upgrade"]);
    assert.deepEqual(readConfig(project), config);
    const output = run(project, ["doctor"]);
    assert.doesNotMatch(output, /secret-extension-value/);
  });

  await test("legacy document flags override the same-language default", () => {
    const project = path.join(root, "language override");
    run(project, ["install", "-y", "-t", "codex", "--communication-language=en", "--documents-language=Indonesia"]);
    assert.equal(readConfig(project).languagePreferences.documents.normalized, "indonesian");
  });

  for (const bad of [
    { languagePreferences: { communication: { raw: { token: "SECRET" } } } },
    { developerPreferences: { workMode: "SECRET" } },
    { additionalSkills: [{ name: "valid", paths: { SECRET: 7 } }] },
    { availableMCPs: ["ok", { token: "SECRET" }] },
    { brainstormPreferences: { recommendations: "SECRET" } },
    { codeReviewPreferences: { fixMode: "SECRET" } },
    ["SECRET"],
  ]) {
    await test(`invalid config ${passed} rejects install/upgrade even --force before recovery`, async () => {
      const project = path.join(root, `invalid-${passed}`);
      json(configPath(project), bad);
      json(path.join(project, ".agents", "macca-transaction.json"), { pending: true });
      const before = snapshot(project);
      for (const command of ["install", "upgrade"]) {
        const output = run(project, [command, "--yes", "--force"], 1);
        assert.match(output, /MACCA_CONFIG_INVALID/);
        assert.match(output, /not started/);
        assert.doesNotMatch(output, /SECRET/);
        assert.deepEqual(snapshot(project), before);
      }
      const instance = load({ "node:fs": readOnlyFs() });
      assert.throws(() => instance.applyInstall(project, ["codex"], {}, { force: true }), { code: "MACCA_CONFIG_INVALID" });
      assert.throws(() => instance.applyUpgrade(project, { force: true }), { code: "MACCA_CONFIG_INVALID" });
    });
  }

  await test("malformed JSON errors never expose source excerpts", () => {
    const project = path.join(root, "malformed");
    write(configPath(project), '{"token":"SUPER_SECRET" trailing junk}');
    for (const command of ["install", "upgrade", "doctor"]) {
      const output = run(project, [command, "--yes", "--force"], 1);
      assert.match(output, /valid JSON/);
      assert.doesNotMatch(output, /SUPER_SECRET/);
    }
  });

  await test("new merged config is validated before mkdir or writes", () => {
    const instance = load({ "node:fs": readOnlyFs() });
    const project = path.join(root, "bad supplied metadata");
    assert.throws(() => instance.applyInstall(project, ["codex"], { name: 42 }), { code: "MACCA_CONFIG_INVALID" });
    assert.equal(snapshot(project), null);
  });

  await test("Node <22 rejects mutation; doctor fails unsupported and warns for unverified newer runtime", async () => {
    const project = path.join(root, "unsupported");
    const instance = load({ "node:fs": readOnlyFs() }, "20.19.0");
    await assert.rejects(instance.runInstall({ tools: [], yes: true, directory: project }), { code: "MACCA_NODE_UNSUPPORTED" });
    assert.throws(() => instance.runUpgrade({ directory: project }), { code: "MACCA_NODE_UNSUPPORTED" });
    instance.runDoctor({ directory: project });
    assert.equal(instance.process.exitCode, 1);
    assert.match(instance.output(), /Unsupported Node/);
    const newer = load({ "node:fs": readOnlyFs() }, "26.0.0");
    newer.runDoctor({ directory: path.join(root, "flags path Ω") });
    assert.equal(newer.process.exitCode, 0);
    assert.match(newer.output(), /runtime is unverified/);
  });

  await test("doctor is read-only for healthy, missing, damaged, drifted and interrupted installations", () => {
    const project = path.join(root, "doctor");
    run(project, ["install", "--yes", "--tool", "copilot,codex"]);
    const check = (status, pattern) => {
      const before = snapshot(project);
      const instance = load({ "node:fs": readOnlyFs() });
      instance.runDoctor({ directory: project });
      assert.equal(instance.process.exitCode, status, instance.output());
      assert.match(instance.output(), pattern);
      assert.deepEqual(snapshot(project), before);
    };
    check(0, /0 failure\(s\)/);
    const asset = path.join(project, ".github", "skills", "bug-fix", "assets", "bug-log.template.md");
    assert.ok(fs.existsSync(asset));
    const content = fs.readFileSync(asset);
    fs.unlinkSync(asset);
    check(1, /Required installed payload file is missing/);
    write(asset, content);
    fs.appendFileSync(asset, "\nlocal change\n");
    check(0, /Local skill drift/);
    write(asset, content);
    const state = path.join(project, ".agents", "macca-state.json");
    const stateContent = fs.readFileSync(state);
    fs.unlinkSync(state);
    check(0, /state is absent/);
    write(state, stateContent);
    const manifest = path.join(project, ".agents", "macca-managed-skills.txt");
    const manifestContent = fs.readFileSync(manifest);
    fs.unlinkSync(manifest);
    check(1, /ENOENT/);
    write(manifest, manifestContent);
    const lockPath = path.join(project, ".agents", "macca-lock.json");
    const lockContent = fs.readFileSync(lockPath);
    const lock = JSON.parse(lockContent);
    lock.skills = ["_shared"];
    json(lockPath, lock);
    check(1, /manifest disagree/);
    write(lockPath, lockContent);
    json(path.join(project, ".agents", "macca-transaction.json"), { pending: true });
    check(1, /Interrupted transaction retained/);
    const missing = path.join(root, "doctor missing", "nested");
    const before = snapshot(root);
    run(missing, ["doctor"], 1);
    assert.deepEqual(snapshot(root), before);
  });

  await test("marker reader distinguishes absent, unsafe and unreadable files without reading special files", () => {
    const skill = path.join(root, "mock marker");
    const marker = path.join(skill, ".macca-owned.json");
    let reads = 0;
    const mocked = readOnlyFs();
    mocked.readFileSync = () => { reads += 1; throw new Error("Marker must not be read"); };
    for (const kind of ["symlink", "fifo", "directory", "device"]) {
      mocked.lstatSync = (candidate) => {
        assert.equal(candidate, marker);
        return { isSymbolicLink: () => kind === "symlink", isFile: () => false };
      };
      assert.throws(() => load({ "node:fs": mocked }).readOwnershipMarker(skill), { code: "MACCA_UNSAFE_MARKER", path: marker });
    }
    mocked.lstatSync = () => { throw Object.assign(new Error("Absent"), { code: "ENOENT" }); };
    assert.equal(load({ "node:fs": mocked }).readOwnershipMarker(skill), null);
    mocked.lstatSync = () => { throw Object.assign(new Error("Denied"), { code: "EACCES" }); };
    assert.throws(() => load({ "node:fs": mocked }).readOwnershipMarker(skill), { code: "EACCES" });
    assert.equal(reads, 0);
  });

  await test("doctor rejects mocked special markers without reading them or mutating files on every platform", () => {
    const project = path.join(root, "doctor mock marker");
    run(project, ["install", "--yes"]);
    const marker = path.join(project, ".agents", "skills", "developer", ".macca-owned.json");
    const before = snapshot(project);
    for (const kind of ["symlink", "fifo", "directory", "device"]) {
      let reads = 0;
      const mocked = readOnlyFs();
      mocked.lstatSync = (candidate, ...args) => candidate === marker
        ? { isSymbolicLink: () => kind === "symlink", isFile: () => false }
        : fs.lstatSync(candidate, ...args);
      mocked.readFileSync = (candidate, ...args) => {
        if (candidate === marker) { reads += 1; throw new Error("PRIVATE_MARKER_DATA"); }
        return fs.readFileSync(candidate, ...args);
      };
      const instance = load({ "node:fs": mocked });
      instance.runDoctor({ directory: project });
      assert.equal(instance.process.exitCode, 1, instance.output());
      assert.match(instance.output(), /FAIL: Unsafe ownership marker/);
      assert.doesNotMatch(instance.output(), /PRIVATE_MARKER_DATA/);
      assert.equal(reads, 0);
      assert.deepEqual(snapshot(project), before);
    }
  });

  await test("doctor does not follow an ownership marker symlink to external JSON", () => {
    const project = path.join(root, "doctor marker symlink");
    run(project, ["install", "--yes"]);
    const marker = path.join(project, ".agents", "skills", "developer", ".macca-owned.json");
    const outside = path.join(root, "external marker.json");
    json(outside, { owner: "macca-method", skill: "developer", private: "EXTERNAL_SECRET" });
    fs.unlinkSync(marker);
    try { fs.symlinkSync(outside, marker, "file"); } catch (error) {
      if (process.platform === "win32" && ["EPERM", "EACCES"].includes(error.code)) {
        process.stdout.write("  SKIP: file symlink privilege unavailable; mocked symlink coverage passed\n");
        return;
      }
      throw error;
    }
    const before = snapshot(root);
    let forbiddenReads = 0;
    const mocked = readOnlyFs();
    mocked.readFileSync = (candidate, ...args) => {
      if (candidate === marker || candidate === outside) {
        forbiddenReads += 1;
        throw new Error("EXTERNAL_SECRET");
      }
      return fs.readFileSync(candidate, ...args);
    };
    const instance = load({ "node:fs": mocked });
    instance.runDoctor({ directory: project });
    assert.equal(instance.process.exitCode, 1);
    assert.match(instance.output(), /FAIL: Unsafe ownership marker/);
    assert.doesNotMatch(instance.output(), /EXTERNAL_SECRET/);
    assert.equal(forbiddenReads, 0);
    assert.match(run(project, ["doctor"], 1), /Unsafe ownership marker/);
    assert.deepEqual(snapshot(root), before);
  });

  await test("doctor rejects a real Linux FIFO marker without blocking", () => {
    if (process.platform !== "linux") {
      process.stdout.write("  SKIP: real FIFO requires Linux; mocked special-file coverage passed\n");
      return;
    }
    const project = path.join(root, "doctor fifo marker");
    run(project, ["install", "--yes"]);
    const marker = path.join(project, ".agents", "skills", "developer", ".macca-owned.json");
    assert.ok(fs.statSync(path.dirname(marker)).isDirectory());
    fs.unlinkSync(marker);
    const made = spawnSync("mkfifo", [marker], { encoding: "utf8", timeout: 5000 });
    if (["ENOENT", "EACCES", "EPERM"].includes(made.error?.code)) {
      process.stdout.write("  SKIP: mkfifo unavailable or disallowed; mocked special-file coverage passed\n");
      return;
    }
    assert.ifError(made.error);
    assert.equal(made.status, 0, made.stderr);
    assert.ok(fs.lstatSync(marker).isFIFO());
    const before = snapshot(project);
    const result = spawnSync(process.execPath, [cli, "doctor", "--directory", project], {
      encoding: "utf8", timeout: 5000,
    });
    assert.ifError(result.error);
    assert.equal(result.status, 1, `${result.stdout}${result.stderr}`);
    assert.match(result.stdout, /FAIL: Unsafe ownership marker/);
    assert.deepEqual(snapshot(project), before);
  });

  for (const [name, payloadHash] of [
    ["missing", undefined], ["mismatched", "0".repeat(64)],
    ["malformed", "PRIVATE_INVALID_HASH"], ["non-string", { secret: "PRIVATE_INVALID_HASH" }],
  ]) {
    await test(`doctor warns for ${name} marker hash and predicts ordinary upgrade refusal without repair`, () => {
      const project = path.join(root, `doctor marker hash ${name}`);
      run(project, ["install", "--yes"]);
      const skill = path.join(project, ".agents", "skills", "developer");
      const markerPath = path.join(skill, ".macca-owned.json");
      const marker = JSON.parse(fs.readFileSync(markerPath, "utf8"));
      marker.payloadHash = payloadHash;
      marker.private = "PRIVATE_MARKER_VALUE";
      json(markerPath, marker);
      const before = snapshot(project);
      const instance = load({ "node:fs": readOnlyFs() }, "22.0.0");
      instance.runDoctor({ directory: project });
      assert.equal(instance.process.exitCode, 0, instance.output());
      assert.match(instance.output(), /WARN: Ownership marker payload fingerprint/);
      assert.match(instance.output(), /ordinary upgrade will refuse.*Back up and review.*does not repair/);
      assert.match(instance.output(), /0 failure\(s\), 1 warning\(s\)/);
      assert.doesNotMatch(instance.output(), /PRIVATE_|0{64}/);
      assert.ok(instance.output().includes(JSON.stringify(markerPath)));
      assert.throws(() => instance.assertManagedDirectoryUnchanged(skill), /locally modified managed skill/);
      assert.deepEqual(snapshot(project), before);
    });
  }

  await test("symlinked ancestors and installed paths stay rejected with actionable realpath advice", () => {
    const actual = path.join(root, "real");
    fs.mkdirSync(actual);
    const alias = path.join(root, "alias");
    try { fs.symlinkSync(actual, alias, "junction"); } catch (error) {
      if (process.platform === "win32" && ["EPERM", "EACCES"].includes(error.code)) {
        process.stdout.write("  SKIP: symlink privilege unavailable\n");
        return;
      }
      throw error;
    }
    const output = run(alias, ["install", "--yes"], 1);
    assert.match(output, /symlinked target project ancestor/);
    assert.match(output, /real path.*macOS aliases/);
    run(alias, ["doctor"], 1);
    assert.deepEqual(snapshot(actual), []);
    const broken = path.join(root, "broken-link");
    fs.symlinkSync(path.join(root, "absent-link-target"), broken, "junction");
    run(broken, ["install", "--yes"], 1);
    assert.equal(snapshot(path.join(root, "absent-link-target")), null);
  });

  await test("extra positional arguments are rejected and help lists doctor", () => {
    const project = path.join(root, "stray");
    assert.match(run(project, ["install", "extra", "--yes"], 1), /Unexpected positional arguments/);
    assert.equal(snapshot(project), null);
    assert.match(run(project, ["--help"]), /doctor.*Read-only/);
  });

  await test("filesystem errors retain codes, paths, next steps and truthful stages", () => {
    for (const code of ["EACCES", "EPERM", "EBUSY", "ENOSPC", "ENOENT"]) {
      for (const stage of ["not started", "writing", "recovery"]) {
        const instance = load();
        const target = path.join(root, "error project");
        Object.assign(instance.state(), { targetDir: target, stage, recoveryChanged: stage === "recovery" });
        instance.exitWithError(Object.assign(new Error("injected filesystem failure"), { code, path: target }));
        const output = instance.output();
        assert.match(output, new RegExp(`Error \\[${code}\\]`));
        assert.ok(output.includes(JSON.stringify(target)));
        assert.match(output, /Next:/);
        assert.doesNotMatch(output, /sudo|reset/);
        if (stage === "not started") assert.match(output, /no files changed by this attempt/);
        else assert.match(output, /files may have changed/);
        if (stage === "recovery") assert.match(output, /recovery may have changed files/);
      }
    }
  });

  await test("a failure after actual recovery reports changes rather than not started", () => {
    const project = path.join(root, "recovered then failed");
    run(project, ["install", "--yes"]);
    const journal = path.join(project, ".agents", "macca-transaction.json");
    json(journal, { version: 2, transactionId: "1-1-abcdef", phase: "committed", entries: [] });
    fs.appendFileSync(path.join(project, ".agents", "skills", "developer", "SKILL.md"), "\nlocal edit\n");
    const output = run(project, ["upgrade"], 1);
    assert.match(output, /recovery; files may have changed; recovery may have changed files/);
    assert.doesNotMatch(output, /not started|no files changed/);
    assert.ok(!fs.existsSync(journal));
  });

  await test("invalid rollback config is rejected before recovery mutates any path", () => {
    const project = path.join(root, "invalid rollback config");
    const instance = load();
    const target = configPath(project);
    json(target, { name: "valid visible config" });
    const transactionId = "1-1-abcdef";
    const backup = path.join(path.dirname(target), `.developer-config.json.macca-backup-${transactionId}`);
    json(backup, { availableMCPs: 42 });
    json(path.join(project, ".agents", "macca-transaction.json"), {
      version: 2, transactionId, phase: "committing", entries: [{
        targetPath: target, backupPath: backup, stagingPath: null, kind: "file", hadTarget: true,
        originalHash: instance.hashFile(backup), stagedHash: instance.hashFile(target),
      }],
    });
    const before = snapshot(project);
    const output = run(project, ["upgrade", "--force"], 1);
    assert.match(output, /MACCA_CONFIG_INVALID/);
    assert.match(output, /not started/);
    assert.deepEqual(snapshot(project), before);
  });

  await test("--yes preserves language settings restored from a config-only backup", () => {
    const project = path.join(root, "restore saved settings");
    run(project, ["install", "--yes", "--communication-language", "English"]);
    const saved = readConfig(project);
    const target = configPath(project);
    const transactionId = "1-1-abcdef";
    const backup = path.join(path.dirname(target), `.developer-config.json.macca-backup-${transactionId}`);
    fs.renameSync(target, backup);
    json(path.join(project, ".agents", "macca-transaction.json"), {
      version: 2, transactionId, phase: "committing", entries: [{
        targetPath: target, backupPath: backup, stagingPath: null, kind: "file", hadTarget: true,
        originalHash: load().hashFile(backup), stagedHash: null,
      }],
    });
    run(project, ["install", "--yes"]);
    assert.deepEqual(readConfig(project), saved);
  });

  await test("local drift suggests backup/review before destructive force", () => {
    const project = path.join(root, "local drift");
    run(project, ["install", "--yes"]);
    fs.appendFileSync(path.join(project, ".agents", "skills", "developer", "SKILL.md"), "\nlocal edit\n");
    const before = snapshot(project);
    const output = run(project, ["upgrade"], 1);
    assert.match(output, /locally modified managed skill/);
    assert.match(output, /Back up and review.*--force destructively/);
    assert.match(output, /not started/);
    assert.deepEqual(snapshot(project), before);
  });

  process.stdout.write(`CLI setup: ${passed} tests passed\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => fs.rmSync(root, { recursive: true, force: true }));
