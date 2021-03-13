import htmlparser from "htmlparser2";
import { renderJSX, defaultOpts } from "./jsx-serializer";

function stringifyProps(props: Object) {
  let text = "{";
  let rest = "";
  for (let [key, value] of Object.entries(props)) {
    if (value === "...") {
      rest = key;
    } else if (value === " ") {
      text += ` ${key},`;
    } else {
      text += ` ${key}: ${value}`;
    }
  }

  if (rest) {
    text += ` ...${rest}`;
  }

  text = text.trim() + " }";

  return text;
}

export { defaultOpts };
export const defaultProps: { [key: string]: string } = Object.freeze({
  props: "...",
});

export function render(
  content: string,
  displayName: string = "ReactComponent",
  jsxImports: string = "* as React",
  jsxFrom: string = "react",
  exportName = displayName,
  props = defaultProps,
  opts = defaultOpts,
  useMemo = false
) {
  const dom = (htmlparser as any).parseDocument(content);

  return `import ${jsxImports} from "${jsxFrom}";

${
  exportName === "default" ? "export default" : `export const ${exportName} =`
} ${useMemo ? "React.memo(" : ""}(${stringifyProps(props)}) => (
  ${renderJSX(dom, opts)}
)${useMemo ? ")" : ""};

${
  exportName !== "default"
    ? `let src = ${JSON.stringify(content)};\nexport default src;`
    : ""
}
`;
}
