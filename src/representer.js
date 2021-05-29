#!/usr/bin/env node
import fs from "fs";
import { wrenLanguage, lezerParser } from "@exercism/codemirror-lang-wren";
import { walkTree, flip } from "./lib.js"
import path from "path";
import glob from "glob";

let [,,slug, input, output] = [...process.argv];

const BUILT_INS = ["Bool","Class","Fiber","Fn", "List","Map","Null","Num","Object","Range","Sequence","String", "System"]
const IDENTIFIERS = ["VariableName","ClassMethodName","ClassName","VariableDefinition"]
const LINE_LENGTH = 70

const fake = (x) => {
  return {name: x, code: x, leaf: true, children: []}
}
class Representation {
  constructor(file, id = 0) {
    this.file = file;
    this.id = id;
    this.replacements = Object.create(null);
    this.result = "";
    // this.last = 0;
    this.cursor = LINE_LENGTH;
  }
  replacementFor(name) {
    if (BUILT_INS.includes(name)) return name;

    if (this.replacements[name]) return this.replacements[name];
    this.replacements[name] = `@IDENT${this.id}@`;
    this.id += 1;
    return this.replacements[name];
  }
  process() {
    let data = fs.readFileSync(this.file).toString();
    this.code = data
    let tree = lezerParser.parse(data);
    var node = walkTree(tree, data, () => {});
    this.walk(node, this.visitNode.bind(this))
    this.result = this.result.trim();
    return this;
  }


  rewriteObject(node) {
    var props = node.children
      .filter(x => x.name == "Property")
      .sort((a,b) => a.children[0].code.localeCompare(b.children[0].code) )
    node.children = [fake("{"),...props,fake("}")]
  }
  walk(node, fn) {
    fn(node)
    if (node.name=="ObjectExpression") { this.rewriteObject(node) }
    // console.log("children", node.children.map(x => [x.name, x.code]))
    // console.log(node.children[0])
    if (!node.leaf) node.children.forEach(x => this.walk(x, fn))
  }

  rewrite(code, nodeName) {
    let name = nodeName
    if (nodeName=="ClassMethodName" && code=="new") { return code }
    if (IDENTIFIERS.includes(nodeName)) {
      name = this.replacementFor(code) ;
      return name
    } else {
      return code
    }
  }

  addLineBreak(node) {
    // console.log(node.name)
    return node.name.endsWith("Declaration") ||
    node.name.endsWith("Statement") ||
    node.name == "Block"
  }
  visitNode(node) {
    if (node.name=="Script") return;
    if (this.addLineBreak(node)) { this.result += "\n" }
    if (node.leaf) {
      const rewritten = this.rewrite(node.code, node.name) + " "
      this.result += rewritten
      // if (this.code.slice(this.last, node.from).includes("\n")) {

      // if (this.result.length > this.cursor) {
      //   this.result += "\n"
      //   // this.last = node.to
      //   this.cursor += LINE_LENGTH
      // }
    }

  }
}

let out = ""
let id = 1
let mappings = {}
const files = glob.sync(path.join(input,"*.wren"))
files.forEach(file => {
  let r = new Representation(file, id).process()
  Object.assign(mappings, r.replacements)
  out += r.result + "\n----\n"
  id = r.id
})

let results = path.join(output, "representation.txt")
let mapping = path.join(output, "mapping.json")
fs.writeFileSync(results, out)
fs.writeFileSync(mapping, JSON.stringify(flip(mappings),null,2))
