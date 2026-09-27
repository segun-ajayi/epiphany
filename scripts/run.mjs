import { spawn } from "node:child_process";
import { resolve } from "node:path";

const command = process.argv[2];
process.env.SQLITE_PATH ||= resolve(".data/app.sqlite");
const args =
  command === "dev"
    ? [
        resolve("node_modules/vite/bin/vite.js"),
        "dev",
        "--mode",
        "node",
        "--host",
        "127.0.0.1",
        "--port",
        "8080",
        "--strictPort",
        ...process.argv.slice(3),
      ]
    : [resolve(".output-node/server/index.mjs")];
if (!["dev", "start"].includes(command)) throw new Error("Choose dev or start.");
const child = spawn(process.execPath, args, {
  stdio: "inherit",
  windowsHide: true,
  env: process.env,
});
child.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
