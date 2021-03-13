import { render } from "../dist/index.mjs";
import { fstat, readdir, readdirSync, readFile as _readFile } from "fs";
import { promisify } from "util";
import * as path from "path";
import assert from "assert";
import { writeFile } from "fs/promises";
import svgr from "@svgr/core";

const readFile = promisify(_readFile);

const readSVG = (input) =>
  readFile(
    path.resolve(path.join(import.meta.url, "../", input).replace("file:", "")),
    { encoding: "utf-8" }
  );

const writeJSX = (jsx, filename) =>
  writeFile(
    path
      .join(import.meta.url, "../../svgs-dist", filename + ".jsx")
      .replace("file:", ""),
    jsx,
    {
      encoding: "utf-8",
    }
  );

const writeHTMLJSX = (jsx, filename) =>
  writeFile(
    path
      .join(import.meta.url, "../../htmls-dist", filename + ".jsx")
      .replace("file:", ""),
    jsx,
    {
      encoding: "utf-8",
    }
  );

const writeSVGRJSX = (jsx, filename) =>
  writeFile(
    path
      .join(import.meta.url, "../../svgr-dist", filename + ".jsx")
      .replace("file:", ""),
    jsx,
    {
      encoding: "utf-8",
    }
  );

describe("svgjsx", () => {
  it("runs simple", async () => {
    const simple = await readSVG("simple.svg");
    const jsx = render(simple);

    assert(jsx);
    console.log(jsx);
  });

  it("runs gear", async () => {
    const simple = await readSVG("gear.svg");
    const jsx = render(simple);

    assert(jsx);
    console.log(jsx);
  });

  it("commented", async () => {
    const simple = await readSVG("commented.svg");
    const jsx = render(simple);

    assert(jsx);
    console.log(jsx);
  });

  it("runs bootstrap", async () => {
    const files = readdirSync(
      path.resolve(
        path
          .join(import.meta.url, "../../", "svgs/dist/svg/bootstrap/")
          .replace("file:", "")
      )
    );

    for (let file of files) {
      await writeJSX(
        render(await readFile(path.join("svgs/dist/svg/bootstrap/", file))),
        path.basename(file)
      );
    }
  });

  it("html", async () => {
    const basepath = path.resolve(
      path.join(import.meta.url, "../../", "htmls/").replace("file:", "")
    );
    const files = readdirSync(basepath);

    for (let file of files) {
      await writeHTMLJSX(
        render(await readFile(path.join(basepath, file))),
        path.basename(file)
      );
    }
  });

  it("svgr runs bootstrap", async () => {
    const files = readdirSync(
      path.resolve(
        path
          .join(import.meta.url, "../../", "svgs/dist/svg/bootstrap/")
          .replace("file:", "")
      )
    );

    for (let file of files) {
      await writeSVGRJSX(
        await svgr.default(
          await readFile(path.join("svgs/dist/svg/bootstrap/", file))
        ),
        path.basename(file)
      );
    }
  });
});
