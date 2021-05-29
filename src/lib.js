export function flip(obj) {
  return Object.assign({}, ...Object.entries(obj).map(([a,b]) => ({ [b]: a })))
}

export const walkTree = (tree, data, visitFn) => {
  let cursor = tree.topNode.cursor;
  return walkTree_(cursor, -1, visitFn);

  function walkTree_(cursor, depth = 0, visitFn) {
    var node = {
      type: cursor.type,
      name: cursor.name,
      children: [],
      depth: depth,
      from: cursor.from,
      to: cursor.to,
      get code() {
        return data.slice(this.from, this.to)
      }
    }
    var leaf = (cursor.firstChild()==false);
    node.leaf = leaf
    // console.log(node.name, node.code)
    visitFn(node);
    while (!leaf && true) {
      node.children.push(walkTree_(cursor, depth + 1, visitFn));
      if (!cursor.nextSibling()) break;
    }
    if (!leaf) cursor.parent()
    return node;
  }
}
