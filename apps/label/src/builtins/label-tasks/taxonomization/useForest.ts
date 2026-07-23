import type { TreeNode } from './types'

/** Find the node with the given name. */
const findNode = (forest: TreeNode[], name: string): TreeNode | undefined => {
  for (const node of forest) {
    if (node.name === name) return node
    const found = findNode(node.children, name)
    if (found) return found
  }
  return undefined
}

/** Find the parent of the node with the given name. */
const findParent = (forest: TreeNode[], name: string): TreeNode | undefined => {
  for (const node of forest) {
    if (node.children.map((d) => d.name).includes(name)) return node
    const found = findParent(node.children, name)
    if (found) return found
  }
  return undefined
}

const removeNodeWithName = (nodes: TreeNode[], name: string): void => {
  nodes.splice(nodes.map((d) => d.name).indexOf(name), 1)
}

/**
 * The taxonomy hierarchy.
 * Each node is a root node of a tree in the forest.
 *
 * The forest is a nested version of the taxonomy `categories` in `./useLabelTask.ts`.
 * This forest is maintained so that `ElTree` in `element-plus` can be rendered.
 *
 * Note that each visualization belongs to which node
 * in the taxonomy is NOT store in the taxonomy itself.
 * It is stored in the annotationStore in `./useLabelTask.ts`.
 */
const forest = ref([] as TreeNode[])

export const useForest = () => {
  /** Add a node. */
  const addNode = (
    addedName: string,
    parentName?: string,
  ): void => {
    const addedNode: TreeNode = { name: addedName, children: [] }
    if (parentName !== undefined) {
      const parent = findNode(forest.value, parentName)
      if (!parent) throw new Error(`Parent ${parentName} not found.`)
      parent.children.push(addedNode)
    }
    else {
      // If no parent, add to the root.
      forest.value.push(addedNode)
    }
  }

  /**
   * Flatten the subtree of a node given its name.
   * Remove subtree.
   */
  const removeChildren = (name: string): void => {
    const node = findNode(forest.value, name)
    if (!node) throw new Error(`Node ${name} not found.`)
    node.children = []
  }

  /** Move a node in the forest. */
  const moveNode = (
    movedName: string,
    anchorName: string,
    type: 'before' | 'inner' | 'after',
  ): void => {
    const node = findNode(forest.value, movedName)
    if (!node) throw new Error(`Node ${movedName} not found.`)

    // Remove the node from its parent.
    const parent = findParent(forest.value, movedName)
    if (parent) {
      removeNodeWithName(parent.children, movedName)
    }

    const anchor = findNode(forest.value, anchorName)
    if (type === 'inner') {
      // If anchor not found, it means the category is moved to the root.
      if (!anchor) {
        // Move the category to the last.
        removeNodeWithName(forest.value, node.name)
        forest.value.push(node)
      }
      else {
        anchor.children.push(node)
      }
      return
    }

    const anchorParent = findParent(forest.value, anchorName)

    // If the anchor is a root node.
    if (!anchorParent) {
      removeNodeWithName(forest.value, node.name)
      const anchorIndex = forest.value.findIndex((d) => d.name === anchorName)
      if (type === 'before') {
        forest.value.splice(anchorIndex, 0, node)
      }
      else if (type === 'after') {
        forest.value.splice(anchorIndex + 1, 0, node)
      }
    }
    else {
      const anchorIndex = anchorParent.children.findIndex((d) => d.name === anchorName)
      if (type === 'before') {
        anchorParent.children.splice(anchorIndex, 0, node)
      }
      else if (type === 'after') {
        anchorParent.children.splice(anchorIndex + 1, 0, node)
      }
    }
  }

  /** Rename a taxonomy category. */
  const renameNode = (oldName: string, newName: string): void => {
    const node = findNode(forest.value, oldName)
    if (!node) throw new Error(`Node ${oldName} not found.`)

    // Rename the category.
    node.name = newName
  }

  /** Remove a taxonomy category given its name. */
  const removeNode = (name: string): void => {
    const node = findNode(forest.value, name)
    if (node === undefined) return

    // NOTE: Try removing a node that doesn't exist should not throw an error.
    // Otherwise, when trying to remove a subtree,
    // we will need to sort the nodes to remove from the leaves to the root.
    // if (node === undefined) throw new Error(`Category ${name} not found.`)

    const parent = findParent(forest.value, name)

    // Remove the node from its parent.
    // If the node is a root node, remove it from the forest.
    const siblings = parent ? parent.children : forest.value
    siblings.splice(siblings.map((d) => d.name).indexOf(name), 1)
  }

  return {
    forest,
    addNode,
    removeChildren,
    moveNode,
    renameNode,
    removeNode,
  }
}
