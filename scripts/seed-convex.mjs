import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const contents = fs.readFileSync(filePath, "utf8");
  const entries = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    entries[key] = value;
  }

  return entries;
}

const rootDir = process.cwd();
const rootEnv = parseEnvFile(path.join(rootDir, ".env.local"));
const frontendEnv = parseEnvFile(path.join(rootDir, "frontend", ".env.local"));

const deploymentUrl =
  process.env.CONVEX_URL ||
  process.env.VITE_CONVEX_URL ||
  rootEnv.CONVEX_URL ||
  frontendEnv.VITE_CONVEX_URL;

if (!deploymentUrl) {
  console.error(
    "Missing Convex URL. Set CONVEX_URL in .env.local or VITE_CONVEX_URL in frontend/.env.local.",
  );
  process.exit(1);
}

const client = new ConvexHttpClient(deploymentUrl, { logger: false });
const seedMutation = makeFunctionReference("init:seed");

try {
  const result = await client.mutation(seedMutation, {});
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Unknown Convex seed error",
  );
  process.exit(1);
}
