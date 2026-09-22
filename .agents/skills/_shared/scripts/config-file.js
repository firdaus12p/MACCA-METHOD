"use strict";

// Internal loader only: parsed values must stay local, never become CLI output.
const fs = require("node:fs");
const path = require("node:path");
const MAX_CONFIG_BYTES = 1024 * 1024;

class ConfigFileError extends Error {}

function fail(message) {
  throw new ConfigFileError(message);
}

function localPath(file) {
  if (typeof file !== "string" || !file || file.includes("\0")) fail("Invalid config file path.");
  if (process.platform === "win32") {
    // Exclude UNC/device namespaces, drive-relative paths, ADS and DOS devices.
    // Ordinary drive-absolute and relative local paths remain supported.
    if (/^[\\/]{2}/.test(file) || /^[a-z]:($|[^\\/])/i.test(file)) {
      fail("Config requires an ordinary local file path.");
    }
  }
  const absolute = path.resolve(file);
  const root = path.parse(absolute).root;
  const parts = absolute.slice(root.length).split(path.sep).filter(Boolean);
  if (process.platform === "win32" && (
    !/^[a-z]:\\$/i.test(root) || parts.some((part) =>
      /[<>:"|?*\x00-\x1f]/.test(part) || /[ .]$/.test(part) ||
      /^(con|prn|aux|nul|conin\$|conout\$|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(part))
  )) fail("Config requires an ordinary local file path.");
  const chain = [root];
  for (const part of parts) chain.push(path.join(chain[chain.length - 1], part));
  return { absolute, chain };
}

function inspect(chain, allowMissing) {
  const snapshots = [];
  for (let index = 0; index < chain.length; index += 1) {
    let stat;
    try {
      stat = fs.lstatSync(chain[index]);
    } catch (error) {
      // A dangling link itself has an lstat entry and is rejected below;
      // only a genuinely missing component may mean absent preferences.
      if (allowMissing && error.code === "ENOENT") return null;
      if (error.code === "ENOENT") fail("Missing config file.");
      fail("Cannot inspect config file.");
    }
    if (stat.isSymbolicLink()) fail("Config path must not contain symlinks or junctions.");
    if (index < chain.length - 1 ? !stat.isDirectory() : !stat.isFile()) {
      fail("Config requires directories and a regular, non-symlink file.");
    }
    snapshots.push(stat);
  }
  return snapshots;
}

function sameIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

function recheck(chain, snapshots) {
  const current = inspect(chain, false);
  if (current.some((stat, index) => !sameIdentity(stat, snapshots[index]))) {
    fail("Config path changed during reading.");
  }
}

function loadConfig(file, { allowMissing = false } = {}) {
  let descriptor;
  let result;
  let failure;
  try {
    const { absolute, chain } = localPath(file);
    const snapshots = inspect(chain, allowMissing);
    if (!snapshots) return { absent: true };
    const before = snapshots[snapshots.length - 1];
    if (before.size > MAX_CONFIG_BYTES) fail("Config exceeds the 1 MiB limit.");
    const { O_RDONLY, O_NOFOLLOW, O_NONBLOCK } = fs.constants;
    let flags = O_RDONLY;
    if (process.platform !== "win32") {
      // Zero/absent flags provide no protection: fail closed on POSIX.
      if (!Number.isInteger(O_NOFOLLOW) || O_NOFOLLOW <= 0 ||
          !Number.isInteger(O_NONBLOCK) || O_NONBLOCK <= 0) {
        fail("Safe config reading is unavailable on this platform.");
      }
      flags |= O_NOFOLLOW | O_NONBLOCK;
    }
    // Windows has no Node NOFOLLOW equivalent. The chain/fd checks below are
    // best-effort local race detection, not a hostile-filesystem sandbox.
    descriptor = fs.openSync(absolute, flags);
    const opened = fs.fstatSync(descriptor);
    if (!opened.isFile() || !sameIdentity(opened, before)) fail("Config file changed during inspection.");
    if (opened.size > MAX_CONFIG_BYTES) fail("Config exceeds the 1 MiB limit.");
    recheck(chain, snapshots);
    const buffer = Buffer.alloc(MAX_CONFIG_BYTES + 1);
    let length = 0;
    while (length < buffer.length) {
      const count = fs.readSync(descriptor, buffer, length, buffer.length - length, null);
      if (count === 0) break;
      length += count;
    }
    if (length > MAX_CONFIG_BYTES) fail("Config exceeds the 1 MiB limit.");
    const after = fs.fstatSync(descriptor);
    if (!after.isFile() || !sameIdentity(after, opened) || after.size !== opened.size ||
        after.mtimeMs !== opened.mtimeMs || after.ctimeMs !== opened.ctimeMs) {
      fail("Config file changed during reading.");
    }
    recheck(chain, snapshots);
    let value;
    try {
      value = JSON.parse(buffer.toString("utf8", 0, length));
    } catch {
      fail("Invalid config: $: must contain valid JSON.");
    }
    result = { absent: false, value };
  } catch (error) {
    failure = error instanceof ConfigFileError ? error : new ConfigFileError("Cannot read config file.");
  } finally {
    if (descriptor !== undefined) {
      try {
        fs.closeSync(descriptor);
      } catch {
        failure = new ConfigFileError("Cannot close config file.");
      }
    }
  }
  if (failure) throw failure;
  return result;
}

module.exports = { loadConfig, ConfigFileError };
