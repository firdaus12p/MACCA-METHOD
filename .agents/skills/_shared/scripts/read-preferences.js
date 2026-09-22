#!/usr/bin/env node

"use strict";

// Installed alongside config-validator.js and config-file.js.

class PreferenceError extends Error {}

function fail(message) {
  throw new PreferenceError(message);
}

// Ignore inherited properties and never execute accessors in module callers.
function own(object, key) {
  const descriptor = object && Object.getOwnPropertyDescriptor(object, key);
  return descriptor && Object.prototype.hasOwnProperty.call(descriptor, "value")
    ? descriptor.value : undefined;
}

function normalizeLanguage(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (["indonesian", "id", "indo", "indonesia", "bahasa indonesia"].includes(normalized)) {
    return "indonesian";
  }
  if (["english", "en", "eng", "inggris", "bahasa inggris"].includes(normalized)) {
    return "english";
  }
  return null;
}

function language(channel) {
  const normalized = own(channel, "normalized");
  const raw = own(channel, "raw");
  const preferred = normalizeLanguage(normalized);
  const fallback = normalizeLanguage(raw);
  return {
    configured: normalized !== undefined || raw !== undefined,
    effective: preferred || fallback || "indonesian",
    source: preferred ? "normalized" : fallback ? "raw" : "default",
  };
}

function preference(section, key, choices) {
  const saved = own(section, key);
  // Select from constants rather than copying arbitrary config values.
  const value = choices.find((choice) => choice === saved);
  return { configured: value !== undefined, value: value === undefined ? null : value };
}

function summarize(value) {
  let errors;
  try {
    // Keep dependency failures redacted, including when invoked as a CLI.
    errors = require("./config-validator.js").validateConfig(value);
  } catch {
    fail("Preference validation unavailable.");
  }
  if (errors.length) {
    fail("Invalid config:\n" + errors.map(({ field, message }) => `- ${field}: ${message}`).join("\n"));
  }
  const languages = own(value, "languagePreferences");
  const developer = own(value, "developerPreferences");
  const brainstorm = own(value, "brainstormPreferences");
  const review = own(value, "codeReviewPreferences");
  const skills = own(value, "additionalSkills");
  const mcps = own(value, "availableMCPs");
  const isSet = (key) => {
    const text = own(value, key);
    return typeof text === "string" && text.trim() !== "";
  };
  return {
    absent: false,
    identity: { nameSet: isSet("name"), projectSet: isSet("project") },
    languagePreferences: {
      communication: language(own(languages, "communication")),
      documents: language(own(languages, "documents")),
    },
    developerPreferences: {
      workMode: preference(developer, "workMode", ["direct", "plan-first"]),
      scope: preference(developer, "scope", ["frontend", "backend", "fullstack"]),
    },
    brainstormPreferences: {
      discussionMode: preference(brainstorm, "discussionMode", ["one-by-one", "three-at-a-time", "all-at-once"]),
      recommendations: preference(brainstorm, "recommendations", [true, false]),
      discoveryDepth: preference(brainstorm, "discoveryDepth", ["quick", "standard", "critical"]),
    },
    codeReviewPreferences: {
      fixMode: preference(review, "fixMode", ["report-first", "fix-then-report"]),
    },
    additionalSkills: { configured: skills !== undefined, count: skills === undefined ? 0 : skills.length },
    availableMCPs: {
      configured: mcps !== undefined,
      count: Array.isArray(mcps) ? mcps.length : 0,
      denied: mcps === "none" || (Array.isArray(mcps) && mcps.length === 0),
    },
  };
}

function readPreferences(file) {
  let loader;
  try {
    loader = require("./config-file.js");
  } catch {
    fail("Safe config loader unavailable.");
  }
  let loaded;
  try {
    loaded = loader.loadConfig(file, { allowMissing: true });
  } catch (error) {
    fail(error instanceof loader.ConfigFileError ? error.message : "Cannot read config file.");
  }
  return loaded.absent ? { ...summarize({}), absent: true } : summarize(loaded.value);
}

function main(args) {
  try {
    if (args.length !== 1) fail("Usage: node read-preferences.js <config-file>");
    process.stdout.write(`${JSON.stringify(readPreferences(args[0]))}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof PreferenceError ? error.message : "Cannot read preferences."}\n`);
    process.exitCode = 1;
  }
}

module.exports = { readPreferences, summarize };

if (require.main === module) main(process.argv.slice(2));
