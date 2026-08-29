#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "macca-legacy-upgrade-"));
const projectDir = path.join(temporaryRoot, "project");
const obsoleteMeetingName = Buffer.from("cmFwYXQ=", "base64").toString("utf8");

function commandName(base) {
    return process.platform === "win32" ? `${base}.cmd` : base;
}

function run(command, args, options = {}) {
    return execFileSync(command, args, {
        cwd: rootDir,
        stdio: "inherit",
        ...options
    });
}

function capture(command, args, options = {}) {
    return execFileSync(command, args, {
        cwd: rootDir,
        encoding: "utf8",
        ...options
    });
}

function assertExists(targetPath) {
    if (!fs.existsSync(targetPath)) throw new Error(`Missing expected path: ${targetPath}`);
}

function assertMissing(targetPath) {
    if (fs.existsSync(targetPath)) throw new Error(`Obsolete path was not removed: ${targetPath}`);
}

try {
    fs.mkdirSync(projectDir, { recursive: true });

    const legacyPackOutput = capture(commandName("npm"), [
        "pack",
        "macca-method@1.1.0",
        "--json",
        "--pack-destination",
        temporaryRoot
    ]);
    const legacyPackageList = JSON.parse(legacyPackOutput);
    const legacyPackageSpec = path.join(temporaryRoot, legacyPackageList[0].filename);

    run(commandName("npx"), [
        "--yes",
        "--package",
        legacyPackageSpec,
        "macca-method",
        "install",
        "--yes",
        "--tool",
        "opencode",
        "--directory",
        projectDir,
        "--name",
        "Legacy User",
        "--project",
        "Legacy Project",
        "--communication-language",
        "English",
        "--document-language",
        "English"
    ]);

    const legacyRoot = path.join(projectDir, ".opencode", "skill");
    assertExists(path.join(legacyRoot, obsoleteMeetingName, "SKILL.md"));

    const packOutput = capture(commandName("npm"), ["pack", "--json", "--pack-destination", temporaryRoot]);
    const packageList = JSON.parse(packOutput);
    const packageSpec = path.join(temporaryRoot, packageList[0].filename);

    run(commandName("npx"), [
        "--yes",
        "--package",
        packageSpec,
        "macca-method",
        "upgrade",
        "--directory",
        projectDir
    ]);

    const currentRoot = path.join(projectDir, ".opencode", "skills");
    assertExists(path.join(currentRoot, "meet", "SKILL.md"));
    assertExists(path.join(currentRoot, "release-readiness", "SKILL.md"));
    assertMissing(path.join(legacyRoot, obsoleteMeetingName));

    const config = JSON.parse(fs.readFileSync(path.join(projectDir, ".agents", "developer-config.json"), "utf8"));
    if (config.name !== "Legacy User" || config.project !== "Legacy Project") {
        throw new Error("Legacy upgrade did not preserve developer config");
    }

    process.stdout.write("OK: published 1.1.0 OpenCode installation upgraded safely\n");
} finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
}
