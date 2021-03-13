import {
  OnLoadArgs,
  OnLoadResult,
  OnResolveArgs,
  OnResolveResult,
  Plugin,
} from "esbuild";
export type ReadFileFunction = (_path: string) => Promise<string>;
import { render, defaultOpts, defaultProps } from "svgj";
import * as path from "path";

let resolveNamespace = "svgj";
let readFile: ReadFileFunction;
let args = {
  displayName: "ReactComponent",
  jsxImports: "* as React",
  jsxFrom: "react",
  exportName: "ReactComponent",
  props: defaultProps,
  opts: defaultOpts,
  useMemo: false,
};

async function generateJSX(opts: OnLoadArgs): Promise<OnLoadResult> {
  return {
    contents: render(
      await readFile(opts.path),
      args.displayName,
      args.jsxImports,
      args.jsxFrom,
      args.exportName,
      args.props,
      args.opts,
      args.useMemo
    ),
    loader: "jsx",
  };
}

async function onResolve(opts: OnResolveArgs): Promise<OnResolveResult> {
  return {
    path: path.resolve(opts.resolveDir, opts.path),
    namespace: resolveNamespace,
  };
}

export function plugin({
  readFile: _readFile,
  filter = /\.svg$/,
  resolver = {
    filter: filter,
  },
  pluginName: name = "svgj",

  namespace = resolveNamespace,

  loader = {
    filter: filter,
    namespace: namespace,
  },

  ..._args
}) {
  readFile = _readFile;
  resolveNamespace = namespace;

  if (!readFile)
    throw "Expected readFile function shaped like (path: string) => Promise<string>";
  Object.assign(args, _args);

  if (resolver) {
    return {
      name,
      setup: (builder) => {
        builder.onResolve(resolver, onResolve);
        builder.onLoad(loader, generateJSX);
      },
    } as Plugin;
  } else {
    return {
      name,
      setup: (builder) => {
        builder.onLoad(loader, generateJSX);
      },
    } as Plugin;
  }
}
