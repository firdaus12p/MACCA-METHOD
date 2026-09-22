#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const documentationFiles = [
  "README.md", "docs/workflows.md", "docs/configuration.md", "docs/troubleshooting.md",
];
const blank = (text) => text.replace(/[^\r\n]/g, " ");

// Preserve offsets so section extraction and diagnostics refer to source text.
function stripCode(source, inline = true) {
  let fence = null;
  let text = source.split(/(?<=\n)/).map((line) => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})([^\r\n]*)/);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
      return blank(line);
    }
    if (marker && !(marker[1][0] === "`" && marker[2].includes("`"))) {
      fence = marker[1];
      return blank(line);
    }
    return /^(?: {4}|\t)/.test(line) ? blank(line) : line;
  }).join("").replace(/<!--[\s\S]*?-->/g, blank);
  if (inline) text = text.replace(/(`+)(?!`)([\s\S]*?[^`])\1(?!`)/g, blank);
  return text;
}

function destinationAt(text, start) {
  let index = start;
  while (/\s/.test(text[index] || "") && index < text.length) index++;
  if (text[index] === "<") {
    const end = text.indexOf(">", index + 1);
    if (end >= 0) return { destination: text.slice(index + 1, end), end: end + 1 };
    return null;
  }
  const begin = index;
  let depth = 0;
  for (; index < text.length; index++) {
    const character = text[index];
    if (character === "\\") { index++; continue; }
    if (character === "(") depth++;
    if (character === ")") {
      if (!depth) break;
      depth--;
    }
    if (/\s/.test(character) && !depth) break;
  }
  return depth ? null : { destination: text.slice(begin, index), end: index };
}

function markdownLinks(source) {
  let text = stripCode(source);
  const definitions = new Map();
  const normalize = (label) => label.trim().replace(/\s+/g, " ").toLowerCase();
  text = text.replace(/^ {0,3}\[([^\]\n]+)\]:[ \t]*(.+)$/gm, (line, label, value) => {
    const parsed = destinationAt(value, 0);
    if (parsed && !definitions.has(normalize(label))) definitions.set(normalize(label), parsed.destination);
    return blank(line);
  });
  const links = [];
  // Inline links and images share the same destination syntax. Backticked
  // filenames and example commands are not links and have already been masked.
  let consumed = 0;
  for (const match of text.matchAll(/(?<!\\)\[([^\]\n]*)\]/g)) {
    if (match.index < consumed) continue;
    const end = match.index + match[0].length;
    let destination;
    if (text[end] === "(") {
      const parsed = destinationAt(text, end + 1);
      if (parsed && /^(?:\s+(?:"[^"\n]*"|'[^'\n]*'|\([^\n]*?\)))?\s*\)/.test(text.slice(parsed.end))) {
        destination = parsed.destination;
      }
    } else if (text[end] === "[") {
      const reference = text.slice(end).match(/^\[([^\]\n]*)\]/);
      if (reference) {
        destination = definitions.get(normalize(reference[1] || match[1]));
        consumed = end + reference[0].length;
      }
    } else {
      destination = definitions.get(normalize(match[1]));
    }
    if (destination !== undefined) links.push({ destination, offset: match.index });
  }
  return links;
}

function headingAnchors(source) {
  const anchors = new Set();
  const text = stripCode(source, false);
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const atx = lines[index].match(/^ {0,3}#{1,6}[ \t]+(.+?)(?:[ \t]+#+[ \t]*)?$/);
    const setext = index + 1 < lines.length && /^ {0,3}(?:=+|-+)\s*$/.test(lines[index + 1]) && lines[index].trim();
    if (!atx && !setext) continue;
    const heading = (atx ? atx[1] : lines[index++])
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/<[^>]*>/g, "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
      .replace(/&#(x[\da-f]+|\d+);/gi, (entity, number) => {
        const code = number[0].toLowerCase() === "x" ? parseInt(number.slice(1), 16) : Number(number);
        return code <= 0x10ffff ? String.fromCodePoint(code) : entity;
      });
    // GitHub keeps hyphens/underscores, removes punctuation (not replaces it
    // with a hyphen), and retains repeated spaces as repeated hyphens.
    const base = heading.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, "").replace(/ /g, "-");
    let slug = base;
    for (let suffix = 1; anchors.has(slug); suffix++) slug = `${base}-${suffix}`;
    anchors.add(slug);
  }
  return anchors;
}

function validateDocs(root, packagedFiles) {
  const issues = [];
  const anchors = new Map();
  for (const file of documentationFiles) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    for (const { destination, offset } of markdownLinks(source)) {
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(destination)) continue;
      const label = `${file}:${source.slice(0, offset).split("\n").length}`;
      let targetPath;
      let fragment;
      try {
        const hash = destination.indexOf("#");
        const pathname = (hash < 0 ? destination : destination.slice(0, hash)).split("?")[0];
        targetPath = pathname ? decodeURIComponent(pathname.replace(/\\([\\()[\] ])/g, "$1")) : "";
        fragment = hash < 0 ? "" : decodeURIComponent(destination.slice(hash + 1));
      } catch {
        issues.push(`${label}: invalid URL encoding in ${destination}`);
        continue;
      }
      const target = targetPath ? path.resolve(root, path.dirname(file), targetPath) : path.join(root, file);
      const relative = path.relative(root, target).split(path.sep).join("/");
      if (relative === ".." || relative.startsWith("../") || path.isAbsolute(relative) || targetPath.startsWith("/")) {
        issues.push(`${label}: local link escapes package: ${destination}`);
        continue;
      }
      if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
        issues.push(`${label}: missing local link target: ${destination}`);
        continue;
      }
      if (!packagedFiles.has(relative)) issues.push(`${label}: local link target is not packaged: ${destination}`);
      if (fragment && /\.md$/i.test(target)) {
        if (!anchors.has(target)) anchors.set(target, headingAnchors(fs.readFileSync(target, "utf8")));
        if (!anchors.get(target).has(fragment)) issues.push(`${label}: missing heading anchor: ${destination}`);
      }
    }
  }
  return issues;
}

module.exports = { documentationFiles, stripCode, markdownLinks, headingAnchors, validateDocs };

if (require.main === module) {
  // The package validator supplies its independent exact publication contract
  // and actual packed paths, so a source-only link cannot pass this command.
  const { spawnSync } = require("node:child_process");
  const result = spawnSync(process.execPath, [path.join(__dirname, "validate-package.js")], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}
