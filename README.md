# svgj

`svgj` quickly converts `.svg` files into `jsx`. `svgj` is about 40x faster than `svgr`, depending on how you measure (benchmarks at bottom).

Input:

```html
<svg>
  <rect x="0" y="0" w="50" h="100" />
</svg>
```

Output:

```jsx
import * as React from "React";

export const ReactComponent = ({ ...props }) => (
  <svg {...props}>
    <rect x={`0`} y={`0`} w={`50`} h={`100`} />
  </svg>
);
```

Compared to `svgr`, `svgj` is buggier, has a worse API, fewer features, only returns JSX as strings that need to be transpiled, and prints ugly looking JSX.

But its much faster, thanks to using `htmlparser2` and serialization logic from `dom-serializer` (with modifications to support JSX and passing in custom props based on element). Consequently, this will often work with html.

You probably only want to use this inside of a bundler when importing SVG files as JSX.

## Usage

You probably want to use the esbuild plugin instead of the underlying library.

### Installation

yarn:

```bash
yarn add esbuild-plugin-svgj
```

npm:

```bash
npm install esbuild-plugin-svgj
```

### esbuild-plugin-svgj usage

```js
import { plugin } from "esbuild-plugin-svgj";
import { readFile } from "fs/promises";
import esbuild from "esbuild";

esbuild.build({
  // ...rest of esbuild config
  plugins: [
    plugin({
      readFile: (path) => readFile(path, "utf8"),
    }),
  ],
});
```

### Library usage

```ts
export function render(
  content: string,
  displayName: string = "ReactComponent",
  jsxImports: string = "* as React",
  jsxFrom: string = "react",
  exportName = displayName,
  props = defaultProps,
  opts = defaultOpts,
  useMemo = false
): string;

export const defaultOpts: Options = {
  removeAttrs: {
    xmlns: true,
  },
  addProps: {
    svg: {
      props: "...",
    },
  },
};

export const defaultProps: { [key: string]: string } = {
  props: "...",
};
```

## Benchmarks

These svgs are from bootstrap.

To download the test icons:

```bash
git submodule update --init --recursive
```

Then, run `node bench.mjs`.

The first group renders 10 svgs. The second group renders a single svg. The svg files are read from disk as strings before the benchmark starts.

```bash
❯ node bench.mjs

svgj x 10,271 ops/sec ±1.06% (90 runs sampled)
svgr sync x 105 ops/sec ±4.86% (74 runs sampled)
Fastest is svgj
Slowest is svgr sync
svgj x 89,124 ops/sec ±1.45% (90 runs sampled)
svgr sync x 1,199 ops/sec ±2.01% (81 runs sampled)
Fastest is svgj
Slowest is svgr sync
```

Then, run `node bench-async.mjs`

`benchmark.js` is a little tough to get working right with async code, so this one just uses `console.time`, but with a warmup beforehand. The files in both benchmarks are the same.

```bash
❯ node bench-async.mjs

svgj (1 file): 0.128ms
svgr (1 file): 1.675ms
svgj (10 files): 0.376ms
svgr (10 files): 20.193ms
svgj (258 files): 9.493ms
svgr (258 files): 330.877ms
```

### TypeScript

This doesn't generate type definitions.

But, you can google `typescript import svg react`. [Here's the first result](https://duncanleung.com/typescript-module-declearation-svg-img-assets/).

To save you a click, add this `.d.ts` and it should work:

```ts
declare module "*.svg" {
  import React = require("react");
  export const ReactComponent: React.SFC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}
```

Keep in mind that this currently won't `React.forwardRef`. Per `create-react-app`'s defaults, `src` is the source string and `ReactComponent` is the JSX source.
