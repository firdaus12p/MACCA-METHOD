#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const readline = require("node:readline");

const PACKAGE_ROOT = path.resolve(__dirname, "..");
const SOURCE_AGENTS_DIR = path.join(PACKAGE_ROOT, ".agents");
const SOURCE_SKILLS_DIR = path.join(SOURCE_AGENTS_DIR, "skills");
const SOURCE_MANAGED_SKILLS_FILE = path.join(SOURCE_AGENTS_DIR, "macca-managed-skills.txt");
const SOURCE_LOCK_FILE = path.join(PACKAGE_ROOT, "skills-lock.json");

const TOOL_DEFINITIONS = [
    {
        key: "copilot",
        aliases: ["github-copilot"],
        label: "GitHub Copilot",
        destination: (targetDir) => path.join(targetDir, ".github", "skills"),
        displayDestination: ".github/skills/"
    },
    {
        key: "cursor",
        aliases: [],
        label: "Cursor",
        destination: (targetDir) => path.join(targetDir, ".cursor", "skills"),
        displayDestination: ".cursor/skills/"
    },
    {
        key: "claude",
        aliases: ["claude-code"],
        label: "Claude Code",
        destination: (targetDir) => path.join(targetDir, ".claude", "skills"),
        displayDestination: ".claude/skills/"
    },
    {
        key: "windsurf",
        aliases: [],
        label: "Windsurf",
        destination: (targetDir) => path.join(targetDir, ".windsurf", "skills"),
        displayDestination: ".windsurf/skills/"
    },
    {
        key: "gemini",
        aliases: ["gemini-cli"],
        label: "Gemini CLI",
        destination: (targetDir) => path.join(targetDir, ".gemini", "skills"),
        displayDestination: ".gemini/skills/"
    },
    {
        key: "opencode",
        aliases: [],
        label: "OpenCode",
        destination: (targetDir) => path.join(targetDir, ".opencode", "skill"),
        displayDestination: ".opencode/skill/"
    },
    {
        key: "kilo",
        aliases: ["kilo-code"],
        label: "Kilo Code",
        destination: (targetDir) => path.join(targetDir, ".kilo", "skills"),
        displayDestination: ".kilo/skills/"
    },
    {
        key: "codex",
        aliases: ["openai-codex"],
        label: "Codex (OpenAI)",
        destination: (targetDir) => path.join(targetDir, ".agents", "skills"),
        displayDestination: ".agents/skills/"
    },
    {
        key: "kimi",
        aliases: ["kimi-cli"],
        label: "Kimi CLI",
        destination: () => {
            if (process.platform === "win32") {
                return path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), "agents", "skills");
            }

            return path.join(os.homedir(), ".config", "agents", "skills");
        },
        displayDestination: process.platform === "win32" ? "%APPDATA%\\agents\\skills\\" : "~/.config/agents/skills/"
    }
];

const TOOL_BY_KEY = new Map(TOOL_DEFINITIONS.map((tool) => [tool.key, tool]));
const TOOL_LOOKUP = new Map();
for (const tool of TOOL_DEFINITIONS) {
    TOOL_LOOKUP.set(tool.key, tool.key);
    for (const alias of tool.aliases) {
        TOOL_LOOKUP.set(alias, tool.key);
    }
}

function main() {
    try {
        const args = parseArgs(process.argv.slice(2));
        const command = args._[0] || "help";

        if (args.version) {
            const packageJson = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8"));
            process.stdout.write(`${packageJson.version}\n`);
            return;
        }

        if (args.help || command === "help") {
            printHelp();
            return;
        }

        if (args.listTools) {
            printToolList();
            return;
        }

        ensurePackagedFiles();

        if (command === "install") {
            runInstall(args).catch((error) => exitWithError(error.message));
            return;
        }

        if (command === "upgrade") {
            runUpgrade(args);
            return;
        }

        exitWithError(`Unknown command: ${command}`);
    } catch (error) {
        exitWithError(error.message);
    }
}

function parseArgs(argv) {
    const args = {
        _: [],
        tools: []
    };

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];

        if (token === "-h" || token === "--help") {
            args.help = true;
            continue;
        }

        if (token === "-v" || token === "--version") {
            args.version = true;
            continue;
        }

        if (token === "-y" || token === "--yes") {
            args.yes = true;
            continue;
        }

        if (token === "--list-tools") {
            args.listTools = true;
            continue;
        }

        if (token === "-t" || token === "--tool" || token === "--tools") {
            const result = takeValue(argv, index, token);
            args.tools.push(result.value);
            index = result.index;
            continue;
        }

        if (token.startsWith("--tool=") || token.startsWith("--tools=")) {
            args.tools.push(token.slice(token.indexOf("=") + 1));
            continue;
        }

        if (token === "-d" || token === "--directory") {
            const result = takeValue(argv, index, token);
            args.directory = result.value;
            index = result.index;
            continue;
        }

        if (token.startsWith("--directory=")) {
            args.directory = token.slice(token.indexOf("=") + 1);
            continue;
        }

        if (token === "--name") {
            const result = takeValue(argv, index, token);
            args.name = result.value;
            index = result.index;
            continue;
        }

        if (token.startsWith("--name=")) {
            args.name = token.slice(token.indexOf("=") + 1);
            continue;
        }

        if (token === "--project") {
            const result = takeValue(argv, index, token);
            args.project = result.value;
            index = result.index;
            continue;
        }

        if (token.startsWith("--project=")) {
            args.project = token.slice(token.indexOf("=") + 1);
            continue;
        }

        if (token === "--communication-language") {
            const result = takeValue(argv, index, token);
            args.communicationLanguage = result.value;
            index = result.index;
            continue;
        }

        if (token.startsWith("--communication-language=")) {
            args.communicationLanguage = token.slice(token.indexOf("=") + 1);
            continue;
        }

        if (token === "--document-language" || token === "--documents-language") {
            const result = takeValue(argv, index, token);
            args.documentLanguage = result.value;
            index = result.index;
            continue;
        }

        if (token.startsWith("--document-language=") || token.startsWith("--documents-language=")) {
            args.documentLanguage = token.slice(token.indexOf("=") + 1);
            continue;
        }

        if (token.startsWith("-")) {
            throw new Error(`Unknown option: ${token}`);
        }

        args._.push(token);
    }

    return args;
}

function takeValue(argv, index, flag) {
    const value = argv[index + 1];
    if (value === undefined) {
        throw new Error(`Missing value for ${flag}`);
    }

    return {
        value,
        index: index + 1
    };
}

function ensurePackagedFiles() {
    if (!fs.existsSync(SOURCE_SKILLS_DIR)) {
        throw new Error("Packaged skills directory is missing. Reinstall the package or run from the repository root.");
    }

    if (!fs.existsSync(SOURCE_LOCK_FILE)) {
        throw new Error("skills-lock.json is missing from the package.");
    }
}

function printHelp() {
    process.stdout.write(
        [
            "MACCA CLI",
            "",
            "Usage:",
            "  npx macca-method install [options]",
            "  npx macca-method upgrade [options]",
            "  npx macca-method --list-tools",
            "",
            "Install options:",
            "  -t, --tool <name>                 Repeatable. Also accepts comma-separated values.",
            "  -d, --directory <path>           Target project directory. Defaults to the current directory.",
            "  -y, --yes                        Skip prompts and use defaults where needed.",
            "      --name <value>               Developer name.",
            "      --project <value>            Project name.",
            "      --communication-language <value>",
            "      --document-language <value>",
            "",
            "Examples:",
            "  npx macca-method install",
            "  npx macca-method install --tool github-copilot --tool codex --yes",
            "  npx macca-method upgrade",
            ""
        ].join("\n")
    );
}

function printToolList() {
    process.stdout.write("Supported tools:\n");
    TOOL_DEFINITIONS.forEach((tool, index) => {
        const aliases = tool.aliases.length > 0 ? ` (aliases: ${tool.aliases.join(", ")})` : "";
        process.stdout.write(`  ${index + 1}. ${tool.key} -> ${tool.label}${aliases}\n`);
    });
}

function resolveTargetDirectory(rawDirectory) {
    if (!rawDirectory) {
        return process.cwd();
    }

    return path.resolve(process.cwd(), rawDirectory);
}

function readNonEmptyLines(filePath) {
    if (!fs.existsSync(filePath)) {
        return [];
    }

    return fs
        .readFileSync(filePath, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
}

function unique(values) {
    return [...new Set(values)];
}

function getSourceManagedSkills() {
    const managedSkills = readNonEmptyLines(SOURCE_MANAGED_SKILLS_FILE);
    if (managedSkills.length > 0) {
        return managedSkills;
    }

    return fs
        .readdirSync(SOURCE_SKILLS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
}

function normalizeLanguage(value) {
    const trimmed = String(value || "").trim();
    const lowered = trimmed.toLowerCase();

    switch (lowered) {
        case "":
        case "id":
        case "indo":
        case "indonesia":
        case "indonesian":
        case "bahasa indonesia":
            return "indonesian";
        case "en":
        case "eng":
        case "english":
        case "inggris":
        case "bahasa inggris":
            return "english";
        default:
            return lowered;
    }
}

function ensureDirectory(directoryPath) {
    fs.mkdirSync(directoryPath, { recursive: true });
}

function writeTextFile(filePath, content) {
    ensureDirectory(path.dirname(filePath));
    fs.writeFileSync(filePath, content, "utf8");
}

function copyFile(sourcePath, targetPath) {
    ensureDirectory(path.dirname(targetPath));
    fs.copyFileSync(sourcePath, targetPath);
}

function copyDirectory(sourcePath, targetPath) {
    ensureDirectory(path.dirname(targetPath));
    fs.rmSync(targetPath, { recursive: true, force: true });
    fs.cpSync(sourcePath, targetPath, { recursive: true });
}

function normalizeToolList(values) {
    const rawTokens = [];
    for (const value of values) {
        rawTokens.push(...String(value).split(","));
    }

    const resolved = [];
    for (const token of rawTokens) {
        const trimmed = token.trim().toLowerCase();
        if (!trimmed) {
            continue;
        }

        const key = TOOL_LOOKUP.get(trimmed);
        if (!key) {
            throw new Error(`Unknown tool: ${token}`);
        }

        resolved.push(key);
    }

    return unique(resolved);
}

function buildDeveloperConfig(options) {
    return {
        name: options.name,
        project: options.project,
        languagePreferences: {
            communication: {
                raw: options.communicationLanguage,
                normalized: normalizeLanguage(options.communicationLanguage)
            },
            documents: {
                raw: options.documentLanguage,
                normalized: normalizeLanguage(options.documentLanguage)
            }
        }
    };
}

function createPrompt() {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        throw new Error("Interactive install requires a TTY. Use --yes and explicit flags in non-interactive environments.");
    }

    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

function askQuestion(prompt, question) {
    return new Promise((resolve) => {
        prompt.question(question, resolve);
    });
}

async function promptForTools() {
    const prompt = createPrompt();

    try {
        process.stdout.write("\nPilih AI tool yang mau dipasang:\n");
        TOOL_DEFINITIONS.forEach((tool, index) => {
            process.stdout.write(`  ${index + 1}. ${tool.label} -> ${tool.displayDestination}\n`);
        });
        process.stdout.write("\n");

        while (true) {
            const answer = await askQuestion(prompt, "Masukkan nomor/nama tool (pisahkan dengan koma, 'all', kosong = codex): ");
            const parsed = parseInteractiveToolSelection(answer);
            if (parsed.error) {
                process.stdout.write(`  ${parsed.error}\n`);
                continue;
            }

            return parsed.tools;
        }
    } finally {
        prompt.close();
    }
}

function parseInteractiveToolSelection(answer) {
    const trimmed = String(answer || "").trim();
    if (!trimmed) {
        return { tools: ["codex"] };
    }

    if (trimmed.toLowerCase() === "all") {
        return { tools: TOOL_DEFINITIONS.map((tool) => tool.key) };
    }

    const tools = [];
    for (const part of trimmed.split(",")) {
        const token = part.trim();
        if (!token) {
            continue;
        }

        if (/^\d+$/.test(token)) {
            const index = Number(token) - 1;
            if (index < 0 || index >= TOOL_DEFINITIONS.length) {
                return { error: `Pilihan nomor tidak valid: ${token}` };
            }

            tools.push(TOOL_DEFINITIONS[index].key);
            continue;
        }

        const key = TOOL_LOOKUP.get(token.toLowerCase());
        if (!key) {
            return { error: `Nama tool tidak dikenal: ${token}` };
        }

        tools.push(key);
    }

    return { tools: unique(tools) };
}

async function promptForMetadata(seed) {
    const prompt = createPrompt();

    try {
        const name = seed.name !== undefined ? seed.name : await askQuestion(prompt, "Kamu mau dipanggil apa? (Kosong = Skip): ");
        const project = seed.project !== undefined ? seed.project : await askQuestion(prompt, "Nama project ini apa? (Kosong = Skip): ");
        const communication = seed.communicationLanguage !== undefined
            ? seed.communicationLanguage
            : await askQuestion(prompt, "Bahasa komunikasi yang anda inginkan? (Kosong = Bahasa Indonesia): ");
        const documents = seed.documentLanguage !== undefined
            ? seed.documentLanguage
            : await askQuestion(prompt, "Bahasa dokumen yang dihasilkan? (Kosong = Bahasa Indonesia): ");

        return {
            name: name || "",
            project: project || "",
            communicationLanguage: communication || "Bahasa Indonesia",
            documentLanguage: documents || "Bahasa Indonesia"
        };
    } finally {
        prompt.close();
    }
}

function applyInstall(targetDir, tools, metadata) {
    const managedSkills = getSourceManagedSkills();
    const agentsDirectory = path.join(targetDir, ".agents");
    ensureDirectory(targetDir);
    ensureDirectory(agentsDirectory);

    if (fs.existsSync(SOURCE_MANAGED_SKILLS_FILE)) {
        copyFile(SOURCE_MANAGED_SKILLS_FILE, path.join(agentsDirectory, "macca-managed-skills.txt"));
    } else {
        writeTextFile(path.join(agentsDirectory, "macca-managed-skills.txt"), `${managedSkills.join("\n")}\n`);
    }

    copyFile(SOURCE_LOCK_FILE, path.join(targetDir, "skills-lock.json"));

    for (const toolKey of tools) {
        const tool = TOOL_BY_KEY.get(toolKey);
        const destination = tool.destination(targetDir);
        ensureDirectory(destination);

        for (const skillName of managedSkills) {
            copyDirectory(path.join(SOURCE_SKILLS_DIR, skillName), path.join(destination, skillName));
        }
    }

    if (!tools.includes("codex")) {
        fs.rmSync(path.join(agentsDirectory, "skills"), { recursive: true, force: true });
    }

    writeTextFile(path.join(agentsDirectory, "macca-tools.txt"), `${tools.join("\n")}\n`);
    writeTextFile(
        path.join(agentsDirectory, "developer-config.json"),
        `${JSON.stringify(buildDeveloperConfig(metadata), null, 2)}\n`
    );
}

function applyUpgrade(targetDir) {
    const agentsDirectory = path.join(targetDir, ".agents");
    const tools = readNonEmptyLines(path.join(agentsDirectory, "macca-tools.txt"));
    if (tools.length === 0) {
        throw new Error(".agents/macca-tools.txt was not found. Run install first so MACCA knows which tools to update.");
    }

    const previousManagedSkills = readNonEmptyLines(path.join(agentsDirectory, "macca-managed-skills.txt"));
    const nextManagedSkills = getSourceManagedSkills();
    const skillsToClean = unique([...previousManagedSkills, ...nextManagedSkills]);

    for (const toolKey of tools) {
        const tool = TOOL_BY_KEY.get(toolKey);
        if (!tool) {
            throw new Error(`Unsupported tool in .agents/macca-tools.txt: ${toolKey}`);
        }

        const destination = tool.destination(targetDir);
        ensureDirectory(destination);

        for (const skillName of skillsToClean) {
            fs.rmSync(path.join(destination, skillName), { recursive: true, force: true });
        }

        for (const skillName of nextManagedSkills) {
            copyDirectory(path.join(SOURCE_SKILLS_DIR, skillName), path.join(destination, skillName));
        }
    }

    if (!tools.includes("codex")) {
        fs.rmSync(path.join(agentsDirectory, "skills"), { recursive: true, force: true });
    }

    if (fs.existsSync(SOURCE_MANAGED_SKILLS_FILE)) {
        copyFile(SOURCE_MANAGED_SKILLS_FILE, path.join(agentsDirectory, "macca-managed-skills.txt"));
    } else {
        writeTextFile(path.join(agentsDirectory, "macca-managed-skills.txt"), `${nextManagedSkills.join("\n")}\n`);
    }

    copyFile(SOURCE_LOCK_FILE, path.join(targetDir, "skills-lock.json"));
}

function printInstallSummary(action, tools) {
    process.stdout.write(`\n  MACCA ${action} untuk:\n`);
    for (const toolKey of tools) {
        const tool = TOOL_BY_KEY.get(toolKey);
        process.stdout.write(`  ✓ ${tool.label.padEnd(16)} -> ${tool.displayDestination}\n`);
    }
    process.stdout.write("\n");
}

async function runInstall(args) {
    let tools = normalizeToolList(args.tools);
    if (tools.length === 0) {
        tools = args.yes ? ["codex"] : await promptForTools();
    }

    const metadata = args.yes
        ? {
            name: args.name || "",
            project: args.project || "",
            communicationLanguage: args.communicationLanguage || "Bahasa Indonesia",
            documentLanguage: args.documentLanguage || "Bahasa Indonesia"
        }
        : await promptForMetadata(args);

    const targetDir = resolveTargetDirectory(args.directory);
    applyInstall(targetDir, tools, metadata);

    printInstallSummary("installed", tools);
    process.stdout.write(`  Target project: ${targetDir}\n\n`);
}

function runUpgrade(args) {
    const targetDir = resolveTargetDirectory(args.directory);
    const tools = readNonEmptyLines(path.join(targetDir, ".agents", "macca-tools.txt"));
    applyUpgrade(targetDir);
    printInstallSummary("updated", tools);
    process.stdout.write(`  Target project: ${targetDir}\n\n`);
}

function exitWithError(message) {
    process.stderr.write(`\nError: ${message}\n`);
    process.exit(1);
}

main();