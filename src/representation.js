import fs from "fs";
import { lezerParser } from "@exercism/codemirror-lang-wren";
import { walkTree, sortOnly } from "./lib"

// class names that are part of the core language that we do not need to replace
// with placeholder identifiers
const KNOWN_CLASSES = [
  "Bool","Class","Fiber","Fn", "List","Map","Null","Num","Object","Range","Sequence","String","System",
  "Random", "Meta"
]

// node types that represent identifiers that we should replace with placeholder
// values in the representation
const IDENTIFIER_NODES = ["VariableName","ClassMethodName","ClassName","VariableDefinition"]

export class Representation {
  constructor(file, id = 0) {
    this.file = file;
    this.id = id;
    this.replacements = Object.create(null);
    this.result = "";
  }

  replacementFor(name) {
    if (KNOWN_CLASSES.includes(name)) return name;

    if (this.replacements[name]) return this.replacements[name];
    this.replacements[name] = `@IDENT${this.id}@`;
    this.id += 1;
    return this.replacements[name];
  }

  process() {
    this.code = fs.readFileSync(this.file).toString();
    let tree = lezerParser.parse(this.code);
    var node = walkTree(tree, this.code, () => {});
    this.walk(node, this.visitNode.bind(this))
    this.result = this.result.trim();
    return this;
  }

  normalizeObject(node) {
    sortOnly(node.children, x => x.name === "Property", (a,b) => {
      return a.children[0].code.localeCompare(b.children[0].code)
    } )
  }

  walk(node, fn) {
    fn(node)
    if (node.name === "ObjectExpression") { this.normalizeObject(node) }
    // console.log("children", node.children.map(x => [x.name, x.code]))
    if (!node.leaf) node.children.forEach(x => this.walk(x, fn))
  }

  rewrite(code, nodeName) {
    if (nodeName === "ClassMethodName" && code === "new") { return code }
    if (!IDENTIFIER_NODES.includes(nodeName)) { return code };

    return this.replacementFor(code);
  }

  addLineBreakBefore(node) {
    return node.name.endsWith("Declaration") ||
    node.name.endsWith("Statement") ||
    node.name === "Block"
  }

  textContentBetween(last, current) {
    let si = last ? last.to : 0;
    let fi = current.from;
    let data = this.code.slice(si,fi)
    if (data.trim() !== "") return data;
  }

  visitNode(node) {
    if (node.name === "Script") return;
    if (this.addLineBreakBefore(node)) { this.result += "\n" }
    if (node.leaf) {
      const rewritten = this.rewrite(node.code, node.name) + " "
      let text = this.textContentBetween(this.lastNode, node);
      if (text) { this.result += text; }
      this.result += rewritten;
      this.lastNode = node;
    }
  }
}