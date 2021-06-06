#!/usr/bin/env node
import fs from "fs";
import { flip } from "./lib.js"
import path from "path";
import glob from "glob";
import { Representation } from "./representation.js";

const [,,slug, input, output] = [...process.argv];

let out = ""
let id = 1
const mappings = {}
const files = glob.sync(path.join(input,"*.wren")).sort()
files.forEach(file => {
  const r = new Representation(file, id).process()
  Object.assign(mappings, r.replacements)
  out += r.result + "\n----\n"
  id = r.id
})

const results = path.join(output, "representation.txt")
const mapping = path.join(output, "mapping.json")
fs.writeFileSync(results, out)
fs.writeFileSync(mapping, JSON.stringify(flip(mappings),null,2))
