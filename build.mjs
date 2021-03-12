import esbuild from "esbuild";
import * as fs from "fs";
import * as path from "path";

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf-8"));

async function run() {
  fs.rmdirSync(path.join(import.meta.url, "../dist").replace("file:", ""), {
    recursive: true,
  });

  await esbuild.build({
    entryPoints: ["./src/index.ts", "./src/esbuild-plugin-svgjsx.ts"],
    bundle: true,
    external: Object.keys(pkg.dependencies),
    outdir: "dist",
    platform: "neutral",
    outExtension: {
      ".js": ".mjs",
    },
    format: "esm",
    minifySyntax: true,
    minify: true,
  });
}

run();
