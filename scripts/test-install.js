#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const crypto = require("node:crypto");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const rootDir = path.resolve(__dirname, "..");
const mode = process.argv.includes("--published") ? "published" : "local";
const tmpDir = fs.mkdtempSync(path.join(resolveTempRoot(), "macca-test-install-"));
const projectDir = path.join(tmpDir, "project");
const collisionDir = path.join(tmpDir, "collision-project");
const symlinkDir = path.join(tmpDir, "symlink-project");
const driftDir = path.join(tmpDir, "drift-project");
let packageSpec = "macca-method";

function commandName(base) {
    if (process.platform !== "win32") {
        return base;
    }

    return base === "npm" || base === "npx" ? `${base}.cmd` : base;
}

function resolveTempRoot() {
    const tempRoot = os.tmpdir();
    try {
        return fs.realpathSync(tempRoot);
    } catch {
        return tempRoot;
    }
}

function runNpm(args, options = {}) {
    const npmExecPath = process.env.npm_execpath;
    if (npmExecPath && /\.c?js$/i.test(npmExecPath)) {
        return capture(process.execPath, [npmExecPath, ...args], options);
    }

    return capture(commandName("npm"), args, options);
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

function expectCliFailure(args, expectedText) {
    try {
        if (mode === "published") {
            capture(commandName("npx"), ["--yes", "macca-method", ...args], { cwd: rootDir, stdio: "pipe" });
        } else {
            capture(commandName("npx"), ["--yes", "--package", packageSpec, "macca-method", ...args], { cwd: rootDir, stdio: "pipe" });
        }
    } catch (error) {
        const output = `${error.stdout || ""}${error.stderr || ""}`;
        if (!output.includes(expectedText)) {
            throw new Error(`Expected failed command to include ${expectedText}, got: ${output}`);
        }
        return;
    }
    throw new Error(`Expected command to fail: ${args.join(" ")}`);
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
    const packOutput = runNpm(["pack", "--json", "--pack-destination", tmpDir]);
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
        const collisionSkill = path.join(collisionDir, ".agents", "skills", "developer", "SKILL.md");
        fs.mkdirSync(path.dirname(collisionSkill), { recursive: true });
        fs.writeFileSync(collisionSkill, "---\nname: developer\ndescription: User-owned collision fixture.\n---\n", "utf8");
        expectCliFailure(
            ["install", "--yes", "--tool", "codex", "--directory", collisionDir],
            "Refusing to overwrite or remove unowned skill directory"
        );
        if (!fs.readFileSync(collisionSkill, "utf8").includes("User-owned collision fixture")) {
            throw new Error("Collision protection modified the user-owned skill");
        }

        if (process.platform !== "win32") {
            const outsideSkills = path.join(tmpDir, "outside-skills");
            fs.mkdirSync(path.join(symlinkDir, ".agents"), { recursive: true });
            fs.mkdirSync(outsideSkills, { recursive: true });
            fs.symlinkSync(outsideSkills, path.join(symlinkDir, ".agents", "skills"), "dir");
            expectCliFailure(
                ["install", "--yes", "--tool", "codex", "--directory", symlinkDir],
                "Refusing symlinked skill destination component"
            );
            if (fs.readdirSync(outsideSkills).length !== 0) {
                throw new Error("Symlink containment test wrote outside the target project");
            }

            const outerReal = path.join(tmpDir, "outer-real-project");
            const outerLink = path.join(tmpDir, "outer-link-project");
            fs.mkdirSync(outerReal, { recursive: true });
            fs.symlinkSync(outerReal, outerLink, "dir");
            expectCliFailure(
                ["install", "--yes", "--tool", "codex", "--directory", outerLink],
                "Refusing symlinked target project ancestor"
            );
            if (fs.readdirSync(outerReal).length !== 0) {
                throw new Error("Target directory ancestry symlink test wrote into the real directory");
            }
        } else {
            const outerReal = path.join(tmpDir, "outer-real-project");
            const outerLink = path.join(tmpDir, "outer-link-project");
            fs.mkdirSync(outerReal, { recursive: true });
            try {
                run(commandName("cmd"), ["/c", "mklink", "/J", outerLink, outerReal]);
                expectCliFailure(
                    ["install", "--yes", "--tool", "codex", "--directory", outerLink],
                    "Refusing symlinked target project ancestor"
                );
            } catch {
                process.stdout.write("  Skipping Windows junction ancestry test (mklink unavailable or not permitted)\n");
            }
        }

        const customSkill = path.join(projectDir, ".agents", "skills", "custom-skill", "SKILL.md");
        fs.mkdirSync(path.dirname(customSkill), { recursive: true });
        fs.writeFileSync(customSkill, "---\nname: custom-skill\ndescription: User-owned test skill.\n---\n", "utf8");

        process.stdout.write("\n");
        process.stdout.write(`  Installing into: ${projectDir}\n`);

        runCli(["install", "--yes", "--tool", "codex", "--tool", "github-copilot", "--directory", projectDir]);

        const configPath = path.join(projectDir, ".agents", "developer-config.json");
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        config.name = "Preserved Name";
        config.project = "Preserved Project";
        config.languagePreferences.communication = { raw: "English", normalized: "english" };
        config.languagePreferences.documents = { raw: "English", normalized: "english" };
        config.customField = { preserved: true };
        fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
        runCli(["install", "--yes", "--tool", "opencode", "--directory", projectDir]);

        run(commandName("node"), [
            path.join(rootDir, "scripts", "run-skill-validator.js"),
            path.join(projectDir, ".opencode", "skills", "_shared", "scripts", "validate-skills.py")
        ]);

        const managedPath = path.join(projectDir, ".agents", "macca-managed-skills.txt");
        const originalManaged = fs.readFileSync(managedPath, "utf8");
        fs.writeFileSync(managedPath, `${originalManaged}../../outside\n`, "utf8");
        expectCliFailure(["upgrade", "--directory", projectDir], "locally modified MACCA metadata");
        fs.writeFileSync(managedPath, originalManaged, "utf8");

        const maliciousSource = path.join(projectDir, "src");
        const maliciousTransactionId = "1-1-deadbeef";
        const maliciousBackup = path.join(projectDir, `.src.macca-backup-${maliciousTransactionId}`);
        const interruptedJournal = path.join(projectDir, ".agents", "macca-transaction.json");
        fs.mkdirSync(maliciousSource, { recursive: true });
        fs.writeFileSync(path.join(maliciousSource, "sentinel.txt"), "keep", "utf8");
        fs.writeFileSync(interruptedJournal, `${JSON.stringify({
            version: 1,
            phase: "committed",
            transactionId: maliciousTransactionId,
            entries: [{
                targetPath: maliciousSource,
                stagingPath: null,
                backupPath: maliciousBackup,
                kind: "directory",
                hadTarget: true
            }]
        }, null, 2)}\n`, "utf8");
        expectCliFailure(["upgrade", "--directory", projectDir], "not a managed MACCA path");
        assertPathExists(path.join(maliciousSource, "sentinel.txt"));
        fs.rmSync(interruptedJournal, { force: true });

        const forgedTransactionId = "3-3-feedface";
        const customSkillDirectory = path.dirname(customSkill);
        const forgedBackup = path.join(
            path.dirname(customSkillDirectory),
            `.${path.basename(customSkillDirectory)}.macca-backup-${forgedTransactionId}`
        );
        fs.writeFileSync(interruptedJournal, `${JSON.stringify({
            version: 1,
            phase: "committing",
            transactionId: forgedTransactionId,
            entries: [{
                targetPath: customSkillDirectory,
                stagingPath: null,
                backupPath: forgedBackup,
                kind: "directory",
                hadTarget: false,
                stagedHash: null
            }]
        }, null, 2)}\n`, "utf8");
        expectCliFailure(["upgrade", "--directory", projectDir], "matching transaction evidence");
        assertPathExists(customSkill);
        fs.rmSync(interruptedJournal, { force: true });

        const interruptedConfig = fs.readFileSync(configPath, "utf8");
        const interruptedTransactionId = "2-2-cafebabe";
        const interruptedBackup = path.join(
            projectDir,
            ".agents",
            `.developer-config.json.macca-backup-${interruptedTransactionId}`
        );
        const interruptedTarget = `${JSON.stringify({ interrupted: true }, null, 2)}\n`;
        fs.renameSync(configPath, interruptedBackup);
        fs.writeFileSync(configPath, interruptedTarget, "utf8");
        fs.writeFileSync(interruptedJournal, `${JSON.stringify({
            version: 1,
            phase: "committing",
            transactionId: interruptedTransactionId,
            entries: [{
                targetPath: configPath,
                stagingPath: null,
                backupPath: interruptedBackup,
                kind: "file",
                hadTarget: true,
                stagedHash: crypto.createHash("sha256").update(interruptedTarget).digest("hex")
            }]
        }, null, 2)}\n`, "utf8");
        runCli(["upgrade", "--directory", projectDir]);
        if (fs.existsSync(interruptedJournal) || fs.existsSync(interruptedBackup)) {
            throw new Error("Interrupted transaction recovery left journal or backup artifacts");
        }
        if (fs.readFileSync(configPath, "utf8") !== interruptedConfig) {
            throw new Error("Interrupted transaction recovery did not restore developer-config.json");
        }

        runCli(["install", "--yes", "--tool", "opencode", "--directory", driftDir]);
        const driftSkill = path.join(driftDir, ".opencode", "skills", "developer", "SKILL.md");
        fs.appendFileSync(driftSkill, "\nlocal edit\n", "utf8");
        expectCliFailure(["upgrade", "--directory", driftDir], "locally modified managed skill");

        assertPathExists(path.join(projectDir, ".agents", "developer-config.json"));
        assertPathExists(path.join(projectDir, ".agents", "macca-managed-skills.txt"));
        assertPathExists(path.join(projectDir, ".agents", "macca-tools.txt"));
        assertPathExists(path.join(projectDir, ".agents", "skills", "brainstorm-prd", "SKILL.md"));
        assertPathExists(path.join(projectDir, ".github", "skills", "brainstorm-prd", "SKILL.md"));
        assertPathExists(path.join(projectDir, ".opencode", "skills", "brainstorm-prd", "SKILL.md"));
        for (const skillsRoot of [
            path.join(projectDir, ".agents", "skills"),
            path.join(projectDir, ".github", "skills"),
            path.join(projectDir, ".opencode", "skills")
        ]) {
            assertPathExists(path.join(skillsRoot, "meet", "SKILL.md"));
        }
        assertPathExists(customSkill);
        assertPathExists(path.join(projectDir, ".agents", "macca-lock.json"));

        const allToolsDir = path.join(tmpDir, "all-tools-project");
        runCli([
            "install",
            "--yes",
            "--tool", "codex",
            "--tool", "github-copilot",
            "--tool", "cursor",
            "--tool", "claude-code",
            "--tool", "windsurf",
            "--tool", "gemini-cli",
            "--tool", "opencode",
            "--tool", "kilo-code",
            "--tool", "kimi-cli",
            "--directory", allToolsDir
        ]);
        for (const expectedPath of [
            path.join(allToolsDir, ".agents", "skills", "meet", "SKILL.md"),
            path.join(allToolsDir, ".github", "skills", "meet", "SKILL.md"),
            path.join(allToolsDir, ".cursor", "skills", "meet", "SKILL.md"),
            path.join(allToolsDir, ".claude", "skills", "meet", "SKILL.md"),
            path.join(allToolsDir, ".windsurf", "skills", "meet", "SKILL.md"),
            path.join(allToolsDir, ".gemini", "skills", "meet", "SKILL.md"),
            path.join(allToolsDir, ".opencode", "skills", "meet", "SKILL.md"),
            path.join(allToolsDir, ".kilo", "skills", "meet", "SKILL.md")
        ]) {
            assertPathExists(expectedPath);
        }

        if (mode === "local") {
            const downgradeDir = path.join(tmpDir, "downgrade-project");
            runCli([
                "install",
                "--yes",
                "--tool", "github-copilot",
                "--tool", "opencode",
                "--directory", downgradeDir,
                "--name", "Downgrade User",
                "--project", "Downgrade Project",
                "--communication-language", "English",
                "--document-language", "English"
            ]);
            const downgradeLockPath = path.join(downgradeDir, ".agents", "macca-lock.json");
            const downgradeLock = JSON.parse(fs.readFileSync(downgradeLockPath, "utf8"));
            downgradeLock.version = "99.0.0";
            fs.writeFileSync(downgradeLockPath, `${JSON.stringify(downgradeLock, null, 2)}\n`, "utf8");
            expectCliFailure([
                "upgrade",
                "--directory", downgradeDir
            ], "Refusing to downgrade MACCA");
            assertPathExists(path.join(downgradeDir, ".github", "skills", "meet", "SKILL.md"));
            assertPathExists(path.join(downgradeDir, ".opencode", "skills", "meet", "SKILL.md"));
        }

        const preservedConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (!preservedConfig.customField || preservedConfig.customField.preserved !== true) {
            throw new Error("Reinstall did not preserve unknown developer-config.json fields");
        }
        if (
            preservedConfig.name !== "Preserved Name"
            || preservedConfig.project !== "Preserved Project"
            || preservedConfig.languagePreferences.communication.normalized !== "english"
            || preservedConfig.languagePreferences.documents.normalized !== "english"
        ) {
            throw new Error("Reinstall reset known developer-config.json values");
        }

        const tools = readNonEmptyLines(path.join(projectDir, ".agents", "macca-tools.txt"));
        for (const expectedTool of ["codex", "copilot", "opencode"]) {
            if (!tools.includes(expectedTool)) {
                throw new Error(`Reinstall orphaned previously selected tool: ${expectedTool}`);
            }
        }

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
