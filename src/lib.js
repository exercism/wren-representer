export function flip(obj) {
  return Object.assign({}, ...Object.entries(obj).map(([a, b]) => ({ [b]: a })))
}

export const sortOnly = (list, filterFn, sortFn) => {
  let positions = []
  let items = list.filter((x, i) => {
    let r = filterFn(x)
    if (r) positions.push(i)
    return r
  })
  items = items.sort(sortFn)
  positions.forEach((position, i) => {
    list[position] = items[i]
  })
  return list
}

function walkTree_(cursor, data, depth = 0, visitFn = null) {
  var node = {
    parent: null,
    type: cursor.type,
    name: cursor.name,
    children: [],
    depth: depth,
    from: cursor.from,
    to: cursor.to,
    // code: data.slice(cursor.from, cursor.to),
    get code() {
      return data.slice(this.from, this.to)
    },
  }
  var leaf = cursor.firstChild() === false
  node.leaf = leaf
  // console.log(node.name, node.code)
  if (visitFn) visitFn(node)
  while (!leaf && true) {
    node.children.push(walkTree_(cursor, data, depth + 1, visitFn))
    if (!cursor.nextSibling()) break
  }
  node.children.forEach((n) => n.parent = node)
  if (!leaf) cursor.parent()
  return node
}

export const walkTree = (tree, data, visitFn) => {
  let cursor = tree.topNode.cursor
  return walkTree_(cursor, data, -1, visitFn)
}
