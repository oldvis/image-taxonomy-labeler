// TODO: We may store the path from root to the node
// to allow duplicate names in different branches.
export interface Category {
  /** The unique name of the taxonomy category. */
  name: string
  /** The name of subcategories. */
  children: string[]
}

export interface TreeNode {
  /** The unique name of the node. */
  name: string
  children: TreeNode[]
}
