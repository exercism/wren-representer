#!/usr/bin/env node
import fs from "fs";
import { wrenLanguage } from "@exercism/codemirror-lang-wren";
import { walkTree, flip } from "./lib.js"
import path from "path";
import glob from "glob";

const parser = wrenLanguage.parser

let [,,slug, input, output] = [...process.argv];

let results = path.join(output, "representation.txt")
let mapping = path.join(output, "mapping.json")

const BUILT_INS = ["Bool","Class","Fiber","Fn", "List","Map","Null","Num","Object","Range","Sequence","String", "System"]
const IDENTIFIERS = ["VariableName","ClassMethodName","ClassName","VariableDefinition"]
const LINE_LENGTH = 70

class Representation {
  constructor(file, id = 0) {
    this.file = file;
    this.id = id;
    this.replacements = Object.create(null);
    this.result = "";
    this.last = 0;
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
    let tree = parser.parse(data);
    walkTree(tree, data, this.visitNode.bind(this));
    this.result = this.result.trim();
    return this;
  }

  rewrite(code, nodeName) {
    if (nodeName=="ClassMethodName" && code=="new") { return code }
    if (IDENTIFIERS.includes(nodeName)) {
      let name = this.replacementFor(code) ;
      return name
    } else {
      return code
    }
  }

  visitNode(node) {
    if (node.name=="Script") return;
    if (node.leaf) {
      const rewritten = this.rewrite(node.code, node.name) + " "
      this.result += rewritten
      // if (this.code.slice(this.last, node.from).includes("\n")) {
      if (this.result.length > this.cursor) {
        this.result += "\n"
        // this.last = node.to
        this.cursor += LINE_LENGTH
      }
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

// console.log(out)
fs.writeFileSync(results, out)
fs.writeFileSync(mapping, JSON.stringify(flip(mappings),null,2))
