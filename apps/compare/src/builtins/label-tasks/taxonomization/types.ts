import type { TreeNode } from '@image-taxonomy-labeler/ui/label-tasks/taxonomization/types'

export type { Category, TreeNode } from '@image-taxonomy-labeler/ui/label-tasks/taxonomization/types'

export interface TreeNodeWithUsers extends TreeNode {
  /** The users whose taxonomies have this node. */
  usernames: string[]
  children: TreeNodeWithUsers[]
}
