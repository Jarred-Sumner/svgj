import htmlparser from "htmlparser2";
import { renderJSX } from "./jsx-serializer";

export function render(
  content: string,
  jsxFragment: string,
  jsxFactory: string,
  jsxImport: string
) {
  const dom = htmlparser.parseDocument(content);

  const jsx = renderJSX(dom);

  return jsx;
}
