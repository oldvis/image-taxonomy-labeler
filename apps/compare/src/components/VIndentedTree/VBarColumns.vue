<script setup lang="ts">
import type { HierarchyNode } from 'd3'
import { scaleLinear } from 'd3'

interface TreeNode {
  name: string
  value: number
  children?: TreeNode[]
}

interface BarColumn {
  value: (d: TreeNode) => number
  x: number
  class?: string
  domain: [number, number]
  barWidth: number
}

const props = defineProps({
  node: {
    type: Object as PropType<HierarchyNode<TreeNode>>,
    required: true,
  },
  columns: {
    type: Object as PropType<BarColumn[]>,
    required: true,
  },
  barHeight: {
    type: Number as PropType<number>,
    default: 12,
  },
})

const { columns } = toRefs(props)

const getScale = (domain: [number, number], barWidth: number) => (
  scaleLinear().domain(domain).range([0, barWidth])
)
</script>

<template>
  <rect
    v-for="(column, i) in columns"
    :key="i"
    :x="column.x + 6"
    :y="-barHeight / 2"
    :width="getScale(column.domain, column.barWidth)(column.value(node.data))"
    :height="barHeight"
    :class="column.class"
  />
</template>
