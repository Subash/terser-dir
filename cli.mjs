import { execa } from "execa";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

await main();

async function main() {
  const dir = getOption("--dir");
  if (!dir) return console.error("Please provide the --dir option.");

  const outdir = getOption("--outdir");
  if (!outdir) return console.error("Please provide the --outdir option.");

  await terserDir(path.resolve(dir), path.resolve(outdir));
}

function getOption(name) {
  const args = process.argv.slice(2);
  const index = args.indexOf(name);
  if (index === -1) return;
  return args[index + 1];
}

async function terserDir(dir, outdir) {
  await Promise.all(
    (await getJavaScriptFiles(dir)).map((file) => {
      terser(file, path.resolve(outdir, path.relative(dir, file)));
    })
  );
}

async function getJavaScriptFiles(dir) {
  const extensions = [".js", ".mjs", ".cjs"];
  return (await getFiles(dir)).filter((file) =>
    extensions.includes(path.extname(file))
  );
}

async function getFiles(dir) {
  return (await fs.readdir(dir, { withFileTypes: true, recursive: true }))
    .filter((dirent) => dirent.isFile())
    .map((dirent) => path.join(dirent.parentPath, dirent.name));
}

async function terser(input, output) {
  const executable = fileURLToPath(import.meta.resolve("terser/bin/terser"));
  const args = [executable, input, "--output", output, ...getTerserOptions()];
  await fs.mkdir(path.dirname(output), { recursive: true });
  await execa("node", args, { stdio: "inherit" });
}

function getTerserOptions() {
  const options = process.argv.slice(2);

  const dirIndex = options.indexOf("--dir");
  if (dirIndex !== -1) options.splice(dirIndex, 2);

  const outdirIndex = options.indexOf("--outdir");
  if (outdirIndex !== -1) options.splice(outdirIndex, 2);

  return options;
}
