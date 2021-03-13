import Benchmark from "benchmark";
import { render as svgj } from "./dist/index.mjs";
import { fstat, readdir, readdirSync, readFile as _readFile } from "fs";
import { promisify } from "util";
import * as path from "path";
import assert from "assert";
import { writeFile } from "fs/promises";
import svgr from "@svgr/core";
import chalk from "chalk";

const readFile = promisify(_readFile);

const readSVG = (input) => readFile(input, { encoding: "utf-8" });

let allFiles = [];
let tenFiles = [];
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

  tenFiles = allFiles.slice(0, 10);
}

async function bench() {
  await setup();

  new Benchmark.Suite("svgj vs svgr (10 files)")
    .add("svgj", () => {
      for (let file of tenFiles) {
        svgj(file);
      }
    })
    .add("svgr sync", () => {
      for (let file of tenFiles) {
        svgr.default.sync(file);
      }
    })
    .on("cycle", function (event) {
      console.log(String(event.target));
    })
    .on("complete", function () {
      console.log(
        "Fastest is " + chalk.green(this.filter("fastest").map("name"))
      );
      console.log(
        "Slowest is " + chalk.red(this.filter("slowest").map("name"))
      );
    })
    .run();

  const oneFile = allFiles[20]; // arbitrary number
  new Benchmark.Suite("svgj vs svgr (1 file)")
    .add("svgj", () => {
      svgj(oneFile);
    })
    .add("svgr sync", () => {
      svgr.default.sync(oneFile);
    })
    .on("cycle", function (event) {
      console.log(String(event.target));
    })
    .on("complete", function () {
      console.log(
        "Fastest is " + chalk.green(this.filter("fastest").map("name"))
      );
      console.log(
        "Slowest is " + chalk.red(this.filter("slowest").map("name"))
      );
    })
    .run();
}

bench();
