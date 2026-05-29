#!/usr/bin/env node

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// ========== CONFIGURATION – CHANGE THIS ==========
const REPO = "brightsonnjegite-sudo/Mickey-Glitch";  // <-- YOUR REPO HERE
const LOCAL_REPO_PATH = ".";   // Path to your local git repo
const BRANCH = "main";         // Branch to check (main or master)
// =================================================

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
const VERSION_FILE = join(DATA_DIR, "currentVersion.json");

const colors = {
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

function log(color, msg) {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

function getCurrentLocalCommit() {
  try {
    const commit = execSync(`git -C "${LOCAL_REPO_PATH}" rev-parse HEAD`, {
      encoding: "utf8",
    }).trim();
    if (!commit.match(/^[a-f0-9]{40}$/)) throw new Error("Invalid commit hash");
    return commit;
  } catch (err) {
    log("red", `Error getting local commit: ${err.message}`);
    process.exit(1);
  }
}

async function getLatestRemoteCommit() {
  const url = `https://api.github.com/repos/${REPO}/commits/${BRANCH}`;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "UpdateChecker" },
    });
    if (!response.ok) {
      if (response.status === 404) {
        log("yellow", `Branch '${BRANCH}' not found, trying 'master'...`);
        const masterUrl = `https://api.github.com/repos/${REPO}/commits/master`;
        const masterRes = await fetch(masterUrl, {
          headers: { "User-Agent": "UpdateChecker" },
        });
        if (!masterRes.ok) throw new Error(`GitHub API error: ${masterRes.status}`);
        const masterData = await masterRes.json();
        return masterData.sha;
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }
    const data = await response.json();
    return data.sha;
  } catch (err) {
    log("red", `Failed to fetch remote commit: ${err.message}`);
    process.exit(1);
  }
}

function getStoredVersion() {
  if (!existsSync(VERSION_FILE)) return null;
  try {
    const content = readFileSync(VERSION_FILE, "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function saveVersion(commitSha) {
  const versionInfo = {
    sha: commitSha,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(VERSION_FILE, JSON.stringify(versionInfo, null, 2));
  log("green", `Saved version: ${commitSha.substring(0, 7)}`);
}

async function checkForUpdates() {
  log("cyan", `\n🔍 Checking for updates in ${REPO}...\n`);

  const latestRemote = await getLatestRemoteCommit();
  log("green", `Latest remote commit: ${latestRemote.substring(0, 7)}`);

  const currentLocal = getCurrentLocalCommit();
  log("green", `Current local commit: ${currentLocal.substring(0, 7)}`);

  const stored = getStoredVersion();
  let storedSha = stored ? stored.sha : null;

  if (!storedSha) {
    log("yellow", "No previous version found. Storing current version...");
    saveVersion(currentLocal);
    storedSha = currentLocal;
  }

  if (latestRemote === currentLocal) {
    log("green", "\n✅ Repository is already up-to-date!");
    return;
  }

  if (latestRemote !== currentLocal) {
    log("yellow", "\n🔄 Updates are available!");
    const compareUrl = `https://github.com/${REPO}/compare/${currentLocal}...${latestRemote}`;
    log("cyan", `View changes: ${compareUrl}`);
    console.log("\nTo update, run:");
    console.log(`  git -C "${LOCAL_REPO_PATH}" pull origin ${BRANCH}`);
    console.log("Then re-run this script to update the stored version.");
    return;
  }

  if (latestRemote === storedSha && latestRemote !== currentLocal) {
    log("yellow", "\n⚠️ Your local repository has uncommitted changes or diverged.");
    log("cyan", "Stored version is up-to-date, but your working directory differs.");
    console.log("You may want to `git stash` or `git reset --hard` to sync.");
  }
}

checkForUpdates().catch((err) => {
  log("red", `Unhandled error: ${err.message}`);
  process.exit(1);
});