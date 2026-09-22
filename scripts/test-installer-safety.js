#!/usr/bin/env node

"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { spawnSync } = require("node:child_process");

const repo = path.resolve(__dirname, "..");
const cliPath = path.join(repo, "bin", "macca-method.js");

function loadInstaller(overrides = {}) {
  const source = fs.readFileSync(cliPath, "utf8");
  assert.match(source, /main\(\);\s*$/);
  const sandbox = {
    require: (name) => overrides[name] || require(name),
    process,
    console,
    Buffer,
    __dirname: path.dirname(cliPath),
  };
  vm.runInNewContext(source.replace(/main\(\);\s*$/, ""), sandbox, {
    filename: cliPath,
  });
  return sandbox;
}

// Run the actual transaction code in a child and exit at an FS boundary. This
// leaves real journals/backups without adding a production crash-test hook.
if (process.argv[2] === "--crash") {
  const [, , , project, kind, phase] = process.argv;
  const watched = kind === "file"
    ? path.join(project, ".agents", "developer-config.json")
    : path.join(project, ".agents", "skills", "developer");
  const crashFs = Object.create(fs);
  crashFs.renameSync = (source, destination) => {
    fs.renameSync(source, destination);
    if (phase === "committing" && destination === watched && source.includes(".macca-stage-")) {
      process.exit(86);
    }
    if (phase === "committed" && destination.endsWith("macca-transaction.json") &&
        JSON.parse(fs.readFileSync(destination, "utf8")).phase === "committed") {
      process.exit(86);
    }
  };
  const instance = loadInstaller({ "node:fs": crashFs });
  if (kind === "file") instance.applyInstall(project, ["codex"], {}, { force: true });
  else instance.applyUpgrade(project, { force: true });
  throw new Error("Crash boundary was not reached");
}

const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "macca-safety-"));
let passed = 0;

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function json(file, value) {
  write(file, `${JSON.stringify(value, null, 2)}\n`);
}

function runCli(project, args, expectedError, executable = cliPath) {
  const result = spawnSync(process.execPath, [executable, ...args, "--directory", project], {
    encoding: "utf8",
    timeout: 60000,
  });
  assert.ifError(result.error);
  const output = `${result.stdout}${result.stderr}`;
  if (expectedError) {
    assert.equal(result.status, 1, output);
    assert.match(output, expectedError);
  } else {
    assert.equal(result.status, 0, output);
  }
  return output;
}

function install(name) {
  const project = path.join(root, name);
  runCli(project, ["install", "--yes", "--tool", "codex"]);
  return project;
}

function journalPath(project) {
  return path.join(project, ".agents", "macca-transaction.json");
}

function crash(project, kind = "directory", phase = "committing") {
  const result = spawnSync(process.execPath, [__filename, "--crash", project, kind, phase], {
    encoding: "utf8",
    timeout: 60000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 86, `${result.stdout}${result.stderr}`);
  const journal = JSON.parse(fs.readFileSync(journalPath(project), "utf8"));
  assert.equal(journal.version, 2);
  assert.equal(journal.phase, phase);
  for (const entry of journal.entries) {
    if (entry.hadTarget) assert.match(entry.originalHash, /^[a-f0-9]{64}$/);
    if (entry.stagingPath) assert.match(entry.stagedSnapshotHash, /^[a-f0-9]{64}$/);
  }
  return journal;
}

function test(name, action) {
  action();
  passed += 1;
  process.stdout.write(`OK: ${name}\n`);
}

function transactionEvidence(project, journal) {
  const installer = loadInstaller();
  return {
    journal: fs.readFileSync(journalPath(project), "utf8"),
    paths: journal.entries.map((entry) => [
      entry.targetPath, entry.backupPath, entry.stagingPath,
    ].map((candidate) => candidate && fs.existsSync(candidate)
      ? installer.hashSnapshot(candidate, entry.kind) : null)),
  };
}

try {
  for (const edit of ["target", "backup", "stage"]) {
    test(`ordinary rename failure preserves all evidence after a ${edit} edit`, () => {
      const project = install(`ordinary-${edit}`);
      const sentinel = path.join(project, "src", "user.js");
      write(sentinel, "unrelated user file");
      const injectedFs = Object.create(fs);
      let evidence;
      let journal;
      let failed = false;
      injectedFs.renameSync = (source, destination) => {
        if (!failed && destination.endsWith("macca-lock.json") && source.includes(".macca-stage-")) {
          failed = true;
          journal = JSON.parse(fs.readFileSync(journalPath(project), "utf8"));
          const entry = journal.entries.find((item) => item.targetPath.endsWith(`${path.sep}developer`));
          const candidate = edit === "stage"
            ? journal.entries.find((item) => item.stagingPath && fs.existsSync(item.stagingPath)).stagingPath
            : edit === "backup" ? entry.backupPath : entry.targetPath;
          if (fs.statSync(candidate).isDirectory()) write(path.join(candidate, "user.tmp", "notes.js"), "concurrent edit");
          else fs.appendFileSync(candidate, "\nconcurrent edit\n");
          evidence = transactionEvidence(project, journal);
          throw new Error("injected ordinary rename failure");
        }
        fs.renameSync(source, destination);
      };
      assert.throws(() => loadInstaller({ "node:fs": injectedFs }).applyUpgrade(project), /injected ordinary rename failure; Refusing recovery/);
      assert.ok(failed);
      assert.deepEqual(transactionEvidence(project, journal), evidence);
      runCli(project, ["upgrade", "--force"], /Refusing recovery/);
      assert.deepEqual(transactionEvidence(project, journal), evidence);
      assert.equal(fs.readFileSync(sentinel, "utf8"), "unrelated user file");
    });
  }

  for (const edit of ["target", "backup"]) {
    test(`successful promotion preserves all evidence when ${edit} changed before cleanup`, () => {
      const project = install(`cleanup-${edit}`);
      const injectedFs = Object.create(fs);
      let evidence;
      let journal;
      injectedFs.renameSync = (source, destination) => {
        fs.renameSync(source, destination);
        if (destination === journalPath(project)) {
          const current = JSON.parse(fs.readFileSync(destination, "utf8"));
          if (current.phase === "committed") {
            journal = current;
            const entry = journal.entries.find((item) => item.targetPath.endsWith(`${path.sep}developer`));
            write(path.join(edit === "backup" ? entry.backupPath : entry.targetPath, "notes.tmp"), "late edit");
            evidence = transactionEvidence(project, journal);
          }
        }
      };
      assert.throws(() => loadInstaller({ "node:fs": injectedFs }).applyUpgrade(project), /Refusing recovery/);
      assert.ok(evidence);
      assert.deepEqual(transactionEvidence(project, journal), evidence);
      runCli(project, ["upgrade", "--force"], /Refusing recovery/);
      assert.deepEqual(transactionEvidence(project, journal), evidence);
    });
  }

  test("clean ordinary rename failure restores the entire original project", () => {
    const project = install("ordinary-clean");
    write(path.join(project, "src", "user.js"), "unrelated");
    const installer = loadInstaller();
    const before = installer.hashSnapshot(project, "directory");
    const injectedFs = Object.create(fs);
    let failed = false;
    injectedFs.renameSync = (source, destination) => {
      if (!failed && destination.endsWith("macca-lock.json") && source.includes(".macca-stage-")) {
        failed = true;
        throw new Error("injected clean failure");
      }
      fs.renameSync(source, destination);
    };
    assert.throws(() => loadInstaller({ "node:fs": injectedFs }).applyUpgrade(project), /injected clean failure/);
    assert.ok(failed);
    assert.equal(installer.hashSnapshot(project, "directory"), before);
    runCli(project, ["upgrade"]);
  });

  for (const changed of [false, true]) {
    test(`pre-journal failure ${changed ? "preserves modified" : "cleans verified"} stages`, () => {
      const project = install(`pre-journal-${changed}`);
      const injectedFs = Object.create(fs);
      const installer = loadInstaller();
      const before = installer.hashSnapshot(project, "directory");
      let staged;
      let hashes;
      injectedFs.renameSync = (source, destination) => {
        if (destination === journalPath(project)) {
          const journal = JSON.parse(fs.readFileSync(source, "utf8"));
          staged = journal.entries.filter((entry) => entry.stagingPath);
          if (changed) write(path.join(staged.find((entry) => entry.kind === "directory").stagingPath, "notes.tmp"), "stage edit");
          hashes = staged.map((entry) => installer.hashSnapshot(entry.stagingPath, entry.kind));
          throw new Error("injected journal write failure");
        }
        fs.renameSync(source, destination);
      };
      assert.throws(() => loadInstaller({ "node:fs": injectedFs }).applyUpgrade(project), /injected journal write failure/);
      assert.ok(staged);
      assert.ok(!fs.existsSync(journalPath(project)));
      if (changed) {
        assert.deepEqual(staged.map((entry) => installer.hashSnapshot(entry.stagingPath, entry.kind)), hashes);
      } else {
        assert.equal(installer.hashSnapshot(project, "directory"), before);
      }
    });
  }

  test("partial pre-journal copies are preserved without guessing their snapshot", () => {
    const project = install("partial-stage");
    const injectedFs = Object.create(fs);
    let stage;
    injectedFs.cpSync = (source, destination, options) => {
      fs.cpSync(source, destination, options);
      stage = destination;
      write(path.join(stage, "user.tmp"), "partial copy edit");
      throw new Error("injected partial copy failure");
    };
    assert.throws(() => loadInstaller({ "node:fs": injectedFs }).applyUpgrade(project), /injected partial copy failure; Preserving incomplete transaction staging/);
    assert.equal(fs.readFileSync(path.join(stage, "user.tmp"), "utf8"), "partial copy edit");
    assert.ok(!fs.existsSync(journalPath(project)));
  });

  for (const phase of ["committing", "committed"]) {
    test(`interrupted ${phase} recovery can safely resume`, () => {
      const project = install(`retry-${phase}`);
      const installer = loadInstaller();
      const before = installer.hashSnapshot(project, "directory");
      const journal = crash(project, "file", phase);
      const injectedFs = Object.create(fs);
      let interrupted = false;
      if (phase === "committing") {
        injectedFs.renameSync = (source, destination) => {
          fs.renameSync(source, destination);
          if (!interrupted && source.includes(".macca-backup-")) {
            interrupted = true;
            throw new Error("injected recovery interruption");
          }
        };
      } else {
        injectedFs.rmSync = (candidate, options) => {
          fs.rmSync(candidate, options);
          if (!interrupted && candidate.includes(".macca-backup-")) {
            interrupted = true;
            throw new Error("injected recovery interruption");
          }
        };
      }
      assert.throws(() => loadInstaller({ "node:fs": injectedFs }).recoverInterruptedTransaction(project), /injected recovery interruption/);
      assert.ok(interrupted);
      assert.ok(fs.existsSync(journalPath(project)));
      installer.recoverInterruptedTransaction(project);
      installer.recoverInterruptedTransaction(project);
      assert.ok(!fs.existsSync(journalPath(project)));
      for (const entry of journal.entries) {
        assert.ok(!fs.existsSync(entry.backupPath));
        if (entry.stagingPath) assert.ok(!fs.existsSync(entry.stagingPath));
      }
      if (phase === "committing") assert.equal(installer.hashSnapshot(project, "directory"), before);
      runCli(project, ["upgrade"]);
    });
  }

  test("normal upgrades preserve ignored files, directories, caches, and empty directories", () => {
    const project = install("ignored-content");
    const skill = path.join(project, ".agents", "skills", "developer");
    const files = [
      "work.tmp/important-source.js",
      "draft.tmp",
      ".tmp-work/notes.md",
      "__pycache__/cache.pyc",
      "references/.pytest_cache/notes.txt",
      "references/.macca-owned.json",
    ];
    for (const file of files) write(path.join(skill, file), `user content: ${file}`);
    fs.mkdirSync(path.join(skill, "empty-work"));
    runCli(project, ["upgrade"]);
    runCli(project, ["upgrade"]);
    for (const file of files) {
      assert.equal(fs.readFileSync(path.join(skill, file), "utf8"), `user content: ${file}`);
    }
    assert.ok(fs.statSync(path.join(skill, "empty-work")).isDirectory());
    fs.appendFileSync(path.join(skill, "SKILL.md"), "\nlocal modification\n");
    runCli(project, ["upgrade"], /locally modified managed skill/);
  });

  for (const phase of ["committing", "committed"]) {
    for (const edit of ["payload", "ignored"]) {
      test(`${phase} recovery rejects post-crash ${edit} directory edits before cleanup`, () => {
        const project = install(`edited-${phase}-${edit}`);
        const journal = crash(project, "directory", phase);
        const entry = journal.entries.find((item) => item.targetPath.endsWith(`${path.sep}developer`));
        const edited = path.join(entry.targetPath, edit === "payload" ? "SKILL.md" : "work.tmp/notes.js");
        write(edited, "post-crash user edit");
        const journalBefore = fs.readFileSync(journalPath(project), "utf8");
        runCli(project, ["upgrade", "--force"], /Refusing recovery/);
        assert.equal(fs.readFileSync(edited, "utf8"), "post-crash user edit");
        assert.ok(fs.existsSync(entry.backupPath));
        assert.equal(fs.readFileSync(journalPath(project), "utf8"), journalBefore);
      });
    }
  }

  for (const kind of ["directory", "file"]) {
    for (const phase of ["committing", "committed"]) {
      test(`forced ${kind} ${phase} recovery accepts the actual pre-transaction snapshot`, () => {
        const project = install(`snapshot-${kind}-${phase}`);
        const original = kind === "directory"
          ? path.join(project, ".agents", "skills", "developer", "SKILL.md")
          : path.join(project, ".agents", "developer-config.json");
        const content = kind === "directory"
          ? `${fs.readFileSync(original, "utf8")}\nlegitimate pre-force edit\n`
          : '{"custom":"legitimate pre-force edit"}\n';
        write(original, content);
        const journal = crash(project, kind, phase);
        const entry = journal.entries.find((item) => item.targetPath === (
          kind === "directory" ? path.dirname(original) : original
        ));
        // A normal upgrade may reject restored local skill edits, but recovery
        // must already have restored the backup and removed its journal.
        runCli(project, ["upgrade"], kind === "directory" && phase === "committing"
          ? /locally modified managed skill/ : undefined);
        assert.ok(!fs.existsSync(journalPath(project)));
        assert.ok(!fs.existsSync(entry.backupPath));
        if (phase === "committing") assert.equal(fs.readFileSync(original, "utf8"), content);
        if (kind === "file") assert.equal(JSON.parse(fs.readFileSync(original, "utf8")).custom, "legitimate pre-force edit");
      });

      test(`forced ${kind} ${phase} recovery refuses later backup modifications`, () => {
        const project = install(`backup-edit-${kind}-${phase}`);
        const original = kind === "directory"
          ? path.join(project, ".agents", "skills", "developer", "SKILL.md")
          : path.join(project, ".agents", "developer-config.json");
        write(original, kind === "directory" ? "legitimate pre-force edit" : '{"local":true}\n');
        const journal = crash(project, kind, phase);
        const entry = journal.entries.find((item) => item.kind === kind &&
          item.targetPath.endsWith(kind === "directory" ? `${path.sep}developer` : "developer-config.json"));
        const edited = kind === "directory"
          ? path.join(entry.backupPath, "extra.tmp", "notes.txt") : entry.backupPath;
        write(edited, "backup edited after crash");
        runCli(project, ["upgrade", "--force"], /modified transaction backup/);
        assert.equal(fs.readFileSync(edited, "utf8"), "backup edited after crash");
        assert.ok(fs.existsSync(journalPath(project)));
        assert.ok(fs.existsSync(entry.targetPath));
      });
    }
  }

  test("legacy directory journals check staged payload hashes and retain ignored additions", () => {
    const project = install("legacy-journal");
    const journal = crash(project);
    journal.version = 1;
    for (const entry of journal.entries) {
      delete entry.originalHash;
      delete entry.stagedSnapshotHash;
    }
    json(journalPath(project), journal);
    const entry = journal.entries.find((item) => item.targetPath.endsWith(`${path.sep}developer`));
    const skillFile = path.join(entry.targetPath, "SKILL.md");
    const before = fs.readFileSync(skillFile, "utf8");
    write(skillFile, "legacy post-crash edit");
    runCli(project, ["upgrade"], /matching transaction evidence/);
    assert.equal(fs.readFileSync(skillFile, "utf8"), "legacy post-crash edit");
    write(skillFile, before);
    const ignored = path.join(entry.targetPath, "work.tmp", "notes.js");
    write(ignored, "keep legacy ignored content");
    runCli(project, ["upgrade"], /legacy recovery with unhashed directory content/);
    assert.ok(fs.existsSync(ignored));
    assert.ok(fs.existsSync(entry.backupPath));
  });

  test("legacy clean directory rollback still recovers", () => {
    const project = install("legacy-clean");
    const journal = crash(project);
    journal.version = 1;
    for (const entry of journal.entries) {
      delete entry.originalHash;
      delete entry.stagedSnapshotHash;
    }
    json(journalPath(project), journal);
    runCli(project, ["upgrade"]);
    assert.ok(!fs.existsSync(journalPath(project)));
  });

  test("legacy committed file backups without snapshots are preserved", () => {
    const project = install("legacy-committed");
    const journal = crash(project, "file", "committed");
    journal.version = 1;
    for (const entry of journal.entries) {
      delete entry.originalHash;
      delete entry.stagedSnapshotHash;
    }
    json(journalPath(project), journal);
    runCli(project, ["upgrade"], /legacy backup without a snapshot/);
    for (const entry of journal.entries) assert.ok(fs.existsSync(entry.backupPath));
    assert.ok(fs.existsSync(journalPath(project)));
  });

  test("v2 recovery requires both snapshots and rejects modified staged files", () => {
    const project = install("missing-snapshot");
    const journal = crash(project, "file");
    const entry = journal.entries.find((item) => item.targetPath.endsWith("developer-config.json"));
    for (const field of ["originalHash", "stagedSnapshotHash"]) {
      const hash = entry[field];
      delete entry[field];
      json(journalPath(project), journal);
      runCli(project, ["upgrade"], new RegExp(`${field} is missing or invalid`));
      assert.ok(fs.existsSync(entry.backupPath));
      entry[field] = hash;
    }
    json(journalPath(project), journal);
    write(entry.targetPath, '{"postCrashEdit":true}\n');
    runCli(project, ["upgrade", "--force"], /matching transaction hash/);
    assert.deepEqual(JSON.parse(fs.readFileSync(entry.targetPath, "utf8")), { postCrashEdit: true });
    assert.ok(fs.existsSync(entry.backupPath));
  });

  test("atomic JSON writes use private exclusive files and preserve colliding symlinks", () => {
    const directory = path.join(root, "atomic");
    fs.mkdirSync(directory);
    const destination = path.join(directory, "journal.json");
    const sentinel = path.join(directory, "sentinel.txt");
    write(sentinel, "do not overwrite");
    const oldTemporary = `${destination}.tmp-${process.pid}`;
    try {
      fs.symlinkSync(sentinel, oldTemporary);
    } catch (error) {
      if (process.platform !== "win32" || !["EPERM", "EACCES"].includes(error.code)) throw error;
      process.stdout.write("  Symlink fixture unavailable; exercising exclusive regular-file collision instead\n");
      write(oldTemporary, "old collision");
    }
    const atomicFs = Object.create(fs);
    let opened;
    atomicFs.openSync = (file, flags, mode) => {
      opened = file;
      assert.equal(flags, "wx");
      assert.equal(mode, 0o600);
      assert.match(file, /\.tmp-\d+-[a-f0-9]{32}$/);
      assert.notEqual(file, oldTemporary);
      return fs.openSync(file, flags, mode);
    };
    loadInstaller({ "node:fs": atomicFs }).writeJsonAtomic(destination, { safe: true });
    assert.deepEqual(JSON.parse(fs.readFileSync(destination, "utf8")), { safe: true });
    assert.equal(fs.readFileSync(sentinel, "utf8"), "do not overwrite");
    assert.ok(!fs.existsSync(opened));
    if (process.platform !== "win32") assert.equal(fs.statSync(destination).mode & 0o777, 0o600);

    atomicFs.openSync = (file, flags, mode) => {
      opened = file;
      if (fs.lstatSync(oldTemporary).isSymbolicLink()) fs.symlinkSync(sentinel, file);
      else write(file, "collision");
      return fs.openSync(file, flags, mode);
    };
    assert.throws(() => loadInstaller({ "node:fs": atomicFs }).writeJsonAtomic(destination, {}), { code: "EEXIST" });
    assert.ok(fs.existsSync(opened), "must not unlink a temp path we did not create");
    assert.equal(fs.readFileSync(sentinel, "utf8"), "do not overwrite");
    assert.deepEqual(JSON.parse(fs.readFileSync(destination, "utf8")), { safe: true });

    const failingFs = Object.create(fs);
    failingFs.renameSync = () => { throw new Error("rename failed"); };
    const before = fs.readdirSync(directory).sort();
    assert.throws(() => loadInstaller({ "node:fs": failingFs }).writeJsonAtomic(destination, {}), /rename failed/);
    assert.deepEqual(fs.readdirSync(directory).sort(), before, "owned temporary must be cleaned on failure");
  });

  for (const command of ["install", "upgrade"]) {
    test(`${command} retires only verified obsolete skills across previous tools and legacy roots`, () => {
      const fixture = path.join(root, `old-package-${command}`);
      const oldCli = path.join(fixture, "bin", "macca-method.js");
      write(oldCli, fs.readFileSync(cliPath));
      fs.cpSync(path.join(repo, ".agents", "skills"), path.join(fixture, ".agents", "skills"), { recursive: true });
      for (const name of ["macca-lock.json", "macca-managed-skills.txt", "legacy-payloads.json"]) {
        write(path.join(fixture, ".agents", name), fs.readFileSync(path.join(repo, ".agents", name)));
      }
      const obsolete = ["obsolete-owned", "obsolete-modified", "obsolete-unowned", "obsolete-ignored"];
      for (const name of obsolete) {
        write(path.join(fixture, ".agents", "skills", name, "SKILL.md"), `old payload for ${name}\n`);
      }
      fs.appendFileSync(path.join(fixture, ".agents", "macca-managed-skills.txt"), `\n${obsolete.join("\n")}\n`);
      const project = path.join(root, `retirement-${command}`);
      runCli(project, ["install", "--yes", "--tool", "copilot,opencode"], undefined, oldCli);
      const roots = [path.join(project, ".github", "skills"), path.join(project, ".opencode", "skills")];
      const legacy = path.join(project, ".opencode", "skill");
      for (const name of obsolete) {
        fs.cpSync(path.join(roots[1], name), path.join(legacy, name), { recursive: true });
      }
      roots.push(legacy);
      for (const skills of roots) {
        write(path.join(skills, "obsolete-modified", "SKILL.md"), "locally modified obsolete skill");
        fs.unlinkSync(path.join(skills, "obsolete-unowned", ".macca-owned.json"));
        write(path.join(skills, "obsolete-ignored", "notes.tmp"), "retained notes");
      }
      const unrelated = path.join(project, "src", "user.js");
      write(unrelated, "unrelated work");
      const preserved = roots.flatMap((skills) => obsolete.slice(1).map((name) => path.join(skills, name)));
      const installer = loadInstaller();
      const before = preserved.map((directory) => installer.hashSnapshot(directory, "directory"));
      runCli(project, command === "install"
        ? ["install", "--yes", "--tool", "codex", "--force"]
        : ["upgrade", "--force"]);
      assert.deepEqual(preserved.map((directory) => installer.hashSnapshot(directory, "directory")), before);
      assert.equal(fs.readFileSync(unrelated, "utf8"), "unrelated work");
      for (const skills of roots) {
        assert.ok(!fs.existsSync(path.join(skills, "obsolete-owned")));
        assert.equal(fs.readFileSync(path.join(skills, "obsolete-modified", "SKILL.md"), "utf8"), "locally modified obsolete skill");
        assert.ok(fs.existsSync(path.join(skills, "obsolete-unowned", "SKILL.md")));
        assert.equal(fs.readFileSync(path.join(skills, "obsolete-ignored", "notes.tmp"), "utf8"), "retained notes");
      }
      assert.deepEqual(fs.readFileSync(path.join(project, ".agents", "macca-tools.txt"), "utf8").trim().split("\n"), command === "install" ? ["copilot", "opencode", "codex"] : ["copilot", "opencode"]);
      for (const skills of roots.slice(0, 2)) assert.ok(fs.existsSync(path.join(skills, "developer", "SKILL.md")));
      if (command === "install") assert.ok(fs.existsSync(path.join(project, ".agents", "skills", "developer", "SKILL.md")));
    });
  }

  process.stdout.write(`Installer safety: ${passed} tests passed\n`);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
