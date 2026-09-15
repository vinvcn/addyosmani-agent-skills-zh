#!/usr/bin/env node

"use strict";

const { execFileSync } = require("node:child_process");
const { readFileSync } = require("node:fs");

const manifestPaths = [
  "plugin.json",
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
  ".agents/plugins/marketplace.json",
];

function readManifestVersion(manifestPath) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  return manifest.version ?? manifest.plugins?.[0]?.version;
}

// Upstream derives the expected version from the nearest tag reachable from
// HEAD. A translation fork's sync branch shares no history with upstream's
// release tags, so fall back to the highest semver tag in the repo when
// describe lands on a pre-existing non-release tag (e.g. a v0.0.x bootstrap).
let expectedVersion = "";
try {
  expectedVersion = execFileSync(
    "git",
    ["tag", "--list", "[0-9]*", "--sort=-version:refname"],
    { encoding: "utf8" },
  ).split("\n")[0].trim();
} catch { /* fall through to describe */ }
if (!expectedVersion) {
  expectedVersion = execFileSync(
    "git",
    ["describe", "--tags", "--abbrev=0"],
    { encoding: "utf8" },
  ).trim();
}

for (const manifestPath of manifestPaths) {
  const version = readManifestVersion(manifestPath);
  if (version !== expectedVersion) {
    throw new Error(
      `${manifestPath} has version ${version ?? "<missing>"}; expected ${expectedVersion}`,
    );
  }
}

console.log(`All plugin manifests use version ${expectedVersion}.`);
