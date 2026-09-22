#!/usr/bin/env node

"use strict";

// In-memory validation is self-contained; only the CLI loads config-file.js.
// Validate JSON-shaped data without migrating it or reading extension values.
// Language strings (including unknown/empty normalized strings) retain the
// language-config.md fallback contract. Resolution belongs to the reader.
// availableMCPs also accepts the legacy literal "none" from onboarding.md.
const legacyPaths = [
  "path", "githubPath", "opencodePath", "claudePath", "cursorPath",
  "windsurfPath", "geminiPath", "kiloPath", "kimiPath", "codexPath",
];

function validateConfig(value) {
  const errors = [];
  const invalid = (field, message) => errors.push({ field, message });
  const object = (item, field) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      invalid(field, "must be an object");
      return false;
    }
    return true;
  };
  const string = (item, field) => {
    if (typeof item !== "string") invalid(field, "must be a string");
  };
  const nonemptyString = (item, field) => {
    if (typeof item !== "string" || item.trim() === "") {
      invalid(field, "must be a nonempty string");
    }
  };
  const enumeration = (choices) => (item, field) => {
    if (!choices.includes(item)) {
      invalid(field, `must be one of: ${choices.join(", ")}`);
    }
  };
  const property = (parent, key, field, check, required = false) => {
    const descriptor = Object.getOwnPropertyDescriptor(parent, key);
    if (!descriptor) {
      if (required) invalid(field, "is required");
    } else if (!Object.prototype.hasOwnProperty.call(descriptor, "value")) {
      // Do not execute accessors supplied by programmatic callers.
      invalid(field, "must be a data property");
    } else {
      check(descriptor.value, field);
    }
  };
  const section = (checks) => (item, field) => {
    if (!object(item, field)) return;
    for (const [key, check] of Object.entries(checks)) {
      property(item, key, `${field}.${key}`, check);
    }
  };
  const array = (check) => (items, field) => {
    if (!Array.isArray(items)) {
      invalid(field, "must be an array");
      return;
    }
    for (let index = 0; index < items.length; index += 1) {
      property(items, String(index), `${field}[${index}]`, check, true);
    }
  };
  const paths = (item, field) => {
    if (!object(item, field)) return;
    // Host keys are open-ended, so never echo them: they can contain secrets
    // or terminal control characters. [N] identifies Object.keys order.
    Object.keys(item).forEach((key, index) => {
      property(item, key, `${field}[${index}]`, string);
    });
  };
  const skill = (item, field) => {
    if (!object(item, field)) return;
    property(item, "name", `${field}.name`, nonemptyString, true);
    property(item, "purpose", `${field}.purpose`, string);
    property(item, "paths", `${field}.paths`, paths);
    for (const key of legacyPaths) property(item, key, `${field}.${key}`, string);
  };

  if (!object(value, "$")) return errors;
  const checks = {
    name: string,
    project: string,
    languagePreferences: section({
      communication: section({ raw: string, normalized: string }),
      documents: section({ raw: string, normalized: string }),
    }),
    developerPreferences: section({
      workMode: enumeration(["direct", "plan-first"]),
      scope: enumeration(["frontend", "backend", "fullstack"]),
    }),
    brainstormPreferences: section({
      discussionMode: enumeration(["one-by-one", "three-at-a-time", "all-at-once"]),
      recommendations: (item, field) => {
        if (typeof item !== "boolean") invalid(field, "must be a boolean");
      },
      discoveryDepth: enumeration(["quick", "standard", "critical"]),
    }),
    codeReviewPreferences: section({
      fixMode: enumeration(["report-first", "fix-then-report"]),
    }),
    additionalSkills: array(skill),
    availableMCPs: (item, field) => {
      if (item !== "none") array(nonemptyString)(item, field);
    },
  };
  for (const [key, check] of Object.entries(checks)) {
    property(value, key, key, check);
  }
  return errors;
}

function filenameLabel(label) {
  // Escape controls without coercing arbitrary objects or including config data.
  return JSON.stringify(typeof label === "string" ? label : "developer-config.json");
}

function assertValidConfig(value, label) {
  const errors = validateConfig(value);
  if (errors.length === 0) return;
  const error = new Error(
    `Invalid config ${filenameLabel(label)}:\n` +
    errors.map(({ field, message }) => `- ${field}: ${message}`).join("\n"),
  );
  error.code = "MACCA_CONFIG_INVALID";
  error.field = errors[0].field;
  error.fields = errors.map(({ field }) => field);
  throw error;
}

function main(args) {
  const fail = (message) => {
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  };
  if (args.length !== 1) {
    fail("Usage: node config-validator.js <config-file>");
    return;
  }
  let loader;
  try {
    loader = require("./config-file.js");
  } catch {
    fail("Safe config loader unavailable.");
    return;
  }
  let value;
  try {
    value = loader.loadConfig(args[0]).value;
  } catch (error) {
    fail(error instanceof loader.ConfigFileError ? error.message : "Cannot read config file.");
    return;
  }
  const errors = validateConfig(value);
  if (errors.length) {
    fail("Invalid config:\n" + errors.map(({ field, message }) => `- ${field}: ${message}`).join("\n"));
    return;
  }
  process.stdout.write("Valid config.\n");
}

module.exports = { validateConfig, assertValidConfig };

if (require.main === module) main(process.argv.slice(2));
