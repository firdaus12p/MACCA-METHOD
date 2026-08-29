#!/usr/bin/env node

"use strict";

const path = require("node:path");
const { spawnSync } = require("node:child_process");

const validatorPath = path.resolve(
    process.argv[2] || path.join(__dirname, "..", ".agents", "skills", "_shared", "scripts", "validate-skills.py")
);
const candidates = process.platform === "win32"
    ? [["python", []], ["py", ["-3"]]]
    : [["python3", []], ["python", []]];

for (const [command, prefixArgs] of candidates) {
    const result = spawnSync(command, [...prefixArgs, validatorPath], { stdio: "inherit" });
    if (result.error && result.error.code === "ENOENT") {
        continue;
    }
    process.exit(result.status === null ? 1 : result.status);
}

process.stderr.write("Python 3 is required to run the skill validator.\n");
process.exit(1);
