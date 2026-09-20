#!/usr/bin/env node
"use strict";

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";
const venvPy = isWin
  ? path.join(root, ".venv", "Scripts", "python.exe")
  : path.join(root, ".venv", "bin", "python");

if (!fs.existsSync(venvPy)) {
  console.error("No .venv yet. Run this once: npm run setup");
  process.exit(1);
}

const pythonPath = process.env.PYTHONPATH
  ? `${root}${path.delimiter}${process.env.PYTHONPATH}`
  : root;

const child = spawn(venvPy, ["-m", "cnn", "serve"], {
  cwd: root,
  stdio: "inherit",
  windowsHide: true,
  env: {
    ...process.env,
    PYTHONPATH: pythonPath,
    PYTHONUTF8: "1",
    PYTHONIOENCODING: "utf-8",
  },
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
