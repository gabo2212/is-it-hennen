#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";
const venv = path.join(root, ".venv");

function findPython() {
  const candidates = isWin
    ? ["python", "py", "python3"]
    : ["python3", "python"];
  for (const cmd of candidates) {
    const r = spawnSync(cmd, ["--version"], { encoding: "utf8" });
    if (r.status === 0) return cmd;
  }
  return null;
}

function run(cmd, args) {
  console.log(`$ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const py = findPython();
if (!py) {
  console.error(
    "Python 3.10+ is required for the detector. The slides still work with: npm run dev",
  );
  process.exit(1);
}

if (!fs.existsSync(venv)) {
  run(py, ["-m", "venv", ".venv"]);
}

const pip = isWin
  ? path.join(venv, "Scripts", "pip.exe")
  : path.join(venv, "bin", "pip");

run(pip, ["install", "-r", "cnn/requirements.txt"]);
console.log(`
Python deps ready. Keep two terminals open:

  npm run api
  npm run dev

Then open http://127.0.0.1:43123/detect
First detector start downloads FaceNet (~100 MB) once.
`);
