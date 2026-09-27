import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputServer = join(projectRoot, ".output", "server");
const sourceVars = join(projectRoot, ".dev.vars");
const config = join(outputServer, "wrangler.json");
const state = join(projectRoot, ".wrangler", "state");
const wrangler = join(projectRoot, "node_modules", "wrangler", "bin", "wrangler.js");

if (!existsSync(config)) {
  throw new Error("Cloudflare output is missing. Run `npm run build` first.");
}

if (!existsSync(sourceVars)) {
  throw new Error(
    "Local Cloudflare secrets are missing. Create `.dev.vars` from `.dev.vars.example`.",
  );
}

const child = spawn(
  process.execPath,
  [
    wrangler,
    "dev",
    "--config",
    config,
    "--local",
    "--persist-to",
    state,
    "--env-file",
    sourceVars,
    ...process.argv.slice(2),
  ],
  {
    cwd: projectRoot,
    env: process.env,
    stdio: "inherit",
    windowsHide: true,
  },
);

child.on("error", (error) => {
  throw error;
});

child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
