import type { Category, TreeNode } from './types'
import { cloneDeep, isString, keyBy } from 'lodash'

interface intermediateNode {
  name: string
  children: (string | intermediateNode)[]
}

/** Given the taxonomy categories, build a forest and return the roots. */
export const buildForest = (categories: Category[]): TreeNode[] => {
  const nodes = cloneDeep(categories)

  // The mapping from name to node object.
  const name2node: Record<string, intermediateNode> = keyBy(nodes, 'name')

  // The names of non-root nodes.
  const nonRootNames: Set<string> = new Set(nodes.map((d) => d.children).flat())

  // Replace child name with child reference.
  nodes.forEach((node: intermediateNode) => {
    node.children = node.children.map((d) => (
      isString(d) ? name2node[d] : d
    ))
  })

  const roots = Object.values(name2node)
    .filter((d) => !nonRootNames.has(d.name)) as TreeNode[]
  return roots
}
