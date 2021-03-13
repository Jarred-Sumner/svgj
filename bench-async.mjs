import svgr from "@svgr/core";
import { readdirSync, readFile as _readFile } from "fs";
import * as path from "path";
import { promisify } from "util";
import { render as svgj } from "./dist/index.mjs";

const readFile = promisify(_readFile);

const readSVG = (input) => readFile(input, { encoding: "utf-8" });

let allFiles = [];
let tenFiles = [];
let warmupFiles = [];
async function setup() {
  const base = path.resolve(
    path
      .join(import.meta.url, "../", "svgs/dist/svg/bootstrap/")
      .replace("file:", "")
  );
  const files = readdirSync(base);
  for (let file of files) {
    allFiles.push(
      await readSVG(path.resolve("svgs/dist/svg/bootstrap/", file))
    );
  }

  for (let file of readdirSync(path.join(base, "../awesome"))) {
    if (warmupFiles.length > 200) break;
    warmupFiles.push(
      await readSVG(path.resolve("svgs/dist/svg/awesome/", file))
    );
  }

  tenFiles = allFiles.slice(0, 10);
}

async function bench() {
  await setup();

  // Give both a little warmup so the results are more honest.
  for (let file of warmupFiles) {
    svgj(file);
    await svgr.default(file);
  }

  console.time("svgj (1 file)");
  svgj(allFiles[20]);
  console.timeEnd("svgj (1 file)");

  console.time("svgr (1 file)");
  await svgr.default(allFiles[20]);
  console.timeEnd("svgr (1 file)");

  console.time("svgj (10 files)");
  for (let file of tenFiles) {
    svgj(file);
  }
  console.timeEnd("svgj (10 files)");

  console.time("svgr (10 files)");
  for (let file of tenFiles) {
    await svgr.default(file);
  }
  console.timeEnd("svgr (10 files)");

  console.time(`svgj (${allFiles.length}) files)`);
  for (let file of allFiles) {
    svgj(file);
  }
  console.timeEnd(`svgj (${allFiles.length}) files)`);

  console.time(`svgr (${allFiles.length}) files)`);
  for (let file of allFiles) {
    await svgr.default(file);
  }
  console.timeEnd(`svgr (${allFiles.length}) files)`);
}

bench();
