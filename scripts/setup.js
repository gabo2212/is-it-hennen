#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";
const venv = path.join(root, ".venv");

function spawnOk(cmd, args) {
  return spawnSync(cmd, args, { encoding: "utf8", windowsHide: true });
}

function findPython() {
  const candidates = isWin
    ? [
        ["py", ["-3.12"]],
        ["py", ["-3.11"]],
        ["py", ["-3.10"]],
        ["python", []],
        ["py", []],
        ["python3", []],
      ]
    : [
        ["python3", []],
        ["python", []],
      ];
  for (const [cmd, prefix] of candidates) {
    const r = spawnOk(cmd, [
      ...prefix,
      "-c",
      "import sys; print('%d.%d' % sys.version_info[:2])",
    ]);
    if (r.status !== 0) continue;
    const ver = String(r.stdout || "").trim();
    const [maj, min] = ver.split(".").map(Number);
    // facenet-pytorch pins torch 2.2, which has wheels through 3.12 (not 3.13/3.14).
    if (maj !== 3 || Number.isNaN(min) || min < 10 || min > 12) continue;
    return { cmd, prefix, ver };
  }
  return null;
}

function run(cmd, args) {
  console.log(`$ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    windowsHide: true,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const py = findPython();
if (!py) {
  console.error(
    "Python 3.10–3.12 is required for the detector (this app pins PyTorch 2.2). The slides still work with: npm run dev",
  );
  process.exit(1);
}

console.log(`Using Python ${py.ver} (${py.cmd} ${py.prefix.join(" ")})`.trim());

if (!fs.existsSync(venv)) {
  const venvArgs = [...py.prefix, "-m", "venv", ".venv"];
  // OneDrive + Windows often break venv symlinks.
  if (isWin) venvArgs.push("--copies");
  run(py.cmd, venvArgs);
}

const venvPy = isWin
  ? path.join(venv, "Scripts", "python.exe")
  : path.join(venv, "bin", "python");

function pip(args) {
  run(venvPy, ["-m", "pip", ...args]);
}

pip(["install", "--upgrade", "pip"]);

const reqPath = path.join(root, "cnn", "requirements.txt");
const reqLines = fs
  .readFileSync(reqPath, "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));

if (isWin) {
  // facenet-pytorch 2.6 pins torch<2.3. Detector is CPU-only.
  pip([
    "install",
    "torch==2.2.2",
    "torchvision==0.17.2",
    "--index-url",
    "https://download.pytorch.org/whl/cpu",
  ]);
  const rest = reqLines.filter((line) => !/^(torch|torchvision)\b/.test(line));
  pip(["install", ...rest]);
} else {
  pip(["install", "-r", "cnn/requirements.txt"]);
}

console.log(`
Python deps ready. Keep two terminals open:

  npm run api
  npm run dev

Then open http://127.0.0.1:43123/detect
First detector start downloads FaceNet (~100 MB) once.
`);
