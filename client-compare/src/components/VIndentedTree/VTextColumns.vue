<script setup lang="ts">
import type { HierarchyNode } from 'd3'

interface TreeNode {
  name: string
  value: number
  children?: TreeNode[]
}

interface TextColumn {
  value: (d: TreeNode) => number | string
  x: number
  textAnchor: 'start' | 'middle' | 'end'
  class?: string
}

defineProps({
  node: {
    type: Object as PropType<HierarchyNode<TreeNode>>,
    required: true,
  },
  columns: {
    type: Object as PropType<TextColumn[]>,
    required: true,
  },
})
</script>

<template>
  <text
    v-for="(column, i) in columns"
    :key="i"
    dy="0.32em"
    :x="column.x"
    :text-anchor="column.textAnchor"
    font-size="1.2em"
    :class="column.class"
  >
    {{ column.value(node.data) }}
  </text>
</template>
