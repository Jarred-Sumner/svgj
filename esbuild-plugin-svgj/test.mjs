import { plugin } from "./index.mjs";
import esbuild from "esbuild";
import { readFile } from "fs/promises";

esbuild.build({
  entryPoints: ["../test/simple.svg"],
  outfile: "./test/test.js",
  plugins: [plugin({ readFile: (path) => readFile(path, "utf-8") })],
});
