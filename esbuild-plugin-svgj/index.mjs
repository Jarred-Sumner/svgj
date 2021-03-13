import {render, defaultOpts, defaultProps} from "svgj";
import * as path from "path";
let resolveNamespace = "svgj";
let readFile;
let args = {
  displayName: "ReactComponent",
  jsxImports: "* as React",
  jsxFrom: "react",
  exportName: "ReactComponent",
  props: defaultProps,
  opts: defaultOpts,
  useMemo: false
};
async function generateJSX(opts) {
  return {
    contents: render(await readFile(opts.path), args.displayName, args.jsxImports, args.jsxFrom, args.exportName, args.props, args.opts, args.useMemo),
    loader: "jsx"
  };
}
async function onResolve(opts) {
  return {
    path: path.resolve(opts.resolveDir, opts.path),
    namespace: resolveNamespace
  };
}
function plugin({
  readFile: _readFile,
  filter = /\.svg$/,
  resolver = {
    filter
  },
  pluginName: name = "svgj",
  namespace = resolveNamespace,
  loader = {
    filter,
    namespace
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
      }
    };
  } else {
    return {
      name,
      setup: (builder) => {
        builder.onLoad(loader, generateJSX);
      }
    };
  }
}
export {
  plugin
};
