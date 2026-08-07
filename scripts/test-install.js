#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const mode = process.argv.includes("--published") ? "published" : "local";
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "macca-test-install-"));
const projectDir = path.join(tmpDir, "project");
let packageSpec = "macca-method";

function commandName(base) {
    return process.platform === "win32" ? `${base}.cmd` : base;
}

function run(command, args, options = {}) {
    execFileSync(command, args, {
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

function runCli(args) {
    if (mode === "published") {
        run(commandName("npx"), ["--yes", "macca-method", ...args]);
        return;
    }

    run(commandName("npx"), ["--yes", "--package", packageSpec, "macca-method", ...args]);
}

function assertPathExists(targetPath) {
    if (!fs.existsSync(targetPath)) {
        throw new Error(`Missing expected path: ${targetPath}`);
    }
}

function readNonEmptyLines(filePath) {
    return fs
        .readFileSync(filePath, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
}

function listFiles(directoryPath) {
    const files = [];

    function walk(currentPath) {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            const entryPath = path.join(currentPath, entry.name);
            if (entry.isDirectory()) {
                walk(entryPath);
                continue;
            }

            files.push(entryPath);
        }
    }

    walk(directoryPath);
    return files.sort();
}

function ensureExpectedTools(filePath) {
    const tools = readNonEmptyLines(filePath);
    if (!tools.includes("codex")) {
        throw new Error("Expected codex in .agents/macca-tools.txt");
    }

    if (!tools.includes("copilot")) {
        throw new Error("Expected copilot in .agents/macca-tools.txt");
    }
}

function resolveLocalPackage() {
    const packOutput = capture(commandName("npm"), ["pack", "--json", "--pack-destination", tmpDir]);
    const packageList = JSON.parse(packOutput);

    if (!Array.isArray(packageList) || packageList.length === 0 || !packageList[0].filename) {
        throw new Error("npm pack did not return a tarball filename");
    }

    packageSpec = path.join(tmpDir, packageList[0].filename);
}

function main() {
    process.stdout.write("\n");
    process.stdout.write("  MACCA test-install\n");
    process.stdout.write(`  Mode: ${mode}\n`);

    try {
        if (mode === "local") {
            resolveLocalPackage();
        }

        fs.mkdirSync(projectDir, { recursive: true });

        process.stdout.write("\n");
        process.stdout.write(`  Installing into: ${projectDir}\n`);

        runCli(["install", "--yes", "--tool", "codex", "--tool", "github-copilot", "--directory", projectDir]);
        runCli(["upgrade", "--directory", projectDir]);

        assertPathExists(path.join(projectDir, ".agents", "developer-config.json"));
        assertPathExists(path.join(projectDir, ".agents", "macca-managed-skills.txt"));
        assertPathExists(path.join(projectDir, ".agents", "macca-tools.txt"));
        assertPathExists(path.join(projectDir, ".agents", "skills", "brainstorm-prd", "SKILL.md"));
        assertPathExists(path.join(projectDir, ".github", "skills", "brainstorm-prd", "SKILL.md"));
        assertPathExists(path.join(projectDir, "skills-lock.json"));

        ensureExpectedTools(path.join(projectDir, ".agents", "macca-tools.txt"));

        process.stdout.write("\n");
        process.stdout.write("  Verified files:\n");
        for (const filePath of listFiles(projectDir)) {
            process.stdout.write(`${filePath}\n`);
        }

        process.stdout.write("\n");
        process.stdout.write("  ✓ test-install passed\n");
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

main();
