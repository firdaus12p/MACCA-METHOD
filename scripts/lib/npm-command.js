"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

function resolveNpmCommand(args) {
  function realFile(candidate) {
    if (typeof candidate !== "string" || !path.isAbsolute(candidate)) return null;
    try {
      const resolved = fs.realpathSync(candidate);
      return fs.statSync(resolved).isFile() ? resolved : null;
    } catch {
      return null;
    }
  }

  function javascriptCommand(candidate) {
    const resolved = realFile(candidate);
    // npm_execpath can belong to another package manager. Only invoke npm's CLI.
    if (!resolved || !/^npm-cli\.(?:c?js|mjs)$/i.test(path.basename(resolved))) return null;
    return { command: process.execPath, args: [resolved, ...args] };
  }

  const fromEnvironment = javascriptCommand(process.env.npm_execpath);
  if (fromEnvironment) return fromEnvironment;

  const nodePaths = new Set([process.execPath, realFile(process.execPath)].filter(Boolean));
  for (const nodePath of nodePaths) {
    const directory = path.dirname(nodePath);
    for (const candidate of [
      path.join(directory, "node_modules", "npm", "bin", "npm-cli.js"),
      path.join(directory, "..", "lib", "node_modules", "npm", "bin", "npm-cli.js"),
    ]) {
      const command = javascriptCommand(candidate);
      if (command) return command;
    }
  }

  if (process.platform !== "win32") return { command: "npm", args: [...args] };

  let candidates = [];
  try {
    candidates = execFileSync("where.exe", ["npm"], {
      encoding: "utf8", shell: false, windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    }).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  } catch {
    // The descriptive failure below also covers a missing where.exe or PATH entry.
  }
  for (const candidate of candidates) {
    // Inspect shim locations and their real targets, but never execute a .cmd file
    // or interpret its contents as shell text. Arguments remain literal values.
    if (!path.isAbsolute(candidate)) continue;
    const locations = new Set([candidate, realFile(candidate)].filter(Boolean));
    for (const location of locations) {
      const directory = path.dirname(location);
      for (const cli of [
        location,
        path.join(directory, "npm-cli.js"),
        path.join(directory, "node_modules", "npm", "bin", "npm-cli.js"),
        path.join(directory, "..", "node_modules", "npm", "bin", "npm-cli.js"),
      ]) {
        const command = javascriptCommand(cli);
        if (command) return command;
      }
    }
  }
  throw new Error(
    "Cannot locate npm's JavaScript CLI (npm-cli.js). Install Node.js with npm, " +
    "ensure npm is on PATH, or set npm_execpath to its existing npm-cli.js. " +
    "Windows .cmd shims cannot be executed directly without a shell.",
  );
}

module.exports = { resolveNpmCommand };
