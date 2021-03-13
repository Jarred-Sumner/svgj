/*
 * Module dependencies
 */
import ElementType from "domelementtype";
import type { Node, NodeWithChildren, Element, DataNode } from "domhandler";
import { encodeXML } from "entities";
import { camelCase } from "lodash-es";

/*
 * Mixed-case SVG and MathML tags & attributes
 * recognized by the HTML parser, see
 * https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inforeign
 */
import { elementNames, attributeNames } from "./foreignNames";

export interface DomSerializerOptions {
  emptyAttrs?: boolean;
  selfClosingTags?: boolean;
  xmlMode?: boolean | "foreign";
  decodeEntities?: boolean;
  removeAttrs: { [key: string]: boolean };
  addProps: {
    [tagName: string]: {
      [prop: string]: string;
    };
  };
}

const unencodedElements = new Set([
  "style",
  "script",
  "xmp",
  "iframe",
  "noembed",
  "noframes",
  "plaintext",
  "noscript",
]);

/**
 * Format attributes
 */
function formatAttributes(
  attributes: Record<string, string | null> | undefined,
  opts: DomSerializerOptions
) {
  if (!attributes) return;

  let formatted = "";

  for (let [key, value] of Object.entries(attributes)) {
    key =
      key.startsWith("data-") || key.startsWith("aria-")
        ? key
        : attributeNames.get(key) ?? camelCase(key);

    if (opts.removeAttrs[key]) continue;

    if (!value) {
      formatted += " " + key;
    } else {
      formatted += ` ${key}={\`${value || ""}\`}`;
    }
  }
  return formatted.trimStart();
}

/**
 * Self-enclosing tags
 */
const singleTag = new Set([
  "area",
  "base",
  "basefont",
  "br",
  "col",
  "command",
  "embed",
  "frame",
  "hr",
  "img",
  "input",
  "isindex",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

export type Options = {
  addProps: {
    [tagName: string]: { [prop: string]: string };
  };
  removeAttrs: {
    [key: string]: boolean;
  };
};

export const defaultOpts: Options = Object.freeze({
  removeAttrs: Object.freeze({
    xmlns: true,
  }),
  addProps: Object.freeze({
    svg: Object.freeze({
      props: "...",
    }),
  }),
});
/**
 * Renders a DOM node or an array of DOM nodes to a string.
 *
 * Can be thought of as the equivalent of the `outerHTML` of the passed node(s).
 *
 * @param node Node to be rendered.
 * @param options Changes serialization behavior
 */
export function renderJSX(
  node: Node | Node[],
  options: DomSerializerOptions = defaultOpts
): string {
  // TODO: This is a bit hacky.
  const nodes: Node[] =
    Array.isArray(node) || (node as any).cheerio ? (node as Node[]) : [node];

  let output = "";

  for (let i = 0; i < nodes.length; i++) {
    output += renderNode(nodes[i], options);
  }

  return output;
}

function renderNode(node: Node, options: DomSerializerOptions): string {
  switch (node.type) {
    case ElementType.Root:
      return renderJSX((node as NodeWithChildren).children, options);
    case ElementType.Directive:
    case ElementType.Doctype:
      return renderDirective(node as DataNode);
    case ElementType.Comment:
      return renderComment(node as DataNode);
    case ElementType.CDATA:
      return renderCdata(node as NodeWithChildren);
    case ElementType.Script:
    case ElementType.Style:
    case ElementType.Tag:
      return renderTag(node as Element, options);
    case ElementType.Text:
      return renderText(node as DataNode, options);
  }
}

function formatProps(propsList: { [key: string]: string }) {
  let list = "";
  for (let [propName, value] of Object.entries(propsList)) {
    if (value === "...") {
      list += ` {...${propName}}`;
    } else {
      list += ` ${propName}={${value}}`;
    }
  }

  return list.trimStart();
}

const foreignModeIntegrationPoints = new Set([
  "mi",
  "mo",
  "mn",
  "ms",
  "mtext",
  "annotation-xml",
  "foreignObject",
  "desc",
  "title",
]);

const foreignElements = new Set(["svg", "math"]);

function renderTag(elem: Element, opts: DomSerializerOptions) {
  // Handle SVG / MathML in HTML
  if (opts.xmlMode === "foreign") {
    /* Fix up mixed-case element names */
    elem.name = elementNames.get(elem.name) ?? elem.name;
    /* Exit foreign mode at integration points */
    if (
      elem.parent &&
      foreignModeIntegrationPoints.has((elem.parent as Element).name)
    ) {
      opts = { ...opts, xmlMode: false };
    }
  }
  if (!opts.xmlMode && foreignElements.has(elem.name)) {
    opts = { ...opts, xmlMode: "foreign" };
  }

  let tag = `<${elem.name}`;

  const attribs = formatAttributes(elem.attribs, opts);

  if (attribs) {
    tag += ` ${attribs}`;
  }

  const props = opts.addProps[elem.tagName.toLowerCase()];
  if (props) {
    tag += formatProps(props);
  }

  if (
    elem.children.length === 0 &&
    (opts.xmlMode
      ? // In XML mode or foreign mode, and user hasn't explicitly turned off self-closing tags
        opts.selfClosingTags !== false
      : // User explicitly asked for self-closing tags, even in HTML mode
        opts.selfClosingTags && singleTag.has(elem.name))
  ) {
    if (!opts.xmlMode) tag += " ";
    tag += "/>";
  } else {
    tag += ">";

    if (
      elem.children.length > 0 &&
      (elem.tagName === "script" ||
        elem.tagName === "iframe" ||
        elem.tagName === "style")
    ) {
      tag += `dangerouslySetInnerHTML={\``;
      for (let child of elem.children) {
        tag += ((child as DataNode).data ?? "").replace(/(\{|\}|`)/gm, "\\$1");
      }
      tag += "`}";
    } else if (elem.children.length > 0) {
      tag += renderJSX(elem.children, opts);
    }

    if (opts.xmlMode || !singleTag.has(elem.name)) {
      tag += `</${elem.name}>`;
    }
  }

  return tag;
}

function renderDirective(elem: DataNode) {
  return ``;
}

function renderText(elem: DataNode, opts: DomSerializerOptions) {
  if (elem.data?.trim() === "") {
    return "";
  }

  return `{\`${(elem.data || "").replace(/(\{|\}|`)/gm, "\\$1")}\`}`;
}

function renderCdata(elem: NodeWithChildren) {
  return ``;
}

function renderComment(elem: DataNode) {
  return ``;
}
