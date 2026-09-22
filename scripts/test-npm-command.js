#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "lib", "npm-command.js"), "utf8");
let checks = 0;

function fixture({ platform = "win32", env = {}, execPath = "C:\\Node JS\\node.exe",
  files = [], links = {}, directories = [], where = [], whereError = false } = {}) {
  const calls = [];
  const module = { exports: {} };
  const filesystem = {
    realpathSync(candidate) {
      if (Object.hasOwn(links, candidate)) return links[candidate];
      if (files.includes(candidate) || directories.includes(candidate)) return candidate;
      throw new Error("ENOENT");
    },
    statSync(candidate) {
      if (!files.includes(candidate) && !directories.includes(candidate)) throw new Error("ENOENT");
      return { isFile: () => files.includes(candidate) };
    },
  };
  vm.runInNewContext(source, {
    module, process: { platform, env, execPath },
    require(name) {
      if (name === "node:path") return platform === "win32" ? path.win32 : path.posix;
      if (name === "node:fs") return filesystem;
      assert.equal(name, "node:child_process");
      return { execFileSync(command, args, options) {
        calls.push({ command, args: Array.from(args), options });
        assert.equal(command, "where.exe");
        assert.deepEqual(Array.from(args), ["npm"]);
        assert.equal(options.shell, false);
        if (whereError) throw new Error("where unavailable");
        return where.join("\r\n");
      } };
    },
  }, { filename: "npm-command.js" });
  return {
    calls,
    resolve(args = ["--version"]) {
      const result = module.exports.resolveNpmCommand(args);
      return { command: result.command, args: Array.from(result.args) };
    },
  };
}

function test(name, action) {
  action();
  checks += 1;
  process.stdout.write(`OK: ${name}\n`);
}

test("valid npm_execpath takes priority and preserves spaces and shell metacharacters", () => {
  const cli = "C:\\Tools & Packages\\npm\\bin\\npm-cli.js";
  const instance = fixture({ env: { npm_execpath: cli }, files: [cli] });
  const args = Object.freeze(["pack", "C:\\project space\\a & b", "$(literal)", '"quoted"']);
  assert.deepEqual(instance.resolve(args), { command: "C:\\Node JS\\node.exe", args: [cli, ...args] });
  assert.equal(instance.calls.length, 0);
});

test("invalid, missing, relative and other-manager npm_execpath fall back to Node-adjacent npm", () => {
  const cli = "C:\\Node JS\\node_modules\\npm\\bin\\npm-cli.js";
  for (const npmPath of [undefined, "C:\\absent\\npm-cli.js", "relative/npm-cli.js",
    "C:\\tools\\npm.cmd", "C:\\tools\\pnpm.cjs", "C:\\directory\\npm-cli.js"]) {
    const instance = fixture({
      env: { npm_execpath: npmPath }, files: [cli, "C:\\tools\\npm.cmd", "C:\\tools\\pnpm.cjs"],
      directories: ["C:\\directory\\npm-cli.js"],
    });
    assert.deepEqual(instance.resolve(), { command: "C:\\Node JS\\node.exe", args: [cli, "--version"] });
    assert.equal(instance.calls.length, 0);
  }
});

test("npm_execpath symlink resolves to npm CLI before execution", () => {
  const cli = "/opt/node/npm/bin/npm-cli.js";
  const instance = fixture({ platform: "linux", execPath: "/usr/bin/node",
    env: { npm_execpath: "/usr/bin/npm" }, files: [cli], links: { "/usr/bin/npm": cli } });
  assert.deepEqual(instance.resolve(), { command: "/usr/bin/node", args: [cli, "--version"] });
});

test("Node executable realpath discovers version-manager installation", () => {
  const cli = "C:\\versions\\22\\node_modules\\npm\\bin\\npm-cli.js";
  const instance = fixture({ files: [cli, "C:\\versions\\22\\node.exe"],
    links: { "C:\\Node JS\\node.exe": "C:\\versions\\22\\node.exe" } });
  assert.equal(instance.resolve().args[0], cli);
});

test("where npm discovers .cmd sibling payload without executing the shim", () => {
  const cli = "C:\\User Tools\\node_modules\\npm\\bin\\npm-cli.js";
  const instance = fixture({ files: [cli, "C:\\User Tools\\npm.cmd"],
    where: ["C:\\missing\\npm.cmd", "C:\\User Tools\\npm.cmd"] });
  assert.deepEqual(instance.resolve(), { command: "C:\\Node JS\\node.exe", args: [cli, "--version"] });
  assert.equal(instance.calls.length, 1);
});

test("where shim parents and real targets are inspected", () => {
  const cli = "C:\\npm home\\node_modules\\npm\\bin\\npm-cli.js";
  const instance = fixture({ files: [cli, "C:\\npm home\\bin\\npm.cmd"],
    links: { "C:\\shims\\npm.cmd": "C:\\npm home\\bin\\npm.cmd" },
    where: ["C:\\shims\\npm.cmd"] });
  assert.equal(instance.resolve().args[0], cli);
});

test("where realpath may directly identify npm CLI", () => {
  const cli = "C:\\npm\\bin\\npm-cli.js";
  const instance = fixture({ files: [cli], links: { "C:\\bin\\npm": cli }, where: ["C:\\bin\\npm"] });
  assert.equal(instance.resolve().args[0], cli);
});

test("POSIX lib/node_modules layout is supported", () => {
  const cli = "/opt/node/lib/node_modules/npm/bin/npm-cli.js";
  for (const platform of ["linux", "darwin"]) {
    const instance = fixture({ platform, execPath: "/opt/node/bin/node", files: [cli] });
    assert.deepEqual(instance.resolve(), { command: "/opt/node/bin/node", args: [cli, "--version"] });
    assert.equal(instance.calls.length, 0);
  }
});

test("POSIX binary fallback keeps literal arguments without a shell", () => {
  const instance = fixture({ platform: "linux", execPath: "/usr/bin/node" });
  const args = ["pack", "/tmp/a b;$(literal)"];
  const result = instance.resolve(args);
  assert.deepEqual(result, { command: "npm", args });
  assert.notEqual(result.args, args);
  assert.equal(instance.calls.length, 0);
});

test("Windows missing CLI fails descriptively, including failed where and bare shims", () => {
  for (const options of [{}, { whereError: true },
    { files: ["C:\\shim\\npm.cmd"], where: ["C:\\shim\\npm.cmd"] },
    { where: ["npm.cmd", "relative\\npm-cli.js"] }]) {
    const instance = fixture(options);
    assert.throws(() => instance.resolve(), /Cannot locate npm's JavaScript CLI.*Install Node\.js with npm/);
    assert.equal(instance.calls.length, 1);
  }
});

process.stdout.write(`OK: ${checks} npm command resolver tests passed\n`);
